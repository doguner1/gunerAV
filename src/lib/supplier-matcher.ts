export interface SupplierItem {
  supplier: "ozlerav" | "arslansilah";
  title: string;
  url: string;
  slug: string;
  tokens: Set<string>;
}

export interface MatchResult {
  id: string;
  name_tr: string;
  category: string;
  current_url?: string;
  suggested_url?: string;
  supplier: "ozlerav" | "arslansilah";
  confidence: number; // 0 - 100
  alreadyMatched: boolean;
}

// ─── Stop words: too generic to meaningfully differentiate products ──
const STOP_WORDS = new Set([
  // Turkish common words
  "ve", "ile", "icin", "de", "da", "bir", "bu", "su", "no", "lu", "li", "en", "ler", "lar",
  // Units & measurements
  "gr", "mm", "cm", "cal", "mt", "kg", "lt", "adet", "set", "takim", "pcs",
  // Generic product/hunting words that appear in almost everything
  "av", "kalibre", "gauge", "seri", "model", "yeni", "ozel", "pro", "plus",
  "urun", "urunler",
]);

// ─── Product type keywords for cross-type mismatch prevention ───────
const AMMO_KEYWORDS = [
  "fisek", "fisegi", "mermi", "sacma", "kartus", "barut", "kapsul", "tapa",
  "magnum", "slug", "bijon", "chevrotine", "chasse", "trap", "skeet",
  "bior", "caccia", "supersonic", "subsonic", "buckshot",
];
const FIREARM_KEYWORDS = [
  "tufek", "tufegi", "tabanca", "pompali", "sarjorlu", "superpoze",
  "cifte", "kirma", "bullpup", "yari otomatik",
];

// Words to strip when building search queries (too generic to search)
const CATEGORY_WORDS = new Set([
  ...AMMO_KEYWORDS,
  ...FIREARM_KEYWORDS,
  "durbun", "bicak", "caki", "ayakkabi", "bot", "cadir", "canta",
  "yelek", "mont", "eldiven", "sapka", "maske", "gozluk",
  "kamp", "outdoor", "taktik", "aksesuar", "malzeme", "balik",
]);

type ProductType = "ammo" | "firearm" | "other";

function detectProductType(normalizedName: string): ProductType {
  for (const kw of AMMO_KEYWORDS) {
    if (normalizedName.includes(kw)) return "ammo";
  }
  for (const kw of FIREARM_KEYWORDS) {
    if (normalizedName.includes(kw)) return "firearm";
  }
  return "other";
}

/**
 * Turkish character normalization
 */
