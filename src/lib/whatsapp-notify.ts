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


