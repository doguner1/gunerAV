import { NextRequest } from "next/server";
import { getSupabaseAdminClient, hashIp } from "@/lib/server-supabase";
import { detectDeviceType } from "@/lib/device-detect";

/**
 * Core event ingestion engine.
 * Receives raw HTTP request, processes metadata, logs to console,
 * and persists directly to Supabase analytics_events table.
 * NO file-based, in-memory, or disk fallback.
 */
export async function recordAnalyticsEvent(
  req: NextRequest,
  parsedBody?: any
): Promise<{ success: boolean; persisted: "supabase" | "none"; id?: string }> {
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

  // Tek doğruluk kaynağı: sunucu tarafı User-Agent
  const deviceType = detectDeviceType(userAgent);
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
