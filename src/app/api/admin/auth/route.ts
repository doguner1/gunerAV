import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  checkRateLimit,
  registerFailedAttempt,
  clearRateLimit,
  createSessionToken,
  isAdminAuthorized,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/server-auth";

/**
 * POST: Admin login with constant-time password comparison, rate limiting, and secure cookie
 */
export async function POST(req: NextRequest) {
  try {
    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ip = rawIp.split(",")[0].trim();

    // 1. Rate Limiting Check (5 attempts per 5 minutes per IP)
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Çok fazla hatalı deneme yapıldı. Güvenlik gereği lütfen ${rateCheck.resetInSec} saniye sonra tekrar deneyiniz.`,
        },
        { status: 429 }
      );
    }

    const { key, password } = await req.json().catch(() => ({}));
    const inputPassword = key || password;

    const secretConfigured = Boolean(process.env.ANALYTICS_SECRET);
    if (!secretConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Sistemde ANALYTICS_SECRET ortam değişkeni tanımlanmamış. Lütfen Vercel veya .env.local üzerinden ayarlayınız.",
        },
        { status: 500 }
      );
    }

    // 2. Timing-Safe Password Verification
    const isValid = verifyPassword(inputPassword);

    if (!isValid) {
      registerFailedAttempt(ip);
      return NextResponse.json(
        {
          success: false,
          error: "Hatalı şifre girdiniz. Lütfen kontrol edip tekrar deneyiniz.",
        },
        { status: 401 }
      );
    }

    // 3. Clear rate limit upon success & create stateless session token
    clearRateLimit(ip);
    const sessionToken = createSessionToken();

    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      message: "Giriş başarılı.",
    });

    // 4. Set HttpOnly, Secure, SameSite=Strict session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: Math.floor(SESSION_DURATION_MS / 1000), // 8 saat
    });

    return response;
  } catch (error) {
    console.error("[Admin Auth POST Error]:", error);
    return NextResponse.json({ success: false, error: "Sunucu hatası" }, { status: 500 });
  }
}

/**
 * GET: Check whether current browser session is authenticated
 */
export async function GET(req: NextRequest) {
  const isAuth = isAdminAuthorized(req);
  return NextResponse.json({ authenticated: isAuth });
}

/**
 * DELETE: Admin logout (destroys cookie)
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Oturum kapatıldı." });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
