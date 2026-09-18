"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Product, Category } from "@/types/product";
import FilterBar from "./FilterBar";
import ProductCard from "@/components/product/ProductCard";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ChevronDown } from "lucide-react";
import { trackSearch, trackCategoryClick } from "@/lib/analytics";
import {
  getReturnStateForCurrentPage,
  consumeReturnState,
  clearReturnState,
  restoreScrollPosition,
} from "@/lib/navigation-state";

export function isProductMatchingCategory(product: Product, categoryId: string): boolean {
  if (!categoryId || categoryId === "all") return true;

  const prodCat = product.category || "";
  const fullText = (
    (product.name_tr || "") + " " +
    (product.name_en || "") + " " +
    (product.description_tr || "") + " " +
    (product.slug_tr || "") + " " +
    JSON.stringify(product.specs_tr || {})
  ).toLocaleLowerCase("tr");

  const isOtherCategory =
    prodCat.startsWith("kamp") ||
    prodCat.startsWith("muhimmat") ||
    prodCat.startsWith("bicak") ||
    prodCat.startsWith("giyim") ||
    prodCat === "tufek-bakim" ||
    prodCat === "havali-kurusiki" ||
    prodCat.startsWith("havali") ||
    prodCat.startsWith("kurusiki");

  const isAccessory =
    prodCat === "tufek-aksesuar" ||
    prodCat === "tufek-aksesuarlar" ||
    prodCat.startsWith("aksesuar") ||
    prodCat === "aksesuar" ||
    fullText.includes("fener lazer aparatı") ||
    fullText.includes("lazer aparatı") ||
    fullText.includes("lazer takma aparatı") ||
    fullText.includes("dönüştürücü ray") ||
    fullText.includes("montaj rayı") ||
    fullText.includes("dürbün ayağı") ||
    fullText.includes("durbun ayagi") ||
    fullText.includes("tüfek kılıfı") ||
    fullText.includes("dipçik fişekliği") ||
    fullText.includes("atış kulaklığı");

  const isOptic =
    !isAccessory &&
    !isOtherCategory && (
      prodCat === "optik" ||
      fullText.includes("dürbün") ||
      fullText.includes("durbun") ||
      fullText.includes("scope") ||
      fullText.includes("red dot") ||
      fullText.includes("reddot") ||
      fullText.includes("red-dot") ||
      fullText.includes("termal dürbün") ||
      fullText.includes("termal kamera") ||
      fullText.includes("termal nişangah") ||
      fullText.includes("termal optik") ||
      fullText.includes("boresighter") ||
      fullText.includes("sıfırlama lazeri") ||
      fullText.includes("sifirlama lazeri")
    );

  if (categoryId === "optik") {
    if (isAccessory || isOtherCategory) return false;
    if (!isOptic && prodCat !== "optik") return false;
    return true;
  }

  if (categoryId === "tufek") {
    if (
      isOptic ||
      isAccessory ||
      prodCat === "tufek-aksesuar" ||
      prodCat === "tufek-aksesuarlar" ||
      prodCat === "tufek-bakim" ||
      prodCat.startsWith("aksesuar") ||
      prodCat === "aksesuar" ||
      prodCat.startsWith("havali") ||
      prodCat.startsWith("kurusiki")
    ) {
      return false;
    }
    const isShotgun =
      (prodCat.startsWith("tufek-") && prodCat !== "tufek-aksesuar" && prodCat !== "tufek-aksesuarlar" && prodCat !== "tufek-bakim" && !prodCat.startsWith("havali")) ||
      prodCat === "tufek" ||
      prodCat === "silah-muhimmat";
    return isShotgun;
  }

  if (categoryId === "tufek-bakim") {
    return prodCat === "tufek-bakim";
  }

  if (categoryId === "havali-kurusiki") {
    return (
      prodCat === "havali-kurusiki" ||
      prodCat.startsWith("havali") ||
      prodCat.startsWith("kurusiki")
    );
  }

  if (categoryId === "havali-aksesuar") {
    return prodCat === "havali-aksesuar" || prodCat === "havali-muhimmat";
  }

  if (categoryId.startsWith("havali-") || categoryId.startsWith("kurusiki-")) {
    return prodCat === categoryId;
  }

  if (categoryId === "silah-muhimmat") {
    if (isOptic || isAccessory || prodCat === "tufek-bakim") return false;
    const isFirearmOrAmmo =
      (prodCat.startsWith("tufek-") && prodCat !== "tufek-aksesuar" && prodCat !== "tufek-aksesuarlar" && prodCat !== "tufek-bakim") ||
      prodCat === "tufek" ||
      prodCat === "muhimmat" ||
      prodCat === "silah-muhimmat";
    return isFirearmOrAmmo;
  }

  if (categoryId === "bicak") {
    if (isOptic || isAccessory) return false;
    return prodCat === "bicak";
  }

  if (categoryId.startsWith("tufek-") || categoryId.startsWith("aksesuar") || categoryId === "aksesuar") {
    const isAccessoryFilter =
      categoryId === "tufek-aksesuar" ||
      categoryId === "tufek-aksesuarlar" ||
      categoryId.startsWith("aksesuar") ||
      categoryId === "aksesuar";

    if (isAccessoryFilter) {
      if (isOptic) return false;
      const isDirectMatch =
        prodCat === "tufek-aksesuar" ||
        prodCat === "tufek-aksesuarlar" ||
        prodCat.startsWith("aksesuar") ||
        prodCat === "aksesuar" ||
        prodCat === "bicak-av" ||
        isAccessory;
      if (isDirectMatch) return true;
      if (prodCat === "silah-muhimmat" || prodCat === "tufek" || prodCat === "bicak") {
        const keywords = ["aksesuar", "taktik aksesuar", "arpacık", "arpacik", "gepacik", "gez", "kayış", "askı", "dipçik", "kundak", "şarjör borusu", "fener ayağı", "bipod", "çatal ayak", "ray", "picatinny", "choke", "şok", "kulaklık", "aparat"];
        return keywords.some((kw) => fullText.includes(kw));
      }
      return false;
    } else {
      // Specific shotgun subcategory (tufek-yari-otomatik, tufek-sarjorlu, etc.)
      if (isOptic || isAccessory) return false;
      if (prodCat === categoryId) return true;
      if (prodCat === "silah-muhimmat" || prodCat === "tufek") {
        const subType = categoryId.replace("tufek-", "");
        const matchKeywords: Record<string, string[]> = {
          "bullpup": ["bullpup"],
          "sarjorlu": ["şarjör", "sarjor", "şarjörlü", "sarjorlu"],
          "yari-otomatik": ["yarı otomatik", "yari otomatik", "otomatik av tüfeği", "gazlı", "kinetik"],
          "pompali": ["pompalı", "pompali", "pump"],
          "tek-kirma": ["tek kırma", "tek kirma", "tekkırma"],
          "superpoze": ["süperpoze", "superpoze", "poze"],
          "cifte": ["çifte", "cifte"],
        };
        const keywords = matchKeywords[subType] || [];
        return keywords.some((kw) => fullText.includes(kw));
      }
      return false;
    }
  }

  if (categoryId === "muhimmat") {
    return prodCat === "muhimmat" || prodCat.startsWith("muhimmat-");
  }

  if (categoryId.startsWith("muhimmat-")) {
    if (prodCat === categoryId) return true;
    if (prodCat === "muhimmat") {
      const subType = categoryId.replace("muhimmat-", "");
      if (subType === "tek-kursun") {
        return fullText.includes("tek kurşun") || fullText.includes("tek kursun") || fullText.includes("slug");
      } else if (subType === "savrotin") {
        return fullText.includes("şavrotin") || fullText.includes("savrotin") || fullText.includes("buckshot");
      } else if (subType === "trap-skeet") {
        return fullText.includes("trap") || fullText.includes("skeet");
      } else if (subType === "magnum") {
        return fullText.includes("magnum");
      } else if (subType === "kursunsuz-celik") {
        return fullText.includes("çelik") || fullText.includes("celik") || fullText.includes("kurşunsuz");
      } else if (subType === "ozel-dolum") {
        return fullText.includes("özel dolum") || fullText.includes("karışık") || fullText.includes("ozel");
      } else {
        const gramMatch = subType.match(/^(\d+)-gram$/);
        if (gramMatch) {
          const g = gramMatch[1];
          return [`${g} gram`, `${g} gr`, `${g}gr`, `${g}g `].some((kw) => fullText.includes(kw));
        }
      }
    }
    return false;
  }

  if (categoryId === "kamp") {
    return prodCat.startsWith("kamp");
  }

  if (categoryId === "kamp-dogal-yem") {
    return prodCat === "kamp-dogal-yem" || prodCat === "kamp-alabalik-hamuru";
  }

  if (categoryId.startsWith("kamp-")) {
    return prodCat === categoryId;
  }

  return prodCat === categoryId;
}

