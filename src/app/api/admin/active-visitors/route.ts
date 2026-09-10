import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/server-auth";
import { getActiveVisitors } from "@/lib/active-visitors-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const visitors = await getActiveVisitors(45000);

    return NextResponse.json({
      success: true,
      count: visitors.length,
      activeVisitors: visitors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Active Visitors Route Error]:", err);
    return NextResponse.json({
      success: true,
      count: 0,
      activeVisitors: [],
      timestamp: new Date().toISOString(),
    });
  }
}
