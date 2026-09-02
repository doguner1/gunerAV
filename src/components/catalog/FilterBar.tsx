"use client";

import { Category } from "@/types/product";
import { Search, Filter, X, ShieldAlert, Tag } from "lucide-react";
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
    <div className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
      {/* Top row: Search input & quick summary */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 py-2.5 pr-4 pl-10 text-sm text-white placeholder-neutral-500 transition-colors focus:border-white focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 hover:text-white"
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
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
              licenseOnly
                ? "border-red-500/50 bg-red-950/80 text-red-400"
                : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{t("showOnlyLicensed")}</span>
          </button>

          {/* Deals Only Toggle */}
          <button
            type="button"
            onClick={onToggleDeals}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
              dealsOnly
                ? "border-[#d4af37]/50 bg-[#d4af37]/20 text-[#d4af37]"
                : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white"
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>{t("showOnlyDeals")}</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-400 transition-colors hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              <span>Sıfırla</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            selectedCategory === "all"
              ? "bg-white text-black shadow-md"
              : "border border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          }`}
        >
          {t("filterAll")} ({totalCount})
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const label = isTr ? cat.name_tr : cat.name_en;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                isSelected
                  ? "bg-white text-black shadow-md"
                  : "border border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
