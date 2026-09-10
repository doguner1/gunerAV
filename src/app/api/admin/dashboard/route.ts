import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";
import { getSupabaseAdminClient } from "@/lib/server-supabase";
import { isAdminAuthorized } from "@/lib/server-auth";
import { detectDeviceType } from "@/lib/device-detect";
import { getActiveVisitors } from "@/lib/active-visitors-store";

export const dynamic = "force-dynamic";

export interface JourneyStep {
  time: string;
  timestamp: string;
  eventType: string;
  description: string;
  badge: { text: string; color: "green" | "blue" | "purple" | "amber" | "gray" | "red" };
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
  const dataSource = "supabase";
  let activeVisitorsCount = 0;
  let activeVisitorsList: any[] = [];

  // 1. Live Active Visitors (from active-visitors-store via Supabase)
  try {
    activeVisitorsList = await getActiveVisitors(45000);
    activeVisitorsCount = activeVisitorsList.length;
  } catch (err) {
    console.warn("[Dashboard Active Visitors Error]:", err);
  }

  // 2. Query Supabase
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    // 2.a Fire-and-forget 30-day cleanup of active_visitors
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    (async () => {
      try {
        await supabase.from("active_visitors").delete().lt("last_seen", thirtyDaysAgo);
      } catch (err) {
        console.warn("[Active Visitors 30d Cleanup Error]:", err);
      }
    })();

    // 2.b Fire-and-forget: Auto-migrate any old accessory categories in Supabase to tufek-aksesuar
    (async () => {
      try {
        await supabase
          .from("products")
          .update({ category: "tufek-aksesuar", requires_license: false })
          .like("category", "aksesuar%");
        await supabase
          .from("products")
          .update({ category: "tufek-aksesuar", requires_license: false })
          .eq("category", "bicak-av");
      } catch (e) {}
    })();

