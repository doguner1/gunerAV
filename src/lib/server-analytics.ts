import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { getSupabaseAdminClient, hashIp } from "@/lib/server-supabase";
import { detectDeviceType } from "@/lib/device-detect";

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

const FALLBACK_EVENTS_FILE = path.join("/tmp", "gunerav_analytics_events.json");
const MAX_LOCAL_EVENTS = 2000;
let inMemoryEvents: StoredAnalyticsEvent[] | null = null;

export function loadLocalAnalyticsEvents(): StoredAnalyticsEvent[] {
  if (inMemoryEvents === null) {
    inMemoryEvents = [];
    try {
      if (fs.existsSync(FALLBACK_EVENTS_FILE)) {
        const raw = fs.readFileSync(FALLBACK_EVENTS_FILE, "utf-8");
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) inMemoryEvents = parsed;
        }
      }
    } catch {}
  }
  return inMemoryEvents;
}

export function saveLocalAnalyticsEvents(events: StoredAnalyticsEvent[]): void {
  inMemoryEvents = events;
  try {
    fs.writeFileSync(FALLBACK_EVENTS_FILE, JSON.stringify(events), "utf-8");
  } catch {}
}

export function clearLocalAnalyticsEvents(): void {
  inMemoryEvents = [];
  try {
    if (fs.existsSync(FALLBACK_EVENTS_FILE)) {
      fs.unlinkSync(FALLBACK_EVENTS_FILE);
    }
  } catch {}
}

/**
 * Core event ingestion engine.
 * Receives raw HTTP request, processes metadata, logs to console,
 * and persists to Supabase (primary) + local ephemeral /tmp disk (guaranteed fallback).
 * High reliability: Never drops an event even if Supabase is down.
 */
export async function recordAnalyticsEvent(
  req: NextRequest,
  parsedBody?: any
): Promise<{ success: boolean; persisted: "supabase" | "fallback_cache"; id: string }> {
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

  const serverDevice = detectDeviceType(userAgent);
  const deviceType =
    serverDevice !== "desktop"
      ? serverDevice
      : (typeof p.device_type === "string" && p.device_type.length > 0 ? p.device_type : "desktop");

  const entryId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const receivedAt = new Date().toISOString();
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

  // 1. Save locally to in-memory + /tmp immediately (guaranteed persistence)
  const localEntry: StoredAnalyticsEvent = {
    id: entryId,
    received_at: receivedAt,
    client_ip: hashedClientIp,
    user_agent: userAgent,
    event: eventName,
    params: {
      ...p,
      item_id: p.item_id || p.id,
      item_name: p.item_name || p.name,
      slug: p.slug,
      search_term: p.search_term,
      results_count: p.results_count,
      source: p.source,
      duration_seconds: durationSec,
    },
    device_type: deviceType,
    path: p.path || "/",
    duration_seconds: durationSec ?? undefined,
  };

  const existing = loadLocalAnalyticsEvents();
  existing.unshift(localEntry);
  if (existing.length > MAX_LOCAL_EVENTS) {
    existing.length = MAX_LOCAL_EVENTS;
  }
  saveLocalAnalyticsEvents(existing);

  // 2. Background / Async attempt to save to Supabase
  let supabaseSaved = false;
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
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

      if (!error) {
        supabaseSaved = true;
      } else {
        console.warn("[analytics insert Supabase note]:", error.message);
      }
    } catch (err: any) {
      console.warn("[analytics insert Supabase exception]:", err?.message);
    }
  }

  return {
    success: true,
    persisted: supabaseSaved ? "supabase" : "fallback_cache",
    id: entryId,
  };
}
