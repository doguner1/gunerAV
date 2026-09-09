import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";

export async function GET(req: NextRequest) {
  try {
    const key =
      req.headers.get("x-admin-key") ||
      new URL(req.url).searchParams.get("key");
    const validSecret = process.env.ANALYTICS_SECRET;

    if (!validSecret) {
      return NextResponse.json(
        { success: false, error: "ANALYTICS_SECRET ayarlanmamış." },
        { status: 500 }
      );
    }

    if (!key || key !== validSecret) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const products = await getAllProducts();

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Ürünler getirilirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
