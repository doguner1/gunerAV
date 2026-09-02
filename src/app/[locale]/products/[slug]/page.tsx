import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import {
  getProductBySlug,
  getAllProducts,
  getCategoryById,
  getRelatedProducts,
} from "@/lib/products";
import { STORE_INFO } from "@/lib/store";
import { formatPrice, generateWhatsAppLink } from "@/lib/utils";
import ProductGallery from "@/components/product/ProductGallery";
import LicenseNotice from "@/components/product/LicenseNotice";
import ProductCard from "@/components/product/ProductCard";
import { ProductJsonLd } from "@/components/seo/JsonLd";
import {
  MessageCircle,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

export function generateStaticParams() {
  const products = getAllProducts();
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
  const product = getProductBySlug(slug);
  if (!product) return {};

  const isTr = locale === "tr";
  const name = isTr ? product.name_tr : product.name_en;
  const description = isTr ? product.description_tr : product.description_en;
  const title = `${name} | ${STORE_INFO.name}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${STORE_INFO.siteUrl}/${locale}/products/${slug}`,
      languages: {
        tr: `/tr/products/${product.slug_tr || product.id}`,
        en: `/en/products/${product.slug_en || product.id}`,
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

export default function ProductDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const isTr = locale === "tr";
  const name = isTr ? product.name_tr : product.name_en;
  const description = isTr ? product.description_tr : product.description_en;
  const category = getCategoryById(product.category);
  const categoryName = isTr ? category?.name_tr : category?.name_en;
  const specs = isTr ? product.specs_tr : product.specs_en;
  const related = getRelatedProducts(product.id, product.category, 3);

  const waMsg = isTr
    ? `Merhaba Güner Av Bayii, ${name} ürünü hakkında mağazanızdan bilgi almak istiyorum.`
    : `Hello Guner AV, I would like to inquire about the ${name}.`;

  const waUrl = generateWhatsAppLink(STORE_INFO.whatsappNumber, waMsg);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pt-28 pb-20 transition-colors">
      <ProductJsonLd product={product} locale={locale} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 font-medium flex-wrap"
        >
          <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
            Ana Sayfa
          </Link>
          <ChevronRight className="h-3 w-3 text-neutral-400 dark:text-neutral-600" />
          <Link href="/products" className="hover:text-black dark:hover:text-white transition-colors">
            Katalog
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
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery images={product.images} productName={name} />
          </div>

          {/* Right Column: Details & Actions */}
          <div className="flex flex-col justify-between space-y-6 lg:col-span-5">
            <div className="space-y-4">
              {/* Category & Stock Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {category && (
                  <Link
                    href={`/products?category=${category.id}`}
                    className="rounded-md border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1 text-xs font-bold text-neutral-800 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-700 hover:text-black dark:hover:text-white shadow-sm"
                  >
                    {categoryName}
                  </Link>
                )}

                {product.in_stock && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40">
                    <CheckCircle2 className="h-3 w-3" />
                    Mağazada Stokta
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-heading text-2xl font-black text-neutral-950 dark:text-white sm:text-3xl leading-tight">
                {name}
              </h1>

              {/* Price section */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-950 p-4 shadow-sm">
                {product.price ? (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Tavsiye Edilen Satış Fiyatı
                    </span>
                    <div className="mt-1 flex items-baseline gap-3">
                      <span className="font-heading text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white">
                        {formatPrice(product.price, locale)}
                      </span>
                      {product.discount_percent && (
                        <span className="rounded bg-amber-100 dark:bg-[#d4af37]/20 px-2 py-0.5 text-xs font-extrabold text-amber-800 dark:text-[#d4af37] border border-amber-300 dark:border-[#d4af37]/40">
                          %{product.discount_percent} Fırsat
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-500 font-medium">
                      * Fiyatlar ve stok durumu mağazamızda anlık olarak teyit edilir.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-[#d4af37]">
                      Ruhsatlı Ürün Fiyat Politikası
                    </span>
                    <div className="text-lg font-bold text-neutral-950 dark:text-white">
                      Fiyat Bilgisi İçin Mağazamızla İletişime Geçin
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                      Mevzuat gereği ateşli silah ve mühimmat fiyatları telefon veya mağaza ziyareti ile paylaşılmaktadır.
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 font-medium">
                {description}
              </p>

              {/* Mandatory License Warning when requires_license is true */}
              {product.requires_license && (
                <div className="pt-2">
                  <LicenseNotice productName={name} />
                </div>
              )}
            </div>

            {/* In-store CTAs (NO CART, NO CHECKOUT) */}
            <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-6">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-black uppercase tracking-wider text-neutral-950 shadow-xl transition-all hover:bg-[#20ba59] active:scale-98"
              >
                <MessageCircle className="h-5 w-5 fill-neutral-950 text-neutral-950" />
                <span>WhatsApp ile Bilgi Al</span>
              </a>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${STORE_INFO.phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-3 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-sm"
                >
                  <Phone className="h-4 w-4 text-[#b45309] dark:text-[#d4af37]" />
                  <span>Mağazayı Ara</span>
                </a>

                <Link
                  href="/contact"
                  className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-black py-3 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-300 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white shadow-sm"
                >
                  <MapPin className="h-4 w-4 text-[#b45309] dark:text-[#d4af37]" />
                  <span>Mağaza Konumu</span>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-between pt-3 text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#b45309] dark:text-[#d4af37]" />
                  %100 Orijinal Ürün
                </span>
                <span className="flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                  Ücretsiz Teknik Danışmanlık
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specs Section */}
        {specs && Object.keys(specs).length > 0 && (
          <div className="mt-16 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-8 shadow-sm dark:shadow-xl">
            <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-neutral-950 dark:text-white mb-6">
              Teknik Özellikler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(specs).map(([key, value]) => (
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
              Benzer Ekipmanlar
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
