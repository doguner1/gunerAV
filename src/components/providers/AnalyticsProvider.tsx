"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getOrCreateVisitorId, trackEvent } from "@/lib/analytics";
import { startPresenceHeartbeat } from "@/lib/presence";

interface AnalyticsProviderProps {
  children?: React.ReactNode;
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const heartbeatCleanupRef = useRef<(() => void) | null>(null);

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

  // 2. HTTP Heartbeat Presence (Refreshes on navigation, pauses on hidden tab)
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
