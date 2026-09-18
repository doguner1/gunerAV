import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/server-auth";
import { getAllDeviceSettings, saveDeviceSetting } from "@/lib/device-settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const settings = await getAllDeviceSettings();
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (err) {
    console.error("[api/admin/devices GET Error]:", err);
    return NextResponse.json({ success: false, error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { visitorId, alias, isIgnored } = body;

    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json({ success: false, error: "Geçersiz visitorId" }, { status: 400 });
    }

    const saved = await saveDeviceSetting({
      visitorId,
      alias,
      isIgnored,
    });

    return NextResponse.json({ success: true, setting: saved }, { status: 200 });
  } catch (err) {
    console.error("[api/admin/devices POST Error]:", err);
    return NextResponse.json({ success: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
