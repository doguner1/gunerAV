import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { getSupabaseAdminClient, hashIp } from "@/lib/server-supabase";

// Local Fallback Storage Configuration
const DATA_DIR = path.join(process.cwd(), "data");
const PRIMARY_STORAGE_FILE = path.join(DATA_DIR, "analytics_events.json");
const FALLBACK_STORAGE_FILE = path.join("/tmp", "gunerav_analytics_events.json");
export const MAX_FALLBACK_EVENTS = 1500;

export interface StoredAnalyticsEvent {
  id: string;
  received_at: string;
  client_ip: string;
  user_agent: string;
  event: string;
  params: Record<string, any>;
  device_type?: string;
  path?: string;
  duration_seconds?: number;
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

export function loadFallbackEvents(): StoredAnalyticsEvent[] {
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

export function saveFallbackEvents(events: StoredAnalyticsEvent[]): void {
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

/**
 * Core event ingestion engine.
 * Receives raw HTTP request, processes metadata, logs to console,
 * and persists to Supabase (primary) + local disk (fallback).
 */
export async function recordAnalyticsEvent(
  req: NextRequest,
  parsedBody?: any
): Promise<{ success: boolean; persisted: "supabase" | "fallback_disk"; id: string }> {
  let body: any = parsedBody;

  if (!body) {
    const text = await req.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    } else {
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
  const durationSec = typeof p.duration_seconds === "number" ? Math.round(p.duration_seconds) : null;

  // Exact server-side diagnostic log requested
  console.log(
    "[event received]",
    eventName,
    p.item_id || p.slug || "general",
    "device:",
    deviceType,
    "ip_hash:",
    hashedClientIp.slice(0, 8)
  );

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
        duration_seconds: durationSec,
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

  // 2. Yedek Fallback Disk Saklama
  const fallbackEntry: StoredAnalyticsEvent = {
    id: entryId,
    received_at: receivedAt,
    client_ip: hashedClientIp,
    user_agent: userAgent,
    event: eventName,
    params: p,
    device_type: deviceType,
    path: p.path || "/",
    duration_seconds: durationSec ?? undefined,
  };

  const fallbackEvents = loadFallbackEvents();
  fallbackEvents.unshift(fallbackEntry);
  if (fallbackEvents.length > MAX_FALLBACK_EVENTS) {
    fallbackEvents.length = MAX_FALLBACK_EVENTS;
  }
  saveFallbackEvents(fallbackEvents);

  return {
    success: true,
    persisted: supabaseSaved ? "supabase" : "fallback_disk",
    id: entryId,
  };
}
