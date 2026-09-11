"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { getFeaturedProducts, getAllCategories } from "@/lib/products";
import { Product } from "@/types/product";
import ProductCard from "@/components/product/ProductCard";
import { ArrowRight, ChevronDown } from "lucide-react";

const FEATURED_COUNT_KEY = "gunerav_home_featured_count";

export default function FeaturedProducts({ products = [] }: { products?: Product[] }) {
  const t = useTranslations("Products");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isTr = locale === "tr";
  const featured = getFeaturedProducts(products);
  const categories = getAllCategories();

  // 5 satır x 4 sütun = 20 ürün (Kullanıcı tıkladıkça 5 satır daha eklenir)
  const [visibleCount, setVisibleCount] = useState(20);

  // Restore visible count if returning from product detail
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const isFromProduct = sessionStorage.getItem("gunerav_from_home") === "1";
      const savedCountRaw = sessionStorage.getItem(FEATURED_COUNT_KEY);
      const savedCount = savedCountRaw ? parseInt(savedCountRaw, 10) : 20;

      if (isFromProduct && !isNaN(savedCount) && savedCount > 20) {
        setVisibleCount(savedCount);
      } else if (!isFromProduct) {
        // Fresh visit / reload: reset back to default 20
        sessionStorage.removeItem(FEATURED_COUNT_KEY);
      }
    } catch (e) {}
  }, []);

  const handleShowMore = () => {
    setVisibleCount((prev) => {
      const next = prev + 20;
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(FEATURED_COUNT_KEY, next.toString());
        } catch (e) {}
      }
      return next;
    });
  };

  const visibleProducts = featured.slice(0, visibleCount);

  return (
    <section className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-black py-20 transition-colors">
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1800px] px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
              {tCommon("catalog")}
            </span>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-4xl mt-1">
              {t("sectionTitle")}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
              {t("sectionSubtitle")}
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white shadow-sm transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <span>{t("allCatalog")}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid or Empty State */}
        {featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-12 text-center">
            <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
              {isTr
                ? "Vitrin ürünlerimiz güncelleniyor. Güncel stok ve detaylı bilgi için mağazamızı arayabilir veya WhatsApp'tan yazabilirsiniz."
                : "Showcase products are being updated. Please contact us via WhatsApp for current inventory and orders."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product, idx) => {
                const cat = categories.find((c) => c.id === product.category);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={isTr ? cat?.name_tr : cat?.name_en}
                    priority={idx < 4}
                  />
                );
              })}
            </div>

            {/* 5 Satır Sonrası Daha Fazla Göster Butonu */}
            {visibleCount < featured.length && (
              <div className="mt-14 flex flex-col items-center justify-center gap-3">
                <span className="text-xs font-bold font-mono text-neutral-500 uppercase tracking-wider">
                  {isTr
                    ? `${visibleProducts.length} / ${featured.length} Vitrin Ürünü Gösteriliyor`
                    : `Showing ${visibleProducts.length} of ${featured.length} Showcase Products`}
                </span>
                <button
                  type="button"
                  onClick={handleShowMore}
                  className="group inline-flex items-center gap-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-8 py-3.5 text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white shadow-lg transition-all hover:scale-105 hover:border-[#d4af37] hover:bg-neutral-100 dark:hover:bg-neutral-850 active:scale-95 cursor-pointer"
                >
                  <span>{isTr ? "Daha Fazla Göster (+5 Satır)" : "Show More (+5 Rows)"}</span>
                  <ChevronDown className="h-4 w-4 text-[#b45309] dark:text-[#d4af37] transition-transform duration-300 group-hover:translate-y-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
