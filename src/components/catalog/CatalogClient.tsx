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
  const isTr = locale === "tr";

  const categoryParam = searchParams.get("category") || "all";
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [licenseOnly, setLicenseOnly] = useState<boolean>(false);
  const [dealsOnly, setDealsOnly] = useState<boolean>(false);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Category filter
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }

      // License filter
      if (licenseOnly && !product.requires_license) {
        return false;
      }

      // Deals filter
      if (dealsOnly && (!product.discount_percent || product.discount_percent <= 0)) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const name = isTr ? product.name_tr.toLowerCase() : product.name_en.toLowerCase();
        const desc = isTr ? product.description_tr.toLowerCase() : product.description_en.toLowerCase();
        const matchesName = name.includes(q);
        const matchesDesc = desc.includes(q);
        const matchesCat = product.category.toLowerCase().includes(q);

        return matchesName || matchesDesc || matchesCat;
      }

      return true;
    });
  }, [initialProducts, selectedCategory, licenseOnly, dealsOnly, searchQuery, isTr]);

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
      <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
        <span>
          Toplam <strong className="text-white">{filteredProducts.length}</strong> ürün listeleniyor
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-neutral-500 mb-3" />
          <h3 className="font-heading text-lg font-bold text-white">
            {t("noProductsFound")}
          </h3>
          <p className="mt-1 text-xs text-neutral-400 max-w-sm">
            Farklı bir arama terimi deneyebilir veya filtreleri sıfırlayabilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
              setLicenseOnly(false);
              setDealsOnly(false);
            }}
            className="mt-5 rounded-xl bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-neutral-200"
          >
            Filtreleri Temizle
          </button>
        </div>
      )}
    </div>
  );
}
