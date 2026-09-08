import productsData from "../../data/products.json";
import categoriesData from "../../data/categories.json";
import { Product, Category } from "@/types/product";
import { getSupabaseProducts, getSupabaseProductBySlug } from "./supabase";
import { getSecureImageUrl } from "./image-crypto";

function secureProduct(p: Product): Product {
  if (!p) return p;
  return {
    ...p,
    images:
      Array.isArray(p.images) && p.images.length > 0
        ? p.images.map(getSecureImageUrl)
        : ["/images/products/optics-1.webp"],
  };
}

const rawLocalProducts = (productsData || []) as unknown as Product[];
const localProducts: Product[] = rawLocalProducts.map(secureProduct);
const categories = categoriesData as unknown as Category[];

/**
 * Supabase bağlıysa ve ürün varsa oradan, yoksa local products.json dosyasından çeker.
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const supabaseItems = await getSupabaseProducts();
    if (supabaseItems && supabaseItems.length > 0) {
      const securedSupabase = supabaseItems.map(secureProduct);
      const supabaseIds = new Set(securedSupabase.map((p) => p.id));
      const filteredLocal = localProducts.filter((p) => !supabaseIds.has(p.id));
      return [...securedSupabase, ...filteredLocal];
    }
  } catch (e) {
    console.warn("[Products] Supabase'den ürün çekilemedi, yerel veri kullanılıyor:", e);
  }
  return localProducts;
}

export function getAllCategories(): Category[] {
  return categories;
}

export function getFeaturedProducts(list?: Product[]): Product[] {
  const arr = list || localProducts;
  return arr.filter((product) => product.featured);
}

export function getHeroSpotlightProduct(list?: Product[]): Product | undefined {
  const arr = list || localProducts;
  return (
    arr.find((p) => p.is_hero_spotlight) ||
    arr.find((p) => p.featured) ||
    arr[0]
  );
}

export function getDealsProducts(list?: Product[]): Product[] {
  const arr = list || localProducts;
  return arr.filter(
    (product) => product.discount_percent && product.discount_percent > 0
  );
}

export function getProductById(id: string, list?: Product[]): Product | undefined {
  const arr = list || localProducts;
  return arr.find((p) => p.id === id);
}

export async function fetchProductBySlug(
  slug: string,
  locale: string = "tr"
): Promise<Product | undefined> {
  try {
    const fromSupabase = await getSupabaseProductBySlug(slug);
    if (fromSupabase) return secureProduct(fromSupabase);
  } catch (e) {
    // ignore
  }

  const all = await getAllProducts();
  return getProductBySlug(slug, locale, all);
}

export function getProductBySlug(
  slug: string,
  locale: string = "tr",
  list?: Product[]
): Product | undefined {
  const arr = list || localProducts;
  return arr.find((p) => {
    if (p.id === slug) return true;
    if (locale === "tr" && p.slug_tr === slug) return true;
    if (locale === "en" && p.slug_en === slug) return true;
    return p.slug_tr === slug || p.slug_en === slug;
  });
}

export function getProductsByCategory(category: string, list?: Product[]): Product[] {
  const arr = list || localProducts;
  return arr.filter((p) => p.category === category);
}

export function getRelatedProducts(
  currentId: string,
  category: string,
  limit: number = 3,
  list?: Product[]
): Product[] {
  const arr = list || localProducts;
  return arr
    .filter((p) => p.category === category && p.id !== currentId)
    .slice(0, limit);
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug || c.id === slug);
}