export function normalizeBrand(brand: string | null | undefined, productName?: string): string {
  const b = (brand || "").trim().toLowerCase();
  const n = (productName || "").trim().toLowerCase();

  // 1. Air / Air Control Extreme -> Retay
  if (b === "air" || b.startsWith("air ") || b.includes("air control") || n.includes("air control")) {
    return "Retay";
  }

  // 2. Renova -> Huğlu
  if (b.includes("renova") || n.includes("renova")) {
    return "Huğlu";
  }

  // 3. Hunt / Hunt Group -> Always Hunt Group
  if (b.includes("hunt") || n.includes("hunt group") || n.includes("huntgroup")) {
    return "Hunt Group";
  }

  // 4. Retay
  if (b.includes("retay")) return "Retay";

  // 5. Huğlu
  if (b.includes("huğlu") || b.includes("huglu")) return "Huğlu";

  // 6. Ata Arms
  if (b.includes("ata")) return "Ata Arms";

  // 7. Castello
  if (b.includes("castello")) return "Castello";

  // 8. Serengeti
  if (b.includes("serengeti")) return "Serengeti";

  // 9. Dağlıoğlu
  if (b.includes("dağlıoğlu") || b.includes("daglioglu")) return "Dağlıoğlu";

  // 10. Sarsılmaz
  if (b.includes("sarsılmaz") || b.includes("sarsilmaz")) return "Sarsılmaz";

  // 11. Mavoric
  if (b.includes("mavoric")) return "Mavoric";

  // 12. Diğer standart markalar
  if (b.includes("uzkon")) return "Uzkon";
  if (b.includes("bora")) return "Bora";
  if (b.includes("kral")) return "Kral";
  if (b.includes("winchester")) return "Winchester";
  if (b.includes("hatsan")) return "Hatsan";
  if (b.includes("girsan")) return "Girsan";
  if (b.includes("stoeger")) return "Stoeger";
  if (b.includes("franchi")) return "Franchi";
  if (b.includes("benelli")) return "Benelli";
  if (b.includes("beretta")) return "Beretta";
  if (b.includes("browning")) return "Browning";

  if (!brand) return "";
  return brand.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

interface CatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
  initialCategory?: string;
  basePath?: string;
}

