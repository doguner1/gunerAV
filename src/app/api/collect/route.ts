import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/server-analytics";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const clientIp = rawIp.split(",")[0].trim();

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const visitorId = body?.params?.visitor_id || body?.visitor_id;

    // Rate Limiting: Max 40 requests per 10 seconds per IP:visitor_id
    const rateCheck = checkRateLimit("collect", clientIp, visitorId, 40, 10);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.reset),
            "X-RateLimit-Remaining": "0",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    const result = await recordAnalyticsEvent(req, body);
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err) {
    console.error("[api/collect POST Error]:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "/api/collect" });
}
