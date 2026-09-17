"use client";

import { useState, useRef } from "react";
import { Category } from "@/types/product";
import { Search, X, ShieldAlert, Tag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { STORE_INFO } from "@/lib/store";

interface FilterBarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: () => void;
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
  onSearchSubmit,
  licenseOnly,
  onToggleLicense,
  dealsOnly,
  onToggleDeals,
  totalCount,
}: FilterBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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
    <div className="space-y-4 sm:space-y-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 sm:p-6 shadow-sm dark:shadow-xl transition-colors">
      {/* 1. Main Category Pills (Üstte Kategoriler) */}
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
              ? (selectedCategory === "tufek" || selectedCategory.startsWith("tufek-") || selectedCategory.startsWith("aksesuar") || selectedCategory === "aksesuar") && !selectedCategory.startsWith("havali")
              : cat.id === "havali-kurusiki"
              ? selectedCategory === "havali-kurusiki" || selectedCategory.startsWith("havali") || selectedCategory.startsWith("kurusiki")
              : cat.id === "muhimmat"
              ? selectedCategory === "muhimmat" || selectedCategory.startsWith("muhimmat-")
              : cat.id === "kamp"
              ? selectedCategory === "kamp" || selectedCategory.startsWith("kamp-")
              : cat.id === "bicak"
              ? selectedCategory === "bicak"
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


      {/* 2. Shotguns Sub-Categories Row (Visible ONLY when Av Tüfekleri is active) */}
      {(selectedCategory === "tufek" || selectedCategory.startsWith("tufek-") || selectedCategory.startsWith("aksesuar") || selectedCategory === "aksesuar") && (
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900/70 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37] shrink-0 mr-1 flex items-center gap-1">
              <span>🎯</span>
              <span>{isTr ? "Model / Tip:" : "Model / Type:"}</span>
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
                const isSubSelected =
                  selectedCategory === sub.id ||
                  (sub.id === "tufek-aksesuar" && (selectedCategory === "tufek-aksesuarlar" || selectedCategory.startsWith("aksesuar") || selectedCategory === "aksesuar"));
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

      {/* 3. Ammunition Sub-Categories Row (Visible ONLY when Mühimmat & Fişek is active) */}
      {(selectedCategory === "muhimmat" || selectedCategory.startsWith("muhimmat-")) && (
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900/70 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0 mr-1 flex items-center gap-1">
              <span>📦</span>
              <span>{isTr ? "Fişek / Gramaj:" : "Cartridge / Weight:"}</span>
            </span>

            <button
              type="button"
              onClick={() => onSelectCategory("muhimmat")}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === "muhimmat"
                  ? "bg-emerald-600 text-white shadow-sm font-black"
                  : "border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white"
              }`}
            >
              {isTr ? "Tüm Fişekler" : "All Cartridges"}
            </button>

            {categories
              .find((c) => c.id === "muhimmat")
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
                        ? "bg-emerald-600 text-white shadow-sm font-black"
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

      {/* 4. Kamp & Balık Sub-Categories Row */}
      {(selectedCategory === "kamp" || selectedCategory.startsWith("kamp-")) && (
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900/70 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 shrink-0 mr-1 flex items-center gap-1">
              <span>⛺</span>
              <span>{isTr ? "Ekipman Türü:" : "Equipment Type:"}</span>
            </span>

            <button
              type="button"
              onClick={() => onSelectCategory("kamp")}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === "kamp"
                  ? "bg-blue-600 text-white shadow-sm font-black"
                  : "border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white"
              }`}
            >
              {isTr ? "Tüm Ekipmanlar" : "All Equipment"}
            </button>

            {categories
              .find((c) => c.id === "kamp")
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
                        ? "bg-blue-600 text-white shadow-sm font-black"
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

      {/* 5. Havalı & Kurusıkı Sub-Categories Row */}
      {(selectedCategory === "havali-kurusiki" || selectedCategory.startsWith("havali") || selectedCategory.startsWith("kurusiki")) && (
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900/70 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 shrink-0 mr-1 flex items-center gap-1">
              <span>🎯</span>
              <span>{isTr ? "Silah / Mühimmat:" : "Type / Ammo:"}</span>
            </span>

            <button
              type="button"
              onClick={() => onSelectCategory("havali-kurusiki")}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === "havali-kurusiki"
                  ? "bg-amber-600 text-white shadow-sm font-black"
                  : "border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white"
              }`}
            >
              {isTr ? "Tümü" : "All"}
            </button>

            {categories
              .find((c) => c.id === "havali-kurusiki")
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
                        ? "bg-amber-600 text-white shadow-sm font-black"
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

      {/* 6. Bottom Row: Enhanced Tactical Search & Filter Controls (Artık Altta) */}
      <div className="pt-4 border-t border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search input with Tactical Radar Pulse Wave */}
        <div className="relative flex-1 group">
          {/* WhatsApp-style delicate radar wave effect around search input */}
          {!searchQuery && !isFocused && (
            <span className="pointer-events-none absolute -inset-[2px] rounded-xl border border-[#d4af37]/45 dark:border-[#d4af37]/50 animate-radar-pulse opacity-85 -z-0" />
          )}

          <div className="relative flex items-center z-10">
            {/* Tactical search icon + radar ping dot */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <Search className="h-4 w-4 text-[#d4af37] transition-transform group-hover:scale-110" />
              {!searchQuery && !isFocused && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#d4af37]"></span>
                </span>
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                onSearchSubmit?.();
              }}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSearchSubmit?.();
                }
              }}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-900/90 py-2.5 pr-20 pl-10 text-sm text-neutral-950 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 transition-all focus:border-[#d4af37] dark:focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 shadow-sm"
            />

            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  inputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-black dark:hover:text-white rounded-lg transition-colors"
                aria-label={tCommon("reset")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  inputRef.current?.focus();
                  onSearchSubmit?.();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 hover:bg-[#d4af37] hover:text-black dark:hover:bg-[#d4af37] dark:hover:text-black text-neutral-700 dark:text-neutral-300 px-2.5 py-1 text-xs font-bold transition-all shadow-xs border border-neutral-300/60 dark:border-neutral-700/60 hover:border-[#d4af37]"
              >
                <span>{isTr ? "Ara" : "Search"}</span>
                <span className="text-[10px] font-mono text-[#d4af37] group-hover:text-black">↵</span>
              </button>
            )}
          </div>
        </div>

        {/* Action tags */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* License Only Toggle */}
          <button
            type="button"
            onClick={onToggleLicense}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
              licenseOnly
                ? "border-red-500/60 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 shadow-xs"
                : "border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:border-neutral-400 dark:hover:border-neutral-700"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
            <span>{t("showOnlyLicensed")}</span>
          </button>

          {/* Deals Only Toggle */}
          {!STORE_INFO.hidePrices && (
            <button
              type="button"
              onClick={onToggleDeals}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                dealsOnly
                  ? "border-amber-400 bg-amber-100 dark:bg-[#d4af37]/20 text-amber-900 dark:text-[#d4af37] shadow-xs"
                  : "border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:border-neutral-400 dark:hover:border-neutral-700"
              }`}
            >
              <Tag className="h-3.5 w-3.5 text-amber-500" />
              <span>{t("showOnlyDeals")}</span>
            </button>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white hover:border-neutral-400 dark:hover:border-neutral-700"
            >
              <X className="h-3.5 w-3.5" />
              <span>{tCommon("reset")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
