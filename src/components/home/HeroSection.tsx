import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { STORE_INFO } from "@/lib/store";
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
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-black pt-20 pb-10 lg:pt-24 lg:pb-12">
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

      <div className="relative z-10 mx-auto max-w-[1600px] 2xl:max-w-[1800px] px-4 sm:px-6 lg:px-12 xl:px-16 w-full">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 xl:gap-24 items-center lg:items-start justify-between">
          {/* LEFT COLUMN: Clean, Restful, Uncluttered Authority & CTAs */}
          <div className="w-full lg:w-3/5 xl:w-1/2 space-y-6 sm:space-y-8 lg:pt-2">
            {/* Live Store Hours Status Badge */}
            <div className="flex items-center gap-2">
              <StoreStatusBadge />
            </div>

            {/* Main Headline - High contrast, powerful, balanced */}
            <div className="space-y-4">
              <h1 className="font-heading text-4xl font-black tracking-tight uppercase sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.08] drop-shadow-md">
                <span className="block text-white tracking-tight">
                  {t("titlePrefix")}
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-[#d4af37] to-amber-400 mt-1">
                  {t("titleHighlight")}
                </span>
              </h1>
              <p className="max-w-xl text-base text-neutral-200 sm:text-lg leading-relaxed font-normal drop-shadow-sm">
                {t("description")}
              </p>
            </div>

            {/* Streamlined Action CTA */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black px-7 sm:px-8 py-4 text-sm font-extrabold uppercase tracking-wider shadow-[0_12px_32px_rgba(255,255,255,0.25)] transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <span>{t("catalogCta")}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
              </Link>

              {/* PC / Masaüstü ve Tablet Yatay Modda: Sadece Mağaza Konum Butonu */}
              <a
                href={STORE_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-black/40 hover:bg-black/60 px-6 py-4 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:border-[#d4af37] hover:scale-[1.02] active:scale-95 shadow-lg"
              >
                <MapPin className="h-4 w-4 text-[#d4af37]" />
                <span>{t("storeCta")}</span>
              </a>
            </div>

            {/* Clean Authority Trust Strip */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-6 pt-2 text-xs text-neutral-300 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#d4af37] shrink-0" />
                <span className="font-semibold text-neutral-100">{t("dealerExclusive")}</span>
              </div>
              <span className="text-white/20 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#d4af37] shrink-0" />
                <span>{t("priceAndQuality")}</span>
              </div>
            </div>

            {/* TABLET DİKEY MOD: Ürünün Üstünde Yer Alan Prestijli Konum & Arama Butonları */}
            <div className="hidden sm:flex lg:hidden items-center pt-2">
              <div className="inline-flex items-center p-2 rounded-2xl bg-neutral-950/90 dark:bg-black/90 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] gap-3 w-full sm:w-auto">
                {/* Konuma Git Butonu */}
                <a
                  href={STORE_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex-1 sm:flex-initial flex items-center gap-3.5 px-5 sm:px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] group-hover:scale-110 transition-transform shadow-inner shrink-0">
                    <MapPin className="h-5 w-5 fill-[#d4af37]/30 text-[#d4af37]" />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#d4af37]">
                      {t("heroDirections")}
                    </div>
                    <div className="text-sm font-heading font-black text-white tracking-wide">
                      {t("heroDirectionsDesc")}
                    </div>
                  </div>
                </a>

                <div className="h-8 w-[1px] bg-white/15" />

                {/* Hemen Ara Butonu */}
                <a
                  href={`tel:${STORE_INFO.phoneIntl || STORE_INFO.phone}`}
                  className="group flex-1 sm:flex-initial flex items-center gap-3.5 px-5 sm:px-6 py-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30 shrink-0">
                    <PhoneCall className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                      {t("heroCall")}
                    </div>
                    <div className="text-sm font-heading font-black text-white tracking-wide">
                      {STORE_INFO.phone} · {t("directCall")}
                    </div>
                  </div>
                </a>
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
            featuredModelText={t("spotlightFeaturedModel")}
            storePickupText={t("spotlightStorePickup")}
            reviewCount={STORE_INFO.reviewCount}
            inspectText={t("spotlightInspect")}
          />
        </div>
      </div>

      {/* Progressive Dark Fade & Soft Atmospheric Blur (Fades from deep black at bottom up into crystal clear image) */}
      <div className="absolute bottom-0 inset-x-0 h-40 sm:h-52 bg-gradient-to-t from-black via-black/75 to-transparent pointer-events-none z-10" />
      <div
        className="absolute bottom-0 inset-x-0 h-28 sm:h-36 pointer-events-none z-10"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Centered Tactical Discovery Scroll Indicator */}
      <div className="hidden sm:flex absolute bottom-3 sm:bottom-5 inset-x-0 justify-center items-center z-20 pointer-events-none">
        <a
          href="#categories"
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
