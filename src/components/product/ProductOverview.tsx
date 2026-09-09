"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Product, ProductVariant } from "@/types/product";
import { formatPrice, generateWhatsAppLink } from "@/lib/utils";
import { STORE_INFO } from "@/lib/store";
import {
  trackProductView,
  trackVariantSelect,
  trackWhatsAppClick,
  trackPhoneClick,
} from "@/lib/analytics";
import ProductGallery from "@/components/product/ProductGallery";
import LicenseNotice from "@/components/product/LicenseNotice";
import {
  MessageCircle,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Check,
} from "lucide-react";

interface ProductOverviewProps {
  product: Product;
  locale: string;
  categoryName?: string;
}

export default function ProductOverview({
  product,
  locale,
  categoryName,
}: ProductOverviewProps) {
  const t = useTranslations("Products");
  const tCommon = useTranslations("Common");

  const isTr = locale === "tr";
  const name = isTr ? product.name_tr : product.name_en;
  const description = isTr ? product.description_tr : product.description_en;

  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  // Selected variant state
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);

  // Track product view on page load
  useEffect(() => {
    trackProductView({
      id: product.id,
      name,
      category: categoryName || product.category,
      price: product.price,
      slug: product.slug_tr || product.slug_en || product.id,
    });
  }, [product.id, name, categoryName]);

  const activeVariant: ProductVariant | undefined = hasVariants
    ? variants[selectedVariantIndex] || variants[0]
    : undefined;

  // Images to display in gallery (switch dynamically based on selected color)
  const displayImages =
    activeVariant?.images && activeVariant.images.length > 0
      ? activeVariant.images
      : product.images;

  // WhatsApp inquiry link with variant name
  const variantSuffix = activeVariant
    ? ` (${activeVariant.name || activeVariant.color_code})`
    : "";

  const waMsg = isTr
    ? `Merhaba Güner Av Bayii, ${name}${variantSuffix} ürününün fiyatını öğrenmek istiyorum.`
    : `Hello Guner AV, I would like to inquire about the price of ${name}${variantSuffix}.`;

  const waUrl = generateWhatsAppLink(STORE_INFO.whatsappNumber, waMsg);

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
      {/* Left Column: Image Gallery (re-mounts cleanly on variant change, sticky scroll on desktop) */}
      <div className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start">
        <ProductGallery
          key={activeVariant ? `${activeVariant.color_code || selectedVariantIndex}` : "base"}
          images={displayImages}
          productName={`${name}${variantSuffix}`}
        />
      </div>

      {/* Right Column: Details, Variant Selector & Actions */}
      <div className="flex flex-col justify-between space-y-6 lg:col-span-5">
        <div className="space-y-5">
          {/* Category & Stock Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {categoryName && (
              <Link
                href={`/products?category=${product.category}`}
                className="rounded-md border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1 text-xs font-bold text-neutral-800 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-700 hover:text-black dark:hover:text-white shadow-sm transition-colors"
              >
                {categoryName}
              </Link>
            )}

            {product.in_stock && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40">
                <CheckCircle2 className="h-3 w-3" />
                {tCommon("inStockAtStore")}
              </span>
            )}

            {hasVariants && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-[#d4af37]">
                <Sparkles className="h-3 w-3" />
                {variants.length} {isTr ? "Renk Seçeneği" : "Color Options"}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-heading text-2xl font-black text-neutral-950 dark:text-white sm:text-3xl leading-tight">
            {name}
          </h1>

          {/* Price section */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-950 p-4 shadow-sm">
            {!product.requires_license && product.price ? (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {tCommon("msrpTitle")}
                </span>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-heading text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white">
                    {formatPrice(product.price, locale)}
                  </span>
                  {product.discount_percent && (
                    <span className="rounded bg-amber-100 dark:bg-[#d4af37]/20 px-2 py-0.5 text-xs font-extrabold text-amber-800 dark:text-[#d4af37] border border-amber-300 dark:border-[#d4af37]/40">
                      %{product.discount_percent} {tCommon("specialOffers")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 font-medium">
                  {tCommon("msrpNotice")}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-[#d4af37]">
                  {tCommon("pricingPolicyTitle")}
                </span>
                <div className="text-lg font-bold text-neutral-950 dark:text-white">
                  {tCommon("pricingPolicyDesc")}
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                  {tCommon("pricingPolicyNotice")}
                </p>
              </div>
            )}
          </div>

          {/* COLOR / VARIANT SELECTION (If Product Has Variants) */}
          {hasVariants && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#d4af37]" />
                  {isTr ? "Renk & Kaplama Seçenekleri:" : "Color & Finish Options:"}
                </span>
                <span className="text-xs font-mono font-black text-amber-700 dark:text-[#d4af37] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {activeVariant?.name || activeVariant?.color_code}
                </span>
              </div>

              {/* Variant Chips / Cards */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
                {variants.map((v, idx) => {
                  const isSelected = selectedVariantIndex === idx;
                  const thumb = v.images[0] || product.images[0];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedVariantIndex(idx);
                        trackVariantSelect({ id: product.id, name }, v.name || v.color_code || `Variant #${idx + 1}`);
                      }}
                      className={`group relative flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#d4af37] bg-[#d4af37]/10 dark:bg-[#d4af37]/15 ring-2 ring-[#d4af37]/40 shadow-sm"
                          : "border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 hover:border-neutral-400 dark:hover:border-neutral-700 opacity-80 hover:opacity-100"
                      }`}
                      title={v.name}
                    >
                      {/* Active Checkmark Badge */}
                      {isSelected && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d4af37] text-black">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}

                      {/* Small Thumbnail */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-white border border-neutral-200 dark:border-neutral-800 mb-1.5 flex items-center justify-center">
                        <Image
                          src={thumb}
                          alt={v.name}
                          fill
                          unoptimized={true}
                          sizes="80px"
                          className="object-contain p-0.5"
                        />
                      </div>

                      {/* Label / Code */}
                      <span
                        className={`line-clamp-1 text-[11px] font-bold ${
                          isSelected
                            ? "text-neutral-950 dark:text-white"
                            : "text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {v.color_code || v.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-neutral-500 font-medium pt-1">
                {isTr
                  ? "💡 Bir renge tıkladığınızda sol taraftaki görsel ve teknik fotoğraflar o renge göre otomatik değişir."
                  : "💡 Selecting a color automatically updates the gallery and technical photos."}
              </div>
            </div>
          )}

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
            onClick={() => trackWhatsAppClick("product_detail_main", { id: product.id, name })}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-black uppercase tracking-wider text-neutral-950 shadow-xl transition-all hover:bg-[#20ba59] active:scale-98"
          >
            <MessageCircle className="h-5 w-5 fill-neutral-950 text-neutral-950" />
            <span>
              {hasVariants && activeVariant
                ? `${activeVariant.color_code || activeVariant.name} - ${t("askOnWhatsapp")}`
                : t("askOnWhatsapp")}
            </span>
          </a>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`tel:${STORE_INFO.phone}`}
              onClick={() => trackPhoneClick("product_detail_call")}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-3 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-sm"
            >
              <Phone className="h-4 w-4 text-[#b45309] dark:text-[#d4af37]" />
              <span>{tCommon("callStore")}</span>
            </a>

            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-black py-3 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-300 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white shadow-sm"
            >
              <MapPin className="h-4 w-4 text-[#b45309] dark:text-[#d4af37]" />
              <span>{tCommon("storeDirections")}</span>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-between pt-3 text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#b45309] dark:text-[#d4af37]" />
              {tCommon("genuine100")}
            </span>
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
              {tCommon("freeTechnicalGuidance")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
