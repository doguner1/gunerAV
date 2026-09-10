"use client";

import { getOrCreateVisitorId } from "./analytics";

export interface PresenceInfo {
  path: string;
  deviceType?: string;
  productName?: string | null;
}

function detectClientDevice(): string {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/**
 * Sends a single lightweight HTTP heartbeat to /api/heartbeat.
 * Pure REST fetch with keepalive: true. Zero WebSocket overhead on visitor clients.
 */
export async function sendPresenceHeartbeat(info: PresenceInfo): Promise<void> {
  if (typeof window === "undefined") return;

  const visitorId = getOrCreateVisitorId();
  const deviceType = info.deviceType || detectClientDevice();
  const isProbablyIpadPro =
    typeof navigator !== "undefined" &&
    /macintosh/i.test(navigator.userAgent) &&
    navigator.maxTouchPoints > 1;

  try {
    await fetch("/api/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visitor_id: visitorId,
        path: info.path || window.location.pathname || "/",
        device_type: deviceType,
        product_name: info.productName || null,
        is_ipad_pro_hint: isProbablyIpadPro,
      }),
      keepalive: true,
    });
  } catch (err) {
    // Heartbeat fail should never interrupt user browsing
  }
}

/**
 * Starts a 20-second heartbeat loop.
 * Immediately fires on start and on route/product changes.
 * Automatically pauses when tab is hidden and resumes on focus.
 */
export function startPresenceHeartbeat(info: PresenceInfo): () => void {
  if (typeof window === "undefined") return () => {};

  // Immediate ping
  sendPresenceHeartbeat(info);

  // 20-second recurring heartbeat interval
  const intervalId = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      sendPresenceHeartbeat(info);
    }
  }, 20000);

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      sendPresenceHeartbeat(info);
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}