export default function CatalogClient({
  initialProducts,
  categories,
  initialCategory,
  basePath,
}: CatalogClientProps) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("Products");
  const tCommon = useTranslations("Common");
  const isTr = locale === "tr";

  // Initial read from URL query params
  const categoryParam = initialCategory || searchParams.get("category") || "all";
  const brandParam = searchParams.get("brand") || "all";
  const queryParam = searchParams.get("q") || "";
  const licenseParam = searchParams.get("license") === "1";
  const dealsParam = searchParams.get("deals") === "1";
  const countParam = parseInt(searchParams.get("count") || "20", 10);

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedBrand, setSelectedBrand] = useState<string>(brandParam);
  const [searchQuery, setSearchQuery] = useState<string>(queryParam);
  const [licenseOnly, setLicenseOnly] = useState<boolean>(licenseParam);
  const [dealsOnly, setDealsOnly] = useState<boolean>(dealsParam);
  const [visibleCount, setVisibleCount] = useState<number>(isNaN(countParam) ? 20 : countParam);

  const isRestoredRef = useRef(false);
  const prevCategoryPropRef = useRef(initialCategory);

  // 1. Mount effect: ONLY restore scroll if returning from a product detail page!
  useEffect(() => {
    if (typeof window === "undefined") return;

    // If already initialized on mount and category prop hasn't changed, do not scroll
    if (isRestoredRef.current && prevCategoryPropRef.current === initialCategory) {
      return;
    }
    prevCategoryPropRef.current = initialCategory;
    isRestoredRef.current = true;

    const returnState = getReturnStateForCurrentPage();

    if (returnState && returnState.source === "catalog") {
      if (returnState.catalogCategory && !initialCategory && !searchParams.has("category")) {
        setSelectedCategory(returnState.catalogCategory);
      }
      if (returnState.catalogVisibleCount && returnState.catalogVisibleCount >= 20) {
        setVisibleCount(returnState.catalogVisibleCount);
      }

      requestAnimationFrame(() => {
        setTimeout(() => {
          restoreScrollPosition(
            returnState.scrollY,
            returnState.productId ? `product-card-${returnState.productId}` : undefined
          );
          consumeReturnState();
        }, 50);
      });
    } else {
      // Fresh intentional navigation: start cleanly at the top!
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [initialCategory]);

  // 2. PopState effect: when user clicks browser Back / Forward buttons
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category") || initialCategory || "all";
      const b = params.get("brand") || "all";
      const q = params.get("q") || "";
      const lic = params.get("license") === "1";
      const deals = params.get("deals") === "1";
      const count = parseInt(params.get("count") || "20", 10);

      setSelectedCategory(cat);
      setSelectedBrand(b);
      setSearchQuery(q);
      setLicenseOnly(lic);
      setDealsOnly(deals);
      setVisibleCount(isNaN(count) ? 20 : count);

      const returnState = getReturnStateForCurrentPage();
      if (returnState) {
        restoreScrollPosition(
          returnState.scrollY,
          returnState.productId ? `product-card-${returnState.productId}` : undefined
        );
        consumeReturnState();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [initialCategory]);

  // 2b. Sync state if searchParams changes via Next.js router navigation
  useEffect(() => {
    if (!isRestoredRef.current) return;
    const cat = searchParams.get("category") || initialCategory || "all";
    const b = searchParams.get("brand") || "all";
    const q = searchParams.get("q") || "";
    const lic = searchParams.get("license") === "1";
    const deals = searchParams.get("deals") === "1";
    const count = parseInt(searchParams.get("count") || "20", 10);

    setSelectedCategory((prev) => (prev !== cat ? cat : prev));
    setSelectedBrand((prev) => (prev !== b ? b : prev));
    setSearchQuery((prev) => (prev !== q ? q : prev));
    setLicenseOnly((prev) => (prev !== lic ? lic : prev));
    setDealsOnly((prev) => (prev !== deals ? deals : prev));
    setVisibleCount((prev) => (prev !== count ? (isNaN(count) ? 20 : count) : prev));
  }, [searchParams, initialCategory]);

  // 3. Sync state to URL whenever filters change
  useEffect(() => {
    if (!isRestoredRef.current) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();

    if (selectedCategory && selectedCategory !== "all") {
      params.set("category", selectedCategory);
    }
    if (selectedBrand && selectedBrand !== "all") {
      params.set("brand", selectedBrand);
    }
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }
    if (licenseOnly) {
      params.set("license", "1");
    }
    if (dealsOnly) {
      params.set("deals", "1");
    }
    if (visibleCount > 20) {
      params.set("count", visibleCount.toString());
    }

    const queryString = params.toString();
    const currentPath = basePath || window.location.pathname;
    const newUrl = `${currentPath}${queryString ? `?${queryString}` : ""}`;

    // Update URL via replaceState so back button returns to this exact filtered view
    window.history.replaceState(null, "", newUrl);
  }, [selectedCategory, selectedBrand, searchQuery, licenseOnly, dealsOnly, visibleCount, basePath]);

  // Calculate live product count for each category & subcategory
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    const allIds = new Set<string>();
    for (const cat of categories) {
      allIds.add(cat.id);
      if (cat.subcategories) {
        for (const sub of cat.subcategories) {
          allIds.add(sub.id);
        }
      }
    }

    allIds.forEach((id) => {
      let count = 0;
      for (const product of initialProducts) {
        if (isProductMatchingCategory(product, id)) {
          count++;
        }
      }
      counts[id] = count;
    });

    return counts;
  }, [categories, initialProducts]);

  // Calculate available brands for shotgun subcategories
  const availableBrands = useMemo(() => {
    // Sadece tüfek alt kategorileri için marka filtresi gösterelim
    if (!selectedCategory.startsWith("tufek-") || 
        selectedCategory === "tufek-aksesuar" || 
        selectedCategory === "tufek-aksesuarlar" || 
        selectedCategory === "tufek-bakim") {
      return [];
    }

    const brands = new Set<string>();
    for (const product of initialProducts) {
      if (isProductMatchingCategory(product, selectedCategory)) {
        const brand = normalizeBrand(product.brand, product.name_tr);
        if (brand) brands.add(brand);
      }
    }
    return Array.from(brands).sort();
  }, [initialProducts, selectedCategory]);

  // Real-time filtering logic
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Category filter
      if (selectedCategory !== "all" && !isProductMatchingCategory(product, selectedCategory)) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== "all") {
        if (normalizeBrand(product.brand, product.name_tr) !== selectedBrand) {
          return false;
        }
      }

      // License toggle
      if (licenseOnly && !product.requires_license) {
        return false;
      }

      // Deals toggle
      if (dealsOnly && !product.discount_percent) {
        return false;
      }

      // Search query - Fully null-safe with Turkish locale normalization
      if (searchQuery.trim() !== "") {
        const query = searchQuery.trim().toLocaleLowerCase("tr");
        const nameTr = (product.name_tr || "").toLocaleLowerCase("tr");
        const nameEn = (product.name_en || "").toLocaleLowerCase("tr");
        const descTr = (product.description_tr || "").toLocaleLowerCase("tr");
        const descEn = (product.description_en || "").toLocaleLowerCase("tr");

        const nameMatch = nameTr.includes(query) || nameEn.includes(query);
        const descMatch = descTr.includes(query) || descEn.includes(query);
        const specMatch = Object.entries(product.specs_tr || {}).some(
          ([k, v]) =>
            String(k || "").toLocaleLowerCase("tr").includes(query) ||
            String(v ?? "").toLocaleLowerCase("tr").includes(query)
        );

        if (!nameMatch && !descMatch && !specMatch) {
          return false;
        }
      }

      return true;
    });
  }, [initialProducts, selectedCategory, selectedBrand, licenseOnly, dealsOnly, searchQuery]);

  // Debounced search query analytics (1000ms debounce to prevent typing spam)
  const lastTrackedQueryRef = useRef<string>("");

  const triggerSearchAnalytics = useCallback((query: string, count: number) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed === lastTrackedQueryRef.current) return;
    if (trimmed.length < 2) return;

    lastTrackedQueryRef.current = trimmed;
    trackSearch(trimmed, count);
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2 || trimmed === lastTrackedQueryRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      triggerSearchAnalytics(trimmed, filteredProducts.length);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery, filteredProducts.length, triggerSearchAnalytics]);

  // Immediate submit on Enter or input blur
  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (trimmed && trimmed !== lastTrackedQueryRef.current) {
      lastTrackedQueryRef.current = trimmed;
      trackSearch(trimmed, filteredProducts.length);
    }
  }, [searchQuery, filteredProducts.length]);

  const handleSelectCategory = (cat: string) => {
    clearReturnState();
    setSelectedCategory(cat);
    setSelectedBrand("all"); // reset brand on category change
    setVisibleCount(20);
    trackCategoryClick(cat);
    if (typeof window !== "undefined") {
      if (window.scrollY > 280) {
        window.scrollTo({ top: 220, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  };

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div className="space-y-8">
      {/* Filter Toolbar */}
      <FilterBar
        categories={categories}
        categoryCounts={categoryCounts}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        availableBrands={availableBrands}
        selectedBrand={selectedBrand}
        onSelectBrand={setSelectedBrand}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        licenseOnly={licenseOnly}
        onToggleLicense={() => setLicenseOnly(!licenseOnly)}
        dealsOnly={dealsOnly}
        onToggleDeals={() => setDealsOnly(!dealsOnly)}
        totalCount={initialProducts.length}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 px-1 font-medium">
        <span>
          {tCommon("showingProducts", { count: filteredProducts.length })}
        </span>
      </div>

      {/* Products Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-h-[400px]">
          {visibleProducts.map((product, idx) => {
            const cat = categories.find((c) => c.id === product.category);
            return (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={isTr ? cat?.name_tr : cat?.name_en}
                priority={idx < 12}
              />
            );
          })}
        </div>

        {/* 5 Satır Sonrası Daha Fazla Göster Butonu */}
        {visibleCount < filteredProducts.length && (
          <div className="mt-14 flex flex-col items-center justify-center gap-3">
            <span className="text-xs font-bold font-mono text-neutral-500 uppercase tracking-wider">
              {isTr
                ? `${visibleProducts.length} / ${filteredProducts.length} Ürün Listeleniyor`
                : `Showing ${visibleProducts.length} of ${filteredProducts.length} Products`}
            </span>
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 20)}
              className="group inline-flex items-center gap-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-8 py-3.5 text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white shadow-lg transition-all hover:scale-105 hover:border-[#d4af37] hover:bg-neutral-100 dark:hover:bg-neutral-850 active:scale-95 cursor-pointer"
            >
              <span>{isTr ? "Daha Fazla Göster (+5 Satır)" : "Show More (+5 Rows)"}</span>
              <ChevronDown className="h-4 w-4 text-[#b45309] dark:text-[#d4af37] transition-transform duration-300 group-hover:translate-y-1" />
            </button>
          </div>
        )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-12 text-center shadow-sm">
          <AlertCircle className="h-10 w-10 text-neutral-400 dark:text-neutral-500 mb-3" />
          <h3 className="font-heading text-lg font-bold text-neutral-950 dark:text-white">
            {t("noProductsFound")}
          </h3>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 max-w-sm font-medium">
            {tCommon("resetSearchHint")}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
              setLicenseOnly(false);
              setDealsOnly(false);
            }}
            className="mt-5 rounded-xl bg-neutral-950 dark:bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm"
          >
            {tCommon("clearFilters")}
          </button>
        </div>
      )}
    </div>
  );
}
