import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server-supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import { detectDeviceType } from "@/lib/device-detect";

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

    // Rate Limiting: Max 5 heartbeats per 10 seconds per IP:visitor_id
    const rateCheck = checkRateLimit("heartbeat", clientIp, visitor_id, 5, 10);
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

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    const now = new Date().toISOString();
    const finalDeviceType =
      typeof device_type === "string" && device_type.length > 0
        ? device_type.slice(0, 50)
        : detectDeviceType(req.headers.get("user-agent") || "");

    const finalProductName = product_name || productName || null;

    const { error } = await supabase.from("active_visitors").upsert(
      {
        visitor_id: visitor_id.slice(0, 128),
        path: typeof path === "string" ? path.slice(0, 500) : "/",
        device_type: finalDeviceType,
        product_name: typeof finalProductName === "string" ? finalProductName.slice(0, 200) : null,
        last_seen: now,
      },
      { onConflict: "visitor_id" }
    );

    if (error) {
      console.warn("[Heartbeat Upsert Error]:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, success: true, timestamp: now },
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
