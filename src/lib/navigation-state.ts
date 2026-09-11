/**
 * Guner AV - Navigation & Scroll Restoration Manager
 * 
 * Provides unified, robust handling for:
 * 1. Restoring scroll position and expanded items (+5 Satır) when returning from a product detail page (Back button).
 * 2. Guaranteeing that intentional link clicks (Header menu, Category cards, Logo, Filter tabs) ALWAYS start at the top (scrollY = 0).
 * 3. Isolating page states so that scrolling on Home never leaks into Category pages, and vice versa.
 */

const RETURN_STATE_KEY = "gunerav_nav_return_state";
const MAX_STATE_AGE_MS = 15 * 60 * 1000; // 15 minutes

export interface NavReturnState {
  source: "home" | "catalog";
  originUrl: string;       // Full URL path + search (e.g. "/tr", "/tr/products?category=tufek")
  originPath: string;      // Normalized pathname without trailing slash (e.g. "/tr", "/tr/products")
  scrollY: number;         // Vertical scroll position when product was clicked
  productId: string;       // ID of the clicked product
  homeFeaturedCount?: number;
  homeDealsCount?: number;
  catalogCategory?: string;
  catalogVisibleCount?: number;
  timestamp: number;
}

/**
 * Normalizes a pathname: removes trailing slashes, keeps lowercase.
 */
function normalizePath(pathname: string): string {
  if (!pathname) return "";
  const cleaned = pathname.replace(/\/+$/, "");
  return cleaned || "/";
}

/**
 * Checks if a pathname represents the Home page (e.g. "/", "/tr", "/en").
 */
export function isHomePath(pathname: string): boolean {
  const norm = normalizePath(pathname);
  return norm === "/" || norm === "/tr" || norm === "/en";
}

/**
 * Checks if a pathname represents a Catalog or Category page.
 */
export function isCatalogPath(pathname: string): boolean {
  const norm = normalizePath(pathname);
  return (
    norm.includes("/products") ||
    norm.includes("/kategori") ||
    norm.startsWith("/tr/products") ||
    norm.startsWith("/en/products") ||
    norm.startsWith("/tr/kategori") ||
    norm.startsWith("/en/kategori")
  );
}

/**
 * Call when a user clicks on ANY product card to view product details.
 */
