"use client";

import { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "@/components/common/ThemeToggle";
import { STORE_INFO } from "@/lib/store";
import { Menu, X, Phone, ChevronDown, ChevronRight } from "lucide-react";
import { getAllCategories } from "@/lib/products";

export default function Header() {
  const t = useTranslations("Navigation");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isTr = locale === "tr";
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileTufekOpen, setMobileTufekOpen] = useState(false);
  const categories = getAllCategories();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setCategoriesOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/products", label: t("catalog") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  const isHome = pathname === "/" || pathname === "/tr" || pathname === "/en" || pathname === "";
  const isHeroOverlay = !scrolled && isHome;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isHeroOverlay
            ? "bg-black/30 backdrop-blur-xl border-b border-white/10 text-white"
            : scrolled
            ? "bg-white/95 dark:bg-neutral-950/95 shadow-lg shadow-black/5 dark:shadow-black/30 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800"
            : "bg-white/80 dark:bg-neutral-950/70 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800/60"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5 shrink-0">
            <div className="flex flex-col">
              <span className={`font-heading text-lg font-black tracking-wider uppercase sm:text-xl ${
                isHeroOverlay ? "text-white" : "text-neutral-950 dark:text-white"
              }`}>
                GÜNER <span className="text-[#d4af37]">AV</span>
              </span>
              <span className={`text-[9px] font-semibold tracking-[0.2em] uppercase ${
                isHeroOverlay ? "text-neutral-300" : "text-neutral-400 dark:text-neutral-500"
              }`}>
                MALATYA · AV &amp; OUTDOOR
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center lg:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-[13px] transition-colors ${
                    isActive
                      ? isHeroOverlay
                        ? "text-white font-bold"
                        : "text-neutral-950 dark:text-white font-bold"
                      : isHeroOverlay
                      ? "text-neutral-200 hover:text-white font-medium"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white font-medium"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Categories Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className={`flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  isHeroOverlay
                    ? "text-neutral-200 hover:text-white"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
                }`}
              >
                <span>{t("categories")}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
              </button>

              {categoriesOpen && (
                <div
                  onMouseLeave={() => setCategoriesOpen(false)}
                  className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-1.5 shadow-xl"
                >
                  {categories.map((cat) => {
                    const categoryName = isTr ? cat.name_tr : cat.name_en;
                    const isLicensed = cat.id === "tufek" || cat.id.startsWith("tufek-") || cat.id === "muhimmat" || cat.id === "silah-muhimmat";

                    if (cat.subcategories && cat.subcategories.length > 0) {
                      return (
                        <div key={cat.id} className="relative group/sub">
                          <Link
                            href={`/products?category=${cat.id}`}
                            onClick={() => setCategoriesOpen(false)}
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>{categoryName}</span>
                              <ChevronRight className="h-3 w-3 text-neutral-400 group-hover/sub:text-[#d4af37] transition-transform group-hover/sub:translate-x-0.5" />
                            </span>
                            {isLicensed && (
                              <span className="rounded bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">
                                {tCommon("licensed")}
                              </span>
                            )}
                          </Link>

                          {/* Flyout Submenu to the right */}
                          <div className="invisible opacity-0 group-hover/sub:visible group-hover/sub:opacity-100 transition-all duration-150 absolute left-full top-0 ml-1 w-44 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-1.5 shadow-xl z-50">
                            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800/60 mb-1">
                              {isTr ? "Tüfek Çeşitleri" : "Shotgun Types"}
                            </div>
                            <Link
                              href={`/products?category=${cat.id}`}
                              onClick={() => setCategoriesOpen(false)}
                              className="block rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-[#d4af37]"
                            >
                              {isTr ? "Tüm Tüfekler" : "All Shotguns"}
                            </Link>
                            {cat.subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/products?category=${sub.id}`}
                                onClick={() => setCategoriesOpen(false)}
                                className="block rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white"
                              >
                                {isTr ? sub.name_tr : sub.name_en}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.id}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white"
                      >
                        <span>{categoryName}</span>
                        {isLicensed && (
                          <span className="rounded bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">
                            {tCommon("licensed")}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Items */}
          <div className="hidden items-center gap-2 lg:flex">
            {/* Phone */}
            <a
              href={`tel:${STORE_INFO.phone}`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                isHeroOverlay
                  ? "text-neutral-200 hover:text-white"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
              }`}
              aria-label={STORE_INFO.phone}
            >
              <Phone className="h-3.5 w-3.5 text-[#d4af37]" />
              <span className="hidden xl:inline">{STORE_INFO.phone}</span>
            </a>

            <div className={`h-4 w-px ${isHeroOverlay ? "bg-white/20" : "bg-neutral-200 dark:bg-neutral-800"}`} />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <ThemeToggle />

            <div className={`h-4 w-px ${isHeroOverlay ? "bg-white/20" : "bg-neutral-200 dark:bg-neutral-800"}`} />

            {/* CTA */}
            <Link
              href="/products"
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                isHeroOverlay
                  ? "bg-white hover:bg-neutral-200 text-black shadow-lg"
                  : "bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-700 dark:hover:bg-neutral-200"
              }`}
            >
              {t("viewCatalog")}
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <a
              href={`tel:${STORE_INFO.phone}`}
              className={`rounded-lg p-2 ${
                isHeroOverlay ? "text-white" : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
              }`}
              aria-label={STORE_INFO.phone}
            >
              <Phone className="h-5 w-5" />
            </a>
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`rounded-lg p-2 focus:outline-none ${
                isHeroOverlay ? "text-white hover:bg-white/10" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              }`}
              aria-label={tCommon("toggleMenu")}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed top-16 right-0 bottom-0 w-full max-w-xs border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl overflow-y-auto">
            <div className="flex flex-col p-5 gap-5">
              {/* Phone quick bar */}
              <a
                href={`tel:${STORE_INFO.phone}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 p-3 text-sm font-bold text-neutral-950 dark:text-white"
              >
                <Phone className="h-4 w-4 text-[#d4af37]" />
                <span>{STORE_INFO.phone}</span>
              </a>

              {/* Navigation Links */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-3 pb-1">
                  {tCommon("menu")}
                </span>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      pathname === link.href
                        ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-950 dark:text-white font-bold"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white font-medium"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Categories list in mobile */}
              <div className="flex flex-col gap-0.5 border-t border-neutral-100 dark:border-neutral-800/60 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-3 pb-1">
                  {t("categories")}
                </span>
                {categories.map((cat) => {
                  const categoryName = isTr ? cat.name_tr : cat.name_en;
                  const isLicensed = cat.id === "tufek" || cat.id.startsWith("tufek-") || cat.id === "muhimmat" || cat.id === "silah-muhimmat";

                  if (cat.subcategories && cat.subcategories.length > 0) {
                    return (
                      <div key={cat.id} className="flex flex-col">
                        <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white">
                          <Link
                            href={`/products?category=${cat.id}`}
                            className="flex-1 flex items-center justify-between"
                          >
                            <span>{categoryName}</span>
                            {isLicensed && (
                              <span className="rounded bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">
                                {tCommon("licensed")}
                              </span>
                            )}
                          </Link>
                          <button
                            type="button"
                            onClick={() => setMobileTufekOpen(!mobileTufekOpen)}
                            className="p-1 text-neutral-400 hover:text-white ml-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800"
                            aria-label="Alt kategorileri aç/kapat"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${mobileTufekOpen ? "rotate-180" : ""}`} />
                          </button>
                        </div>

                        {mobileTufekOpen && (
                          <div className="ml-4 pl-2 border-l border-neutral-200 dark:border-neutral-800 flex flex-col gap-1 my-1 animate-in fade-in duration-150">
                            <Link
                              href={`/products?category=${cat.id}`}
                              className="px-2.5 py-1 text-xs font-bold text-neutral-900 dark:text-white hover:text-[#d4af37]"
                            >
                              {isTr ? "• Tüm Tüfekler" : "• All Shotguns"}
                            </Link>
                            {cat.subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/products?category=${sub.id}`}
                                className="px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
                              >
                                {isTr ? `• ${sub.name_tr}` : `• ${sub.name_en}`}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.id}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white"
                    >
                      <span>{categoryName}</span>
                      {isLicensed && (
                        <span className="rounded bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">
                          {tCommon("licensed")}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* CTA */}
              <Link
                href="/products"
                className="rounded-xl bg-neutral-900 dark:bg-white p-3 text-center text-sm font-bold uppercase tracking-wider text-white dark:text-black"
              >
                {t("viewCatalog")}
              </Link>

              {/* Store info */}
              <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-4 text-xs text-neutral-500 dark:text-neutral-400 space-y-1.5">
                <div className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                  📍 {STORE_INFO.name}
                </div>
                <div>{STORE_INFO.address}</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {tCommon("openSummary")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
