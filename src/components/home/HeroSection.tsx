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
  Headphones,
  Crosshair,
} from "lucide-react";

import StoreStatusBadge from "@/components/common/StoreStatusBadge";
import { getHeroSpotlightProduct } from "@/lib/products";
import { Product } from "@/types/product";

export default function HeroSection({ products = [] }: { products?: Product[] }) {
  const t = useTranslations("Hero");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isTr = locale === "tr";

  const spotlightProduct = getHeroSpotlightProduct(products);
  const featuredProductSlug = isTr
    ? `/products/${spotlightProduct?.slug_tr || spotlightProduct?.id || "steiner-ranger-8-3-24x56-tufek-durbunu"}`
    : `/products/${spotlightProduct?.slug_en || spotlightProduct?.id || "steiner-ranger-8-3-24x56-rifle-scope"}`;

  const spotlightTitle = (isTr ? spotlightProduct?.name_tr : spotlightProduct?.name_en) || t("spotlightTitle");
  const spotlightImage = spotlightProduct?.images?.[0] || "/images/products/optics-1.webp";

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-black pt-20 pb-16 lg:py-24">
      {/* Full-Screen Atmospheric Tactical Photography Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <Image
          src="/images/hero-bg-hd.webp"
          alt={tCommon("bgAlt")}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-100 transition-transform duration-1000"
        />
        {/* Directional Overlay: Darker on the left for crisp text legibility, transparent on right so rifle shines through */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
      </div>

      {/* Smooth bottom transition fade so there is no harsh white/black cutoff */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white dark:from-neutral-950 via-white/40 dark:via-neutral-950/40 to-transparent z-0 pointer-events-none" />

      {/* Fine Tactical Grid Overlay */}
      <div className="tactical-grid absolute inset-0 z-0 opacity-10 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT COLUMN: Clean, Restful, Uncluttered Authority & CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
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
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black px-8 py-4 text-sm font-extrabold uppercase tracking-wider shadow-[0_12px_32px_rgba(255,255,255,0.25)] transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <span>{t("catalogCta")}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
              </Link>
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
              <span className="text-white/20 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{t("afterSalesSupport")}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Authentic Apple iOS Frosted Liquid Glass Spotlight Card */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            {/* iOS Liquid Glass Container */}
            <div className="relative rounded-[32px] bg-neutral-900/40 dark:bg-black/40 backdrop-blur-3xl border border-white/25 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)] p-5 sm:p-6 pb-12 sm:pb-14 overflow-hidden text-white">
              {/* Spotlight Header Bar */}
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                    <Crosshair className="h-3.5 w-3.5 text-[#d4af37]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/90">
                    {t("spotlightBadge")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{t("spotlightInStock")}</span>
                </div>
              </div>

              {/* Hero Product Visual Display */}
              <Link
                href={featuredProductSlug}
                className="group block relative my-4 rounded-2xl bg-black/35 border border-white/20 overflow-hidden aspect-[4/3] backdrop-blur-xl shadow-inner"
              >
                <Image
                  src={spotlightImage}
                  alt={spotlightTitle}
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                {spotlightProduct ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-4">
                    <div className="text-white">
                      <div className="text-xs font-mono font-bold tracking-widest text-[#d4af37] uppercase">
                        [ + ] {t("spotlightFeaturedModel")}
                      </div>
                      <div className="text-base font-heading font-black">
                        {spotlightTitle}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                )}
              </Link>

              {/* Tactical Specs Bar (Apple Control Center Glass Tiles) */}
              <div className="grid grid-cols-3 gap-2.5 py-3 border-y border-white/15 text-center">
                <div className="rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-white/[0.14] transition-all">
                  <div className="text-[10px] uppercase font-bold text-white/70">
                    {t("spotlightMagnification")}
                  </div>
                  <div className="font-heading font-black text-sm text-white mt-0.5">
                    3x - 24x
                  </div>
                </div>
                <div className="rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-white/[0.14] transition-all">
                  <div className="text-[10px] uppercase font-bold text-white/70">
                    {t("spotlightLight")}
                  </div>
                  <div className="font-heading font-black text-sm text-emerald-300 mt-0.5">
                    %92+
                  </div>
                </div>
                <div className="rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-white/[0.14] transition-all">
                  <div className="text-[10px] uppercase font-bold text-white/70">
                    {t("spotlightDurability")}
                  </div>
                  <div className="font-heading font-black text-sm text-white mt-0.5">
                    Magnum
                  </div>
                </div>
              </div>

              {/* Spotlight Footer & Action */}
              <div className="flex items-center justify-between pt-4 gap-3">
                <div className="flex flex-col space-y-0.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-white/90 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-[#d4af37]" />
                    <span>{t("spotlightStorePickup")}</span>
                  </span>
                  <span className="text-xs font-medium text-white/70">
                    {t("spotlightReviews")}
                  </span>
                </div>

                <Link
                  href={featuredProductSlug}
                  className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-neutral-200 text-black px-5 py-3 text-xs font-black uppercase tracking-wider shadow-xl transition-all hover:scale-[1.03] active:scale-95 shrink-0"
                >
                  <span>{t("spotlightInspect")}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Floating Trust Indicator Pill on Desktop (iOS Liquid Glass) */}
            <div className="hidden sm:flex items-center gap-3 absolute -bottom-5 -left-6 rounded-2xl border border-white/25 bg-black/60 px-4 py-2.5 shadow-2xl backdrop-blur-2xl text-white shadow-[0_16px_36px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 border border-white/20 text-[#d4af37] font-bold shrink-0">
                <Star className="h-4 w-4 fill-[#d4af37]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white tracking-wide">
                  {t("ratingPillTitle")}
                </span>
                <span className="text-[11px] font-medium text-white/70">
                  {t("ratingPillSubtitle")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM COMMAND DOCK: Prestigious Google Maps Navigation & Direct Phone Call */}
        <div className="hidden sm:flex items-center justify-center pt-10 lg:pt-14">
          <div className="inline-flex items-center p-2 rounded-2xl bg-neutral-950/85 dark:bg-black/85 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] gap-3">
            {/* Konuma Git Butonu */}
            <a
              href={STORE_INFO.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3.5 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] group-hover:scale-110 transition-transform shadow-inner">
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
              className="group flex items-center gap-3.5 px-6 py-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30">
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
    </section>
  );
}