export function recordProductNavigation(
  productId: string | number,
  options?: {
    catalogCategory?: string;
    catalogVisibleCount?: number;
  }
) {
  if (typeof window === "undefined") return;

  try {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const currentParams = new URLSearchParams(currentSearch);
    const isHome = isHomePath(currentPath);

    let homeDealsCount: number | undefined;
    let homeFeaturedCount: number | undefined;

    if (isHome) {
      const savedDeals = sessionStorage.getItem("gunerav_home_deals_count");
      const savedFeatured = sessionStorage.getItem("gunerav_home_featured_count");
      if (savedDeals) homeDealsCount = parseInt(savedDeals, 10);
      if (savedFeatured) homeFeaturedCount = parseInt(savedFeatured, 10);
    }

    const countParam = currentParams.get("count");
    const autoVisibleCount = countParam ? parseInt(countParam, 10) : undefined;
    const autoCatParam = currentParams.get("category");

    const state: NavReturnState = {
      source: isHome ? "home" : "catalog",
      originUrl: `${currentPath}${currentSearch}`,
      originPath: normalizePath(currentPath),
      scrollY: window.scrollY,
      productId: String(productId),
      homeDealsCount: homeDealsCount && !isNaN(homeDealsCount) ? homeDealsCount : undefined,
      homeFeaturedCount: homeFeaturedCount && !isNaN(homeFeaturedCount) ? homeFeaturedCount : undefined,
      catalogCategory: options?.catalogCategory || autoCatParam || undefined,
      catalogVisibleCount: options?.catalogVisibleCount || autoVisibleCount || undefined,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(RETURN_STATE_KEY, JSON.stringify(state));

    // Keep legacy home keys in sync for backward compatibility
    if (isHome) {
      sessionStorage.setItem("gunerav_from_home", "1");
      sessionStorage.setItem("gunerav_home_scroll", window.scrollY.toString());
      sessionStorage.setItem("gunerav_home_last_product_id", String(productId));
    }
  } catch (e) {
    console.warn("Failed to record product navigation state:", e);
  }
}

/**
 * Inspects whether the current page should restore a previous return state.
 * Returns the state if it matches the current page, or null if this is a fresh navigation.
 */
export function getReturnStateForCurrentPage(): NavReturnState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(RETURN_STATE_KEY);
    if (!raw) return null;

    const state: NavReturnState = JSON.parse(raw);
    if (!state || !state.originPath) return null;

    // Discard expired state (> 15 minutes)
    if (Date.now() - state.timestamp > MAX_STATE_AGE_MS) {
      clearReturnState();
      return null;
    }

    const currentPathNorm = normalizePath(window.location.pathname);
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    // 1. Home page check
    if (state.source === "home") {
      if (isHomePath(currentPathNorm)) {
        return state;
      }
      return null;
    }

    // 2. Catalog / Category check
    if (state.source === "catalog") {
      // Direct full URL match
      if (state.originUrl === currentUrl) {
        return state;
      }

      // Path match (e.g. /tr/products matches /tr/products, /tr/kategori/tufek matches /tr/kategori/tufek)
      if (state.originPath === currentPathNorm) {
        // If state had a category query param, check if current has same category
        if (state.catalogCategory) {
          const currentParams = new URLSearchParams(window.location.search);
          const currentCat = currentParams.get("category");
          if (currentCat && currentCat !== state.catalogCategory) {
            // User switched to a different category! Do not restore.
            return null;
          }
        }
        return state;
      }

      return null;
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Marks the return state as consumed so subsequent manual refreshes start at the top.
 */
export function consumeReturnState() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RETURN_STATE_KEY);
    sessionStorage.removeItem("gunerav_from_home");
    sessionStorage.removeItem("gunerav_home_scroll");
    sessionStorage.removeItem("gunerav_home_last_product_id");
  } catch (e) {}
}

/**
 * Call on ANY intentional navigation (e.g. clicking category cards, header links,
 * breadcrumbs, logo, or category tabs).
 * Completely resets saved scroll and return states so target page opens at top.
 */
export function clearReturnState() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RETURN_STATE_KEY);
    sessionStorage.removeItem("gunerav_catalog_state");
    sessionStorage.removeItem("gunerav_from_home");
    sessionStorage.removeItem("gunerav_home_scroll");
    sessionStorage.removeItem("gunerav_home_last_product_id");
  } catch (e) {}
}

/**
 * Performs accurate, smooth and reliable scroll restoration to a target coordinate
 * and/or anchors to a specific product card.
 */
export function restoreScrollPosition(
  targetY: number,
  targetElementId?: string,
  onComplete?: () => void
) {
  if (typeof window === "undefined") return;

  const origRestoration = window.history.scrollRestoration;
  window.history.scrollRestoration = "manual";

  const attemptScroll = () => {
    if (targetElementId) {
      const el = document.getElementById(targetElementId);
      if (el) {
        if (targetY > 0) {
          window.scrollTo({ top: targetY, behavior: "instant" });
        } else {
          el.scrollIntoView({ block: "center", behavior: "instant" });
        }
        return true;
      }
    }

    if (targetY > 0) {
      window.scrollTo({ top: targetY, behavior: "instant" });
      return Math.abs(window.scrollY - targetY) < 25;
    }

    return true;
  };

  // Immediate attempt
  attemptScroll();

  // Multi-frame verification for dynamic image rendering and font loading
  let attempts = 0;
  const maxAttempts = 12; // 12 * 40ms = ~480ms
  const timer = setInterval(() => {
    attempts++;
    const isDone = attemptScroll();

    if ((isDone && attempts >= 3) || attempts >= maxAttempts) {
      clearInterval(timer);
      setTimeout(() => {
        window.history.scrollRestoration = origRestoration;
        onComplete?.();
      }, 50);
    }
  }, 40);
}
