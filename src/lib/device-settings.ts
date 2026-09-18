import { getSupabaseAdminClient } from "@/lib/server-supabase";

export interface DeviceSetting {
  visitorId: string;
  alias: string;
  isIgnored: boolean;
  updatedAt: string;
}

// In-memory cache for ultra-fast, zero-overhead lookups during request collection
let cachedSettings: Map<string, DeviceSetting> = new Map();
let lastCacheRefresh = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

/**
 * Loads device settings from Supabase (or cached memory).
 */
export async function getDeviceSettingsMap(forceRefresh = false): Promise<Map<string, DeviceSetting>> {
  const now = Date.now();
  if (!forceRefresh && cachedSettings.size > 0 && now - lastCacheRefresh < CACHE_TTL_MS) {
    return cachedSettings;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return cachedSettings;
  }

  try {
    const map = new Map<string, DeviceSetting>();

    // 1. Try reading from dedicated device_settings table if it exists
    let dedicatedTableSucceeded = false;
    try {
      const { data, error } = await supabase
        .from("device_settings")
        .select("visitor_id, alias, is_ignored, updated_at");

      if (!error && Array.isArray(data)) {
        dedicatedTableSucceeded = true;
        for (const row of data) {
          if (row.visitor_id) {
            map.set(row.visitor_id, {
              visitorId: row.visitor_id,
              alias: row.alias || "",
              isIgnored: Boolean(row.is_ignored),
              updatedAt: row.updated_at || new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      dedicatedTableSucceeded = false;
    }

    // 2. Fallback / supplementary: read __device_setting__ events from analytics_events
    if (!dedicatedTableSucceeded || map.size === 0) {
      try {
        const { data, error } = await supabase
          .from("analytics_events")
          .select("visitor_id, product_name, raw_params, created_at")
          .eq("event_type", "__device_setting__")
          .order("created_at", { ascending: false })
          .limit(500);

        if (!error && Array.isArray(data)) {
          for (const row of data) {
            const vid = row.visitor_id;
            if (vid && !map.has(vid)) {
              const params = (row.raw_params && typeof row.raw_params === "object") ? row.raw_params : {};
              map.set(vid, {
                visitorId: vid,
                alias: (params.alias || row.product_name || "").trim(),
                isIgnored: Boolean(params.is_ignored),
                updatedAt: params.updated_at || row.created_at || new Date().toISOString(),
              });
            }
          }
        }
      } catch (err) {
        console.warn("[device-settings] analytics_events read error:", err);
      }
    }

    cachedSettings = map;
    lastCacheRefresh = now;
    return cachedSettings;
  } catch (err) {
    console.error("[device-settings] getDeviceSettingsMap error:", err);
    return cachedSettings;
  }
}

/**
 * Returns all settings as a plain object for API responses.
 */
export async function getAllDeviceSettings(): Promise<Record<string, DeviceSetting>> {
  const map = await getDeviceSettingsMap();
  const obj: Record<string, DeviceSetting> = {};
  map.forEach((v, k) => {
    obj[k] = v;
  });
  return obj;
}

/**
 * Synchronously checks if a visitorId is marked as ignored.
 * Fast path: checks memory cache. If cache is empty, triggers a background refresh.
 */
export function isDeviceIgnored(visitorId?: string | null): boolean {
  if (!visitorId || visitorId === "anon" || visitorId === "unknown" || visitorId === "gizli") {
    return false;
  }

  // Trigger cache fill if cold
  if (cachedSettings.size === 0 && Date.now() - lastCacheRefresh > 10000) {
    getDeviceSettingsMap().catch(() => {});
  }

  // Exact match
  const exact = cachedSettings.get(visitorId);
  if (exact) return exact.isIgnored;

  // Prefix match (e.g. if slice(0, 10) was passed)
  for (const [vId, setting] of Array.from(cachedSettings.entries())) {
    if (setting.isIgnored && (vId.startsWith(visitorId) || visitorId.startsWith(vId))) {
      return true;
    }
  }

  return false;
}

/**
 * Returns the friendly alias if set.
 */
export function getDeviceAlias(visitorId?: string | null): string | null {
  if (!visitorId) return null;
  const exact = cachedSettings.get(visitorId);
  if (exact && exact.alias) return exact.alias;

  for (const [vId, setting] of Array.from(cachedSettings.entries())) {
    if (setting.alias && (vId.startsWith(visitorId) || visitorId.startsWith(vId))) {
      return setting.alias;
    }
  }

  return null;
}

/**
 * Saves or updates a device setting (alias and/or isIgnored toggle).
 */
export async function saveDeviceSetting(params: {
  visitorId: string;
  alias?: string;
  isIgnored?: boolean;
}): Promise<DeviceSetting> {
  const cleanId = params.visitorId.trim();
  const existing = cachedSettings.get(cleanId);

  const updated: DeviceSetting = {
    visitorId: cleanId,
    alias: typeof params.alias === "string" ? params.alias.trim() : (existing?.alias || ""),
    isIgnored: typeof params.isIgnored === "boolean" ? params.isIgnored : (existing?.isIgnored || false),
    updatedAt: new Date().toISOString(),
  };

  // 1. Update in-memory immediately for zero-delay reaction
  cachedSettings.set(cleanId, updated);
  lastCacheRefresh = Date.now();

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return updated;
  }

  // 2. Try writing to device_settings table
  try {
    await supabase.from("device_settings").upsert(
      {
        visitor_id: cleanId,
        alias: updated.alias,
        is_ignored: updated.isIgnored,
        updated_at: updated.updatedAt,
      },
      { onConflict: "visitor_id" }
    );
  } catch {}

  // 3. Always insert into analytics_events as backup/history
  try {
    await supabase.from("analytics_events").insert({
      event_type: "__device_setting__",
      visitor_id: cleanId,
      product_name: updated.alias || "isimsiz",
      raw_params: {
        alias: updated.alias,
        is_ignored: updated.isIgnored,
        updated_at: updated.updatedAt,
      },
    });
  } catch (err) {
    console.warn("[device-settings] Failed to write backup event:", err);
  }

  return updated;
}
