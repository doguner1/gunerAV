import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSupabaseAdminClient } from "@/lib/server-supabase";
import { isAdminAuthorized } from "@/lib/server-auth";
import { StoredAnalyticsEvent } from "@/app/api/analytics/route";

const DATA_DIR = path.join(process.cwd(), "data");
const PRIMARY_STORAGE_FILE = path.join(DATA_DIR, "analytics_events.json");
const FALLBACK_STORAGE_FILE = path.join("/tmp", "gunerav_analytics_events.json");

function loadFallbackEvents(): StoredAnalyticsEvent[] {
  // Read /tmp first
  try {
    if (fs.existsSync(FALLBACK_STORAGE_FILE)) {
      const content = fs.readFileSync(FALLBACK_STORAGE_FILE, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {}

  // Read data/analytics_events.json
  try {
    if (fs.existsSync(PRIMARY_STORAGE_FILE)) {
      const content = fs.readFileSync(PRIMARY_STORAGE_FILE, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {}

  return [];
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "all"; // 'today' | '7d' | '30d' | 'all'

  // Calculate start date
  let startDate: Date | null = null;
  const now = new Date();
  if (range === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === "7d") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === "30d") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  let rawRows: any[] = [];
  let dataSource = "fallback_disk";

  // 1. Try Supabase
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      let query = supabase
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        rawRows = data.map((r: any) => ({
          id: r.id,
          received_at: r.created_at,
          client_ip: r.ip_hash || "gizli",
          user_agent: r.user_agent || "unknown",
          event: r.event_type,
          params: {
            ...r.raw_params,
            item_id: r.product_id || r.raw_params?.item_id,
            item_name: r.product_name || r.raw_params?.item_name,
            item_category: r.category || r.raw_params?.item_category,
            slug: r.product_slug || r.raw_params?.slug,
            search_term: r.search_term || r.raw_params?.search_term,
            results_count: r.results_count ?? r.raw_params?.results_count,
            source: r.whatsapp_source || r.raw_params?.source,
            visitor_id: r.visitor_id,
            session_id: r.session_id,
          },
          device_type: r.device_type,
          path: r.path,
        }));
        dataSource = "supabase";
      }
    } catch (err) {
      console.warn("[Dashboard Supabase Read Error]:", err);
    }
  }

  // 2. Fallback disk if Supabase had no rows or was unavailable
  if (rawRows.length === 0 && dataSource !== "supabase") {
    const diskEvents = loadFallbackEvents();
    if (startDate) {
      const startTime = startDate.getTime();
      rawRows = diskEvents.filter((ev) => {
        const t = new Date(ev.received_at).getTime();
        return !isNaN(t) && t >= startTime;
      });
    } else {
      rawRows = diskEvents;
    }
  }

  // 3. Aggregate metrics
  const uniqueVisitorsSet = new Set<string>();
  let totalPageViews = 0;
  let whatsappLeads = 0;
  let phoneCalls = 0;
  let locationClicks = 0;
  let searches = 0;
  let zooms = 0;

  const productStatsMap: Record<
    string,
    {
      productId: string;
      productName: string;
      slug: string;
      views: number;
      zooms: number;
      whatsappClicks: number;
    }
  > = {};

  const searchTermsMap: Record<
    string,
    {
      term: string;
      count: number;
      zeroResultCount: number;
      lastSearched: string;
    }
  > = {};

  let mobileCount = 0;
  let tabletCount = 0;
  let desktopCount = 0;

  for (const ev of rawRows) {
    const evName = (ev.event || "").toLowerCase();
    const p = ev.params || {};

    // Visitor tracking
    const visitorId = p.visitor_id || ev.client_ip;
    if (visitorId && visitorId !== "unknown" && visitorId !== "gizli") {
      uniqueVisitorsSet.add(visitorId);
    }

    // Devices
    const dev = (ev.device_type || "").toLowerCase();
    if (dev === "mobile") mobileCount++;
    else if (dev === "tablet") tabletCount++;
    else desktopCount++;

    // Counters
    if (evName.includes("whatsapp")) whatsappLeads++;
    else if (evName.includes("call") || evName.includes("phone")) phoneCalls++;
    else if (evName.includes("direction") || evName.includes("map") || evName.includes("location")) locationClicks++;
    else if (evName === "search") searches++;
    else if (evName === "product_zoom") zooms++;
    else if (evName === "view_item") totalPageViews++;

    // Product tracking
    const pId = p.item_id || p.slug;
    if (pId) {
      if (!productStatsMap[pId]) {
        productStatsMap[pId] = {
          productId: pId,
          productName: p.item_name || pId,
          slug: p.slug || pId,
          views: 0,
          zooms: 0,
          whatsappClicks: 0,
        };
      }
      if (evName === "view_item") productStatsMap[pId].views++;
      if (evName === "product_zoom") productStatsMap[pId].zooms++;
      if (evName.includes("whatsapp")) productStatsMap[pId].whatsappClicks++;
    }

    // Search tracking
    if (evName === "search" && p.search_term) {
      const termKey = String(p.search_term).trim().toLowerCase();
      if (termKey) {
        if (!searchTermsMap[termKey]) {
          searchTermsMap[termKey] = {
            term: p.search_term,
            count: 0,
            zeroResultCount: 0,
            lastSearched: ev.received_at,
          };
        }
        searchTermsMap[termKey].count++;
        if (p.results_count === 0) {
          searchTermsMap[termKey].zeroResultCount++;
        }
      }
    }
  }

  // Top products list with conversion rate calculation
  const topProducts = Object.values(productStatsMap)
    .map((p) => {
      const conversionRate = p.views > 0 ? ((p.whatsappClicks / p.views) * 100).toFixed(1) : "0.0";
      return {
        ...p,
        conversionRate: `${conversionRate}%`,
      };
    })
    .sort((a, b) => b.views - a.views || b.whatsappClicks - a.whatsappClicks)
    .slice(0, 25);

  // Search terms & missed demand list
  const searchTerms = Object.values(searchTermsMap).sort((a, b) => b.count - a.count);
  const missedDemand = searchTerms.filter((s) => s.zeroResultCount > 0);

  // Device percentage
  const totalDevs = mobileCount + tabletCount + desktopCount || 1;
  const deviceBreakdown = {
    mobile: { count: mobileCount, percent: Math.round((mobileCount / totalDevs) * 100) },
    tablet: { count: tabletCount, percent: Math.round((tabletCount / totalDevs) * 100) },
    desktop: { count: desktopCount, percent: Math.round((desktopCount / totalDevs) * 100) },
  };

  return NextResponse.json({
    success: true,
    dataSource,
    range,
    summary: {
      totalEvents: rawRows.length,
      uniqueVisitors: uniqueVisitorsSet.size || Math.max(1, Math.round(rawRows.length / 3)),
      totalPageViews,
      whatsappLeads,
      phoneCalls,
      locationClicks,
      searches,
      zooms,
    },
    topProducts,
    searchTerms: searchTerms.slice(0, 20),
    missedDemand: missedDemand.slice(0, 15),
    deviceBreakdown,
    recentEvents: rawRows.slice(0, 300),
  });
}
