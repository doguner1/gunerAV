import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSupabaseAdminClient, hashIp } from "@/lib/server-supabase";
import { isAdminAuthorized } from "@/lib/server-auth";

// Local Fallback Storage Configuration
const DATA_DIR = path.join(process.cwd(), "data");
const PRIMARY_STORAGE_FILE = path.join(DATA_DIR, "analytics_events.json");
const FALLBACK_STORAGE_FILE = path.join("/tmp", "gunerav_analytics_events.json");
const MAX_FALLBACK_EVENTS = 1000;

export interface StoredAnalyticsEvent {
  id: string;
  received_at: string;
  client_ip: string;
  user_agent: string;
  event: string;
  params: Record<string, any>;
  device_type?: string;
  path?: string;
}

function isPrimaryWritable(): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function loadFallbackEvents(): StoredAnalyticsEvent[] {
  const primaryWritable = isPrimaryWritable();

  if (!primaryWritable) {
    try {
      if (fs.existsSync(FALLBACK_STORAGE_FILE)) {
        const content = fs.readFileSync(FALLBACK_STORAGE_FILE, "utf-8");
        if (content.trim()) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {}
  }

  try {
    if (fs.existsSync(PRIMARY_STORAGE_FILE)) {
      const content = fs.readFileSync(PRIMARY_STORAGE_FILE, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {}

  if (primaryWritable) {
    try {
      if (fs.existsSync(FALLBACK_STORAGE_FILE)) {
        const content = fs.readFileSync(FALLBACK_STORAGE_FILE, "utf-8");
        if (content.trim()) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {}
  }

  return [];
}

function saveFallbackEvents(events: StoredAnalyticsEvent[]): void {
  const jsonContent = JSON.stringify(events, null, 2);

  try {
    fs.writeFileSync(FALLBACK_STORAGE_FILE, jsonContent, "utf-8");
  } catch {}

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_STORAGE_FILE, jsonContent, "utf-8");
  } catch {}
}

// =========================================================================
// POST: Record New Visitor / Interaction Event
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Authenticated wipe/reset from Admin Panel
    if (action === "clear") {
      if (!isAdminAuthorized(req)) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
      }

      saveFallbackEvents([]);

      const supabase = getSupabaseAdminClient();
      if (supabase) {
        try {
          await supabase.from("analytics_events").delete().neq("event_type", "___never___");
        } catch (dbErr) {
          console.error("[Analytics Clear Supabase Error]:", dbErr);
        }
      }

      return NextResponse.json({ success: true, message: "Analitik logları sıfırlandı." });
    }

    let body: any = {};
    const text = await req.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }

    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const clientIp = rawIp.split(",")[0].trim();
    const hashedClientIp = hashIp(clientIp);
    const userAgent = req.headers.get("user-agent") || "unknown";
    const referrer = req.headers.get("referer") || null;

    const eventName = body.event || "unknown";
    const p = body.params || {};

    const uaLower = userAgent.toLowerCase();
    const isTablet =
      p.device_type === "tablet" ||
      uaLower.includes("ipad") ||
      uaLower.includes("tablet") ||
      (uaLower.includes("android") && !uaLower.includes("mobile"));
    const isMobile =
      p.device_type === "mobile" ||
      uaLower.includes("iphone") ||
      uaLower.includes("mobile") ||
      uaLower.includes("ipod");

    const deviceType = p.device_type || (isTablet ? "tablet" : isMobile ? "mobile" : "desktop");
    const entryId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const receivedAt = new Date().toISOString();

    // 1. Supabase Kalıcı Veritabanı Yazımı
    const supabase = getSupabaseAdminClient();
    let supabaseSaved = false;

    if (supabase) {
      try {
        const { error } = await supabase.from("analytics_events").insert({
          event_type: eventName,
          visitor_id: p.visitor_id || null,
          session_id: p.session_id || null,
          product_id: p.item_id || null,
          product_slug: p.slug || null,
          product_name: p.item_name || null,
          category: p.item_category || p.category_id || null,
          search_term: p.search_term || null,
          results_count: typeof p.results_count === "number" ? p.results_count : null,
          whatsapp_source: eventName === "contact_whatsapp" ? (p.source || null) : null,
          path: p.path || null,
          device_type: deviceType,
          referrer,
          ip_hash: hashedClientIp,
          user_agent: userAgent,
          raw_params: p,
        });

        if (error) {
          console.error("[Supabase Analytics Insert Error]:", error);
        } else {
          supabaseSaved = true;
        }
      } catch (err) {
        console.error("[Supabase Analytics Insert Exception]:", err);
      }
    }

    // 2. Yedek Fallback Disk Saklama (Yerel geliştirme & bağlantı kopmaları için)
    const fallbackEntry: StoredAnalyticsEvent = {
      id: entryId,
      received_at: receivedAt,
      client_ip: hashedClientIp,
      user_agent: userAgent,
      event: eventName,
      params: p,
      device_type: deviceType,
      path: p.path || "/",
    };

    const fallbackEvents = loadFallbackEvents();
    fallbackEvents.unshift(fallbackEntry);
    if (fallbackEvents.length > MAX_FALLBACK_EVENTS) {
      fallbackEvents.length = MAX_FALLBACK_EVENTS;
    }
    saveFallbackEvents(fallbackEvents);

    return NextResponse.json({
      success: true,
      persisted: supabaseSaved ? "supabase" : "fallback_disk",
    });
  } catch (error) {
    console.error("[Analytics POST Error]:", error);
    return NextResponse.json({ success: false, error: "Event kaydedilemedi" }, { status: 400 });
  }
}

// =========================================================================
// GET: Retrieve Authenticated Analytics Log for Admin Panel
// =========================================================================
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  // 1. Supabase Kalıcı Veritabanından Oku
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (!error && Array.isArray(data)) {
        const mappedEvents: StoredAnalyticsEvent[] = data.map((row: any) => ({
          id: row.id,
          received_at: row.created_at,
          client_ip: row.ip_hash || "gizli",
          user_agent: row.user_agent || "unknown",
          event: row.event_type,
          params: {
            ...row.raw_params,
            item_id: row.product_id || row.raw_params?.item_id,
            item_name: row.product_name || row.raw_params?.item_name,
            item_category: row.category || row.raw_params?.item_category,
            slug: row.product_slug || row.raw_params?.slug,
            search_term: row.search_term || row.raw_params?.search_term,
            results_count: row.results_count ?? row.raw_params?.results_count,
            source: row.whatsapp_source || row.raw_params?.source,
            visitor_id: row.visitor_id,
            session_id: row.session_id,
          },
          device_type: row.device_type,
          path: row.path,
        }));

        return NextResponse.json({
          authenticated: true,
          source: "supabase",
          total_cached: mappedEvents.length,
          events: mappedEvents,
        });
      }
    } catch (err) {
      console.warn("[Analytics Supabase Read Fallback]:", err);
    }
  }

  // 2. Yedek Fallback Disk Dosyasından Oku
  const fallbackEvents = loadFallbackEvents();
  return NextResponse.json({
    authenticated: true,
    source: "fallback_disk",
    total_cached: fallbackEvents.length,
    events: fallbackEvents,
  });
}

// =========================================================================
// DELETE: Authenticated Log Reset
// =========================================================================
export async function DELETE(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  saveFallbackEvents([]);

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      await supabase.from("analytics_events").delete().neq("event_type", "___never___");
    } catch {}
  }

  return NextResponse.json({ success: true, message: "Tüm loglar temizlendi" });
}
