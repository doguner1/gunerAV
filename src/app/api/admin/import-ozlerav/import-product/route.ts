import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/server-auth";
import { getOzlerAvCookie } from "@/lib/ozlerav-auth";
import * as cheerio from "cheerio";
import { getSupabaseAdminClient } from "@/lib/server-supabase";
import { normalizeText } from "@/lib/supplier-matcher";

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const { url, category } = await req.json();
    if (!url) return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });

    const cookie = await getOzlerAvCookie();
    const headers: Record<string, string> = { "User-Agent": "Mozilla/5.0" };
    if (cookie) headers["Cookie"] = cookie;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("Failed to fetch product page");
    
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract product details
    const title = $("h1").first().text().trim();
    if (!title) throw new Error("Title not found on page");
    
    // Generate a unique ID (slug)
    const id = normalizeText(title).replace(/\s+/g, "-");
    
    // Extract price
    let priceText = $(".product-price, .fiyat, .price").first().text().trim();
    let price = 0;
    if (priceText) {
       const match = priceText.replace(/\./g, "").replace(",", ".").match(/[\d.]+/);
       if (match) price = parseFloat(match[0]);
    }
    
    // Extract images
    const imageUrls: string[] = [];
    $(".product-image img, .gallery img, #product-image").each((_, el) => {
       let src = $(el).attr("src") || $(el).attr("data-src");
       if (src) {
         if (src.startsWith("/")) src = "https://www.ozlerav.com.tr" + src;
         if (!imageUrls.includes(src)) imageUrls.push(src);
       }
    });
    
    if (imageUrls.length === 0) {
       // fallback image extraction
       $("img").each((_, el) => {
         let src = $(el).attr("src");
         if (src && src.includes("/images/products/")) {
           if (src.startsWith("/")) src = "https://www.ozlerav.com.tr" + src;
           if (!imageUrls.includes(src)) imageUrls.push(src);
         }
       });
    }

    const description = $(".product-description, .aciklama").html() || "";

    const supabase = getSupabaseAdminClient();
    
    // Insert into products table
    const productData = {
      id,
      name_tr: title,
      price: price || null,
      category: category || "diger", // default or passed category
      description_tr: description,
      images: imageUrls.length > 0 ? [imageUrls[0]] : [],
      supplier_url: url,
      in_stock: true
    };

    const { error } = await supabase
      .from("products")
      .upsert(productData)
      .select();

    if (error) {
       // If ID constraint fails, append random string
       if (error.code === '23505') {
         productData.id = `${id}-${Math.floor(Math.random() * 1000)}`;
         const retry = await supabase.from("products").insert(productData).select();
         if (retry.error) throw retry.error;
       } else {
         throw error;
       }
    }

    return NextResponse.json({ success: true, title, id: productData.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
