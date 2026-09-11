import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getAllProducts, getAllCategories } from "@/lib/products";
import CatalogClient from "@/components/catalog/CatalogClient";
import { STORE_INFO } from "@/lib/store";
import { Suspense } from "react";
import { BreadcrumbListJsonLd } from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
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

export const revalidate = 3600;

export default async function ProductsPage({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "CatalogPage" });
  const tCommon = await getTranslations({ locale, namespace: "Common" });
  const products = await getAllProducts();
  const categories = getAllCategories();
  const isTr = locale === "tr";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pt-20 pb-20 transition-colors">
      <BreadcrumbListJsonLd
        items={[
          { name: tCommon("home"), url: `/${locale}` },
          { name: t("heading"), url: `/${locale}/products` },
        ]}
      />
      
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1800px] px-4 sm:px-6 lg:px-12 xl:px-16">
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

        {/* SEO Text */}
        <div className="mt-20 pt-10 border-t border-neutral-200 dark:border-neutral-900 prose prose-neutral dark:prose-invert max-w-none text-sm text-neutral-600 dark:text-neutral-400">
          <h2 className="text-xl font-bold mb-4 text-neutral-900 dark:text-white">{isTr ? "Malatya Av Malzemeleri ve Kamp Ekipmanları" : "Hunting and Camping Gear in Malatya"}</h2>
          <p className="mb-4">
            {isTr
              ? "Malatya av bayii arayışınızda Güner Av, doğa tutkunlarına ve avcılara en kaliteli ekipmanları sunmaktan gurur duyar. İster hafta sonu kampına çıkıyor olun, ister profesyonel bir av deneyimi arıyor olun, mağazamızda ihtiyacınız olan her türlü taktik dürbün, fener, av giyimi ve kamp malzemesini bulabilirsiniz. Malatya'nın doğa sporları ve avcılık potansiyelini bilen uzman ekibimiz, yerel avlaklara ve doğa şartlarına en uygun ürünleri seçmeniz için size rehberlik eder."
              : "When searching for a hunting dealer in Malatya, Guner AV is proud to offer the highest quality equipment to nature enthusiasts and hunters. Whether you're going on a weekend camping trip or looking for a professional hunting experience, you can find all kinds of tactical scopes, flashlights, hunting apparel, and camping gear in our store. Our expert team, who knows the outdoor sports and hunting potential of Malatya, will guide you to choose the most suitable products for local hunting grounds and natural conditions."}
          </p>
          <p>
            {isTr
              ? "Bölgemizdeki av tutkunlarının öncelikli tercihi olan işletmemiz, taktik giyimden güvenilir outdoor ayakkabılarına kadar geniş bir yelpazede hizmet vermektedir. Malatya'da av tüfeği ve mühimmatı gibi ruhsatlı ürünleri online mağazamızda listelemesek de, mağazamızı ziyaret ederek veya WhatsApp üzerinden bizimle iletişime geçerek detaylı bilgi alabilirsiniz. Kalite, dayanıklılık ve doğayla uyumlu ekipmanlar için Güner Av'ı tercih edin."
              : "Our business, the primary choice of hunting enthusiasts in our region, provides a wide range of services from tactical clothing to reliable outdoor shoes. Although we do not list licensed products such as hunting shotguns and ammunition in our online store in Malatya, you can get detailed information by visiting our physical store or contacting us via WhatsApp. Choose Guner AV for quality, durability, and nature-friendly equipment."}
          </p>
        </div>
      </div>
    </div>
  );
}
