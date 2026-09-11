"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getOrCreateVisitorId, trackEvent } from "@/lib/analytics";
import { startPresenceHeartbeat } from "@/lib/presence";

interface AnalyticsProviderProps {
  children?: React.ReactNode;
}

function getPageName(path: string): string {
  if (!path || path === "/" || path === "/tr" || path === "/en" || path === "/tr/" || path === "/en/") {
    return "Anasayfa";
  }
  const clean = path.replace(/^\/(tr|en)/, "");
  if (clean.startsWith("/contact")) return "İletişim & Konum";
  if (clean.startsWith("/about")) return "Hakkımızda";
  if (clean.startsWith("/products/")) return "Ürün Detayı";
  if (clean.startsWith("/products")) return "Ürün Kataloğu";
  if (clean.startsWith("/privacy")) return "Gizlilik Politikası";
  if (clean.startsWith("/kategori/tufek")) return "Kategori: Av Tüfekleri";
  if (clean.startsWith("/kategori/havali-kurusiki")) return "Kategori: Havalı & Kurusıkı";
  if (clean.startsWith("/kategori/fisek")) return "Kategori: Av Fişekleri";
  if (clean.startsWith("/kategori/optik")) return "Kategori: Dürbün & Optik";
  if (clean.startsWith("/kategori/bicak")) return "Kategori: Av Bıçakları";
  if (clean.startsWith("/kategori/giyim")) return "Kategori: Av Kıyafetleri";
  if (clean.startsWith("/kategori/kamuflaj")) return "Kategori: Kamuflaj & Çadır";
  if (clean.startsWith("/kategori/bakim")) return "Kategori: Silah Bakım";
  if (clean.startsWith("/kategori/fener")) return "Kategori: Taktik Fener";
  if (clean.startsWith("/kategori")) return "Kategori Sayfası";
  if (clean.startsWith("/admin")) return "Admin Paneli";
  return clean || "Anasayfa";
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const heartbeatCleanupRef = useRef<(() => void) | null>(null);
  const lastPathRef = useRef<string>(pathname);
  const pageStartRef = useRef<number>(Date.now());

  // 1. Global Session Start & Traffic Source Attribution (Once per browser session)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const visitorId = getOrCreateVisitorId();
      const isNewSession = !sessionStorage.getItem("gunerav_session_started");

      if (isNewSession) {
        sessionStorage.setItem("gunerav_session_started", "1");

        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get("utm_source");
        const utmMedium = urlParams.get("utm_medium");
        const utmCampaign = urlParams.get("utm_campaign");
        const utmContent = urlParams.get("utm_content");
        const ref = document.referrer || "";

        let sourceChannel = "Doğrudan (Direkt)";
        if (utmSource) {
          const lower = utmSource.toLowerCase();
          if (lower.includes("instagram")) sourceChannel = "Instagram";
          else if (lower.includes("facebook") || lower.includes("fb")) sourceChannel = "Facebook";
          else if (lower.includes("google")) sourceChannel = "Google";
          else if (lower.includes("x") || lower.includes("twitter")) sourceChannel = "X (Twitter)";
          else sourceChannel = utmSource;
        } else if (ref) {
          try {
            const host = new URL(ref).hostname.toLowerCase();
            if (host.includes("instagram")) sourceChannel = "Instagram";
            else if (host.includes("facebook") || host.includes("fb.")) sourceChannel = "Facebook";
            else if (host.includes("google")) sourceChannel = "Google Arama";
            else if (host.includes("t.co") || host.includes("twitter") || host.includes("x.com")) sourceChannel = "X (Twitter)";
            else if (host.includes("whatsapp")) sourceChannel = "WhatsApp";
            else if (host.includes("youtube")) sourceChannel = "YouTube";
            else if (!host.includes(window.location.hostname)) sourceChannel = host.replace(/^www\./, "");
          } catch {}
        }

        trackEvent("session_start", {
          visitor_id: visitorId,
          source_channel: sourceChannel,
          utm_source: utmSource || undefined,
          utm_medium: utmMedium || undefined,
          utm_campaign: utmCampaign || undefined,
          utm_content: utmContent || undefined,
          referrer: ref || null,
          landing_page: window.location.pathname || "/",
        });
      }
    } catch (err) {
      console.warn("[AnalyticsProvider Init Error]:", err);
    }
  }, []);

  // 2. Track URL Page Views & Page Dwell Time
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Report time spent on previous page if >= 2s
    if (lastPathRef.current && lastPathRef.current !== pathname) {
      const elapsedSec = Math.round((Date.now() - pageStartRef.current) / 1000);
      if (elapsedSec >= 2 && !lastPathRef.current.includes("/admin")) {
        trackEvent("page_time_spent", {
          path: lastPathRef.current,
          page_name: getPageName(lastPathRef.current),
          duration_seconds: elapsedSec,
        });
      }
    }

    // Update for current page
    lastPathRef.current = pathname;
    pageStartRef.current = Date.now();

    // Track new page view (skip admin paths to keep metrics clean)
    if (!pathname.includes("/admin")) {
      trackEvent("page_view", {
        path: pathname,
        page_name: getPageName(pathname),
      });
    }

    // Report time spent on window blur / tab close
    const handleVisibilityOrUnload = () => {
      if (document.visibilityState === "hidden") {
        const elapsedSec = Math.round((Date.now() - pageStartRef.current) / 1000);
        if (elapsedSec >= 2 && lastPathRef.current && !lastPathRef.current.includes("/admin")) {
          trackEvent("page_time_spent", {
            path: lastPathRef.current,
            page_name: getPageName(lastPathRef.current),
            duration_seconds: elapsedSec,
          });
          pageStartRef.current = Date.now();
        }
      } else if (document.visibilityState === "visible") {
        pageStartRef.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrUnload);
    window.addEventListener("pagehide", handleVisibilityOrUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrUnload);
      window.removeEventListener("pagehide", handleVisibilityOrUnload);
    };
  }, [pathname]);

  // 3. HTTP Heartbeat Presence (Refreshes on navigation, pauses on hidden tab)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Clean up previous heartbeat
    if (heartbeatCleanupRef.current) {
      heartbeatCleanupRef.current();
      heartbeatCleanupRef.current = null;
    }

    // Start fresh heartbeat for current page
    heartbeatCleanupRef.current = startPresenceHeartbeat({
      path: pathname,
    });

    return () => {
      if (heartbeatCleanupRef.current) {
        heartbeatCleanupRef.current();
        heartbeatCleanupRef.current = null;
      }
    };
  }, [pathname]);

  return <>{children}</>;
}
