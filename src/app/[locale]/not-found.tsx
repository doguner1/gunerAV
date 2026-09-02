import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Crosshair, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-neutral-50 dark:bg-black px-4 pt-20 transition-colors">
      <div className="relative max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[#b45309] dark:text-[#d4af37] shadow-sm">
          <Crosshair className="h-10 w-10 animate-spin-slow" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          {t("badge")}
        </span>

        <h1 className="font-heading text-4xl font-extrabold uppercase text-neutral-950 dark:text-white sm:text-5xl mt-2">
          {t("title")}
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
          {t("description")}
        </p>
        <p className="mt-1 text-xs text-neutral-500 font-medium">
          {t("subtext")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 dark:bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("backHome")}</span>
          </Link>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-sm"
          >
            <Compass className="h-4 w-4 text-[#b45309] dark:text-[#d4af37]" />
            <span>{t("viewCatalog")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
