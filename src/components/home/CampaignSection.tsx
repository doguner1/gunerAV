"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getDealsProducts, getAllCategories } from "@/lib/products";
import { Product } from "@/types/product";
import ProductCard from "@/components/product/ProductCard";
import { Sparkles, ChevronDown } from "lucide-react";

export default function CampaignSection({ products = [] }: { products?: Product[] }) {
  const t = useTranslations("Products");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isTr = locale === "tr";
  const deals = getDealsProducts(products);
  const categories = getAllCategories();

  // 5 satır x 4 sütun = 20 ürün (Kullanıcı tıkladıkça 5 satır daha eklenir)
  const [visibleCount, setVisibleCount] = useState(20);
  const visibleDeals = deals.slice(0, visibleCount);

  if (deals.length === 0) return null;

  return (
    <section className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-gradient-to-b from-neutral-100/60 via-white to-neutral-100/60 dark:from-neutral-950 dark:via-black dark:to-neutral-950 py-20 transition-colors">
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1800px] px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300 dark:border-[#d4af37]/30 bg-amber-50 dark:bg-[#d4af37]/10 px-3 py-1 text-xs font-bold text-amber-800 dark:text-[#d4af37] uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{tCommon("specialOffers")}</span>
            </div>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
              {t("dealsTitle")}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
              {t("dealsSubtitle")}
            </p>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleDeals.map((product) => {
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

        {/* 5 Satır Sonrası Daha Fazla Göster Butonu */}
        {visibleCount < deals.length && (
          <div className="mt-14 flex flex-col items-center justify-center gap-3">
            <span className="text-xs font-bold font-mono text-neutral-500 uppercase tracking-wider">
              {isTr
                ? `${visibleDeals.length} / ${deals.length} Kampanyalı Ürün Gösteriliyor`
                : `Showing ${visibleDeals.length} of ${deals.length} Discounted Products`}
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
      </div>
    </section>
  );
}
