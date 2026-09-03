import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { STORE_INFO } from "@/lib/store";
import { generateWhatsAppLink } from "@/lib/utils";
import {
  ArrowRight,
  ShieldCheck,
  Star,
  MessageCircle,
  MapPin,
  Compass,
  Crosshair,
  Target,
  Eye,
  Layers,
  Sparkles,
} from "lucide-react";

import { getHeroSpotlightProduct } from "@/lib/products";

export default function HeroSection() {
  const t = useTranslations("Hero");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isTr = locale === "tr";

  const waMsg = isTr
    ? "Merhaba Güner Av Bayii, web sitenizden ulaşıyorum. Güncel ürünler ve mağazanız hakkında bilgi alabilir miyim?"
    : "Hello Guner AV, I am contacting you through your website. Could I receive details about your catalog and store?";

  const waUrl = generateWhatsAppLink(STORE_INFO.whatsappNumber, waMsg);

  const spotlightProduct = getHeroSpotlightProduct();
  const featuredProductSlug = isTr
    ? `/products/${spotlightProduct?.slug_tr || spotlightProduct?.id || "steiner-ranger-8-3-24x56-tufek-durbunu"}`
    : `/products/${spotlightProduct?.slug_en || spotlightProduct?.id || "steiner-ranger-8-3-24x56-rifle-scope"}`;

  const spotlightTitle = (isTr ? spotlightProduct?.name_tr : spotlightProduct?.name_en) || t("spotlightTitle");
  const spotlightImage = spotlightProduct?.images?.[0] || "/images/products/optics-1.webp";

  const quickCategories = [
    {
      id: "silah-muhimmat",
      label: t("quickFirearms"),
      icon: Target,
      count: "12 Kalibre",
    },
    {
      id: "optik",
      label: t("quickOptics"),
      icon: Eye,
      count: "ED Cam",
    },
    {
      id: "bicak",
      label: t("quickKnives"),
      icon: Crosshair,
      count: "D2 Çelik",
    },
    {
      id: "kamp",
      label: t("quickCamping"),
      icon: Layers,
      count: "Outdoor",
    },
  ];

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100/60 dark:bg-black pt-20 pb-16 lg:py-24 transition-colors">
      {/* Dynamic Background Image & Atmosphere */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/images/hero-bg.webp"
          alt={tCommon("bgAlt")}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30 dark:opacity-50 scale-105 transition-transform duration-1000"
        />
        {/* Soft Vignette & Atmospheric Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-100 via-neutral-100/70 to-transparent dark:from-black dark:via-black/75 dark:to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 via-neutral-100/80 to-transparent dark:from-black dark:via-black/85 dark:to-transparent" />
      </div>

      {/* Ambient Lighting Orbs */}
      <div className="absolute right-0 top-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-[#d4af37]/15 dark:bg-[#d4af37]/20 blur-[130px] pointer-events-none" />
      <div className="absolute left-10 top-20 -z-10 h-80 w-80 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[100px] pointer-events-none" />

      {/* Tactical Grid Pattern Overlay */}
      <div className="tactical-grid absolute inset-0 -z-10 opacity-30 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT COLUMN: Authority, Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7">
            {/* Live Status & Authority Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/90 px-3 py-1.5 text-xs backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span>{tCommon("open")}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-extrabold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>5.0</span>
                </div>
                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-300 tracking-wide uppercase text-[11px]">
                  {t("badge")}
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="font-heading text-4xl font-black tracking-tight text-neutral-950 dark:text-white uppercase sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.06]">
                {t("titlePrefix")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-[#d4af37] to-amber-600 dark:from-amber-200 dark:via-[#d4af37] dark:to-yellow-500">
                  {t("titleHighlight")}
                </span>
              </h1>
              <p className="max-w-2xl text-base text-neutral-700 dark:text-neutral-300 sm:text-lg leading-relaxed font-normal">
                {t("description")}
              </p>
            </div>

            {/* Quick Category Jump Chips */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
                <span>{t("quickCategories")}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.id}`}
                      className="group inline-flex items-center gap-2 rounded-xl border border-neutral-300/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 px-3.5 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 backdrop-blur-md transition-all hover:border-[#d4af37] hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-black dark:hover:text-white hover:scale-[1.02] shadow-sm"
                    >
                      <Icon className="h-3.5 w-3.5 text-[#d4af37] transition-transform group-hover:scale-110" />
                      <span>{cat.label}</span>
                      <span className="rounded bg-neutral-200/70 dark:bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">
                        {cat.count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 dark:bg-white px-6 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white dark:text-black shadow-xl transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:shadow-2xl active:scale-95"
              >
                <span>{t("catalogCta")}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/90 px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-neutral-950 dark:text-white backdrop-blur-md transition-all hover:border-[#25D366] hover:bg-white dark:hover:bg-neutral-850 active:scale-95 shadow-sm"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                <span>{tCommon("whatsappInfoLine")}</span>
              </a>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white/80 dark:bg-black/60 px-4 py-3.5 text-sm font-semibold text-neutral-800 dark:text-neutral-300 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-900 shadow-sm"
              >
                <MapPin className="h-4 w-4 text-[#d4af37]" />
                <span>{t("storeCta")}</span>
              </Link>
            </div>

            {/* Trust Highlights Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-300/60 dark:border-neutral-800/80 text-xs text-neutral-800 dark:text-neutral-300 font-medium">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#d4af37]" />
                <div className="font-semibold">{t("licensedDealer")}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <Compass className="h-5 w-5 shrink-0 text-[#d4af37]" />
                <div className="font-semibold">{t("yearsExp")}</div>
              </div>
              <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
                <Star className="h-5 w-5 shrink-0 text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400" />
                <div className="font-semibold">{t("originalProducts")}</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Flagship Tactical Spotlight Card */}
          <div className="lg:col-span-5 relative">
            {/* Outer Glow Wrapper */}
            <div className="relative rounded-3xl p-1 bg-gradient-to-b from-[#d4af37]/40 via-neutral-300 dark:via-neutral-800/60 to-neutral-200 dark:to-neutral-900 shadow-2xl">
              {/* Inner Card Container */}
              <div className="relative rounded-[22px] bg-white/95 dark:bg-neutral-950/95 border border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-2xl p-5 sm:p-6 overflow-hidden">
                {/* Spotlight Header Bar */}
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-[#d4af37]" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#d4af37]">
                      {t("spotlightBadge")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t("spotlightInStock")}</span>
                  </div>
                </div>

                {/* Hero Product Visual Display */}
                <Link
                  href={featuredProductSlug}
                  className="group block relative my-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 overflow-hidden aspect-[4/3]"
                >
                  <Image
                    src={spotlightImage}
                    alt={spotlightTitle}
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Tactical Reticle Graphic Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <div className="text-white">
                      <div className="text-xs font-mono font-bold tracking-widest text-[#d4af37] uppercase">
                        [ + ] ÖNE ÇIKAN MODEL
                      </div>
                      <div className="text-base font-heading font-black">
                        {spotlightTitle}
                      </div>
                    </div>
                  </div>

                  {/* Corner Crosshair HUD Markers */}
                  <div className="absolute top-2 left-2 text-neutral-400/60 font-mono text-[10px] select-none">
                    + 3-24x56
                  </div>
                  <div className="absolute top-2 right-2 text-neutral-400/60 font-mono text-[10px] select-none">
                    ED GLASS
                  </div>
                </Link>

                {/* Tactical Specs Bar */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-200 dark:border-neutral-800/80 text-center">
                  <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900/60 p-2">
                    <div className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">
                      {t("spotlightMagnification")}
                    </div>
                    <div className="font-heading font-black text-sm text-neutral-900 dark:text-white">
                      3x - 24x
                    </div>
                  </div>
                  <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900/60 p-2">
                    <div className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">
                      {t("spotlightLight")}
                    </div>
                    <div className="font-heading font-black text-sm text-emerald-600 dark:text-emerald-400">
                      %92+
                    </div>
                  </div>
                  <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900/60 p-2">
                    <div className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">
                      {t("spotlightDurability")}
                    </div>
                    <div className="font-heading font-black text-sm text-neutral-900 dark:text-white">
                      Magnum
                    </div>
                  </div>
                </div>

                {/* Spotlight Footer & Action */}
                <div className="flex items-center justify-between pt-4 gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500 dark:text-neutral-400">
                      📍 {t("spotlightStorePickup")}
                    </span>
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t("spotlightReviews")}
                    </span>
                  </div>

                  <Link
                    href={featuredProductSlug}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#d4af37] px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-black shadow-md transition-all hover:bg-amber-400 hover:shadow-lg active:scale-95 shrink-0"
                  >
                    <span>{t("spotlightInspect")}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Floating Trust Indicator Pill on Desktop */}
            <div className="hidden sm:flex items-center gap-2.5 absolute -bottom-5 -left-5 rounded-2xl border border-neutral-300/90 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 p-3 px-4 shadow-xl backdrop-blur-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-[#d4af37] font-bold">
                <Star className="h-5 w-5 fill-[#d4af37]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-neutral-950 dark:text-white">
                  5.0 ★ Google Haritalar
                </span>
                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                  Malatya'nın En Yüksek Puanlı Bayii
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
