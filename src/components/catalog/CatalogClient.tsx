"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Product, Category } from "@/types/product";
import FilterBar from "./FilterBar";
import ProductCard from "@/components/product/ProductCard";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ChevronDown } from "lucide-react";
import { trackSearch, trackCategoryClick } from "@/lib/analytics";

interface CatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export default function CatalogClient({
  initialProducts,
  categories,
}: CatalogClientProps) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("Products");
  const tCommon = useTranslations("Common");
  const isTr = locale === "tr";

  const categoryParam = searchParams.get("category") || "all";
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [licenseOnly, setLicenseOnly] = useState<boolean>(false);
  const [dealsOnly, setDealsOnly] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(20);

  useEffect(() => {
    setVisibleCount(20);
  }, [selectedCategory, searchQuery, licenseOnly, dealsOnly]);

  // Sync state if URL query param changes
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  // Real-time filtering logic
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Category filter
      const prodCat = product.category || "";
      const fullText = (
        (product.name_tr || "") + " " +
        (product.name_en || "") + " " +
        (product.description_tr || "") + " " +
        (product.slug_tr || "") + " " +
        JSON.stringify(product.specs_tr || {})
      ).toLocaleLowerCase("tr");

      const isOptic =
        prodCat === "optik" ||
        fullText.includes("dürbün") ||
        fullText.includes("durbun") ||
        fullText.includes("scope") ||
        fullText.includes("red dot") ||
        fullText.includes("reddot") ||
        fullText.includes("termal") ||
        fullText.includes("boresighter") ||
        fullText.includes("lazer") ||
        fullText.includes("laser");

      if (selectedCategory !== "all") {
        if (selectedCategory === "optik") {
          if (!isOptic && prodCat !== "optik") return false;
        } else if (selectedCategory === "tufek") {
          // Dürbünler tüfek kategorisine kesinlikle sızamaz
          if (isOptic) return false;
          const isShotgun =
            prodCat.startsWith("tufek") ||
            prodCat === "silah-muhimmat" ||
            prodCat.startsWith("aksesuar") ||
            prodCat === "aksesuar";
          if (!isShotgun) return false;
        } else if (selectedCategory === "silah-muhimmat") {
          if (isOptic) return false;
          const isFirearmOrAmmo =
            prodCat.startsWith("tufek") ||
            prodCat === "muhimmat" ||
            prodCat === "silah-muhimmat" ||
            prodCat.startsWith("aksesuar");
          if (!isFirearmOrAmmo) return false;
        } else if (selectedCategory === "bicak") {
          if (isOptic) return false;
          if (prodCat !== "bicak") return false;
        } else if (selectedCategory.startsWith("tufek-") || selectedCategory.startsWith("aksesuar") || selectedCategory === "aksesuar") {
          if (isOptic) return false;
          const isAccessory =
            selectedCategory === "tufek-aksesuar" ||
            selectedCategory === "tufek-aksesuarlar" ||
            selectedCategory.startsWith("aksesuar") ||
            selectedCategory === "aksesuar";
          const isDirectMatch = isAccessory
            ? (prodCat === "tufek-aksesuar" || prodCat === "tufek-aksesuarlar" || prodCat.startsWith("aksesuar") || prodCat === "aksesuar" || prodCat === "bicak-av")
            : prodCat === selectedCategory;

          if (isDirectMatch) {
            // Direct match
          } else if (prodCat === "silah-muhimmat" || (isAccessory && (prodCat === "tufek" || prodCat === "bicak"))) {
            // Backward compatibility matching for legacy Supabase entries
            const subType = selectedCategory.replace("tufek-", "");
            const fullText = (
              (product.name_tr || "") + " " +
              (product.description_tr || "") + " " +
              JSON.stringify(product.specs_tr || {})
            ).toLocaleLowerCase("tr");

            const matchKeywords: Record<string, string[]> = {
              "bullpup": ["bullpup"],
              "sarjorlu": ["şarjör", "sarjor", "şarjörlü", "sarjorlu"],
              "yari-otomatik": ["yarı otomatik", "yari otomatik", "otomatik av tüfeği", "gazlı", "kinetik"],
              "pompali": ["pompalı", "pompali", "pump"],
              "tek-kirma": ["tek kırma", "tek kirma", "tekkırma"],
              "superpoze": ["süperpoze", "superpoze", "poze"],
              "cifte": ["çifte", "cifte"],
              "aksesuar": ["aksesuar", "taktik aksesuar", "arpacık", "arpacik", "gepacik", "gez", "kayış", "askı", "dipçik", "kundak", "şarjör borusu", "fener ayağı", "bipod", "çatal ayak", "ray", "picatinny", "choke", "şok"],
              "aksesuarlar": ["aksesuar", "taktik aksesuar", "arpacık", "arpacik", "gepacik", "gez", "kayış", "askı", "dipçik", "kundak", "şarjör borusu", "fener ayağı", "bipod", "çatal ayak", "ray", "picatinny", "choke", "şok"],
            };

            const keywords = matchKeywords[subType] || [];
            const matches = keywords.some((kw) => fullText.includes(kw));
            if (!matches) return false;
          } else {
            return false;
          }
        } else if (selectedCategory === "muhimmat") {
          const isAmmo =
            prodCat === "muhimmat" ||
            prodCat.startsWith("muhimmat-");
          if (!isAmmo) return false;
        } else if (selectedCategory.startsWith("muhimmat-")) {
          if (prodCat === selectedCategory) {
            // Direct match
          } else if (prodCat === "muhimmat") {
            const subType = selectedCategory.replace("muhimmat-", "");
            const fullText = (
              (product.name_tr || "") + " " +
              (product.description_tr || "") + " " +
              JSON.stringify(product.specs_tr || {})
            ).toLocaleLowerCase("tr");

            if (subType === "tek-kursun") {
              if (!fullText.includes("tek kurşun") && !fullText.includes("tek kursun") && !fullText.includes("slug")) return false;
            } else if (subType === "savrotin") {
              if (!fullText.includes("şavrotin") && !fullText.includes("savrotin") && !fullText.includes("buckshot")) return false;
            } else if (subType === "trap-skeet") {
              if (!fullText.includes("trap") && !fullText.includes("skeet")) return false;
            } else if (subType === "magnum") {
              if (!fullText.includes("magnum")) return false;
            } else if (subType === "kursunsuz-celik") {
              if (!fullText.includes("çelik") && !fullText.includes("celik") && !fullText.includes("kurşunsuz")) return false;
            } else if (subType === "ozel-dolum") {
              if (!fullText.includes("özel dolum") && !fullText.includes("karışık") && !fullText.includes("ozel")) return false;
            } else {
              // Gram match (e.g. 34-gram -> 34)
              const gramMatch = subType.match(/^(\d+)-gram$/);
              if (gramMatch) {
                const g = gramMatch[1];
                const matches = [
                  `${g} gram`,
                  `${g} gr`,
                  `${g}gr`,
                  `${g}g `,
                ].some((kw) => fullText.includes(kw));
                if (!matches) return false;
              } else {
                return false;
              }
            }
          } else {
            return false;
          }
        } else if (selectedCategory === "kamp") {
          if (!prodCat.startsWith("kamp")) return false;
        } else if (selectedCategory.startsWith("kamp-")) {
          if (prodCat !== selectedCategory) return false;
        } else if (prodCat !== selectedCategory) {
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
  }, [initialProducts, selectedCategory, licenseOnly, dealsOnly, searchQuery]);

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
    setSelectedCategory(cat);
    trackCategoryClick(cat);
  };

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div className="space-y-8">
      {/* Filter Toolbar */}
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
