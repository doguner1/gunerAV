"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { getAllCategories, getAllProducts } from "@/lib/products";
import { Product } from "@/types/product";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { trackCategoryClick } from "@/lib/analytics";

export default function FeaturedCategories({ products = [] }: { products?: Product[] }) {
  const t = useTranslations("Categories");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isTr = locale === "tr";
  const categories = getAllCategories();

  return (
    <section className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-950 py-20 transition-colors">
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1800px] px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
              {tCommon("collections")}
            </span>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-4xl mt-1">
              {t("sectionTitle")}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
              {t("sectionSubtitle")}
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
          >
            <span>{tCommon("allGear")}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const count = products.filter((p: Product) => {
              if (category.id === "tufek") return p.category.startsWith("tufek") || p.category === "silah-muhimmat";
              if (category.id === "muhimmat") return p.category === "muhimmat" || p.category.startsWith("muhimmat-");
              if (category.id === "bicak") return p.category === "bicak" || p.category === "aksesuar";
              return p.category === category.id;
            }).length;
            const name = isTr ? category.name_tr : category.name_en;
            const desc = isTr ? category.description_tr : category.description_en;
            const isLicenseReq = category.id === "tufek" || category.id === "silah-muhimmat" || category.id.startsWith("tufek-");

            // Category specific tag
            const badgeTag = isLicenseReq
              ? (isTr ? "RUHSATLI" : "LICENSED")
              : category.id === "muhimmat" || category.id.startsWith("muhimmat-")
              ? (isTr ? "AV FİŞEKLERİ" : "SHOTGUN AMMO")
              : category.id === "kamp"
              ? (isTr ? "DOĞA & KAMP" : "OUTDOOR")
              : category.id === "optik"
              ? (isTr ? "PRO OPTİK" : "PRECISION")
              : category.id === "bicak"
              ? (isTr ? "DÖVME ÇELİK" : "STEEL")
              : (isTr ? "TAKTİK GİYİM" : "TACTICAL");

            return (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                onClick={() => trackCategoryClick(category.id, name)}
                className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-black/60"
              >
                {/* Background Image Container */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-neutral-900">
                  <Image
                    src={category.image}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    priority={false}
                  />

                  {/* Top Subtle Vignette */}
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

                  {/* Decreasing Blur Layer (Azalan Yumuşak Cam Blurluğu) */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none backdrop-blur-[4px]"
                    style={{
                      maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0) 100%)",
                      WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0) 100%)",
                    }}
                  />

                  {/* Bottom Rich Gradient + Scrim for Typography */}
                  <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/85 via-50% to-transparent pointer-events-none" />
                </div>

                {/* Top Badges & Action */}
                <div className="absolute inset-x-0 top-0 p-4 flex items-center justify-between z-10">
                  {isLicenseReq ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/90 text-white px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-md backdrop-blur-md">
                      <ShieldAlert className="h-3.5 w-3.5 text-white animate-pulse" />
                      {badgeTag}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/90 text-white px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-md backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                      {badgeTag}
                    </span>
                  )}

                  {/* Floating Action Button */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/90 border border-white/20 backdrop-blur-md transition-all duration-300 group-hover:bg-amber-400 group-hover:text-black group-hover:border-amber-400 group-hover:scale-110 shadow-lg">
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>

                {/* Bottom Content Area */}
                <div className="absolute inset-x-0 bottom-0 p-5 z-10 flex flex-col justify-end">
                  <h3 className="font-heading text-2xl sm:text-2xl font-black uppercase tracking-tight text-white group-hover:text-amber-400 transition-colors drop-shadow-md">
                    {name}
                  </h3>

                  <p className="mt-1 text-xs sm:text-xs text-neutral-300/90 line-clamp-2 leading-relaxed font-normal">
                    {desc}
                  </p>

                  {/* Bottom Meta & Explore Bar */}
                  <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-white/15 text-xs">
                    <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {count > 0 ? `${count} ${t("itemCount")}` : (isTr ? "Koleksiyonu İncele" : "Explore")}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-200 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-md backdrop-blur-md group-hover:bg-amber-400 group-hover:text-black group-hover:border-amber-400 transition-all">
                      {t("viewCategory")} →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
