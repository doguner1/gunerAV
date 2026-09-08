"use client";

import { Category } from "@/types/product";
import { Search, X, ShieldAlert, Tag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface FilterBarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  licenseOnly: boolean;
  onToggleLicense: () => void;
  dealsOnly: boolean;
  onToggleDeals: () => void;
  totalCount: number;
}

export default function FilterBar({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  licenseOnly,
  onToggleLicense,
  dealsOnly,
  onToggleDeals,
  totalCount,
}: FilterBarProps) {
  const locale = useLocale();
  const t = useTranslations("Products");
  const tCommon = useTranslations("Common");
  const isTr = locale === "tr";

  const hasActiveFilters =
    selectedCategory !== "all" || searchQuery !== "" || licenseOnly || dealsOnly;

  const handleReset = () => {
    onSelectCategory("all");
    onSearchChange("");
    if (licenseOnly) onToggleLicense();
    if (dealsOnly) onToggleDeals();
  };

  return (
    <div className="space-y-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm dark:shadow-xl transition-colors">
      {/* Top row: Search input & quick summary */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/90 py-2.5 pr-4 pl-10 text-sm text-neutral-950 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 transition-colors focus:border-black dark:focus:border-white focus:outline-none focus:bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action tags */}
        <div className="flex flex-wrap items-center gap-2">
          {/* License Only Toggle */}
          <button
            type="button"
            onClick={onToggleLicense}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
              licenseOnly
                ? "border-red-500/60 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400"
                : "border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{t("showOnlyLicensed")}</span>
          </button>

          {/* Deals Only Toggle */}
          <button
            type="button"
            onClick={onToggleDeals}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
              dealsOnly
                ? "border-amber-400 bg-amber-100 dark:bg-[#d4af37]/20 text-amber-900 dark:text-[#d4af37]"
                : "border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>{t("showOnlyDeals")}</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              <span>{tCommon("reset")}</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Main Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-all ${
            selectedCategory === "all"
              ? "bg-neutral-950 dark:bg-white text-white dark:text-black shadow-md"
              : "border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white"
          }`}
        >
          {t("filterAll")} ({totalCount})
        </button>

        {categories.map((cat) => {
          const isSelected =
            cat.id === "tufek"
              ? selectedCategory === "tufek" || selectedCategory.startsWith("tufek-")
              : selectedCategory === cat.id;
          const label = isTr ? cat.name_tr : cat.name_en;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-all ${
                isSelected
                  ? "bg-neutral-950 dark:bg-white text-white dark:text-black shadow-md"
                  : "border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 2. Shotgun Sub-Categories Row (Visible ONLY when Av Tüfekleri is active) */}
      {(selectedCategory === "tufek" || selectedCategory.startsWith("tufek-")) && (
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900/70 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#b45309] dark:text-[#d4af37] shrink-0 mr-1 flex items-center gap-1">
              <span>🎯</span>
              <span>{isTr ? "Tüfek Çeşidi:" : "Shotgun Type:"}</span>
            </span>

            <button
              type="button"
              onClick={() => onSelectCategory("tufek")}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === "tufek"
                  ? "bg-[#d4af37] text-black shadow-sm font-black"
                  : "border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white"
              }`}
            >
              {isTr ? "Tüm Tüfekler" : "All Shotguns"}
            </button>

            {categories
              .find((c) => c.id === "tufek")
              ?.subcategories?.map((sub) => {
                const isSubSelected = selectedCategory === sub.id;
                const subLabel = isTr ? sub.name_tr : sub.name_en;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onSelectCategory(sub.id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      isSubSelected
                        ? "bg-[#d4af37] text-black shadow-sm font-black"
                        : "border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {subLabel}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
