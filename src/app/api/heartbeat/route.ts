import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { detectDeviceType } from "@/lib/device-detect";
import { recordActiveVisitor } from "@/lib/active-visitors-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const clientIp = rawIp.split(",")[0].trim();

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const { visitor_id, path, device_type, product_name, productName } = body;

    if (!visitor_id || typeof visitor_id !== "string") {
      return NextResponse.json({ ok: false, error: "Missing visitor_id" }, { status: 400 });
    }

    // Rate Limiting: Max 10 heartbeats per 10 seconds per IP:visitor_id
    const rateCheck = checkRateLimit("heartbeat", clientIp, visitor_id, 10, 10);
    if (!rateCheck.success) {
      return NextResponse.json(
        { ok: false, error: "Too many heartbeats" },
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

    const userAgent = req.headers.get("user-agent") || "";
    const deviceType = detectDeviceType(userAgent);
    const finalProductName = product_name || productName || null;

    const success = await recordActiveVisitor({
      visitor_id,
      path: typeof path === "string" ? path : "/",
      device_type: deviceType,
      product_name: finalProductName,
    });

    if (!success) {
      return NextResponse.json({ ok: false, error: "Failed to record heartbeat" }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, success: true, timestamp: new Date().toISOString() },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (err: any) {
    console.error("[Heartbeat Handler Error]:", err);
    return NextResponse.json({ ok: false, error: "Internal Error" }, { status: 500 });
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
