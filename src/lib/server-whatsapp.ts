/**
 * Server-side Meta WhatsApp Cloud API helper for Güner AV.
 * Sends real-time notifications directly from backend handlers without client dependency.
 */

export interface MetaWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  metaCode?: number;
}

/**
 * Sends a raw text message via Meta WhatsApp Cloud API.
 */
export async function sendMetaWhatsAppText(messageText: string): Promise<MetaWhatsAppResult> {
  try {
    const rawToken = (process.env.WHATSAPP_API_TOKEN || "").trim();
    const apiToken = rawToken.replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "").trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim().replace(/^["']|["']$/g, "");
    const notifyPhoneRaw = (process.env.WHATSAPP_NOTIFY_PHONE || "").trim().replace(/^["']|["']$/g, "");

    if (!apiToken || !phoneNumberId || !notifyPhoneRaw) {
      console.warn("[Server WhatsApp] Missing environment variables:", {
        hasToken: Boolean(apiToken),
        hasPhoneNumberId: Boolean(phoneNumberId),
        hasNotifyPhone: Boolean(notifyPhoneRaw),
      });
      return {
        success: false,
        error: "WHATSAPP_CREDENTIALS_MISSING: Ortam değişkenleri tanımlı değil.",
      };
    }

    let cleanNotifyPhone = notifyPhoneRaw.replace(/\D/g, "");
    if (cleanNotifyPhone.startsWith("05") && cleanNotifyPhone.length === 11) {
      cleanNotifyPhone = "9" + cleanNotifyPhone;
    } else if (cleanNotifyPhone.startsWith("5") && cleanNotifyPhone.length === 10) {
      cleanNotifyPhone = "90" + cleanNotifyPhone;
    }

    if (!cleanNotifyPhone) {
      return {
        success: false,
        error: "INVALID_PHONE_NUMBER: Geçersiz hedef telefon numarası.",
      };
    }

    const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    const metaRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanNotifyPhone,
        type: "text",
        text: {
          preview_url: false,
          body: messageText,
        },
      }),
    });

    const metaData = await metaRes.json().catch(() => ({}));

    if (!metaRes.ok) {
      const metaErr = metaData?.error || {};
      console.error("[Server WhatsApp] Meta Graph API Error:", metaErr);
      return {
        success: false,
        error: metaErr.message || "Meta API Hatası",
        metaCode: metaErr.code,
      };
    }

    return {
      success: true,
      messageId: metaData?.messages?.[0]?.id,
    };
  } catch (err: any) {
    console.error("[Server WhatsApp] Dispatch Exception:", err);
    return {
      success: false,
      error: err?.message || "Internal server error",
    };
  }
}

export interface VisitorSessionAlertParams {
  visitorId: string;
  isReturning: boolean;
  path?: string;
  productName?: string;
  deviceType?: string;
  referrer?: string | null;
}

/**
 * Sends a clean, professional WhatsApp alert for a new or returning visitor session (30-min window).
 */
export async function sendVisitorSessionWhatsAppAlert(params: VisitorSessionAlertParams): Promise<MetaWhatsAppResult> {
  const nowTR = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  const statusLine = params.isReturning
    ? "🔄 *Geri Dönen Ziyaretçi* (Tekrar Sitede)"
    : "🆕 *Yeni Ziyaretçi* (İlk Kez Sitede)";

  let targetDetail = params.path || "/";
  if (params.productName) {
    targetDetail = `"${params.productName}" (${params.path || ""})`;
  }

  const deviceMap: Record<string, string> = {
    mobile: "📱 Mobil",
    desktop: "💻 Masaüstü",
    tablet: "📱 Tablet",
  };
  const devLabel = deviceMap[params.deviceType || ""] || (params.deviceType ? `📱 ${params.deviceType}` : "Bilinmiyor");

  let sourceLabel = "Doğrudan Giriş / Bilinmiyor";
  if (params.referrer) {
    try {
      const refUrl = new URL(params.referrer);
      const host = refUrl.hostname.toLowerCase();
      if (host.includes("google")) sourceLabel = "Google Arama";
      else if (host.includes("instagram")) sourceLabel = "Instagram";
      else if (host.includes("facebook")) sourceLabel = "Facebook";
      else if (host.includes("yandex")) sourceLabel = "Yandex";
      else sourceLabel = host;
    } catch {
      sourceLabel = params.referrer.slice(0, 40);
    }
  }

  const messageLines = [
    "👥 *GÜNER AV - ZİYARETÇİ BİLDİRİMİ*",
    "",
    `🟢 *Durum:* ${statusLine}`,
    `📍 *Baktığı:* ${targetDetail}`,
    `📱 *Cihaz:* ${devLabel}`,
    `🌐 *Kaynak:* ${sourceLabel}`,
    `🕒 *Saat:* ${nowTR}`,
    "",
    "🔗 *Admin Paneli:* https://gunerav.com/admin",
  ];

  return sendMetaWhatsAppText(messageLines.join("\n"));
}
