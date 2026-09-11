"use client";

import { useEffect } from "react";
import {
  getReturnStateForCurrentPage,
  consumeReturnState,
  restoreScrollPosition,
} from "@/lib/navigation-state";

export default function HomeScrollRestorer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const returnState = getReturnStateForCurrentPage();

    if (returnState && returnState.source === "home") {
      requestAnimationFrame(() => {
        setTimeout(() => {
          restoreScrollPosition(
            returnState.scrollY,
            returnState.productId ? `product-card-${returnState.productId}` : undefined
          );
        }, 50);
      });

      // Give child sections (CampaignSection, FeaturedProducts) time to read counts before consuming
      const cleanupTimer = setTimeout(() => {
        consumeReturnState();
      }, 1500);

      return () => clearTimeout(cleanupTimer);
    } else {
      // Fresh navigation to home: start at top
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, []);

  return null;
}

