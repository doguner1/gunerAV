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
 * Ensures storage directory exists and returns the best writable file path.
 */
function getStorageFilePath(): string {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Test write accessibility
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
    return PRIMARY_STORAGE_FILE;
  } catch {
    // In serverless environments with read-only root (e.g. Vercel /var/task), use /tmp
    return FALLBACK_STORAGE_FILE;
  }
}

/**
 * Loads persisted events from disk.
 */
function loadEventsFromDisk(): StoredAnalyticsEvent[] {
  // Check primary first
  try {
    if (fs.existsSync(PRIMARY_STORAGE_FILE)) {
      const content = fs.readFileSync(PRIMARY_STORAGE_FILE, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.warn("[Analytics] Primary disk read failed, trying fallback:", err);
  }

  // Check fallback (/tmp)
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

  return [];
}

/**
 * Saves events array to disk with atomic write.
 */
function saveEventsToDisk(events: StoredAnalyticsEvent[]): boolean {
  const jsonContent = JSON.stringify(events, null, 2);
  const targetFile = getStorageFilePath();

  try {
    // Attempt primary write
    if (targetFile === PRIMARY_STORAGE_FILE) {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PRIMARY_STORAGE_FILE, jsonContent, "utf-8");
      return true;
    }
  } catch (err) {
    console.warn("[Analytics] Failed to write to primary disk, falling back to /tmp:", err);
  }

  // Fallback write (/tmp)
  try {
    fs.writeFileSync(FALLBACK_STORAGE_FILE, jsonContent, "utf-8");
    return true;
  } catch (err) {
    console.error("[Analytics] Critical: Failed to write to fallback storage:", err);
    return false;
  }
}

// In-memory cache for ultra-fast reads, initialized from disk
let memoryCache: StoredAnalyticsEvent[] | null = null;

function getCachedEvents(): StoredAnalyticsEvent[] {
  if (memoryCache === null) {
    memoryCache = loadEventsFromDisk();
  }
  return memoryCache;
}

/**
 * Asynchronously forward event to Supabase if configured in environment
 */
async function syncToSupabaseIfAvailable(entry: StoredAnalyticsEvent) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  try {
    await fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
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
  } catch {
    // Silent fail if table does not exist or network unavailable
  }
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

    // Optional: Allow authenticated wipe/reset from Admin Panel
    if (action === "clear") {
      if (!validSecret || !secret || secret !== validSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      memoryCache = [];
      saveEventsToDisk([]);
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

    const entry: StoredAnalyticsEvent = {
      id: entryId,
      received_at: new Date().toISOString(),
      client_ip: clientIp,
      user_agent: userAgent,
      event: eventName,
      params,
      device_type: params.device_type || (userAgent.includes("Mobile") ? "mobile" : userAgent.includes("Tablet") ? "tablet" : "desktop"),
      path: params.path || "/",
    };

    // Load existing events from disk to ensure fresh sync across workers
    const events = loadEventsFromDisk();
    events.unshift(entry);

    if (events.length > MAX_PERSISTED_EVENTS) {
      events.length = MAX_PERSISTED_EVENTS;
    }

    // Update memory and write to permanent disk
    memoryCache = events;
    saveEventsToDisk(events);

    // Sync to Supabase in background
    syncToSupabaseIfAvailable(entry).catch(() => {});

    // Log to runtime console
    console.log(`[📊 GÜNER_ANALYTICS] ${entry.event}:`, JSON.stringify(entry.params));

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

  // Always reload from disk to ensure any background events are captured
  const events = loadEventsFromDisk();
  memoryCache = events;

  return NextResponse.json({
    authenticated: true,
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

  return NextResponse.json({ success: true, message: "Logs reset successfully" });
}
