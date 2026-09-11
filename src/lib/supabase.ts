import { Product } from "@/types/product";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/**
 * Supabase REST API üzerinden ürünleri çeker (ISR 30sn önbellek ile)
 */
export async function getSupabaseProducts(): Promise<Product[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return [];
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        next: { revalidate: 60 }, // 1 dakikada bir otomatik güncellenir
      }
    );

    if (!res.ok) {
      console.warn(`[Supabase] Ürün çekme hatası: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? (data as Product[]) : [];
  } catch (err) {
    console.error("[Supabase] Bağlantı hatası:", err);
    return [];
  }
}

/**
 * Tek bir ürünü slug veya ID ile çeker
 */
export async function getSupabaseProductBySlug(slug: string): Promise<Product | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/products?or=(id.eq.${slug},slug_tr.eq.${slug},slug_en.eq.${slug})&limit=1`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch (err) {
    console.error("[Supabase] Tekil ürün çekme hatası:", err);
    return null;
  }
}
