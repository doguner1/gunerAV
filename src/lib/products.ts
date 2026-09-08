import productsData from "../../data/products.json";
import categoriesData from "../../data/categories.json";
import { Product, Category } from "@/types/product";
import { isSupabaseConfigured, getSupabaseProducts, getSupabaseProductBySlug } from "./supabase";
import { getSecureImageUrl } from "./image-crypto";

function secureProduct(p: Product): Product {
  if (!p) return p;

  const rawVariants =
    Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants
      : Array.isArray((p as any)?.specs_tr?.variants)
      ? (p as any).specs_tr.variants
      : undefined;

  const securedVariants = rawVariants
    ? rawVariants.map((v: any) => ({
        ...v,
        images:
          Array.isArray(v.images) && v.images.length > 0
            ? v.images.map(getSecureImageUrl)
            : [],
      }))
    : undefined;

  return {
    ...p,
    images:
      Array.isArray(p.images) && p.images.length > 0
        ? p.images.map(getSecureImageUrl)
        : ["/images/products/optics-1.webp"],
    variants: securedVariants,
  };
}

const rawLocalProducts = (productsData || []) as unknown as Product[];
const localProducts: Product[] = rawLocalProducts.map(secureProduct);
const categories = categoriesData as unknown as Category[];

/**
 * Supabase bağlıysa yalnızca Supabase'deki ürünleri getirir (veritabanı temizlendiğinde yerel veri zorla gösterilmez).
 * Supabase yapılandırılmamışsa yerel products.json dosyasını kullanır.
 */
export async function getAllProducts(): Promise<Product[]> {
  if (isSupabaseConfigured) {
    try {
      const supabaseItems = await getSupabaseProducts();
      return (supabaseItems || []).map(secureProduct);
    } catch (e) {
      console.warn("[Products] Supabase'den ürün çekilemedi:", e);
      return [];
    }
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
  if (isSupabaseConfigured) {
    try {
      const fromSupabase = await getSupabaseProductBySlug(slug);
      if (fromSupabase) return secureProduct(fromSupabase);
      return undefined;
    } catch (e) {
      return undefined;
    }
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
  if (category === "tufek") {
    return arr.filter((p) => p.category.startsWith("tufek") || p.category === "silah-muhimmat");
  }
  if (category === "silah-muhimmat") {
    return arr.filter((p) => p.category.startsWith("tufek") || p.category === "muhimmat" || p.category === "silah-muhimmat");
  }
  if (category === "bicak" || category === "aksesuar") {
    return arr.filter((p) => p.category === "bicak" || p.category === "aksesuar");
  }
  return arr.filter((p) => p.category === category);
}

export async function getRelatedProducts(
  currentId: string,
  category: string,
  limit: number = 3,
  list?: Product[]
): Promise<Product[]> {
  const arr = list || (await getAllProducts());
  return arr
    .filter((p) => {
      if (p.id === currentId) return false;
      if (category.startsWith("tufek") && p.category.startsWith("tufek")) return true;
      if ((category === "bicak" || category === "aksesuar") && (p.category === "bicak" || p.category === "aksesuar")) return true;
      return p.category === category;
    })
    .slice(0, limit);
}

export function getCategoryById(id: string): Category | undefined {
  if (id === "aksesuar") return categories.find((c) => c.id === "bicak");
  if (id === "silah-muhimmat") return categories.find((c) => c.id === "tufek") || categories[0];
  const main = categories.find((c) => c.id === id);
  if (main) return main;

  for (const cat of categories) {
    const sub = cat.subcategories?.find((s) => s.id === id);
    if (sub) {
      return {
        id: sub.id,
        slug: sub.slug,
        name_tr: sub.name_tr,
        name_en: sub.name_en,
        description_tr: `${cat.name_tr} - ${sub.name_tr}`,
        description_en: `${cat.name_en} - ${sub.name_en}`,
        image: cat.image,
        icon: cat.icon,
      };
    }
  }
  return undefined;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  if (slug === "aksesuar") return categories.find((c) => c.id === "bicak");
  if (slug === "silah-muhimmat") return categories.find((c) => c.id === "tufek") || categories[0];
  const main = categories.find((c) => c.slug === slug || c.id === slug);
  if (main) return main;

  for (const cat of categories) {
    const sub = cat.subcategories?.find((s) => s.slug === slug || s.id === slug);
    if (sub) {
      return {
        id: sub.id,
        slug: sub.slug,
        name_tr: sub.name_tr,
        name_en: sub.name_en,
        description_tr: `${cat.name_tr} - ${sub.name_tr}`,
        description_en: `${cat.name_en} - ${sub.name_en}`,
        image: cat.image,
        icon: cat.icon,
      };
    }
  }
  return undefined;
}


