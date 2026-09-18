import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/server-auth";
import { getAllProducts } from "@/lib/products";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const res = await fetch("https://www.ozlerav.com.tr/product1.xml");
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    
    const sitemapUrls: string[] = [];
    $("loc").each((_, el) => {
      sitemapUrls.push($(el).text().trim());
    });

    // Get all our current products
    const ourProducts = await getAllProducts();
    const ourSlugs = new Set(ourProducts.map(p => p.id)); // Assuming product ID is often related, or we check URLs
    // But our products don't store the Özler Av URL unless it's in supplier_url
    const existingSupplierUrls = new Set(ourProducts.map(p => p.supplier_url).filter(Boolean));

    const missingUrls = sitemapUrls.filter(url => !existingSupplierUrls.has(url));

    return NextResponse.json({
      success: true,
      totalSitemap: sitemapUrls.length,
      missingCount: missingUrls.length,
      missingUrls: missingUrls
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
