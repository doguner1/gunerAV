import { NextRequest, NextResponse } from "next/server";

// Keep last 200 events in server memory for instant inspection
const recentEvents: any[] = [];
const MAX_SERVER_EVENTS = 200;

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const text = await req.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const entry = {
      received_at: new Date().toISOString(),
      client_ip: ip.split(",")[0].trim(),
      user_agent: userAgent,
      event: body.event || "unknown",
      params: body.params || {},
    };

    recentEvents.unshift(entry);
    if (recentEvents.length > MAX_SERVER_EVENTS) {
      recentEvents.pop();
    }

    // Output structured log for Vercel Runtime Logs
    console.log(`[GÜNER_ANALYTICS] ${entry.event}:`, JSON.stringify(entry.params));

    return NextResponse.json({ success: true, count: recentEvents.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to record event" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("key");
  const validSecret = process.env.ANALYTICS_SECRET;

  // Block unauthorized public access with 404 Not Found if no secret configured or wrong key
  if (!validSecret || !secret || secret !== validSecret) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json({
    authenticated: true,
    total_cached: recentEvents.length,
    events: recentEvents,
  });
}
