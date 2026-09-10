/**
 * Güner AV - Global Analytics & DataLayer Event Hub
 * Dispatches structured events to:
 * 1. Google Tag Manager (window.dataLayer) & GA4
 * 2. Vercel Analytics (va.track)
 * 3. Server-side log beacon (/api/analytics)
 * 4. Client-side local debug log (localStorage)
 */

export interface AnalyticsEventParams {
  [key: string]: any;
}

// Ensure TypeScript recognizes window.dataLayer and debugging tools
declare global {
  interface Window {
    dataLayer: Record<string, any>[];
    getGunerAnalyticsLogs?: () => any[];
    clearGunerAnalyticsLogs?: () => void;
  }
}

const LOCAL_STORAGE_LOG_KEY = "gunerav_analytics_log";
const MAX_LOCAL_LOGS = 100;

let memVisitorId: string | null = null;
let memSessionId: string | null = null;

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "anon";
  try {
    let vid = localStorage.getItem("gunerav_visitor_id");
    if (!vid) {
      vid = "vis_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem("gunerav_visitor_id", vid);
    }
    return vid;
  } catch {
    if (!memVisitorId) memVisitorId = "vis_mem_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    return memVisitorId;
  }
}

export const getVisitorId = getOrCreateVisitorId;

export function getSessionId(): string {
  if (typeof window === "undefined") return "sess";
  try {
    const now = Date.now();
    let sid = localStorage.getItem("gunerav_session_id");
    let lastActiveStr = localStorage.getItem("gunerav_session_last_active");
    
    // 30 dakika (1800000 ms) inaktivite süresi
    const isExpired = !lastActiveStr || (now - parseInt(lastActiveStr)) > 30 * 60 * 1000;
    
    if (!sid || isExpired) {
      sid = "sess_" + Math.random().toString(36).substring(2, 9) + now.toString(36);
      localStorage.setItem("gunerav_session_id", sid);
    }
    
    // Her çağrıda son aktif zamanı güncelle
    localStorage.setItem("gunerav_session_last_active", now.toString());
    
    return sid;
  } catch {
    if (!memSessionId) memSessionId = "sess_mem_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    return memSessionId;
  }
}

/**
 * Core event tracking dispatcher
 */
export function trackEvent(eventName: string, params: AnalyticsEventParams = {}) {
  if (typeof window === "undefined") return;

  const timestamp = new Date().toISOString();
  // NOT: Cihaz tipi artık client-side ekran genişliğiyle HESAPLANMAZ.
  // Sunucu tarafı User-Agent tespiti (server-analytics.ts → detectDeviceType) tek doğruluk kaynağıdır.
  const visitorId = getVisitorId();
  const sessionId = getSessionId();

  const isProbablyIpadPro =
    typeof navigator !== "undefined" &&
    /macintosh/i.test(navigator.userAgent) &&
    navigator.maxTouchPoints > 1;

  const eventPayload = {
    event: eventName,
    visitor_id: visitorId,
    session_id: sessionId,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    path: window.location.pathname,
    timestamp,
    is_ipad_pro_hint: isProbablyIpadPro,
    ...params,
  };

  // 1. Google Tag Manager / GA4 DataLayer
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventPayload);
  } catch (err) {
    console.error("[GTM DataLayer Error]:", err);
  }

  // 2. Vercel Analytics Custom Event (if available)
  try {
    if (typeof (window as any).va === "function") {
      (window as any).va("event", { name: eventName, data: params });
    }
  } catch (err) {}

  // 3. Local debug log in localStorage (for instant review and export)
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LOG_KEY) || "[]");
    existing.unshift({ event: eventName, params, timestamp, path: window.location.pathname });
    if (existing.length > MAX_LOCAL_LOGS) existing.pop();
    localStorage.setItem(LOCAL_STORAGE_LOG_KEY, JSON.stringify(existing));
  } catch (err) {}

  // 4. Send background event to neutral server API endpoint (/api/collect to bypass iOS ad-blockers)
  try {
    const endpoint = "/api/collect";
    const bodyStr = JSON.stringify({ event: eventName, is_ipad_pro_hint: isProbablyIpadPro, params: eventPayload });

    // iOS Safari detection (easyPrivacy and iOS ad-blockers block "analytics", and sendBeacon is flaky on iOS)
    const isIosOrSafari =
      typeof navigator !== "undefined" &&
      (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (/Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|Android/i.test(navigator.userAgent)));

    let beaconSucceeded = false;

    // Non-iOS: Try sendBeacon first for lowest overhead
    if (!isIosOrSafari && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      try {
        const blob = new Blob([bodyStr], { type: "application/json" });
        beaconSucceeded = navigator.sendBeacon(endpoint, blob);
      } catch {
        beaconSucceeded = false;
      }
    }

    // Fallback: If on iOS/Safari, or if sendBeacon was false/unavailable, use fetch with keepalive
    if (!beaconSucceeded && typeof fetch === "function") {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyStr,
        keepalive: true,
      }).catch(() => {
        // Fallback to legacy endpoint if collect failed
        try {
          fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: bodyStr,
            keepalive: true,
          }).catch(() => {});
        } catch {}
      });
    }
  } catch (err) {}

  // Log in development console for easy debugging
  if (process.env.NODE_ENV === "development") {
    console.log(`[📊 Analytics Event: ${eventName}]`, eventPayload);
  }
}

