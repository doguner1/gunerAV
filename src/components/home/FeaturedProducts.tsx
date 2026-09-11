"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { getFeaturedProducts, getAllCategories } from "@/lib/products";
import { Product } from "@/types/product";
import ProductCard from "@/components/product/ProductCard";
import { ArrowRight, ChevronDown } from "lucide-react";

const FEATURED_COUNT_KEY = "gunerav_home_featured_count";
const HOME_SCROLL_KEY = "gunerav_home_scroll";

export default function FeaturedProducts({ products = [] }: { products?: Product[] }) {
  const t = useTranslations("Products");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isTr = locale === "tr";
  const featured = getFeaturedProducts(products);
  const categories = getAllCategories();

  // 5 satır x 4 sütun = 20 ürün (Kullanıcı tıkladıkça 5 satır daha eklenir)
  const [visibleCount, setVisibleCount] = useState(20);
  const isRestoringScrollRef = useRef(false);

  // Helper to accurately restore scroll position without jumping or glitched animations
  const restoreScrollPos = useCallback((targetY: number) => {
    if (targetY <= 0) return;
    isRestoringScrollRef.current = true;

    // Immediate attempt with instant behavior to prevent smooth-scroll disorientation
    window.scrollTo({ top: targetY, behavior: "instant" });

    let attempts = 0;
    const maxAttempts = 6;
    const timer = setInterval(() => {
      attempts++;
      if (Math.abs(window.scrollY - targetY) < 20 || attempts >= maxAttempts) {
        clearInterval(timer);
        setTimeout(() => {
          isRestoringScrollRef.current = false;
        }, 120);
      } else {
        window.scrollTo({ top: targetY, behavior: "instant" });
      }
    }, 40);
  }, []);

  // 1. Mount effect: Restore visible count and scroll position if returning from product detail
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if this was a hard page reload (F5 / browser reload)
    const navEntries = performance.getEntriesByType("navigation");
    const nav = navEntries.length > 0 ? (navEntries[0] as PerformanceNavigationTiming) : undefined;
    const isReload = nav?.type === "reload";

    if (isReload) {
      // User refreshed the page: reset back to default 20 as requested ("sayfa yenilenene kadar")
      sessionStorage.removeItem(FEATURED_COUNT_KEY);
      sessionStorage.removeItem(HOME_SCROLL_KEY);
      return;
    }

    let origScrollRestoration: ScrollRestoration = "auto";

    try {
      const savedCountRaw = sessionStorage.getItem(FEATURED_COUNT_KEY);
      const savedCount = savedCountRaw ? parseInt(savedCountRaw, 10) : 20;

      if (!isNaN(savedCount) && savedCount > 20) {
        setVisibleCount(savedCount);
      }

      const savedScrollRaw = sessionStorage.getItem(HOME_SCROLL_KEY);
      const savedScroll = savedScrollRaw ? parseFloat(savedScrollRaw) : 0;

      if (!isNaN(savedScroll) && savedScroll > 0) {
        origScrollRestoration = window.history.scrollRestoration;
        window.history.scrollRestoration = "manual";

        requestAnimationFrame(() => {
          setTimeout(() => {
            restoreScrollPos(savedScroll);
          }, 60);
        });
      }
    } catch (e) {
      console.warn("Home state restore error:", e);
    }

    return () => {
      window.history.scrollRestoration = origScrollRestoration;
    };
  }, [restoreScrollPos]);

  // 2. PopState effect: when user clicks browser Back / Forward buttons
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      try {
        const savedCountRaw = sessionStorage.getItem(FEATURED_COUNT_KEY);
        const savedCount = savedCountRaw ? parseInt(savedCountRaw, 10) : 20;
        if (!isNaN(savedCount) && savedCount > 20) {
          setVisibleCount(savedCount);
        }

        const savedScrollRaw = sessionStorage.getItem(HOME_SCROLL_KEY);
        const savedScroll = savedScrollRaw ? parseFloat(savedScrollRaw) : 0;
        if (!isNaN(savedScroll) && savedScroll > 0) {
          requestAnimationFrame(() => {
            setTimeout(() => {
              restoreScrollPos(savedScroll);
            }, 60);
          });
        }
      } catch (e) {}
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [restoreScrollPos]);

  // 3. Continuous scroll tracker for home page
  useEffect(() => {
    if (typeof window === "undefined") return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      if (isRestoringScrollRef.current) return;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        try {
          if (window.scrollY > 100) {
            sessionStorage.setItem(HOME_SCROLL_KEY, window.scrollY.toString());
          }
        } catch (e) {}
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", handleScroll);
    };
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
