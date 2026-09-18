import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/server-auth";
import { getAllProducts } from "@/lib/products";
import {
  getSupplierIndex,
  matchProductWithSupplier,
  extractSearchTerms,
  searchOzlerAvProduct,
  computeMatchConfidence,
} from "@/lib/supplier-matcher";
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

    // Phase 1: Sitemap-based matching (fast, bulk)
    const matches = products.map((p) => matchProductWithSupplier(p, supplierIndex));

    // Phase 2: Autocomplete fallback for unmatched Özler Av products
    const unmatchedForSearch = matches.filter(
      (m) => !m.alreadyMatched && !m.suggested_url && m.supplier === "ozlerav"
    );

    // Batch autocomplete searches: 10 concurrent, 200ms between batches
    for (let i = 0; i < unmatchedForSearch.length; i += 10) {
      const batch = unmatchedForSearch.slice(i, i + 10);
      await Promise.all(
        batch.map(async (m) => {
          const terms = extractSearchTerms(m.name_tr);
          if (!terms) return;
          const result = await searchOzlerAvProduct(terms);
          if (result && result.url) {
            const confidence = computeMatchConfidence(m.name_tr, result.title);
            if (confidence >= 40) {
              m.suggested_url = result.url;
              m.confidence = confidence;
            }
          }
        })
      );
      // Polite delay between batches
      if (i + 10 < unmatchedForSearch.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    const alreadyMatchedCount = matches.filter((m) => m.alreadyMatched).length;
    const newlyMatchedCount = matches.filter((m) => !m.alreadyMatched && !!m.suggested_url && m.confidence >= 40).length;
    const unmatchedCount = matches.filter((m) => !m.alreadyMatched && (!m.suggested_url || m.confidence < 40)).length;

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
