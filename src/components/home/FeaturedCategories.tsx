import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { getAllCategories, getProductsByCategory } from "@/lib/products";
import { ArrowUpRight, ShieldAlert } from "lucide-react";

export default function FeaturedCategories() {
  const t = useTranslations("Categories");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isTr = locale === "tr";
  const categories = getAllCategories();

  return (
    <section className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-950 py-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            const count = getProductsByCategory(category.id).length;
            const name = isTr ? category.name_tr : category.name_en;
            const desc = isTr ? category.description_tr : category.description_en;
            const isLicenseReq = category.id === "silah-muhimmat";

            return (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-neutral-400 dark:hover:border-neutral-700"
              >
                {/* Background Image with Overlay */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950">
                  <Image
                    src={category.image}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                </div>

                {/* Card Content (Always white and high-contrast inside image card) */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    {isLicenseReq ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-red-500/50 bg-red-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 backdrop-blur-md">
                        <ShieldAlert className="h-3 w-3" />
                        {tCommon("licensedCategory")}
                      </span>
                    ) : (
                      <span className="rounded-md border border-neutral-800 bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-neutral-300 backdrop-blur-md">
                        {count} {t("itemCount")}
                      </span>
                    )}

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all group-hover:bg-white group-hover:text-black">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-heading text-xl font-bold uppercase tracking-wide text-white group-hover:text-[#d4af37] transition-colors">
                      {name}
                    </h3>
                    <p className="mt-1.5 text-xs text-neutral-300 line-clamp-2">
                      {desc}
                    </p>
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
