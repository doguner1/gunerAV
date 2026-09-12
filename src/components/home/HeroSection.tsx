"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { STORE_INFO } from "@/lib/store";
import { trackMapClick, trackPhoneClick, trackEvent } from "@/lib/analytics";
import {
  ArrowRight,
  ShieldCheck,
  Star,
  MapPin,
  PhoneCall,
  Sparkles,
  Crosshair,
  ChevronDown,
} from "lucide-react";

import StoreStatusBadge from "@/components/common/StoreStatusBadge";
import { getHeroSpotlightProduct } from "@/lib/products";
import { clearReturnState } from "@/lib/navigation-state";
import { Product } from "@/types/product";
import HeroSpotlightStudio from "@/components/home/HeroSpotlightStudio";

export default function HeroSection({ products = [] }: { products?: Product[] }) {
  const t = useTranslations("Hero");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isTr = locale === "tr";

  const spotlightProduct = getHeroSpotlightProduct(products);
  const featuredProductSlug = isTr
    ? `/products/${spotlightProduct?.slug_tr || spotlightProduct?.id || "castello-mod-505-otomatik-av-tufegi"}`
    : `/products/${spotlightProduct?.slug_en || spotlightProduct?.id || "castello-mod-505-semi-auto-shotgun"}`;

  const spotlightTitle = (isTr ? spotlightProduct?.name_tr : spotlightProduct?.name_en) || t("spotlightTitle");
  const spotlightImage = spotlightProduct?.images?.[0] || "/images/hero-bg-hd.webp";

  const rawSpecs = (isTr ? spotlightProduct?.specs_tr : spotlightProduct?.specs_en) || spotlightProduct?.specs_tr || {};
  const dynamicSpecs = Object.entries(rawSpecs)
    .filter(([k, v]) => Boolean(v && typeof v === "string" && v.length < 40))
    .slice(0, 3);

  return (
    <section className="relative min-h-[100dvh] lg:min-h-screen flex flex-col justify-center overflow-hidden bg-black pt-20 pb-8 sm:pt-24 sm:pb-10 lg:pt-28 lg:pb-16">
      {/* Full-Screen Atmospheric Tactical Photography Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {/* Responsive Atmospheric Tactical Background (Single download matching device viewport, 1:1 Retina/OLED sharpness) */}
        <picture className="absolute inset-0 block w-full h-full">
          <source media="(max-width: 767px)" srcSet="/images/hero-bg-mobile.webp" />
          <source media="(min-width: 768px)" srcSet="/images/hero-bg-hd.webp" />
          <img
            src="/images/hero-bg-hd.webp"
            alt={tCommon("bgAlt")}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-center scale-100 transition-transform duration-1000"
          />
        </picture>

        {/* Desktop Directional Overlay: Darker on the left for crisp text legibility, transparent on right */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
        <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

        {/* Mobile Directional Overlay: Cinematic vertical vignette preserving weapon details and text contrast */}
        <div className="block md:hidden absolute inset-0 bg-gradient-to-b from-black/85 via-black/45 to-black/90" />
      </div>

      {/* Fine Tactical Grid Overlay */}
      <div className="tactical-grid absolute inset-0 z-0 opacity-10 pointer-events-none" />

      <div className="relative z-20 mx-auto max-w-[1640px] xl:max-w-[1740px] 2xl:max-w-[1880px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 w-full">
        <div className="flex flex-col lg:flex-row gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-center lg:items-start justify-between">
          {/* LEFT COLUMN: Clean, Restful, Uncluttered Authority & CTAs */}
          <div className="w-full max-w-2xl lg:max-w-none lg:w-3/5 xl:w-[54%] space-y-4 sm:space-y-5 lg:space-y-6 lg:pt-2 xl:pt-4">
            {/* Live Store Hours Status Badge */}
            <div className="flex items-center gap-2">
              <StoreStatusBadge />
            </div>

            {/* Main Headline - High contrast, powerful, balanced */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="font-heading text-3xl sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black tracking-tight uppercase leading-[1.1] drop-shadow-md">
                <span className="block text-white tracking-tight">
                  {t("titlePrefix")}
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-[#d4af37] to-amber-400 mt-1">
                  {t("titleHighlight")}
                </span>
              </h1>
              <p className="max-w-xl text-sm sm:text-base xl:text-lg text-neutral-200 leading-relaxed font-normal drop-shadow-sm">
                {t("description")}
              </p>
            </div>

            {/* Streamlined Action CTA */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-3.5 pt-0.5">
              <Link
                href="/products"
                onClick={() => clearReturnState()}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-[0_12px_32px_rgba(255,255,255,0.25)] transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <span>{t("catalogCta")}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
              </Link>

              {/* Mağaza Konum Butonu (Tüm Cihazlarda Şık & Uyumlu) */}
              <a
                href={STORE_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackMapClick("hero_desktop_maps")}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-black/40 hover:bg-black/60 px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:border-[#d4af37] hover:scale-[1.02] active:scale-95 shadow-lg"
              >
                <MapPin className="h-4 w-4 text-[#d4af37]" />
                <span>{t("storeCta")}</span>
              </a>

              {/* Hemen Ara Butonu (Tablet ve Mobilde Doğrudan İletişim) */}
              <a
                href={`tel:${STORE_INFO.phoneIntl || STORE_INFO.phone}`}
                onClick={() => trackPhoneClick("hero_tablet_call")}
                className="inline-flex lg:hidden items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md transition-all hover:border-emerald-400 hover:scale-[1.02] active:scale-95 shadow-lg"
              >
                <PhoneCall className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span>{t("heroCall")}</span>
              </a>
            </div>

            {/* Clean Authority Trust Strip - Prestijli, Kristal Netliğinde ve Yüksek Kontrastlı Rozet */}
            <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/20 bg-neutral-950/85 sm:bg-black/70 px-4 py-2.5 backdrop-blur-xl shadow-[0_8px_25px_rgba(0,0,0,0.6)] transition-all">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#d4af37]/25 border border-[#d4af37]/50 text-[#d4af37] shrink-0 shadow-inner">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#d4af37]" />
                </div>
                <span className="font-extrabold text-white text-xs sm:text-[13px] tracking-wide whitespace-nowrap">
                  {t("dealerExclusive")}
                </span>
              </div>
              <span className="text-amber-400/40 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/25 border border-amber-500/50 text-amber-300 shrink-0 shadow-inner">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                </div>
                <span className="font-bold text-amber-200 text-xs sm:text-[13px] tracking-wide whitespace-nowrap">
                  {t("priceAndQuality")}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Hero Spotlight with Live Design Studio */}
          <HeroSpotlightStudio
            spotlightProduct={spotlightProduct}
            featuredProductSlug={featuredProductSlug}
            spotlightTitle={spotlightTitle}
            spotlightImage={spotlightImage}
            badgeText={t("spotlightBadge")}
            inStockText={t("spotlightInStock")}
            discountPrefixText={t("spotlightDiscountPrefix")}
            discountHighlightText={t("spotlightDiscountHighlight")}
            googleBadgeTitle={t("googleMapsBadgeTitle")}
            googleBadgeSubtitle={t("googleMapsBadgeSubtitle")}
            reviewCount={STORE_INFO.reviewCount}
            mapsUrl={STORE_INFO.mapsUrl}
            inspectText={t("spotlightInspect")}
          />
        </div>
      </div>

      {/* Progressive Dark Fade & Soft Atmospheric Blur (Only for desktop screens behind content) */}
      <div className="hidden sm:block absolute bottom-0 inset-x-0 h-24 sm:h-28 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none z-0" />
      <div
        className="hidden sm:block absolute bottom-0 inset-x-0 h-16 sm:h-20 pointer-events-none z-0"
        style={{
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Centered Tactical Discovery Scroll Indicator */}
      <div className="hidden sm:flex absolute bottom-2 sm:bottom-3.5 inset-x-0 justify-center items-center z-20 pointer-events-none">
        <a
          href="#categories"
          onClick={() => trackEvent("click_start_hunting_arrow")}
          className="group pointer-events-auto flex flex-col items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer select-none"
          aria-label={t("startHunting")}
        >
          {/* Subtle tactical line & text badge */}
          <div className="flex items-center gap-2">
            <span className="h-[1px] w-6 sm:w-10 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-[#d4af37]" />
            <span className="text-[10px] sm:text-[11px] font-heading font-black uppercase tracking-[0.25em] text-neutral-300 group-hover:text-[#d4af37] transition-colors drop-shadow-md">
              {t("startHunting")}
            </span>
            <span className="h-[1px] w-6 sm:w-10 bg-gradient-to-l from-transparent via-[#d4af37]/60 to-[#d4af37]" />
          </div>

          {/* Glowing Animated Arrow Pill */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950/70 border border-white/15 backdrop-blur-md text-[#d4af37] shadow-[0_4px_20px_rgba(0,0,0,0.6)] group-hover:border-[#d4af37]/70 group-hover:bg-[#d4af37]/20 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all">
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </div>
        </a>
      </div>
    </section>
  );
}
