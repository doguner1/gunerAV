"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Crosshair, ArrowRight, Star, Sparkles } from "lucide-react";
import { Product } from "@/types/product";
import { trackEvent, trackMapClick } from "@/lib/analytics";

export interface DesignConfig {
  width: number;
  offsetX: number;
  offsetY: number;
  imageHeight: number;
  borderRadius: number;
  bgOpacity: number;
  padding: number;
}

export const FULLSCREEN_CONFIG: DesignConfig = {
  width: 440,
  offsetX: 0,
  offsetY: 0,
  imageHeight: 240,
  borderRadius: 24,
  bgOpacity: 75,
  padding: 20,
};

export const DEFAULT_WINDOWED_CONFIG: DesignConfig = {
  width: 440,
  offsetX: 0,
  offsetY: 0,
  imageHeight: 240,
  borderRadius: 24,
  bgOpacity: 75,
  padding: 20,
};

interface HeroSpotlightStudioProps {
  spotlightProduct?: Product;
  featuredProductSlug: string;
  spotlightTitle: string;
  spotlightImage: string;
  badgeText: string;
  inStockText: string;
  featuredModelText?: string;
  discountPrefixText?: string;
  discountHighlightText?: string;
  googleBadgeTitle?: string;
  googleBadgeSubtitle?: string;
  reviewCount: number;
  mapsUrl?: string;
  inspectText: string;
}

export default function HeroSpotlightStudio({
  spotlightProduct,
  featuredProductSlug,
  spotlightTitle,
  spotlightImage,
  badgeText,
  inStockText,
  featuredModelText,
  discountPrefixText,
  discountHighlightText,
  googleBadgeTitle,
  googleBadgeSubtitle,
  reviewCount,
  mapsUrl,
  inspectText,
}: HeroSpotlightStudioProps) {
  return (
    <div className="w-full max-w-md sm:max-w-lg lg:max-w-[420px] xl:max-w-[450px] 2xl:max-w-[480px] shrink-0 lg:self-center">
      {/* Luxury Obsidian Glass Showcase Card */}
      <div className="relative rounded-3xl border border-white/15 bg-neutral-950/80 p-4 sm:p-5 xl:p-6 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.2)] text-white overflow-hidden transition-all duration-300 hover:border-white/25">
        {/* Subtle Ambient Gold Radiance */}
        <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Spotlight Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#d4af37]/15 border border-[#d4af37]/35 text-[#d4af37]">
              <Crosshair className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-200">
              {badgeText}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{inStockText}</span>
          </div>
        </div>

        {/* Hero Product Visual Display - Refined Spacious Studio Frame */}
        <Link
          href={featuredProductSlug}
          onClick={() =>
            trackEvent("click_hero_spotlight", {
              item_name: spotlightTitle,
              slug: featuredProductSlug,
              trigger: "image",
            })
          }
          className="group block relative my-3.5 rounded-2xl bg-gradient-to-b from-white via-white to-neutral-100 border border-neutral-200/80 overflow-hidden shadow-md transition-all duration-300 hover:scale-[1.01] h-[250px] xl:h-[275px]"
        >
          <div className="relative w-full h-full flex items-center justify-center p-3 sm:p-4">
            <Image
              src={spotlightImage}
              alt={spotlightTitle}
              fill
              unoptimized={
                spotlightImage.startsWith("http") ||
                spotlightImage.startsWith("/api/img")
              }
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-contain p-3 sm:p-4 object-center transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Model Name Floating Overlay at Bottom */}
          {spotlightProduct ? (
            <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-3 pointer-events-none rounded-b-2xl">
              <div className="text-white min-w-0">
                <div className="text-[9.5px] font-mono font-bold tracking-widest text-[#d4af37] uppercase truncate drop-shadow-sm">
                  [ + ] {featuredModelText || "SEÇKİN MODEL"}
                </div>
                <div className="text-xs sm:text-sm font-heading font-black truncate drop-shadow-sm text-white">
                  {spotlightTitle}
                </div>
              </div>
            </div>
          ) : null}
        </Link>

        {/* Spotlight Footer & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-2">
          {/* Sınırlı Süre İndirim Rozeti */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-[#d4af37]/35 text-[#d4af37] shrink-0">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#d4af37]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400/90 whitespace-nowrap">
                {discountPrefixText || "Sınırlı Süre İçin"}
              </span>
              <span className="text-[11px] sm:text-xs font-heading font-black text-white tracking-wide whitespace-nowrap">
                <span className="text-[#d4af37] font-black">
                  {discountHighlightText || "%10 İndirimde"}
                </span>
              </span>
            </div>
          </div>

          <Link
            href={featuredProductSlug}
            onClick={() =>
              trackEvent("click_hero_spotlight", {
                item_name: spotlightTitle,
                slug: featuredProductSlug,
                trigger: "button",
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-neutral-100 text-black px-3.5 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <span>{inspectText}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Grounded Google Haritalar Trust Pill - Doğal ve Asla Yazıları Örtmeyen Konum */}
      <a
        href={mapsUrl || "https://maps.google.com"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackMapClick("hero_spotlight_google_badge")}
        className="mt-3 flex items-center gap-3 rounded-2xl border border-white/15 bg-neutral-950/85 hover:bg-black text-white py-2.5 px-4 shadow-lg backdrop-blur-xl transition-all hover:border-[#d4af37]/50 group cursor-pointer"
      >
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 group-hover:scale-110 transition-transform shrink-0">
          <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1">
            {googleBadgeTitle || "5.0 ★ Google Haritalar"}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400 group-hover:text-neutral-300 transition-colors">
            {googleBadgeSubtitle || "Malatya'nın En Yüksek Puanlı Bayii"} ({reviewCount} Yorum)
          </span>
        </div>
      </a>
    </div>
  );
}
