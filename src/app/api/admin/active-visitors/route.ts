import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/server-auth";
import { getSupabaseAdminClient } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 });
  }

  let supabase: ReturnType<typeof getSupabaseAdminClient> | null = null;
  try {
    supabase = getSupabaseAdminClient();
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      count: 0,
      activeVisitors: [],
      error: err.message || "Supabase bağlantısı kurulamadı",
    });
  }

  try {
    // 35-second activity window
    const activeCutoff = new Date(Date.now() - 35 * 1000).toISOString();

    const { data, error } = await supabase
      .from("active_visitors")
      .select("visitor_id, path, device_type, product_name, last_seen")
      .gte("last_seen", activeCutoff)
      .order("last_seen", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[Active Visitors Fetch Error]:", error);
      return NextResponse.json({
        success: false,
        count: 0,
        activeVisitors: [],
        error: error.message,
      });
    }

    const visitors = data || [];

    return NextResponse.json({
      success: true,
      count: visitors.length,
      activeVisitors: visitors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Active Visitors Unexpected Error]:", err);
    return NextResponse.json({
      success: false,
      count: 0,
      activeVisitors: [],
      error: err.message || "Bilinmeyen hata",
    });
  }
}
