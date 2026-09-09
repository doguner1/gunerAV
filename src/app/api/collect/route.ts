import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/server-analytics";

export async function POST(req: NextRequest) {
  try {
    const result = await recordAnalyticsEvent(req);
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