// Expose helper to inspect logs in browser console: window.getGunerAnalyticsLogs()
if (typeof window !== "undefined") {
  window.getGunerAnalyticsLogs = () => {
    try {
      const logs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LOG_KEY) || "[]");
      console.table(logs);
      return logs;
    } catch {
      return [];
    }
  };

  window.clearGunerAnalyticsLogs = () => {
    localStorage.removeItem(LOCAL_STORAGE_LOG_KEY);
    console.log("Analytics logs cleared.");
  };
}

/**
 * 1. Product View (GA4 view_item)
 */
export function trackProductView(product: {
  id: string;
  name: string;
  category?: string;
  price?: number | null;
  slug?: string;
}) {
  trackEvent("view_item", {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category || "general",
    price: product.price || 0,
    currency: "TRY",
    slug: product.slug,
  });
}

/**
 * 2. Product Image HD Zoom (Micro-interaction)
 */
export function trackProductZoom(product: {
  id: string;
  name: string;
  slug?: string;
  imageIndex?: number;
  type: "lens" | "lightbox" | "touch";
}) {
  trackEvent("product_zoom", {
    item_id: product.id,
    item_name: product.name,
    slug: product.slug || product.id,
    image_index: product.imageIndex ?? 0,
    zoom_type: product.type,
  });
}

/**
 * 3. Product Dwell Time / Time Spent (YENİ ÖZELLİK 2)
 */
export function trackProductTimeSpent(product: {
  id: string;
  name: string;
  slug?: string;
  durationSeconds: number;
}) {
  if (product.durationSeconds < 2) return;
  trackEvent("product_time_spent", {
    item_id: product.id,
    item_name: product.name,
    slug: product.slug || product.id,
    duration_seconds: product.durationSeconds,
  });
}

/**
 * 3. Search Query & Results Count (Critical for finding missed product demand!)
 */
export function trackSearch(query: string, resultsCount: number) {
  const trimmed = query.trim();
  if (!trimmed) return;

  trackEvent("search", {
    search_term: trimmed,
    results_count: resultsCount,
    has_results: resultsCount > 0,
  });
}

/**
 * 4. WhatsApp Direct Contact Click (Conversion Event)
 */
export function trackWhatsAppClick(source: string, product?: { id?: string; name?: string }) {
  trackExternalClick("contact_whatsapp", {
    source,
    item_id: product?.id,
    item_name: product?.name,
  });
}

/**
 * 5. Category Click / Selection
 */
export function trackCategoryClick(categoryId: string, categoryName?: string) {
  trackEvent("select_category", {
    category_id: categoryId,
    category_name: categoryName || categoryId,
  });
}

/**
 * 6. Variant Selection (Color / Caliber)
 */
export function trackVariantSelect(product: { id: string; name: string }, variantName: string) {
  trackEvent("select_variant", {
    item_id: product.id,
    item_name: product.name,
    variant: variantName,
  });
}

/**
 * 7. Phone Call Click
 */
export function trackPhoneClick(source: string, details: Record<string, any> = {}) {
  trackExternalClick("click_phone", { source, ...details });
}

/**
 * 8. Map & Store Directions Click
 */
export function trackMapClick(source: string, details: Record<string, any> = {}) {
  trackExternalClick("click_map_directions", { source, ...details });
}

/**
 * Helper to force sendBeacon for external links (tel:, maps:, wa.me:)
 * to avoid WebKit cancelling fetch requests when app switches.
 */
function trackExternalClick(eventName: string, params: AnalyticsEventParams = {}) {
  // First record the event properly with standard trackEvent
  trackEvent(eventName, params);

  // Then forcefully try sendBeacon regardless of OS to ensure delivery 
  // before the browser suspends the context.
  try {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const isProbablyIpadPro = 
        /Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
      
      const eventPayload = {
        session_id: getSessionId(),
        visitor_id: getVisitorId(),
        timestamp: new Date().toISOString(),
        path: window.location.pathname,
        ...params,
      };

      const bodyStr = JSON.stringify({ 
        event: eventName, 
        is_ipad_pro_hint: isProbablyIpadPro, 
        params: eventPayload 
      });
      
      const blob = new Blob([bodyStr], { type: "application/json" });
      navigator.sendBeacon("/api/collect", blob);
    }
  } catch (e) {
    // silently fail
  }
}