export function normalizeText(str: string): string {
  return (str || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/Ş/g, "s")
    .replace(/Ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/Ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/i̇/g, "i") // Handle combining dot (i + \u0307)
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenize with stop word removal for meaningful matching.
 * Short pure-digit tokens (1-2 chars) are also dropped to avoid false overlap on "12", "32" etc.
 */
export function tokenize(str: string): Set<string> {
  const norm = normalizeText(str);
  const words = norm.split(" ").filter(
    (w) => w.length > 1 && !STOP_WORDS.has(w) && !(w.length <= 2 && /^\d+$/.test(w))
  );
  return new Set(words);
}

/**
 * Extract the most distinctive brand/model search terms from a product name.
 * Removes stop words, category words, and pure numbers.
 */
export function extractSearchTerms(productName: string): string {
  const norm = normalizeText(productName);
  const words = norm.split(" ").filter(
    (w) =>
      w.length > 1 &&
      !STOP_WORDS.has(w) &&
      !CATEGORY_WORDS.has(w) &&
      !/^\d+$/.test(w)
  );
  // Take first 3 distinctive words (brand, model, variant)
  return words.slice(0, 3).join(" ");
}

/**
 * Compute Jaccard-based match confidence between two product names
 */
export function computeMatchConfidence(name1: string, name2: string): number {
  const t1 = tokenize(name1);
  const t2 = tokenize(name2);
  if (t1.size === 0 || t2.size === 0) return 0;
  let common = 0;
  Array.from(t2).forEach((t) => {
    if (t1.has(t)) common++;
  });
  const union = new Set(Array.from(t1).concat(Array.from(t2))).size;
  return Math.round((common / union) * 100);
}

/**
 * Search Özler Av autocomplete API for a product.
 * Returns the best match URL and title, or null if not found.
 */
export async function searchOzlerAvProduct(
  query: string,
  cookie?: string
): Promise<{ url: string; title: string } | null> {
  if (!query || query.trim().length < 2) return null;
  try {
    const apiUrl = "https://www.ozlerav.com.tr/arama/urunautocomplate?query=" + encodeURIComponent(query.trim());
    const headers: Record<string, string> = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };
    if (cookie) {
      headers["Cookie"] = cookie;
    }
    const res = await fetch(
      apiUrl,
      { headers }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (
      data.suggestions &&
      Array.isArray(data.suggestions) &&
      data.suggestions.length > 0
    ) {
      const s = data.suggestions[0];
      let url = "";
      if (typeof s.data === "string") {
        if (s.data.startsWith("http")) {
          url = s.data;
        } else {
          const prefix = s.data.startsWith("/") ? "" : "/";
          url = "https://www.ozlerav.com.tr" + prefix + s.data;
        }
      }
      if (!url) return null;
      return { url, title: s.value || "" };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Downloads and indexes all product URLs from supplier sitemaps
 */
export async function getSupplierIndex(): Promise<SupplierItem[]> {
  const items: SupplierItem[] = [];

  // 1. Özler Av (All products in product1.xml)
  try {
    const res = await fetch("https://www.ozlerav.com.tr/product1.xml", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const xml = await res.text();
      const urls = xml.match(/<loc>(.*?)<\/loc>/g) || [];
      for (const rawUrl of urls) {
        const u = rawUrl.replace(/<\/?loc>/g, "").trim();
        if (u.includes("-p-")) {
          const parts = u.split("/");
          const filename = parts[parts.length - 1];
          const slug = filename.replace(/-p-\d+.*$/, "");
          const title = slug.replace(/-/g, " ");
          items.push({
            supplier: "ozlerav",
            url: u,
            slug,
            title,
            tokens: tokenize(title),
          });
        }
      }
    }
  } catch (err) {
    console.error("[supplier-matcher] Failed to fetch ozlerav sitemap:", err);
  }

  // 2. Arslan Silah (Firearms / Castello models in page-sitemap.xml)
  try {
    const res = await fetch("https://arslansilah.com/page-sitemap.xml", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const xml = await res.text();
      const urls = xml.match(/<loc>(.*?)<\/loc>/g) || [];
      for (const rawUrl of urls) {
        const u = rawUrl.replace(/<\/?loc>/g, "").trim();
        if (
          !u.includes("/en/") &&
          (u.includes("/pompali/") ||
            u.includes("/sarjorlu/") ||
            u.includes("/yari-otomatik/") ||
            u.includes("/superpoze/") ||
            u.includes("/cifte/") ||
            u.includes("/tek-kirma/") ||
            u.includes("/bullpup/"))
        ) {
          const parts = u.replace(/\/$/, "").split("/");
          const slug = parts[parts.length - 1];
          const title = slug.replace(/-/g, " ");
          items.push({
            supplier: "arslansilah",
            url: u,
            slug,
            title,
            tokens: tokenize(title),
          });
        }
      }
    }
  } catch (err) {
    console.error("[supplier-matcher] Failed to fetch arslansilah sitemap:", err);
  }

  return items;
}

// Minimum confidence for a sitemap match to count as valid
const MIN_SITEMAP_CONFIDENCE = 40;

/**
 * Finds best matching supplier URL for a product using sitemap index.
 * Includes cross-type prevention (ammo ↔ firearm).
 */
export function matchProductWithSupplier(
  product: { id: string; name_tr: string; category?: string; supplier_url?: string },
  supplierItems: SupplierItem[]
): MatchResult {
  const currentUrl = product.supplier_url || "";
  const isAlreadySpecific =
    Boolean(currentUrl) &&
    currentUrl !== "https://www.ozlerav.com.tr/" &&
    currentUrl !== "https://ozlerav.com/" &&
    currentUrl !== "https://arslansilah.com/";

  if (isAlreadySpecific) {
    return {
      id: product.id,
      name_tr: product.name_tr,
      category: product.category || "diger",
      current_url: currentUrl,
      suggested_url: currentUrl,
      supplier: currentUrl.includes("arslansilah") ? "arslansilah" : "ozlerav",
      confidence: 100,
      alreadyMatched: true,
    };
  }

  const nameNorm = normalizeText(product.name_tr);
  const pTokens = tokenize(product.name_tr);
  const productType = detectProductType(nameNorm);

  const isFirearm =
    (product.category && product.category.startsWith("tufek")) ||
    nameNorm.includes("castello") ||
    productType === "firearm";

  const targetSupplier: "arslansilah" | "ozlerav" = isFirearm ? "arslansilah" : "ozlerav";
  const pool = supplierItems.filter((item) => item.supplier === targetSupplier);

  let bestMatch: SupplierItem | null = null;
  let highestScore = 0;

  for (const item of pool) {
    // ── Cross-type prevention: ammo should NEVER match a firearm URL ──
    const itemNorm = normalizeText(item.title + " " + item.slug);
    const itemType = detectProductType(itemNorm);
    if (productType === "ammo" && itemType === "firearm") continue;
    if (productType === "firearm" && itemType === "ammo") continue;

    // 1. Exact slug match
    const cleanProdId = normalizeText(product.id).replace(/^castello\s+/, "");
    const cleanItemSlug = normalizeText(item.slug).replace(/^castello\s+/, "");
    if (cleanProdId === cleanItemSlug || cleanProdId === normalizeText(item.slug)) {
      bestMatch = item;
      highestScore = 100;
      break;
    }

    // 2. Token overlap score (stop words already removed)
    let commonTokens = 0;
    Array.from(item.tokens).forEach((t) => {
      if (pTokens.has(t)) commonTokens++;
    });

    // Require at least 2 meaningful common tokens to prevent false matches
    if (commonTokens >= 2) {
      const union = new Set(Array.from(pTokens).concat(Array.from(item.tokens))).size;
      const score = Math.round((commonTokens / union) * 100);

      if (isFirearm) {
        const modelMatch = Array.from(item.tokens).some(
          (t) => t.length >= 3 && pTokens.has(t)
        );
        if (modelMatch && score > highestScore) {
          highestScore = Math.max(score, 80);
          bestMatch = item;
        }
      } else if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }
  }

  // Discard low-confidence sitemap matches completely
  if (highestScore < MIN_SITEMAP_CONFIDENCE) {
    bestMatch = null;
    highestScore = 0;
  }

  return {
    id: product.id,
    name_tr: product.name_tr,
    category: product.category || "diger",
    current_url: currentUrl,
    suggested_url: bestMatch ? bestMatch.url : undefined,
    supplier: targetSupplier,
    confidence: bestMatch ? highestScore : 0,
    alreadyMatched: false,
  };
}
