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
} from "lucide-react";

export default function HeroSection() {
  const t = useTranslations("Hero");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  const waMsg =
    locale === "tr"
      ? "Merhaba Güner Av Bayii, web sitenizden ulaşıyorum. Güncel ürünler ve mağazanız hakkında bilgi alabilir miyim?"
      : "Hello Guner AV, I am contacting you through your website. Could I receive details about your catalog and store?";

  const waUrl = generateWhatsAppLink(STORE_INFO.whatsappNumber, waMsg);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-black pt-16 pb-16 transition-colors">
      {/* Background Graphic */}
      <div className="absolute inset-0 -z-10 opacity-10 dark:opacity-30">
        <Image
          src="/images/hero-bg.webp"
          alt={tCommon("bgAlt")}
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Dark vignette gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-50 via-neutral-50/70 to-transparent dark:from-black dark:via-black/70 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-50 via-neutral-50/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="tactical-grid absolute inset-0 -z-10 opacity-40 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl space-y-8">
          {/* Top Badge: Google 5.0 + Licensed Dealer */}
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-neutral-300 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 p-1.5 pr-4 text-xs backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>{tCommon("open")}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="font-bold text-neutral-900 dark:text-white">5.0</span>
            </div>
            <span className="text-neutral-400 dark:text-neutral-500">·</span>
            <span className="font-bold text-neutral-800 dark:text-neutral-300 tracking-wide uppercase text-[11px]">
              {t("badge")}
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="font-heading text-4xl font-black tracking-tight text-neutral-950 dark:text-white uppercase sm:text-6xl lg:text-7xl leading-[1.08]">
              {t("titlePrefix")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-950 via-neutral-800 to-[#b45309] dark:from-white dark:via-neutral-200 dark:to-[#d4af37]">
                {t("titleHighlight")}
              </span>
            </h1>
            <p className="max-w-2xl text-base text-neutral-700 dark:text-neutral-300 sm:text-lg leading-relaxed font-normal">
              {t("description")}
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 dark:bg-white px-7 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white dark:text-black shadow-xl transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:shadow-2xl active:scale-95"
            >
              <span>{t("catalogCta")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/90 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-neutral-950 dark:text-white backdrop-blur-md transition-all hover:border-[#25D366] hover:bg-white dark:hover:bg-neutral-850 active:scale-95 shadow-sm"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <span>{tCommon("whatsappInfoLine")}</span>
            </a>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white/80 dark:bg-black/60 px-5 py-3.5 text-sm font-semibold text-neutral-800 dark:text-neutral-300 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-900 shadow-sm"
            >
              <MapPin className="h-4 w-4 text-[#d4af37]" />
              <span>{t("storeCta")}</span>
            </Link>
          </div>

          {/* Trust Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-800/60 text-xs text-neutral-800 dark:text-neutral-300 font-medium">
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
      </div>
    </section>
  );
}
