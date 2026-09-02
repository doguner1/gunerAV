"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Product, Category } from "@/types/product";
import FilterBar from "./FilterBar";
import ProductCard from "@/components/product/ProductCard";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";

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
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
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

  return (
    <div className="space-y-8">
      {/* Filter Toolbar */}
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const cat = categories.find((c) => c.id === product.category);
            return (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={isTr ? cat?.name_tr : cat?.name_en}
              />
            );
          })}
        </div>
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