    // 2.b Analytics Events Query
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
      if (!error && Array.isArray(data) && data.length > 0) {
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
            source_channel: r.raw_params?.source_channel || r.raw_params?.utm_source,
            visitor_id: r.visitor_id || r.raw_params?.visitor_id,
            session_id: r.session_id || r.raw_params?.session_id,
            duration_seconds: r.duration_seconds ?? r.raw_params?.duration_seconds,
          },
          device_type: r.device_type,
          path: r.path,
          duration_seconds: r.duration_seconds,
        }));
      } else if (error) {
        console.warn("[Dashboard Supabase Query Error]:", error);
      }
    } catch (err) {
      console.warn("[Dashboard Supabase Read Error]:", err);
    }
  }

  // 2. Supabase Diagnostic Info
  const hasUrl = Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasAnonKey = Boolean(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY);
  const missingEnv: string[] = [];
  if (!hasUrl) missingEnv.push("SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL");
  if (!hasServiceKey && !hasAnonKey) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY veya NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const supabaseStatus = {
    connected: Boolean(supabase),
    isConfigured: hasUrl && (hasServiceKey || hasAnonKey),
    isServiceRole: hasServiceKey,
    missingEnv,
    tableRowCount: rawRows.length,
    storageType: dataSource,
  };

  // 3. Fetch All Catalog Products for LEFT JOIN
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

  // 4. Aggregate metrics & Session grouping
  const uniqueVisitorsSet = new Set<string>();
  let totalPageViews = 0;
  let whatsappLeads = 0;
  let phoneCalls = 0;
  let locationClicks = 0;
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

    // Visitor tracking: UUID visitor_id from localStorage or client_ip
    const visitorId = p.visitor_id || ev.client_ip;
    if (visitorId && visitorId !== "unknown" && visitorId !== "gizli") {
      uniqueVisitorsSet.add(visitorId);
    }

    // Devices: UA based detection
    const dev =
      ev.user_agent && ev.user_agent !== "unknown"
        ? detectDeviceType(ev.user_agent)
        : (ev.device_type || "desktop").toLowerCase();

    if (dev === "mobile") mobileCount++;
    else if (dev === "tablet") tabletCount++;
    else desktopCount++;

    // Counters
    if (evName.includes("whatsapp")) whatsappLeads++;
    else if (evName.includes("call") || evName.includes("phone")) phoneCalls++;
    else if (evName.includes("direction") || evName.includes("map") || evName.includes("location")) locationClicks++;
    else if (evName === "product_zoom") zooms++;
    else if (evName === "view_item") totalPageViews++;

    // Match Product in Catalog
    const rawPId = p.item_id || p.slug || p.item_name;
    let matchedKey: string | undefined;
    if (rawPId) {
      matchedKey = productLookup.get(String(rawPId).toLowerCase());
    }

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

      if (evName === "product_time_spent" || evName === "page_time_spent") {
        const sec = typeof p.duration_seconds === "number" ? p.duration_seconds : ev.duration_seconds;
        if (typeof sec === "number" && sec >= 2) {
          productStatsMap[finalKey].totalDurationSeconds += sec;
          productStatsMap[finalKey].durationCount++;
        }
      }
    }

    // Session Grouping
    const sId = p.session_id || p.visitor_id || ev.client_ip || "sess_unknown";
    if (!sessionMap.has(sId)) {
      sessionMap.set(sId, {
        events: [],
        deviceType: dev,
        clientIp: ev.client_ip || "gizli",
        visitorId: p.visitor_id || "anonim",
      });
    }
    sessionMap.get(sId)!.events.push(ev);
  }

  // 5. Smart Keystroke Consolidation for Searches
  let validSearchCount = 0;
  const supersededSearchEventIds = new Set<string>();

  for (const sessionData of Array.from(sessionMap.values())) {
    const sessionSearchEvents = sessionData.events
      .filter((ev) => (ev.event || "").toLowerCase() === "search" && ev.params?.search_term)
      .sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime());

    for (let i = 0; i < sessionSearchEvents.length; i++) {
      const currEv = sessionSearchEvents[i];
      const rawTerm = String(currEv.params.search_term).trim();
      if (!rawTerm) continue;

      const currNorm = rawTerm.toLocaleLowerCase("tr");
      const currTime = new Date(currEv.received_at).getTime();

      const isSuperseded = sessionSearchEvents.slice(i + 1).some((laterEv) => {
        const laterRaw = String(laterEv.params?.search_term || "").trim();
        const laterNorm = laterRaw.toLocaleLowerCase("tr");
        const laterTime = new Date(laterEv.received_at).getTime();

        const timeDiffMs = !isNaN(laterTime) && !isNaN(currTime) ? laterTime - currTime : 0;
        const maxWindowMs = currNorm.length <= 4 ? 3 * 60 * 1000 : 60 * 1000;

        return (
          laterNorm.startsWith(currNorm) &&
          laterNorm.length > currNorm.length &&
          timeDiffMs <= maxWindowMs
        );
      });

      if (isSuperseded) {
        if (currEv.id) supersededSearchEventIds.add(currEv.id);
        continue;
      }

      validSearchCount++;
      const termKey = currNorm;
      if (!searchTermsMap[termKey]) {
        searchTermsMap[termKey] = {
          term: rawTerm,
          count: 0,
          zeroResultCount: 0,
          lastSearched: currEv.received_at,
        };
      }
      searchTermsMap[termKey].count++;
      if (currEv.params.results_count === 0) {
        searchTermsMap[termKey].zeroResultCount++;
      }
      if (
        new Date(currEv.received_at).getTime() >
        new Date(searchTermsMap[termKey].lastSearched).getTime()
      ) {
        searchTermsMap[termKey].lastSearched = currEv.received_at;
      }
    }
  }

  const searches = validSearchCount;

  // 6. Format Product Stats
  const topProducts = Object.values(productStatsMap)
    .map((p) => {
      const conversionRate = p.views > 0 ? ((p.whatsappClicks / p.views) * 100).toFixed(1) : "0.0";
      const avgDurationSeconds = p.durationCount > 0 ? Math.round(p.totalDurationSeconds / p.durationCount) : 0;
      const hasAnomaly = p.views === 0 && p.zooms > 0;

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
  const sessionsWithLead = new Set<string>();

  for (const [sessionId, sessionData] of Array.from(sessionMap.entries())) {
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

      if (evName === "session_start") {
        description = `Siteye Giriş Yapıldı (${p.source_channel || "Doğrudan"})`;
        badge = { text: "Giriş", color: "blue" };
      } else if (evName === "view_item") {
        description = `Ürün İnceleme: ${p.item_name || p.slug || "Ürün Detayı"}`;
        badge = { text: "İnceleme", color: "blue" };
      } else if (evName === "product_time_spent" || evName === "page_time_spent") {
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
        if (ev.id && supersededSearchEventIds.has(ev.id)) {
          continue;
        }
        const isZero = p.results_count === 0;
        description = isZero
          ? `Arama Yapıldı: "${p.search_term || ""}" (0 Sonuç - Kaçırılan Talep)`
          : `Arama Yapıldı: "${p.search_term || ""}" (${p.results_count ?? 0} sonuç)`;
        badge = isZero
          ? { text: "0 Sonuç", color: "red" }
          : { text: "Arama", color: "amber" };
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

    if (hasWhatsAppLead) {
      sessionsWithLead.add(sessionId);
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

  sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // 10. Visitor Loyalty (Yeni vs Geri Dönen)
  const visitorSessionCounts = new Map<string, number>();
  for (const [_, sData] of Array.from(sessionMap.entries())) {
    const vId = sData.visitorId;
    if (vId && vId !== "anonim" && vId !== "unknown" && vId !== "gizli") {
      visitorSessionCounts.set(vId, (visitorSessionCounts.get(vId) || 0) + 1);
    }
  }

  let newVisitorsCount = 0;
  let returningVisitorsCount = 0;
  for (const count of Array.from(visitorSessionCounts.values())) {
    if (count > 1) {
      returningVisitorsCount++;
    } else {
      newVisitorsCount++;
    }
  }
  const totalTrackedLoyalty = newVisitorsCount + returningVisitorsCount;
  const visitorLoyalty = {
    newCount: newVisitorsCount,
    newPercent: totalTrackedLoyalty > 0 ? Math.round((newVisitorsCount / totalTrackedLoyalty) * 100) : 100,
    returningCount: returningVisitorsCount,
    returningPercent: totalTrackedLoyalty > 0 ? Math.round((returningVisitorsCount / totalTrackedLoyalty) * 100) : 0,
    totalTracked: totalTrackedLoyalty,
  };

  // 11. Traffic Sources (Sosyal Medya, Arama Motorları, Doğrudan)
  const channelStats = new Map<string, { visits: number; whatsappLeads: number }>();
  const trackedSessionIds = new Set<string>();

  for (const ev of rawRows) {
    const evName = (ev.event || "").toLowerCase();
    const p = ev.params || {};
    const sId = p.session_id || p.visitor_id || ev.client_ip;

    if ((evName === "session_start" || p.source_channel) && sId && !trackedSessionIds.has(sId)) {
      trackedSessionIds.add(sId);
      const ch = p.source_channel || "Doğrudan (Direkt)";
      const curr = channelStats.get(ch) || { visits: 0, whatsappLeads: 0 };
      curr.visits++;
      if (sessionsWithLead.has(sId)) {
        curr.whatsappLeads++;
      }
      channelStats.set(ch, curr);
    }
  }

  // Backfill any sessions without explicit session_start as "Doğrudan (Direkt)"
  const unclassifiedSessions = Math.max(0, sessionMap.size - trackedSessionIds.size);
  if (unclassifiedSessions > 0 || channelStats.size === 0) {
    let unclassifiedLeads = 0;
    for (const [sId] of Array.from(sessionMap.entries())) {
      if (!trackedSessionIds.has(sId) && sessionsWithLead.has(sId)) {
        unclassifiedLeads++;
      }
    }
    const currDirect = channelStats.get("Doğrudan (Direkt)") || { visits: 0, whatsappLeads: 0 };
    currDirect.visits += unclassifiedSessions;
    currDirect.whatsappLeads += unclassifiedLeads;
    channelStats.set("Doğrudan (Direkt)", currDirect);
  }

  const totalChannelVisits = Array.from(channelStats.values()).reduce((a, b) => a + b.visits, 0) || 1;
  const trafficSources = Array.from(channelStats.entries())
    .map(([channel, stats]) => ({
      channel,
      visits: stats.visits,
      percent: Math.round((stats.visits / totalChannelVisits) * 100),
      whatsappLeads: stats.whatsappLeads,
      conversionRate: stats.visits > 0 ? ((stats.whatsappLeads / stats.visits) * 100).toFixed(1) + "%" : "0.0%",
    }))
    .sort((a, b) => b.visits - a.visits);

  // 12. Conversion Funnel (Giriş -> İnceleme -> Derin İnceleme -> WhatsApp)
  const actualTotalSessions = sessionMap.size;
  let viewedCount = 0;
  let engagedCount = 0;
  let whatsappLeadCount = 0;

  for (const sData of Array.from(sessionMap.values())) {
    let hasView = false;
    let hasEngaged = false;
    let hasLead = false;

    for (const ev of sData.events) {
      const evName = (ev.event || "").toLowerCase();
      const p = ev.params || {};
      if (evName === "view_item") hasView = true;
      if (
        evName === "product_zoom" ||
        (typeof p.duration_seconds === "number" && p.duration_seconds >= 30) ||
        (typeof ev.duration_seconds === "number" && ev.duration_seconds >= 30)
      ) {
        hasEngaged = true;
      }
      if (evName.includes("whatsapp")) hasLead = true;
    }

    const firstTime = sData.events[0]?.received_at ? new Date(sData.events[0].received_at).getTime() : 0;
    const lastTime = sData.events[sData.events.length - 1]?.received_at ? new Date(sData.events[sData.events.length - 1].received_at).getTime() : firstTime;
    const sessionDuration = Math.max(0, Math.round((lastTime - firstTime) / 1000));

    if (hasView) viewedCount++;
    if (hasEngaged || (hasView && sessionDuration >= 30)) engagedCount++;
    if (hasLead) whatsappLeadCount++;
  }

  const conversionFunnel = [
    {
      step: "1. Site Ziyareti",
      description: "Siteye giriş yapan tüm ziyaret oturumları",
      count: actualTotalSessions,
      percent: 100,
      dropRate: actualTotalSessions > 0 ? `${Math.max(0, Math.round(((actualTotalSessions - viewedCount) / actualTotalSessions) * 100))}% terk` : "0%",
    },
    {
      step: "2. Ürün İnceleme",
      description: "Katalogda en az bir ürün detayına girenler",
      count: viewedCount,
      percent: actualTotalSessions > 0 ? Math.round((viewedCount / actualTotalSessions) * 100) : 0,
      dropRate: viewedCount > 0 ? `${Math.max(0, Math.round(((viewedCount - engagedCount) / viewedCount) * 100))}% terk` : "0%",
    },
    {
      step: "3. Derin İnceleme (HD Zoom / 30sn+)",
      description: "Ürün görselini büyüten veya 30 sn+ inceleyenler",
      count: engagedCount,
      percent: actualTotalSessions > 0 ? Math.round((engagedCount / actualTotalSessions) * 100) : 0,
      dropRate: engagedCount > 0 ? `${Math.max(0, Math.round(((engagedCount - whatsappLeadCount) / engagedCount) * 100))}% terk` : "0%",
    },
    {
      step: "4. WhatsApp Satış Görüşmesi",
      description: "WhatsApp butonuna basıp bayiye ulaşanlar",
      count: whatsappLeadCount,
      percent: actualTotalSessions > 0 ? Math.round((whatsappLeadCount / actualTotalSessions) * 100) : 0,
      dropRate: "0%",
    },
  ];

  return NextResponse.json({
    success: true,
    dataSource,
    supabaseStatus,
    range,
    summary: {
      totalEvents: rawRows.length,
      uniqueVisitors: uniqueVisitorsSet.size,
      activeVisitorsCount,
      totalPageViews,
      whatsappLeads,
      phoneCalls,
      locationClicks,
      searches,
      zooms,
      totalCatalogProducts: catalogProducts.length,
    },
    visitorLoyalty,
    trafficSources,
    conversionFunnel,
    topProducts,
    sessions: sessions.slice(0, 50),
    searchTerms: searchTerms.slice(0, 20),
    missedDemand: missedDemand.slice(0, 15),
    deviceBreakdown,
    recentEvents: rawRows.slice(0, 300),
  });
}
