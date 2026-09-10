import productsData from "../../data/products.json";
import categoriesData from "../../data/categories.json";
import { Product, Category } from "@/types/product";
import { isSupabaseConfigured, getSupabaseProducts, getSupabaseProductBySlug } from "./supabase";
import { getSecureImageUrl } from "./image-crypto";

let staticImagesMap: Record<string, { images?: string[]; variants?: any[] }> = {};
try {
  staticImagesMap = require("./static-images-map.json");
} catch {
  // Graceful fallback if static map is not yet generated
}

function secureProduct(p: Product): Product {
  if (!p) return p;

  let category = p.category;
  let requiresLicense = p.requires_license;

  const slugKey = p.slug_tr || p.slug_en || p.id || "";
  const slugLower = slugKey.toLowerCase();
  const nameLower = ((p.name_tr || "") + " " + (p.name_en || "")).toLowerCase();

  const isGunAccessory =
    category === "tufek-aksesuar" ||
    category === "tufek-aksesuarlar" ||
    category === "aksesuar" ||
    category?.startsWith("aksesuar-") ||
    category === "bicak-av" ||
    nameLower.includes("aparati") ||
    nameLower.includes("aparatı") ||
    nameLower.includes("montaj rayı") ||
    nameLower.includes("montaj rayi") ||
    nameLower.includes("dönüştürücü ray") ||
    nameLower.includes("donusturucu ray") ||
    nameLower.includes("dürbün ayağı") ||
    nameLower.includes("durbun ayagi") ||
    nameLower.includes("kılıf") ||
    nameLower.includes("kilif") ||
    nameLower.includes("çanta") ||
    nameLower.includes("canta") ||
    nameLower.includes("fişeklik") ||
    nameLower.includes("fiseklik") ||
    nameLower.includes("kayış") ||
    nameLower.includes("kayis") ||
    nameLower.includes("dipçik") ||
    nameLower.includes("dipcik") ||
    nameLower.includes("kundak") ||
    nameLower.includes("tutamak") ||
    nameLower.includes("tutamagi") ||
    nameLower.includes("çatal ayak") ||
    nameLower.includes("catal ayak") ||
    nameLower.includes("bipod") ||
    nameLower.includes("arpacık") ||
    nameLower.includes("arpacik") ||
    nameLower.includes("gez ") ||
    nameLower.includes("gez-") ||
    nameLower.includes("gez takımı") ||
    nameLower.includes("kulaklık") ||
    nameLower.includes("kulaklik") ||
    nameLower.includes("ray pedi") ||
    slugLower.includes("fiseklik") ||
    slugLower.includes("ray-pedi") ||
    slugLower.includes("catal-ayak") ||
    slugLower.includes("bipod") ||
    slugLower.includes("durbun-ayagi") ||
    slugLower.includes("montaj-rayi") ||
    slugLower.includes("lazer-aparati");

  const isOptic =
    !isGunAccessory && (
      category === "optik" ||
      nameLower.includes("dürbün") ||
      nameLower.includes("durbun") ||
      nameLower.includes("scope") ||
      nameLower.includes("red dot") ||
      nameLower.includes("reddot") ||
      nameLower.includes("red-dot") ||
      nameLower.includes("termal") ||
      nameLower.includes("sıfırlama lazeri") ||
      nameLower.includes("sifirlama lazeri") ||
      nameLower.includes("boresighter") ||
      nameLower.includes("monoküler") ||
      nameLower.includes("monokuler") ||
      slugLower.includes("durbun") ||
      slugLower.includes("optik") ||
      slugLower.includes("scope") ||
      slugLower.includes("red-dot") ||
      slugLower.includes("reddot")
    );

  if (isGunAccessory) {
    category = "tufek-aksesuar";
    requiresLicense = false;
  } else if (isOptic) {
    category = "optik";
    requiresLicense = false;
  } else if (category === "kamp" || category?.startsWith("kamp-")) {
    requiresLicense = false;
  } else if (category === "muhimmat" || category?.startsWith("muhimmat-")) {
    requiresLicense = false;
  } else if (category === "bicak" || category?.startsWith("bicak-")) {
    requiresLicense = false;
  } else if (category?.startsWith("tufek-") || category === "tufek") {
    requiresLicense = true;
  }

  const staticEntry = staticImagesMap[slugKey];
  if (staticEntry) {
    if (Array.isArray(staticEntry.images) && staticEntry.images.length > 0) {
      p.images = staticEntry.images;
    }
    if (Array.isArray(staticEntry.variants) && staticEntry.variants.length > 0) {
      p.variants = staticEntry.variants;
    }
  }

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

  let cleanedVariants = securedVariants;
  if (cleanedVariants && cleanedVariants.length > 1) {
    const otherVariantImages = new Set<string>();
    for (let i = 1; i < cleanedVariants.length; i++) {
      (cleanedVariants[i].images || []).forEach((img: string) => otherVariantImages.add(img));
    }
    // If the 1st variant accidentally contains images from subsequent variants (legacy scraper artifact)
    if (cleanedVariants[0]?.images && cleanedVariants[0].images.length > 0) {
      const filteredFirstVariantImages = cleanedVariants[0].images.filter(
        (img: string) => !otherVariantImages.has(img)
      );
      if (filteredFirstVariantImages.length > 0) {
        cleanedVariants[0] = {
          ...cleanedVariants[0],
          images: filteredFirstVariantImages,
        };
      }
    }
  }

  // Clean specs so variants array or non-primitive objects are not exposed as specs
  const cleanSpecsTr = p.specs_tr ? { ...p.specs_tr } : undefined;
  if (cleanSpecsTr && "variants" in cleanSpecsTr) {
    delete (cleanSpecsTr as any).variants;
  }
  const cleanSpecsEn = p.specs_en ? { ...p.specs_en } : undefined;
  if (cleanSpecsEn && "variants" in cleanSpecsEn) {
    delete (cleanSpecsEn as any).variants;
  }

  const baseImages =
    cleanedVariants && cleanedVariants[0]?.images && cleanedVariants[0].images.length > 0
      ? cleanedVariants[0].images
      : Array.isArray(p.images) && p.images.length > 0
      ? p.images.map(getSecureImageUrl)
      : ["/images/products/optics-1.webp"];

  return {
    ...p,
    category,
    requires_license: requiresLicense,
    images: baseImages,
    variants: cleanedVariants,
    specs_tr: cleanSpecsTr,
    specs_en: cleanSpecsEn,
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
  if (!arr || arr.length === 0) return undefined;

  // 1. Öncelik: Admin panelinden 'Hero Vitrin' olarak işaretlenen ürün
  const explicitHero = arr.find((p) => Boolean(p.is_hero_spotlight));
  if (explicitHero) return explicitHero;

  // 2. Öncelik: Öne çıkan tüfekler arasından ilk model (Serengeti veya Castello)
  const featuredFirearm = arr.find((p) => p.featured && p.category?.startsWith("tufek"));
  if (featuredFirearm) return featuredFirearm;

  // 3. Öncelik: Herhangi bir öne çıkan ürün
  const featuredAny = arr.find((p) => p.featured);
  if (featuredAny) return featuredAny;

  // 4. Fallback: İlk tüfek veya veritabanındaki ilk ürün
  return arr.find((p) => p.category?.startsWith("tufek")) || arr[0];
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
  if (category === "kamp") {
    return arr.filter((p) => p.category.startsWith("kamp"));
  }
  if (category === "optik") {
    return arr.filter((p) => p.category === "optik");
  }
  if (category === "tufek") {
    return arr.filter((p) => (p.category.startsWith("tufek") || p.category === "silah-muhimmat" || p.category.startsWith("aksesuar") || p.category === "aksesuar") && p.category !== "optik");
  }
  if (category === "tufek-aksesuar" || category === "tufek-aksesuarlar") {
    return arr.filter((p) => (p.category === "tufek-aksesuar" || p.category === "tufek-aksesuarlar" || p.category.startsWith("aksesuar") || p.category === "aksesuar" || p.category === "bicak-av") && p.category !== "optik");
  }
  if (category === "silah-muhimmat") {
    return arr.filter((p) => (p.category.startsWith("tufek") || p.category === "muhimmat" || p.category === "silah-muhimmat" || p.category.startsWith("aksesuar")) && p.category !== "optik");
  }
  if (category === "bicak") {
    return arr.filter((p) => p.category === "bicak");
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
      if (category.startsWith("kamp") && p.category.startsWith("kamp")) return true;
      if ((category.startsWith("tufek") || category.startsWith("aksesuar")) && (p.category.startsWith("tufek") || p.category.startsWith("aksesuar"))) return true;
      if (category.startsWith("bicak") && p.category.startsWith("bicak")) return true;
      return p.category === category;
    })
    .slice(0, limit);
}

export function getCategoryById(id: string): Category | undefined {
  if (id === "tufek-aksesuarlar") id = "tufek-aksesuar";
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
  if (slug === "tufek-aksesuarlar") slug = "tufek-aksesuar";
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


