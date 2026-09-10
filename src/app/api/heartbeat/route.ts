import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/server-supabase";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { visitor_id, path, device_type, product_name } = body;

    if (!visitor_id || typeof visitor_id !== "string") {
      return NextResponse.json({ error: "Missing visitor_id" }, { status: 400 });
    }

    let supabase: ReturnType<typeof getSupabaseAdminClient> | null = null;
    try {
      supabase = getSupabaseAdminClient();
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message || "Database not configured" }, { status: 503 });
    }
    const now = new Date().toISOString();

    const { error } = await supabase.from("active_visitors").upsert(
      {
        visitor_id: visitor_id.slice(0, 128),
        path: typeof path === "string" ? path.slice(0, 500) : "/",
        device_type: typeof device_type === "string" ? device_type.slice(0, 50) : "desktop",
        product_name: typeof product_name === "string" ? product_name.slice(0, 200) : null,
        last_seen: now,
      },
      { onConflict: "visitor_id" }
    );

    if (error) {
      console.warn("[Heartbeat Upsert Error]:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, timestamp: now }, { status: 200 });
  } catch (err: any) {
    console.error("[Heartbeat Handler Error]:", err);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
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
