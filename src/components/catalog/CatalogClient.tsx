"use client";

import { useState, useMemo, useEffect } from "react";
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
      if (selectedCategory !== "all") {
        if (selectedCategory === "tufek") {
          const isShotgun =
            product.category.startsWith("tufek") ||
            product.category === "silah-muhimmat";
          if (!isShotgun) return false;
        } else if (selectedCategory === "silah-muhimmat") {
          const isFirearmOrAmmo =
            product.category.startsWith("tufek") ||
            product.category === "muhimmat" ||
            product.category === "silah-muhimmat";
          if (!isFirearmOrAmmo) return false;
        } else if (selectedCategory === "bicak" || selectedCategory === "aksesuar") {
          if (product.category !== "bicak" && product.category !== "aksesuar") return false;
        } else if (selectedCategory.startsWith("tufek-")) {
          if (product.category === selectedCategory) {
            // Direct match
          } else if (product.category === "silah-muhimmat") {
            // Backward compatibility matching for legacy Supabase entries
            const subType = selectedCategory.replace("tufek-", "");
            const fullText = (
              (product.name_tr || "") + " " +
              (product.description_tr || "") + " " +
              JSON.stringify(product.specs_tr || {})
            ).toLowerCase();

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
            const matches = keywords.some((kw) => fullText.includes(kw));
            if (!matches) return false;
          } else {
            return false;
          }
        } else if (selectedCategory === "muhimmat") {
          const isAmmo =
            product.category === "muhimmat" ||
            product.category.startsWith("muhimmat-");
          if (!isAmmo) return false;
        } else if (selectedCategory.startsWith("muhimmat-")) {
          if (product.category === selectedCategory) {
            // Direct match
          } else if (product.category === "muhimmat") {
            const subType = selectedCategory.replace("muhimmat-", "");
            const fullText = (
              (product.name_tr || "") + " " +
              (product.description_tr || "") + " " +
              JSON.stringify(product.specs_tr || {})
            ).toLowerCase();

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
          if (!product.category.startsWith("kamp")) return false;
        } else if (selectedCategory.startsWith("kamp-")) {
          if (product.category !== selectedCategory) return false;
        } else if (product.category !== selectedCategory) {
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

      // Search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const nameMatch =
          product.name_tr.toLowerCase().includes(query) ||
          product.name_en.toLowerCase().includes(query);
        const descMatch =
          product.description_tr.toLowerCase().includes(query) ||
          product.description_en.toLowerCase().includes(query);
        const specMatch = Object.entries(product.specs_tr || {}).some(
          ([k, v]) =>
            k.toLowerCase().includes(query) || (v ? v.toLowerCase().includes(query) : false)
        );

        if (!nameMatch && !descMatch && !specMatch) {
          return false;
        }
      }

      return true;
    });
  }, [initialProducts, selectedCategory, licenseOnly, dealsOnly, searchQuery]);

  // Debounced search query analytics
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(() => {
      trackSearch(searchQuery, filteredProducts.length);
    }, 600);
    return () => clearTimeout(timer);
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
