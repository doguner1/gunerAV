import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/server-auth";
import { getAllProducts } from "@/lib/products";
import { getSupplierIndex, matchProductWithSupplier } from "@/lib/supplier-matcher";
import { getSupabaseAdminClient } from "@/lib/server-supabase";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const [products, supplierIndex] = await Promise.all([
      getAllProducts(true),
      getSupplierIndex(),
    ]);

    const matches = products.map((p) => matchProductWithSupplier(p, supplierIndex));

    const alreadyMatchedCount = matches.filter((m) => m.alreadyMatched).length;
    const newlyMatchedCount = matches.filter((m) => !m.alreadyMatched && m.suggested_url && m.confidence >= 50).length;
    const unmatchedCount = matches.filter((m) => !m.alreadyMatched && (!m.suggested_url || m.confidence < 50)).length;

    return NextResponse.json({
      success: true,
      totalCount: products.length,
      alreadyMatchedCount,
      newlyMatchedCount,
      unmatchedCount,
      supplierIndexCount: supplierIndex.length,
      matches,
    });
  } catch (error: any) {
    console.error("[match-suppliers GET error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Tedarikçi eşleştirme hatası" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updates: Array<{ id: string; supplier_url: string }> = body.updates || [];

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ success: false, error: "Güncellenecek ürün listesi boş." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    let updatedCount = 0;

    if (supabase) {
      // Update in batches of 20 to avoid overwhelming the database
      for (let i = 0; i < updates.length; i += 20) {
        const batch = updates.slice(i, i + 20);
        await Promise.all(
          batch.map(async (item) => {
            const { error } = await supabase
              .from("products")
              .update({ supplier_url: item.supplier_url })
              .eq("id", item.id);
            if (!error) updatedCount++;
          })
        );
      }
    }

    // Trigger on-demand ISR revalidation
    try {
      revalidatePath("/");
      revalidatePath("/tr/products");
      revalidatePath("/en/products");
    } catch {
      // Ignore
    }

    return NextResponse.json({
      success: true,
      requestedCount: updates.length,
      updatedCount,
    });
  } catch (error: any) {
    console.error("[match-suppliers POST error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Güncelleme sırasında hata oluştu" },
      { status: 500 }
    );
  }
}
