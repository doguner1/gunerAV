import fs from "fs";
import path from "path";
import { getSupabaseAdminClient } from "@/lib/server-supabase";

export interface StoredActiveVisitor {
  visitor_id: string;
  path: string;
  device_type: string;
  product_name: string | null;
  last_seen: string;
  last_seen_ms: number;
}

const FALLBACK_ACTIVE_FILE = path.join("/tmp", "gunerav_active_visitors.json");
const activeVisitorsMap = new Map<string, StoredActiveVisitor>();
let loadedFromDisk = false;

function loadFromDiskIfNeeded(): void {
  if (loadedFromDisk) return;
  loadedFromDisk = true;
  try {
    if (fs.existsSync(FALLBACK_ACTIVE_FILE)) {
      const raw = fs.readFileSync(FALLBACK_ACTIVE_FILE, "utf-8");
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const nowMs = Date.now();
          for (const item of parsed) {
            if (item && item.visitor_id && nowMs - item.last_seen_ms < 120000) {
              activeVisitorsMap.set(item.visitor_id, item);
            }
          }
        }
      }
    }
  } catch {}
}

function saveToDisk(): void {
  try {
    const list = Array.from(activeVisitorsMap.values());
    fs.writeFileSync(FALLBACK_ACTIVE_FILE, JSON.stringify(list), "utf-8");
  } catch {}
}

/**
 * Records or refreshes an active visitor presence heartbeat.
 * Guaranteed to succeed even if Supabase is down or unconfigured.
 */
export async function recordActiveVisitor(params: {
  visitor_id: string;
  path?: string;
  device_type?: string;
  product_name?: string | null;
}): Promise<StoredActiveVisitor> {
  loadFromDiskIfNeeded();

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const entry: StoredActiveVisitor = {
    visitor_id: params.visitor_id.slice(0, 128),
    path: (params.path || "/").slice(0, 500),
    device_type: (params.device_type || "desktop").slice(0, 50),
    product_name: params.product_name ? params.product_name.slice(0, 200) : null,
    last_seen: nowIso,
    last_seen_ms: nowMs,
  };

  // 1. Update in-memory map
  activeVisitorsMap.set(entry.visitor_id, entry);

  // 2. Prune old visitors (> 2 minutes)
  activeVisitorsMap.forEach((item, id) => {
    if (nowMs - item.last_seen_ms > 120000) {
      activeVisitorsMap.delete(id);
    }
  });

  // 3. Persist to /tmp
  saveToDisk();

  // 4. Background sync to Supabase if configured
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    (async () => {
      try {
        await supabase.from("active_visitors").upsert(
          {
            visitor_id: entry.visitor_id,
            path: entry.path,
            device_type: entry.device_type,
            product_name: entry.product_name,
            last_seen: entry.last_seen,
          },
          { onConflict: "visitor_id" }
        );
      } catch (err) {
        // Silent catch: local store guarantees real-time presence even if Supabase table is missing
      }
    })();
  }

  return entry;
}

/**
 * Returns currently active visitors within the specified activity window (default: 45s).
 * Merges local store and Supabase records for complete accuracy.
 */
export async function getActiveVisitors(windowMs = 45000): Promise<StoredActiveVisitor[]> {
  loadFromDiskIfNeeded();

  const nowMs = Date.now();
  const mergedMap = new Map<string, StoredActiveVisitor>();

  // 1. Collect from local in-memory & /tmp store
  activeVisitorsMap.forEach((item) => {
    if (nowMs - item.last_seen_ms <= windowMs) {
      mergedMap.set(item.visitor_id, item);
    }
  });

  // 2. Query Supabase if available
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const activeCutoff = new Date(nowMs - windowMs).toISOString();
      const { data } = await supabase
        .from("active_visitors")
        .select("visitor_id, path, device_type, product_name, last_seen")
        .gte("last_seen", activeCutoff)
        .order("last_seen", { ascending: false })
        .limit(100);

      if (Array.isArray(data)) {
        for (const row of data) {
          const rowMs = new Date(row.last_seen).getTime();
          const existing = mergedMap.get(row.visitor_id);
          if (!existing || rowMs > existing.last_seen_ms) {
            mergedMap.set(row.visitor_id, {
              visitor_id: row.visitor_id,
              path: row.path || "/",
              device_type: row.device_type || "desktop",
              product_name: row.product_name || null,
              last_seen: row.last_seen,
              last_seen_ms: rowMs,
            });
          }
        }
      }
    } catch {
      // Fall back to local store
    }
  }

  const result = Array.from(mergedMap.values());
  result.sort((a, b) => b.last_seen_ms - a.last_seen_ms);
  return result;
}
