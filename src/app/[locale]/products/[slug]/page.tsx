import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Metadata } from "next";
import {
  fetchProductBySlug,
  getProductBySlug,
  getAllProducts,
  getCategoryById,
  getRelatedProducts,
} from "@/lib/products";
import { STORE_INFO } from "@/lib/store";
import ProductOverview from "@/components/product/ProductOverview";
import ProductCard from "@/components/product/ProductCard";
import { ProductJsonLd, BreadcrumbListJsonLd } from "@/components/seo/JsonLd";
import { ChevronRight } from "lucide-react";

export const dynamicParams = true;
export const revalidate = 30;

export async function generateStaticParams() {
  const products = await getAllProducts();
  const params: { locale: string; slug: string }[] = [];

  products.forEach((p) => {
    if (p.slug_tr) params.push({ locale: "tr", slug: p.slug_tr });
    if (p.slug_en) params.push({ locale: "en", slug: p.slug_en });
    params.push({ locale: "tr", slug: p.id });
    params.push({ locale: "en", slug: p.id });
  });

  return params;
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const product = await fetchProductBySlug(slug, locale);
  if (!product) return {};

  const isTr = locale === "tr";
  const name = isTr ? product.name_tr : product.name_en;
  const description = isTr ? product.description_tr : product.description_en;
  const title = `${name} | ${STORE_INFO.name}`;

  const category = getCategoryById(product.category);
  const categoryName = isTr ? category?.name_tr : category?.name_en;
  const brandStr = product.brand || "";

  const keywords = (isTr
    ? [brandStr, name, categoryName, "Malatya", "Malatya av bayii", "fiyatları", "özellikleri", "satın al", brandStr && `${brandStr} Malatya`, "tüfek", "fişek"].filter(Boolean)
    : [brandStr, name, categoryName, "Malatya hunting", "dealer", "price", "specs", brandStr && `${brandStr} Malatya`].filter(Boolean)) as string[];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${STORE_INFO.siteUrl}/${locale}/products/${slug}`,
      languages: {
        tr: `${STORE_INFO.siteUrl}/tr/products/${product.slug_tr || product.id}`,
        en: `${STORE_INFO.siteUrl}/en/products/${product.slug_en || product.id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${STORE_INFO.siteUrl}/${locale}/products/${slug}`,
      images: product.images[0] ? [product.images[0]] : ["/images/og-image.jpg"],
    },
  };
}

export default async function ProductDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const product = await fetchProductBySlug(slug, locale);

  if (!product) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Products" });
  const tCommon = await getTranslations({ locale, namespace: "Common" });

  const isTr = locale === "tr";
  const name = isTr ? product.name_tr : product.name_en;
  const description = isTr ? product.description_tr : product.description_en;
  const category = getCategoryById(product.category);
  const categoryName = isTr ? category?.name_tr : category?.name_en;
  const specs = isTr ? product.specs_tr : product.specs_en;
  const related = await getRelatedProducts(product.id, product.category, 3);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pt-20 pb-20 transition-colors">
      <ProductJsonLd product={product} locale={locale} />
      <BreadcrumbListJsonLd
        items={[
          { name: tCommon("home"), url: `/${locale}` },
          { name: tCommon("catalog"), url: `/${locale}/products` },
          ...(category ? [{ name: categoryName || category.id, url: `/${locale}/products?category=${category.id}` }] : []),
          { name: name, url: `/${locale}/products/${slug}` },
        ]}
      />

      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1800px] px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 font-medium flex-wrap"
        >
          <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
            {tCommon("home")}
          </Link>
          <ChevronRight className="h-3 w-3 text-neutral-400 dark:text-neutral-600" />
          <Link href="/products" className="hover:text-black dark:hover:text-white transition-colors">
            {tCommon("catalog")}
          </Link>
          {category && (
            <>
              <ChevronRight className="h-3 w-3 text-neutral-400 dark:text-neutral-600" />
              <Link
                href={`/products?category=${category.id}`}
                className="hover:text-black dark:hover:text-white transition-colors"
              >
                {categoryName}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 text-neutral-400 dark:text-neutral-600" />
          <span className="text-neutral-950 dark:text-neutral-200 line-clamp-1 font-bold">{name}</span>
        </nav>

        {/* Product Overview Grid */}
        {/* Product Overview with Dynamic Variants & Reactive Image Gallery */}
        <ProductOverview
          product={product}
          locale={locale}
          categoryName={categoryName}
        />

        {/* Technical Specs Section */}
        {specs && Object.keys(specs).length > 0 && (
          <div className="mt-16 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-8 shadow-sm dark:shadow-xl">
            <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-neutral-950 dark:text-white mb-6">
              {tCommon("technicalSpecs")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(specs)
                .filter(
                  ([key, value]) =>
                    key !== "variants" &&
                    typeof value === "string" &&
                    value.trim() !== ""
                )
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 py-3 text-xs"
                  >
                    <span className="font-bold text-neutral-600 dark:text-neutral-400">{key}</span>
                    <span className="font-semibold text-neutral-950 dark:text-white text-right">{value}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-20 border-t border-neutral-200 dark:border-neutral-900 pt-14">
            <h2 className="font-heading text-2xl font-black uppercase tracking-tight text-neutral-950 dark:text-white mb-8">
              {tCommon("relatedGear")}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  categoryName={categoryName}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
