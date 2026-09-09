import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server-supabase";
import { isAdminAuthorized } from "@/lib/server-auth";
import {
  StoredAnalyticsEvent,
  loadFallbackEvents,
  saveFallbackEvents,
  recordAnalyticsEvent,
} from "@/lib/server-analytics";

export type { StoredAnalyticsEvent };

// =========================================================================
// POST: Record New Event or Handle Admin Wipe
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

    const result = await recordAnalyticsEvent(req);
    return NextResponse.json(result);
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
            duration_seconds: row.duration_seconds ?? row.raw_params?.duration_seconds,
          },
          device_type: row.device_type,
          path: row.path,
          duration_seconds: row.duration_seconds ?? undefined,
        }));

        return NextResponse.json({
          authenticated: true,
          source: "supabase",
          count: mappedEvents.length,
          events: mappedEvents,
        });
      }
    } catch (err) {
      console.warn("[Analytics GET Supabase Fallback]:", err);
    }
  }

  // 2. Fallback: Yerel diskten oku
  const fallbackEvents = loadFallbackEvents();
  return NextResponse.json({
    authenticated: true,
    source: "fallback_disk",
    count: fallbackEvents.length,
    events: fallbackEvents,
  });
}
