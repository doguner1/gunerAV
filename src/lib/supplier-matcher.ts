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

/**
 * Turkish character normalization and tokenizer
 */
export function normalizeText(str: string): string {
  return (str || "")
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

export function tokenize(str: string): Set<string> {
  const norm = normalizeText(str);
  const words = norm.split(" ").filter((w) => w.length > 1);
  return new Set(words);
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

/**
 * Finds best matching supplier URL for a product
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
  const pTokens = tokenize(`${product.name_tr} ${product.id}`);
  const isFirearm =
    (product.category && product.category.startsWith("tufek")) ||
    nameNorm.includes("castello") ||
    nameNorm.includes("tufek");

  // Choose supplier subset
  const targetSupplier: "arslansilah" | "ozlerav" = isFirearm ? "arslansilah" : "ozlerav";
  const pool = supplierItems.filter((item) => item.supplier === targetSupplier);

  let bestMatch: SupplierItem | null = null;
  let highestScore = 0;

  for (const item of pool) {
    // 1. Exact slug match
    const cleanProdId = normalizeText(product.id).replace(/^castello\s+/, "");
    const cleanItemSlug = normalizeText(item.slug).replace(/^castello\s+/, "");
    if (cleanProdId === cleanItemSlug || cleanProdId === normalizeText(item.slug)) {
      bestMatch = item;
      highestScore = 100;
      break;
    }

    // 2. Token overlap score
    let commonTokens = 0;
    Array.from(item.tokens).forEach((t) => {
      if (pTokens.has(t)) commonTokens++;
    });

    if (commonTokens > 0) {
      // Jaccard similarity
      const union = new Set(Array.from(pTokens).concat(Array.from(item.tokens))).size;
      const score = Math.round((commonTokens / union) * 100);

      // Model-specific boost for firearms
      if (isFirearm) {
        const modelMatch = item.tokens.size > 0 && Array.from(item.tokens).some((t) => t.length >= 3 && pTokens.has(t));
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
