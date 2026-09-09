"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { Product } from "@/types/product";
import { formatPrice, generateWhatsAppLink } from "@/lib/utils";
import { STORE_INFO } from "@/lib/store";
import { MessageCircle, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";
import { trackEvent, trackWhatsAppClick } from "@/lib/analytics";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  priority?: boolean;
}

export default function ProductCard({ product, categoryName, priority = false }: ProductCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const locale = useLocale();
  const t = useTranslations("Products");
  const tCommon = useTranslations("Common");

  const isTr = locale === "tr";
  const name = isTr ? product.name_tr : product.name_en;
  const description = isTr ? product.description_tr : product.description_en;
  const slug = (isTr ? product.slug_tr : product.slug_en) || product.id;

  const mainImage = product.images[0] || "/images/products/optics-1.webp";

  const waMsg = isTr
    ? `Merhaba Güner Av Bayii, ${name} ürününün fiyatını öğrenmek istiyorum.`
    : `Hello Guner AV, I would like to inquire about the price of ${name}.`;

  const waLink = generateWhatsAppLink(STORE_INFO.whatsappNumber, waMsg);

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-neutral-950 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm hover:shadow-xl">
      {/* Top Media Area */}
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white border-b border-neutral-200 dark:border-neutral-800/80">
          <Link
            href={`/products/${slug}`}
            onClick={() => trackEvent("click_product_card", { item_id: product.id, item_name: name, category: product.category })}
            className="relative block h-full w-full flex items-center justify-center"
          >
            {!isLoaded && (
              <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-900/60 animate-pulse" />
            )}
            <Image
              src={mainImage}
              alt={name}
              fill
              priority={priority}
              unoptimized={true}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onLoad={() => setIsLoaded(true)}
              className={`object-contain transition-all duration-500 group-hover:scale-105 pointer-events-none ${
                isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            />
          </Link>

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
            {/* Category / License Badge */}
            {product.requires_license ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-red-500/50 bg-red-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 backdrop-blur-md">
                <ShieldAlert className="h-3 w-3" />
                {t("licenseRequired")}
              </span>
            ) : categoryName ? (
              <span className="rounded-md border border-neutral-700 bg-neutral-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-200 backdrop-blur-md">
                {categoryName}
              </span>
            ) : null}

            {/* Discount Badge - High Contrast, Punchy & Clear */}
            {!product.requires_license && product.discount_percent ? (
              <span className="rounded-md bg-gradient-to-r from-amber-400 via-[#d4af37] to-amber-500 text-neutral-950 font-black px-2.5 py-1 text-[10px] uppercase tracking-wider shadow-md border border-amber-300">
                %{product.discount_percent} {tCommon("discount")}
              </span>
            ) : null}
          </div>

          {/* Stock Tag */}
          <div className="absolute bottom-3 left-3 pointer-events-none z-10">
            {product.in_stock && (
              <span className="inline-flex items-center gap-1 rounded bg-black/85 px-2 py-0.5 text-[10px] font-medium text-emerald-400 backdrop-blur-md border border-emerald-900/50">
                <CheckCircle2 className="h-2.5 w-2.5" />
                {t("inStock")}
              </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5">
          <Link href={`/products/${slug}`} className="group/title block">
            <h3 className="line-clamp-1 font-heading text-base font-bold text-neutral-950 dark:text-white transition-colors group-hover/title:text-amber-700 dark:group-hover/title:text-[#d4af37]">
              {name}
            </h3>
          </Link>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 font-medium">
            {description}
          </p>
        </div>
      </div>

      {/* Bottom Pricing & Actions */}
      <div className="border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50/90 dark:bg-neutral-950/80 p-5 pt-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            {product.requires_license ? tCommon("legalStatus") : tCommon("msrpShort")}
          </span>
          <div className="text-right">
            {product.requires_license ? (
              <span className="text-xs font-bold text-amber-700 dark:text-[#d4af37]">
                {t("askPrice")}
              </span>
            ) : product.price ? (
              <div className="flex flex-col items-end">
                {product.discount_percent ? (
                  <span className="text-[11px] text-neutral-400 line-through font-medium">
                    {formatPrice(Math.round(product.price * (1 + product.discount_percent / 100)), locale)}
                  </span>
                ) : null}
                <span className="font-heading text-base font-black text-neutral-950 dark:text-white">
                  {formatPrice(product.price, locale)}
                </span>
              </div>
            ) : (
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {t("askPrice")}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/products/${slug}`}
            onClick={() => trackEvent("click_product_card_details", { item_id: product.id, item_name: name })}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white"
          >
            <span>{t("details")}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick("product_card_inquire", { id: product.id, name })}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-neutral-950 dark:bg-white px-3 py-2 text-xs font-extrabold text-white dark:text-black transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 shadow-sm"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />
            <span>{tCommon("inquire")}</span>
          </a>
        </div>
      </div>
    </article>
  );
}
