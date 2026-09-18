import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiToken = (process.env.WHATSAPP_API_TOKEN || "").trim();
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const notifyPhone = (process.env.WHATSAPP_NOTIFY_PHONE || "").trim();

  return NextResponse.json({
    hasToken: Boolean(apiToken),
    tokenLength: apiToken.length,
    tokenPrefix: apiToken ? apiToken.slice(0, 10) + "..." : "YOK",
    hasPhoneNumberId: Boolean(phoneNumberId),
    phoneNumberId: phoneNumberId || "YOK",
    hasNotifyPhone: Boolean(notifyPhone),
    notifyPhone: notifyPhone || "YOK",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { productName, productUrl, supplierUrl, triggerSource } = body;

    const rawToken = (process.env.WHATSAPP_API_TOKEN || "").trim();
    const apiToken = rawToken.replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "").trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim().replace(/^["']|["']$/g, "");
    const notifyPhoneRaw = (process.env.WHATSAPP_NOTIFY_PHONE || "").trim().replace(/^["']|["']$/g, "");

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

    let cleanNotifyPhone = notifyPhoneRaw.replace(/\D/g, "");
    if (cleanNotifyPhone.startsWith("05") && cleanNotifyPhone.length === 11) {
      cleanNotifyPhone = "9" + cleanNotifyPhone;
    } else if (cleanNotifyPhone.startsWith("5") && cleanNotifyPhone.length === 10) {
      cleanNotifyPhone = "90" + cleanNotifyPhone;
    }

    if (!cleanNotifyPhone) {
      return NextResponse.json({
        success: false,
        reason: "INVALID_PHONE_NUMBER",
      });
    }

    const pName = productName || "İsimsiz Ürün";
    const pUrl = productUrl || "Belirtilmemiş";
    const sUrl = supplierUrl || "Belirtilmemiş (Tedarikçi URL Yok)";

    const messageBody = [
      `*${pName}*`,
      "",
      "",
      `🌐 *Sitemiz:* ${pUrl}`,
      "",
      `🔗 *Tedarikçi:* ${sUrl}`,
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
      const metaErr = metaData?.error || {};
      const code = metaErr.code;
      let diagnosis = metaErr.message || "Meta API hatası";

      if (code === 190) {
        diagnosis = "Access Token süresi dolmuş (Token Expired). Meta panelinden yeni bir geçici token alıp Vercel'e WHATSAPP_API_TOKEN olarak eklemeniz gerekiyor.";
      } else if (code === 131047) {
        diagnosis = "24 Saat Kuralı Engeli: Test numarasının (+1 555...) size serbest metin gönderebilmesi için, kendi WhatsApp'ınızdan o +1 555... numarasına son 24 saatte en az bir mesaj ('Selam' vb.) yazmış olmanız gerekir.";
      } else if (code === 131030) {
        diagnosis = "Numaranız Meta Test Listesinde Değil: Test modunda sadece Meta panelinde 'To' kısmına eklenip SMS koduyla onaylanmış numaralara mesaj gidebilir.";
      } else if (code === 100) {
        diagnosis = "Geçersiz Parametre veya Phone Number ID: Vercel'deki WHATSAPP_PHONE_NUMBER_ID değerini kontrol ediniz.";
      }

      return NextResponse.json({
        success: false,
        error: diagnosis,
        metaCode: code,
        rawMetaError: metaErr,
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
