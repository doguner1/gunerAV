import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getAllProducts, getAllCategories, getCategoryById } from "@/lib/products";
import CatalogClient from "@/components/catalog/CatalogClient";
import { STORE_INFO } from "@/lib/store";
import { Suspense } from "react";
import { BreadcrumbListJsonLd, CollectionPageJsonLd } from "@/components/seo/JsonLd";
import { notFound } from "next/navigation";

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = getAllCategories();
  const params: { locale: string; categoryId: string }[] = [];

  categories.forEach((c) => {
    params.push({ locale: "tr", categoryId: c.id });
    params.push({ locale: "en", categoryId: c.id });
  });

  return params;
}

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string; categoryId: string }>;
}): Promise<Metadata> {
  const { locale, categoryId } = await params;
  const isTr = locale === "tr";
  const category = getCategoryById(categoryId);

  if (!category) return {};

  const catName = isTr ? category.name_tr : category.name_en;
  
  const title = isTr
    ? `${catName} | Malatya Av Güner Av Bayii`
    : `${catName} | Guner AV Hunting Dealer`;
  const description = isTr
    ? `Güner Av Bayii'nde ${catName} ürünlerini inceleyin. En kaliteli ekipmanlar uygun fiyatlarla.`
    : `Browse ${catName} products at Guner AV. High-quality equipment at best prices.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${STORE_INFO.siteUrl}/${locale}/kategori/${categoryId}`,
      languages: {
        tr: `${STORE_INFO.siteUrl}/tr/kategori/${categoryId}`,
        en: `${STORE_INFO.siteUrl}/en/kategori/${categoryId}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${STORE_INFO.siteUrl}/${locale}/kategori/${categoryId}`,
      images: ["/images/og-image.jpg"],
    },
  };
}

export default async function CategoryPage({ params }: {
  params: Promise<{ locale: string; categoryId: string }>;
}) {
  const { locale, categoryId } = await params;
  setRequestLocale(locale);
  
  const category = getCategoryById(categoryId);
  if (!category) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "CatalogPage" });
  const tCommon = await getTranslations({ locale, namespace: "Common" });
  const products = await getAllProducts();
  const categories = getAllCategories();
  const isTr = locale === "tr";
  const catName = isTr ? category.name_tr : category.name_en;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pt-20 pb-20 transition-colors">
      <BreadcrumbListJsonLd
        items={[
          { name: tCommon("home"), url: `/${locale}` },
          { name: t("heading"), url: `/${locale}/products` },
          { name: catName || category.id, url: `/${locale}/kategori/${categoryId}` },
        ]}
      />
      <CollectionPageJsonLd
        name={catName || category.id}
        description={isTr ? `Güner Av Bayii'nde ${catName} ürünlerini inceleyin. En kaliteli ekipmanlar uygun fiyatlarla.` : `Browse ${catName} products at Guner AV. High-quality equipment at best prices.`}
        url={`${STORE_INFO.siteUrl}/${locale}/kategori/${categoryId}`}
      />
      
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1800px] px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Page Header */}
        <div className="mb-10 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
            {t("tagline")} - {catName}
          </span>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-5xl mt-2">
            {catName}
          </h1>
          <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-400 leading-relaxed font-medium">
            {isTr ? `${catName} kategorisindeki tüm ürünlerimiz aşağıda listelenmiştir.` : `All products in the ${catName} category are listed below.`}
          </p>
        </div>

        {/* Catalog Client */}
        <Suspense
          fallback={
            <div className="h-96 flex items-center justify-center text-xs text-neutral-500">
              {t("loading")}
            </div>
          }
        >
          <CatalogClient 
            initialProducts={products} 
            categories={categories}
            initialCategory={categoryId}
            basePath={`/${locale}/products`}
          />
        </Suspense>

      </div>
    </div>
  );
}
