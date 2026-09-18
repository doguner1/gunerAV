import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { productName, productUrl, supplierUrl, triggerSource } = body;

    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const notifyPhoneRaw = process.env.WHATSAPP_NOTIFY_PHONE;

    if (!apiToken || !phoneNumberId || !notifyPhoneRaw) {
      console.warn("[WhatsApp Notify] Missing environment variables:", {
        hasToken: Boolean(apiToken),
        hasPhoneNumberId: Boolean(phoneNumberId),
        hasNotifyPhone: Boolean(notifyPhoneRaw),
      });
      return NextResponse.json({
        success: false,
        reason: "WHATSAPP_CREDENTIALS_MISSING",
        message: "WhatsApp API credentials are not configured in environment variables.",
      });
    }

    const cleanNotifyPhone = notifyPhoneRaw.replace(/\D/g, "");
    if (!cleanNotifyPhone) {
      return NextResponse.json({
        success: false,
        reason: "INVALID_PHONE_NUMBER",
      });
    }

    const pName = productName || "İsimsiz Ürün";
    const pUrl = productUrl || "Belirtilmemiş";
    const sUrl = supplierUrl || "Belirtilmemiş (Tedarikçi URL Yok)";
    const src = triggerSource ? ` (${triggerSource})` : "";

    const messageBody = [
      "🔔 *Yeni Müşteri WhatsApp Talebi!*",
      "",
      `📦 *Ürün:* ${pName}`,
      `🌐 *Sitemiz:* ${pUrl}`,
      `🔗 *Tedarikçi:* ${sUrl}`,
      "",
      `💡 Müşteri sitede WhatsApp destek butonuna tıkladı${src} ve iletişime geçiyor.`,
    ].join("\n");

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
          body: messageBody,
        },
      }),
    });

    const metaData = await metaRes.json().catch(() => ({}));

    if (!metaRes.ok) {
      console.error("[WhatsApp Notify] Meta Graph API Error:", metaData);
      return NextResponse.json({
        success: false,
        error: metaData?.error?.message || "Meta API error",
        status: metaRes.status,
      });
    }

    return NextResponse.json({
      success: true,
      messageId: metaData?.messages?.[0]?.id,
    });
  } catch (error: any) {
    console.error("[WhatsApp Notify] Exception:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error",
    });
  }
}
