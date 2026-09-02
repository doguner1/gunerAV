import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getAllProducts, getAllCategories } from "@/lib/products";
import CatalogClient from "@/components/catalog/CatalogClient";
import { STORE_INFO } from "@/lib/store";
import { Suspense } from "react";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isTr = locale === "tr";

  const title = isTr
    ? "Ürün Kataloğu | Malatya Av Güner Av Bayii"
    : "Product Catalog | Guner AV Hunting Dealer";
  const description = isTr
    ? "Malatya Av Güner Av Bayii ürün kataloğu. Taktik dürbünler, av tüfekleri, av ve doğa giyimi, kamp malzemeleri ve taktik bıçaklar."
    : "Guner AV official product catalog. Scopes, hunting shotguns, outdoor apparel, camping equipment, and tactical knives.";

  return {
    title,
    description,
    alternates: {
      canonical: `${STORE_INFO.siteUrl}/${locale}/products`,
      languages: {
        tr: `${STORE_INFO.siteUrl}/tr/products`,
        en: `${STORE_INFO.siteUrl}/en/products`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${STORE_INFO.siteUrl}/${locale}/products`,
      images: ["/images/og-image.jpg"],
    },
  };
}

export default async function ProductsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "CatalogPage" });
  const products = getAllProducts();
  const categories = getAllCategories();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pt-28 pb-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
            {t("tagline")}
          </span>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-5xl mt-2">
            {t("heading")}
          </h1>
          <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-400 leading-relaxed font-medium">
            {t("description")}
          </p>
        </div>

        {/* Catalog Client with Suspense for SearchParams */}
        <Suspense
          fallback={
            <div className="h-96 flex items-center justify-center text-xs text-neutral-500">
              {t("loading")}
            </div>
          }
        >
          <CatalogClient initialProducts={products} categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}
