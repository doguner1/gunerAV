import { NextRequest } from "next/server";
import { getSupabaseAdminClient, hashIp } from "@/lib/server-supabase";
import { detectDeviceType } from "@/lib/device-detect";
import { isDeviceIgnored } from "@/lib/device-settings";
import { sendVisitorSessionWhatsAppAlert } from "@/lib/server-whatsapp";

// In-memory cache to deduplicate identical events arriving within 1200ms
const recentServerEvents = new Map<string, number>();

// In-memory cache to track sessions that have already triggered a WhatsApp alert (30-min window)
const notifiedSessions = new Map<string, number>();

/**
 * Core event ingestion engine.
 * Receives raw HTTP request, processes metadata, logs to console,
 * and persists directly to Supabase analytics_events table.
 * NO file-based, in-memory, or disk fallback.
 */
export async function recordAnalyticsEvent(
  req: NextRequest,
  parsedBody?: any
): Promise<{ success: boolean; persisted: "supabase" | "none"; id?: string; optout?: boolean }> {
  let body: any = parsedBody;

  if (!body) {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const clientIp = rawIp.split(",")[0].trim();
  const hashedClientIp = hashIp(clientIp);
  const userAgent = req.headers.get("user-agent") || "unknown";
  const referrer = req.headers.get("referer") || null;

  const eventName = body.event || "unknown";
  const p = body.params || {};
  const visitorId = p.visitor_id || "anon";

  // Check if device is ignored (opted out by admin)
  if (isDeviceIgnored(visitorId)) {
    return { success: true, persisted: "none", id: "ignored_device", optout: true };
  }

  // Server-side deduplication: ignore duplicate packet within 1200ms from the same visitor/IP
  const dedupeKey = `${eventName}:${visitorId}:${p.source || p.item_id || p.whatsapp_source || p.path || ""}`;
  const now = Date.now();
  const lastRecorded = recentServerEvents.get(dedupeKey) || 0;
  if (now - lastRecorded < 1200) {
    console.log("[analytics server dedupe] Ignored duplicate event within 1.2s:", dedupeKey);
    return { success: true, persisted: "supabase", id: "duplicate_ignored" };
  }
  recentServerEvents.set(dedupeKey, now);

  // Periodic cleanup
  if (recentServerEvents.size > 300) {
    recentServerEvents.forEach((t, k) => {
      if (now - t > 10000) recentServerEvents.delete(k);
    });
  }

  // Tek doğruluk kaynağı: sunucu tarafı User-Agent (+ dar kapsamlı iPad Pro donanım ipucu)
  const isIpadProHint = Boolean(body.is_ipad_pro_hint ?? p.is_ipad_pro_hint);
  const deviceType = detectDeviceType(userAgent, isIpadProHint);
  const entryId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const durationSec = typeof p.duration_seconds === "number" ? Math.round(p.duration_seconds) : null;

  console.log(
    "[event received]",
    eventName,
    p.item_id || p.slug || "general",
    "device:",
    deviceType,
    "ip_hash:",
    hashedClientIp.slice(0, 8)
  );

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    console.error("[analytics] Supabase client kurulamadı — SUPABASE_SERVICE_ROLE_KEY veya URL tanımlı değil!");
    return { success: false, persisted: "none" };
  }

  // 30 Dakikalık Oturum (Session) WhatsApp Bildirim Motoru
  // Admin kapalı olsa bile ilk tıklama/girişte mesaj atar, 30 dk boyunca sessiz kalır, 30 dk sonra tekrar girerse bildirir.
  const sessionId = p.session_id;
  if (sessionId && visitorId && visitorId !== "anon") {
    const nowMs = Date.now();
    const lastNotified = notifiedSessions.get(sessionId) || 0;
    const isLocallyFresh = !lastNotified || (nowMs - lastNotified > 30 * 60 * 1000);

    if (isLocallyFresh) {
      notifiedSessions.set(sessionId, nowMs);

      // Asenkron ve non-blocking: API yanıt süresini geciktirmeden arka planda çalışır
      (async () => {
        try {
          const { count: sessionEventCount } = await supabase
            .from("analytics_events")
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionId);

          if (!sessionEventCount || sessionEventCount === 0) {
            // Ziyaretçinin daha önce sitemize gelip gelmediğini kontrol et
            const { count: priorVisitorEvents } = await supabase
              .from("analytics_events")
              .select("*", { count: "exact", head: true })
              .eq("visitor_id", visitorId);

            const isReturning = Boolean(priorVisitorEvents && priorVisitorEvents > 0);

            await sendVisitorSessionWhatsAppAlert({
              visitorId,
              isReturning,
              path: p.path || "/",
              productName: p.item_name || p.name || null,
              deviceType,
              referrer: p.referrer || referrer,
            });
          }
        } catch (waErr) {
          console.error("[Visitor Session WA Dispatch Error]:", waErr);
        }
      })();
    }

    // Periyodik hafıza temizliği (30 dakikadan eski oturumları temizle)
    if (notifiedSessions.size > 500) {
      const cutoff = Date.now() - 30 * 60 * 1000;
      notifiedSessions.forEach((ts, sid) => {
        if (ts < cutoff) notifiedSessions.delete(sid);
      });
    }
  }

  const { error } = await supabase.from("analytics_events").insert({
    event_type: eventName,
    visitor_id: p.visitor_id || null,
    session_id: p.session_id || null,
    product_id: p.item_id || p.id || null,
    product_slug: p.slug || null,
    product_name: p.item_name || p.name || null,
    category: p.item_category || p.category_id || null,
    search_term: p.search_term || null,
    results_count: typeof p.results_count === "number" ? p.results_count : null,
    duration_seconds: durationSec,
    whatsapp_source: eventName === "contact_whatsapp" ? (p.source || null) : null,
    path: p.path || null,
    device_type: deviceType,
    referrer: p.referrer || referrer,
    ip_hash: hashedClientIp,
    user_agent: userAgent,
    raw_params: p,
  });

  if (error) {
    console.error("[analytics insert error]", error.message, error.code);
    return { success: false, persisted: "none" };
  }

  return {
    success: true,
    persisted: "supabase",
    id: entryId,
  };
}
