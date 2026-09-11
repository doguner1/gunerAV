"use client";

import { useEffect } from "react";

const HOME_SCROLL_KEY = "gunerav_home_scroll";
const HOME_PRODUCT_KEY = "gunerav_home_last_product_id";
const FROM_HOME_KEY = "gunerav_from_home";

export default function HomeScrollRestorer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prevent browser from auto-scrolling to 0,0 before elements mount
    const origScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const isFromProduct = sessionStorage.getItem(FROM_HOME_KEY) === "1";
    const savedScrollRaw = sessionStorage.getItem(HOME_SCROLL_KEY);
    const targetY = savedScrollRaw ? parseFloat(savedScrollRaw) : 0;
    const lastProductId = sessionStorage.getItem(HOME_PRODUCT_KEY);

    if (isFromProduct && (targetY > 0 || lastProductId)) {
      const doScroll = () => {
        if (targetY > 0) {
          window.scrollTo({ top: targetY, behavior: "instant" });
        }

        let attempts = 0;
        const maxAttempts = 16; // 16 * 40ms = ~640ms window
        const interval = setInterval(() => {
          attempts++;

          // Anchor to specific product card if available
          if (lastProductId) {
            const cardEl = document.getElementById(`product-card-${lastProductId}`);
            if (cardEl) {
              if (targetY > 0) {
                window.scrollTo({ top: targetY, behavior: "instant" });
              } else {
                cardEl.scrollIntoView({ block: "center", behavior: "instant" });
              }

              if (targetY > 0 && Math.abs(window.scrollY - targetY) < 30) {
                clearInterval(interval);
              } else if (attempts >= maxAttempts) {
                clearInterval(interval);
              }
              return;
            }
          }

          if (targetY > 0) {
            window.scrollTo({ top: targetY, behavior: "instant" });
            if (Math.abs(window.scrollY - targetY) < 30 || attempts >= maxAttempts) {
              clearInterval(interval);
            }
          } else {
            clearInterval(interval);
          }
        }, 40);
      };

      // Immediate attempt and after layout commit
      doScroll();
      requestAnimationFrame(() => {
        setTimeout(doScroll, 50);
      });
    }

    // PopState listener for browser back/forward buttons
    const handlePopState = () => {
      const savedScroll = parseFloat(sessionStorage.getItem(HOME_SCROLL_KEY) || "0");
      const prodId = sessionStorage.getItem(HOME_PRODUCT_KEY);
      if (savedScroll > 0) {
        window.scrollTo({ top: savedScroll, behavior: "instant" });
      } else if (prodId) {
        const el = document.getElementById(`product-card-${prodId}`);
        el?.scrollIntoView({ block: "center", behavior: "instant" });
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Keep FROM_HOME_KEY long enough for child sections (FeaturedProducts, CampaignSection)
    // to mount and read their visibleCounts, then clear it so subsequent F5 reloads start at top.
    const cleanupTimer = setTimeout(() => {
      try {
        sessionStorage.removeItem(FROM_HOME_KEY);
      } catch (e) {}
    }, 1200);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      clearTimeout(cleanupTimer);
      window.history.scrollRestoration = origScrollRestoration;
    };
  }, []);

  return null;
}
