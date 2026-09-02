import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { getFeaturedProducts, getAllCategories } from "@/lib/products";
import ProductCard from "@/components/product/ProductCard";
import { ArrowRight } from "lucide-react";

export default function FeaturedProducts() {
  const t = useTranslations("Products");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isTr = locale === "tr";
  const products = getFeaturedProducts();
  const categories = getAllCategories();

  return (
    <section className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-black py-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
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
      </div>
    </section>
  );
}
