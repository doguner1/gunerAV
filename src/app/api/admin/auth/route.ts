import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    const validSecret = process.env.ANALYTICS_SECRET;

    if (!validSecret) {
      return NextResponse.json({ success: false, error: "Vercel'de ANALYTICS_SECRET ayarlanmamış." }, { status: 500 });
    }

    if (key === validSecret) {
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, error: "Hatalı şifre" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
