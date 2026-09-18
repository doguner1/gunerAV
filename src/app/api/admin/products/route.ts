import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";
import { isAdminAuthorized } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const products = await getAllProducts(true);

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
