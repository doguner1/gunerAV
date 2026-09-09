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

/**
 * Core event tracking dispatcher
 */
export function trackEvent(eventName: string, params: AnalyticsEventParams = {}) {
  if (typeof window === "undefined") return;

  const timestamp = new Date().toISOString();
  const screenWidth = window.innerWidth;
  const deviceType = screenWidth < 768 ? "mobile" : screenWidth < 1024 ? "tablet" : "desktop";

  const eventPayload = {
    event: eventName,
    device_type: deviceType,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    path: window.location.pathname,
    timestamp,
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
    existing.unshift({ event: eventName, params, timestamp, device: deviceType, path: window.location.pathname });
    if (existing.length > MAX_LOCAL_LOGS) existing.pop();
    localStorage.setItem(LOCAL_STORAGE_LOG_KEY, JSON.stringify(existing));
  } catch (err) {}

  // 4. Send background beacon to server API
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics",
        JSON.stringify({ event: eventName, params: eventPayload })
      );
    } else {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: eventName, params: eventPayload }),
        keepalive: true,
      }).catch(() => {});
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
  imageIndex?: number;
  type: "lens" | "lightbox" | "touch";
}) {
  trackEvent("product_zoom", {
    item_id: product.id,
    item_name: product.name,
    image_index: product.imageIndex ?? 0,
    zoom_type: product.type,
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
  trackEvent("contact_whatsapp", {
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
export function trackPhoneClick(source: string) {
  trackEvent("click_phone", { source });
}
