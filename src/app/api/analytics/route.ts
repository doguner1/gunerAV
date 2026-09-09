import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 1. Storage Configuration
const DATA_DIR = path.join(process.cwd(), "data");
const PRIMARY_STORAGE_FILE = path.join(DATA_DIR, "analytics_events.json");
const FALLBACK_STORAGE_FILE = path.join("/tmp", "gunerav_analytics_events.json");
const MAX_PERSISTED_EVENTS = 2000;

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

/**
 * Checks whether primary data directory is writable (true locally, false on Vercel read-only root)
 */
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

/**
 * Loads persisted events from disk.
 * In serverless (Vercel), FALLBACK_STORAGE_FILE (/tmp) is where runtime events and clears are written,
 * so it MUST take precedence over the static bundled PRIMARY_STORAGE_FILE.
 */
function loadEventsFromDisk(): StoredAnalyticsEvent[] {
  const primaryWritable = isPrimaryWritable();

  // 1. In serverless / read-only environments, check /tmp first!
  if (!primaryWritable) {
    try {
      if (fs.existsSync(FALLBACK_STORAGE_FILE)) {
        const content = fs.readFileSync(FALLBACK_STORAGE_FILE, "utf-8");
        if (content.trim()) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (err) {
      console.warn("[Analytics] Fallback disk read failed:", err);
    }
  }

  // 2. Check primary storage file (data/analytics_events.json)
  try {
    if (fs.existsSync(PRIMARY_STORAGE_FILE)) {
      const content = fs.readFileSync(PRIMARY_STORAGE_FILE, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.warn("[Analytics] Primary disk read failed:", err);
  }

  // 3. If primary was writable, check fallback as secondary backup
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

/**
 * Saves events array to disk.
 * Writes to /tmp (always writable) and to primary if writable.
 */
function saveEventsToDisk(events: StoredAnalyticsEvent[]): boolean {
  const jsonContent = JSON.stringify(events, null, 2);
  let saved = false;

  // Always write to /tmp
  try {
    fs.writeFileSync(FALLBACK_STORAGE_FILE, jsonContent, "utf-8");
    saved = true;
  } catch (err) {
    console.warn("[Analytics] Failed to write fallback storage (/tmp):", err);
  }

  // If primary is writable, write to primary as well
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRIMARY_STORAGE_FILE, jsonContent, "utf-8");
    saved = true;
  } catch {
    // Read-only filesystem in serverless
  }

  return saved;
}

// In-memory cache for ultra-fast reads within the active container
let memoryCache: StoredAnalyticsEvent[] | null = null;

/**
 * Helper to get Supabase connection details if configured
 */
function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

/**
 * Forward event to Supabase if configured in environment
 */
async function syncToSupabaseIfAvailable(entry: StoredAnalyticsEvent) {
  const config = getSupabaseConfig();
  if (!config) return;

  try {
    await fetch(`${config.url}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id: entry.id,
        event: entry.event,
        params: entry.params,
        client_ip: entry.client_ip,
        user_agent: entry.user_agent,
        device_type: entry.device_type,
        path: entry.path,
        created_at: entry.received_at,
      }),
    });
  } catch {}
}

/**
 * Fetch events from Supabase if configured
 */
async function getEventsFromSupabase(): Promise<StoredAnalyticsEvent[] | null> {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    const res = await fetch(`${config.url}/rest/v1/analytics_events?select=*&order=created_at.desc&limit=1000`, {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return data.map((row: any) => ({
      id: row.id || `evt_${row.created_at}`,
      received_at: row.created_at || row.received_at || new Date().toISOString(),
      client_ip: row.client_ip || "unknown",
      user_agent: row.user_agent || "unknown",
      event: row.event || "unknown",
      params: typeof row.params === "object" && row.params !== null ? row.params : {},
      device_type: row.device_type,
      path: row.path,
    }));
  } catch {
    return null;
  }
}

/**
 * Delete all events from Supabase if configured
 */
async function clearSupabaseEvents() {
  const config = getSupabaseConfig();
  if (!config) return;

  try {
    await fetch(`${config.url}/rest/v1/analytics_events?id=neq.none`, {
      method: "DELETE",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
    });
  } catch {}
}

// =========================================================================
// POST: Record New Visitor / Interaction Event
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const secret = searchParams.get("key");
    const validSecret = process.env.ANALYTICS_SECRET;

    // Authenticated wipe/reset from Admin Panel
    if (action === "clear") {
      if (!validSecret || !secret || secret !== validSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      memoryCache = [];
      saveEventsToDisk([]);
      await clearSupabaseEvents();
      return NextResponse.json({ success: true, message: "Analytics logs cleared successfully." });
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

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const clientIp = ip.split(",")[0].trim();

    const entryId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventName = body.event || "unknown";
    const params = body.params || {};

    const uaLower = userAgent.toLowerCase();
    const isTablet =
      params.device_type === "tablet" ||
      uaLower.includes("ipad") ||
      uaLower.includes("tablet") ||
      (uaLower.includes("android") && !uaLower.includes("mobile"));
    const isMobile =
      params.device_type === "mobile" ||
      uaLower.includes("iphone") ||
      uaLower.includes("mobile") ||
      uaLower.includes("ipod");

    const deviceType = params.device_type || (isTablet ? "tablet" : isMobile ? "mobile" : "desktop");

    const entry: StoredAnalyticsEvent = {
      id: entryId,
      received_at: new Date().toISOString(),
      client_ip: clientIp,
      user_agent: userAgent,
      event: eventName,
      params,
      device_type: deviceType,
      path: params.path || "/",
    };

    // Load existing events from disk to ensure fresh sync across invocations
    const events = loadEventsFromDisk();
    events.unshift(entry);

    if (events.length > MAX_PERSISTED_EVENTS) {
      events.length = MAX_PERSISTED_EVENTS;
    }

    // Update memory and write to disk
    memoryCache = events;
    saveEventsToDisk(events);

    // Sync to Supabase in background
    syncToSupabaseIfAvailable(entry).catch(() => {});

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    console.error("[Analytics POST Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to record event" }, { status: 400 });
  }
}

// =========================================================================
// GET: Retrieve Authenticated Analytics Log for Admin Panel
// =========================================================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("key");
  const validSecret = process.env.ANALYTICS_SECRET;

  // Block unauthorized public access
  if (!validSecret || !secret || secret !== validSecret) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // 1. First attempt to load from Supabase if configured
  const supabaseEvents = await getEventsFromSupabase();
  if (supabaseEvents !== null) {
    return NextResponse.json({
      authenticated: true,
      source: "supabase",
      total_cached: supabaseEvents.length,
      events: supabaseEvents,
    });
  }

  // 2. Otherwise load from disk
  const events = loadEventsFromDisk();
  memoryCache = events;

  return NextResponse.json({
    authenticated: true,
    source: "disk",
    total_cached: events.length,
    events,
  });
}

// =========================================================================
// DELETE: Authenticated Log Reset
// =========================================================================
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("key");
  const validSecret = process.env.ANALYTICS_SECRET;

  if (!validSecret || !secret || secret !== validSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  memoryCache = [];
  saveEventsToDisk([]);
  await clearSupabaseEvents();

  return NextResponse.json({ success: true, message: "Logs reset successfully" });
}
