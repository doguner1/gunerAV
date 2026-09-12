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
  width: 400,
  offsetX: 0,
  offsetY: 0,
  imageHeight: 210,
  borderRadius: 24,
  bgOpacity: 80,
  padding: 16,
};

export const DEFAULT_WINDOWED_CONFIG: DesignConfig = {
  width: 400,
  offsetX: 0,
  offsetY: 0,
  imageHeight: 210,
  borderRadius: 24,
  bgOpacity: 80,
  padding: 16,
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
    <div className="w-full max-w-md sm:max-w-lg lg:max-w-[380px] xl:max-w-[400px] shrink-0 lg:self-start lg:-mt-4 xl:-mt-6 z-20">
      {/* Luxury Compact Top-Right Tactical Glass Showcase Card */}
      <div className="relative rounded-2xl border border-white/15 bg-neutral-950/85 p-3.5 sm:p-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] text-white overflow-hidden transition-all duration-300 hover:border-[#d4af37]/40 group">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

        {/* Spotlight Header Bar: Badge + Stock + Google Rating */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#d4af37]/15 border border-[#d4af37]/35 text-[#d4af37] shrink-0">
              <Crosshair className="h-3 w-3" />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-200 truncate">
              {badgeText}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9.5px] font-bold text-emerald-300 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{inStockText}</span>
            </div>
          </div>
        </div>

        {/* Versatile Product Showcase Display - Fits wide rifles, square optics, and vertical gear */}
        <Link
          href={featuredProductSlug}
          onClick={() =>
            trackEvent("click_hero_spotlight", {
              item_name: spotlightTitle,
              slug: featuredProductSlug,
              trigger: "image",
            })
          }
          className="group/img block relative my-2.5 rounded-xl bg-gradient-to-b from-white via-white to-neutral-100 border border-neutral-200/90 overflow-hidden shadow-inner transition-all duration-300 hover:scale-[1.01] h-[190px] xl:h-[205px]"
        >
          <div className="relative w-full h-full flex items-center justify-center p-2.5">
            <Image
              src={spotlightImage}
              alt={spotlightTitle}
              fill
              unoptimized={
                spotlightImage.startsWith("http") ||
                spotlightImage.startsWith("/api/img")
              }
              sizes="(max-width: 768px) 100vw, 450px"
              className="object-contain p-2.5 object-center transition-transform duration-500 group-hover/img:scale-105"
            />
          </div>

          {/* Model Name Floating Ribbon at Bottom */}
          {spotlightProduct ? (
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex items-end p-2.5 pointer-events-none rounded-b-xl">
              <div className="text-white min-w-0">
                <div className="text-[9px] font-mono font-bold tracking-widest text-[#d4af37] uppercase truncate">
                  [ + ] {featuredModelText || "SEÇKİN MODEL"}
                </div>
                <div className="text-xs font-heading font-black truncate text-white drop-shadow-sm">
                  {spotlightTitle}
                </div>
              </div>
            </div>
          ) : null}
        </Link>

        {/* Spotlight Footer & Action */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/10 gap-2">
          {/* Sınırlı Süre İndirim Rozeti */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 border border-[#d4af37]/35 text-[#d4af37] shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-amber-400/90 whitespace-nowrap">
                {discountPrefixText || "Sınırlı Süre İçin"}
              </span>
              <span className="text-[11px] font-heading font-black text-white tracking-wide whitespace-nowrap">
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-neutral-100 text-black px-3.5 py-2 text-[11px] font-black uppercase tracking-wider shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <span>{inspectText}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Sleek In-Card Google Reviews Rating Bar */}
        <a
          href={mapsUrl || "https://maps.google.com"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackMapClick("hero_spotlight_google_badge")}
          className="mt-2.5 flex items-center justify-between rounded-lg border border-white/10 bg-black/40 hover:bg-black/60 px-2.5 py-1.5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-400">
              <Star className="h-3 w-3 fill-current" />
            </div>
            <span className="text-[10.5px] font-bold text-white tracking-tight">
              5.0 Google Haritalar
            </span>
          </div>
          <span className="text-[9.5px] text-neutral-400 hover:text-neutral-200">
            12 Doğrulanmış Yorum &rarr;
          </span>
        </a>
      </div>
    </div>
  );
}
