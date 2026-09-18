export interface WhatsAppNotifyPayload {
  productName: string;
  productUrl: string;
  supplierUrl?: string;
  productId?: string;
  triggerSource?: string;
}

/**
 * Fires a fire-and-forget notification to the backend to notify the admin/owner via Meta WhatsApp Cloud API.
 * Uses keepalive: true so the HTTP POST completes even if the customer navigates away immediately.
 */
export function notifyWhatsAppInquiry(payload: WhatsAppNotifyPayload) {
  try {
    if (typeof window === "undefined") return;

    fetch("/api/whatsapp/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      console.warn("[WhatsApp Notify] Non-blocking dispatch notice:", err);
    });
  } catch (err) {
    console.warn("[WhatsApp Notify] Dispatch error:", err);
  }
}

export interface ActiveVisitorsNotifyPayload {
  activeCount: number;
  previousCount: number;
  path?: string;
  deviceType?: string;
}

/**
  * Fires a notification to the backend to notify the store owner via Meta WhatsApp Cloud API
  * when live active visitors count increases.
  */
export async function notifyActiveVisitorsIncrease(payload: ActiveVisitorsNotifyPayload): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window === "undefined") return { success: false, error: "SSR" };

    const res = await fetch("/api/whatsapp/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "active_visitors",
        ...payload,
      }),
      keepalive: true,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      console.warn("[WhatsApp Notify] Active visitors notify error:", data);
      return { success: false, error: data.error || data.reason || "Bilinmeyen hata" };
    }
    return { success: true };
  } catch (err: any) {
    console.warn("[WhatsApp Notify] Active visitors dispatch exception:", err);
    return { success: false, error: err?.message || "Bağlantı hatası" };
  }
}

