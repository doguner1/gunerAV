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
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
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

          {/* RIGHT COLUMN: Premium Apple-grade Tactical Spotlight Card in Top-Right */}
          <div className="w-full sm:max-w-md lg:w-[400px] xl:w-[430px] 2xl:w-[450px] lg:shrink-0 lg:self-start lg:ml-auto relative mt-6 lg:-mt-10 xl:-mt-14 2xl:-mt-18 lg:-mr-4 xl:-mr-8 2xl:-mr-12">
            {/* iOS Liquid Glass Container - Sleek, tactical, prominent showcase */}
            <div className="relative rounded-2xl lg:rounded-[24px] bg-neutral-900/60 dark:bg-black/60 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.35)] p-4 sm:p-5 overflow-hidden text-white">
              {/* Spotlight Header Bar */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 backdrop-blur-md border border-white/20">
                    <Crosshair className="h-3.5 w-3.5 text-[#d4af37]" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                    {t("spotlightBadge")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{t("spotlightInStock")}</span>
                </div>
              </div>

              {/* Hero Product Visual Display - Spacious, crisp, uncompressed */}
              <Link
                href={featuredProductSlug}
                className="group block relative my-3 rounded-xl bg-black/45 border border-white/15 overflow-hidden h-52 sm:h-60 lg:h-48 xl:h-52 backdrop-blur-xl shadow-inner p-3"
              >
                <Image
                  src={spotlightImage}
                  alt={spotlightTitle}
                  fill
                  unoptimized={spotlightImage.startsWith("http") || spotlightImage.startsWith("/api/img")}
                  sizes="(max-width: 768px) 100vw, 450px"
                  className="object-contain p-2 object-center transition-transform duration-500 group-hover:scale-105"
                />
                {spotlightProduct ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-3 pointer-events-none">
                    <div className="text-white min-w-0">
                      <div className="text-[9.5px] font-mono font-bold tracking-widest text-[#d4af37] uppercase truncate">
                        [ + ] {t("spotlightFeaturedModel")}
                      </div>
                      <div className="text-sm font-heading font-black truncate">
                        {spotlightTitle}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                )}
              </Link>

              {/* Spotlight Footer & Action */}
              <div className="flex items-center justify-between pt-3 border-t border-white/15 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 text-[#d4af37] shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10.5px] uppercase tracking-wider font-bold text-white/90 truncate">
                      {t("spotlightStorePickup")}
                    </span>
                    <span className="text-[9.5px] text-white/60 truncate">
                      Google 5.0 &#9733; ({STORE_INFO.reviewCount})
                    </span>
                  </div>
                </div>

                <Link
                  href={featuredProductSlug}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-black uppercase tracking-wider shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <span>{t("spotlightInspect")}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
