import { NextRequest, NextResponse } from "next/server";
import { saveContactMessage } from "@/lib/server-messages";
import { hashIp } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Anti-Bot Honeypot Security Check
    if (body.gunerav_security_hp && String(body.gunerav_security_hp).trim().length > 0) {
      console.warn("[contact api] Bot honeypot triggered. Request dropped silently.");
      return NextResponse.json({
        success: true,
        message: "Mesajınız başarıyla iletildi.",
      });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "general";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    // 2. Validation
    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, error: "Lütfen geçerli bir ad soyad giriniz." },
        { status: 400 }
      );
    }

    if (!phone || phone.length < 7) {
      return NextResponse.json(
        { success: false, error: "Lütfen geçerli bir telefon numarası giriniz." },
        { status: 400 }
      );
    }

    if (!message || message.length < 3) {
      return NextResponse.json(
        { success: false, error: "Lütfen mesajınızı yazınız." },
        { status: 400 }
      );
    }

    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const clientIp = rawIp.split(",")[0].trim();
    const ipHash = hashIp(clientIp);
    const userAgent = req.headers.get("user-agent") || "unknown";

    const saved = await saveContactMessage({
      name,
      phone,
      email,
      subject,
      message,
      ip_hash: ipHash,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Mesajınız başarıyla iletildi.",
      id: saved.id,
    });
  } catch (error) {
    console.error("[contact api error]:", error);
    return NextResponse.json(
      { success: false, error: "Mesaj iletilirken bir sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
