import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";
import { getSupabaseAdminClient } from "@/lib/server-supabase";
import { isAdminAuthorized } from "@/lib/server-auth";
import { loadFallbackEvents, StoredAnalyticsEvent } from "@/lib/server-analytics";

export interface JourneyStep {
  time: string;
  timestamp: string;
  eventType: string;
  description: string;
  badge: { text: string; color: "green" | "blue" | "purple" | "amber" | "gray" };
}

export interface VisitorJourneySession {
  sessionId: string;
  visitorId: string;
  deviceType: string;
  clientIp: string;
  startTime: string;
  endTime: string;
  durationFormatted: string;
  totalDurationSeconds: number;
  hasWhatsAppLead: boolean;
  stepCount: number;
  steps: JourneyStep[];
}

function formatDurationHuman(seconds: number): string {
  if (seconds <= 0) return "0 sn";
  if (seconds < 60) return `${seconds} sn`;
  const mins = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  return remSec > 0 ? `${mins} dk ${remSec} sn` : `${mins} dk`;
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "00:00:00";
  }
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
  let dataSource: "supabase" | "fallback_disk" = "fallback_disk";

  // 1. Try Supabase
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      let query = supabase
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000);

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
            visitor_id: r.visitor_id || r.raw_params?.visitor_id,
            session_id: r.session_id || r.raw_params?.session_id,
            duration_seconds: r.duration_seconds ?? r.raw_params?.duration_seconds,
          },
          device_type: r.device_type,
          path: r.path,
          duration_seconds: r.duration_seconds,
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

  // 3. Supabase Diagnostic Info
  const hasUrl = Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);
  const hasAnonKey = Boolean(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const missingEnv: string[] = [];
  if (!hasUrl) missingEnv.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!hasServiceKey && !hasAnonKey) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY (veya ANON_KEY)");

  const supabaseStatus = {
    connected: dataSource === "supabase",
    isConfigured: hasUrl && (hasServiceKey || hasAnonKey),
    missingEnv,
    tableRowCount: rawRows.length,
    storageType: dataSource,
  };

  // 4. Fetch All Catalog Products for LEFT JOIN
  const catalogProducts = await getAllProducts();
  const productStatsMap: Record<
    string,
    {
      productId: string;
      productName: string;
      slug: string;
      views: number;
      zooms: number;
      whatsappClicks: number;
      totalDurationSeconds: number;
      durationCount: number;
      hasAnomaly?: boolean;
    }
  > = {};

  const productLookup = new Map<string, string>(); // query string -> primary key

  for (const prod of catalogProducts) {
    const primaryKey = prod.slug_tr || prod.slug_en || prod.id;
    productStatsMap[primaryKey] = {
      productId: prod.id,
      productName: prod.name_tr,
      slug: primaryKey,
      views: 0,
      zooms: 0,
      whatsappClicks: 0,
      totalDurationSeconds: 0,
      durationCount: 0,
    };

    productLookup.set(prod.id.toLowerCase(), primaryKey);
    if (prod.slug_tr) productLookup.set(prod.slug_tr.toLowerCase(), primaryKey);
    if (prod.slug_en) productLookup.set(prod.slug_en.toLowerCase(), primaryKey);
    if (prod.name_tr) productLookup.set(prod.name_tr.toLowerCase(), primaryKey);
    if (prod.name_en) productLookup.set(prod.name_en.toLowerCase(), primaryKey);
  }

  // 5. Aggregate metrics & Session grouping
  const uniqueVisitorsSet = new Set<string>();
  let totalPageViews = 0;
  let whatsappLeads = 0;
  let phoneCalls = 0;
  let locationClicks = 0;
  let searches = 0;
  let zooms = 0;

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

  // Session Map for Visitor Journeys
  const sessionMap = new Map<string, { events: any[]; deviceType: string; clientIp: string; visitorId: string }>();

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

    // Match Product in Catalog
    const rawPId = p.item_id || p.slug || p.item_name;
    let matchedKey: string | undefined;
    if (rawPId) {
      matchedKey = productLookup.get(String(rawPId).toLowerCase());
    }

    // If not in catalog, create or use ad-hoc entry
    const finalKey = matchedKey || rawPId;
    if (finalKey) {
      if (!productStatsMap[finalKey]) {
        productStatsMap[finalKey] = {
          productId: p.item_id || finalKey,
          productName: p.item_name || finalKey,
          slug: p.slug || finalKey,
          views: 0,
          zooms: 0,
          whatsappClicks: 0,
          totalDurationSeconds: 0,
          durationCount: 0,
        };
      }

      if (evName === "view_item") productStatsMap[finalKey].views++;
      if (evName === "product_zoom") productStatsMap[finalKey].zooms++;
      if (evName.includes("whatsapp")) productStatsMap[finalKey].whatsappClicks++;

      if (evName === "product_time_spent") {
        const sec = typeof p.duration_seconds === "number" ? p.duration_seconds : ev.duration_seconds;
        if (typeof sec === "number" && sec >= 2) {
          productStatsMap[finalKey].totalDurationSeconds += sec;
          productStatsMap[finalKey].durationCount++;
        }
      }
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

    // Session Grouping
    const sId = p.session_id || p.visitor_id || ev.client_ip || "sess_unknown";
    if (!sessionMap.has(sId)) {
      sessionMap.set(sId, {
        events: [],
        deviceType: ev.device_type || "desktop",
        clientIp: ev.client_ip || "gizli",
        visitorId: p.visitor_id || "anonim",
      });
    }
    sessionMap.get(sId)!.events.push(ev);
  }

  // 6. Format Product Stats (All Products Included, with Dwell Time & Anomaly Detection)
  const topProducts = Object.values(productStatsMap)
    .map((p) => {
      const conversionRate = p.views > 0 ? ((p.whatsappClicks / p.views) * 100).toFixed(1) : "0.0";
      const avgDurationSeconds = p.durationCount > 0 ? Math.round(p.totalDurationSeconds / p.durationCount) : 0;
      const hasAnomaly = p.zooms > p.views;

      return {
        productId: p.productId,
        productName: p.productName,
        slug: p.slug,
        views: p.views,
        zooms: p.zooms,
        whatsappClicks: p.whatsappClicks,
        avgDurationSeconds,
        hasAnomaly,
        conversionRate: `${conversionRate}%`,
      };
    })
    .sort((a, b) => {
      // Primary: views desc, Secondary: whatsappClicks desc, Tertiary: name asc
      if (b.views !== a.views) return b.views - a.views;
      if (b.whatsappClicks !== a.whatsappClicks) return b.whatsappClicks - a.whatsappClicks;
      if (b.zooms !== a.zooms) return b.zooms - a.zooms;
      return a.productName.localeCompare(b.productName, "tr");
    });

  // 7. Search terms & Missed Demand
  const searchTerms = Object.values(searchTermsMap).sort((a, b) => b.count - a.count);
  const missedDemand = searchTerms.filter((s) => s.zeroResultCount > 0);

  // 8. Device Breakdown
  const totalDevs = mobileCount + tabletCount + desktopCount || 1;
  const deviceBreakdown = {
    mobile: { count: mobileCount, percent: Math.round((mobileCount / totalDevs) * 100) },
    tablet: { count: tabletCount, percent: Math.round((tabletCount / totalDevs) * 100) },
    desktop: { count: desktopCount, percent: Math.round((desktopCount / totalDevs) * 100) },
  };

  // 9. Build Visitor Journeys
  const sessions: VisitorJourneySession[] = [];

  for (const [sessionId, sessionData] of Array.from(sessionMap.entries())) {
    // Sort events ascending by timestamp
    const sortedEvs = [...sessionData.events].sort(
      (a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
    );

    const firstTime = sortedEvs[0]?.received_at || new Date().toISOString();
    const lastTime = sortedEvs[sortedEvs.length - 1]?.received_at || firstTime;
    const diffSeconds = Math.max(0, Math.round((new Date(lastTime).getTime() - new Date(firstTime).getTime()) / 1000));

    let hasWhatsAppLead = false;
    const steps: JourneyStep[] = [];

    for (const ev of sortedEvs) {
      const evName = (ev.event || "").toLowerCase();
      const p = ev.params || {};

      let description = "Sayfa Görüntülendi";
      let badge: JourneyStep["badge"] = { text: "Gezinme", color: "gray" };

      if (evName === "view_item") {
        description = `Ürün İnceleme: ${p.item_name || p.slug || "Ürün Detayı"}`;
        badge = { text: "İnceleme", color: "blue" };
      } else if (evName === "product_time_spent") {
        const sec = typeof p.duration_seconds === "number" ? p.duration_seconds : 0;
        description = `${p.item_name || "Ürün sayfasında"} ${sec} sn vakit geçirdi`;
        badge = { text: `${sec} sn`, color: "purple" };
      } else if (evName === "product_zoom") {
        description = `Ürün Görseli Yakınlaştırıldı (${p.zoom_type || "Lens"}) - ${p.item_name || ""}`;
        badge = { text: "HD Zoom", color: "purple" };
      } else if (evName.includes("whatsapp")) {
        hasWhatsAppLead = true;
        description = `WhatsApp Sipariş / Fiyat Butonuna Tıklandı (${p.item_name ? `"${p.item_name}"` : p.source || "Siteden"})`;
        badge = { text: "WhatsApp Satış", color: "green" };
      } else if (evName === "search") {
        description = `Arama Yapıldı: "${p.search_term || ""}" (${p.results_count ?? 0} sonuç)`;
        badge = { text: "Arama", color: "amber" };
      } else if (evName === "select_category") {
        description = `Kategori Seçildi: ${p.category_name || p.category_id || "Kategori"}`;
        badge = { text: "Kategori", color: "amber" };
      } else if (evName === "select_variant") {
        description = `Renk / Kalibre Seçimi: ${p.variant || "Varyant"} (${p.item_name || ""})`;
        badge = { text: "Varyant", color: "blue" };
      } else if (evName.includes("call") || evName.includes("phone")) {
        description = `Telefonla Doğrudan Arama (${p.source || "Web"})`;
        badge = { text: "Telefon", color: "green" };
      } else if (evName.includes("direction") || evName.includes("map")) {
        description = `Mağaza Konumu & Yol Tarifi Açıldı`;
        badge = { text: "Harita", color: "amber" };
      } else {
        description = `${ev.event} (${ev.path || p.path || "/"})`;
      }

      steps.push({
        time: formatTime(ev.received_at),
        timestamp: ev.received_at,
        eventType: ev.event,
        description,
        badge,
      });
    }

    sessions.push({
      sessionId: sessionId.length > 12 ? sessionId.slice(0, 10) + "..." : sessionId,
      visitorId: sessionData.visitorId,
      deviceType: sessionData.deviceType,
      clientIp: sessionData.clientIp,
      startTime: firstTime,
      endTime: lastTime,
      durationFormatted: formatDurationHuman(diffSeconds),
      totalDurationSeconds: diffSeconds,
      hasWhatsAppLead,
      stepCount: steps.length,
      steps,
    });
  }

  // Sort sessions by latest first
  sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return NextResponse.json({
    success: true,
    dataSource,
    supabaseStatus,
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
      totalCatalogProducts: catalogProducts.length,
    },
    topProducts,
    sessions: sessions.slice(0, 50),
    searchTerms: searchTerms.slice(0, 20),
    missedDemand: missedDemand.slice(0, 15),
    deviceBreakdown,
    recentEvents: rawRows.slice(0, 300),
  });
}
