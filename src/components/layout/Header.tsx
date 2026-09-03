"use client";

import { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "@/components/common/ThemeToggle";
import { STORE_INFO } from "@/lib/store";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 dark:bg-neutral-950/95 shadow-lg shadow-black/5 dark:shadow-black/30 backdrop-blur-xl"
            : "bg-white/80 dark:bg-neutral-950/70 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5 shrink-0">
            <div className="flex flex-col">
              <span className="font-heading text-lg font-black tracking-wider text-neutral-950 dark:text-white uppercase sm:text-xl">
                GÜNER <span className="text-[#d4af37]">AV</span>
              </span>
              <span className="text-[9px] font-semibold tracking-[0.2em] text-neutral-400 dark:text-neutral-500 uppercase">
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
                      ? "text-neutral-950 dark:text-white font-bold"
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
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
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
                    return (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.id}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white"
                      >
                        <span>{categoryName}</span>
                        {cat.id === "silah-muhimmat" && (
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
              aria-label={STORE_INFO.phone}
            >
              <Phone className="h-3.5 w-3.5 text-[#d4af37]" />
              <span className="hidden xl:inline">{STORE_INFO.phone}</span>
            </a>

            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <ThemeToggle />

            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

            {/* CTA */}
            <Link
              href="/products"
              className="rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-white dark:text-black transition-all hover:bg-neutral-700 dark:hover:bg-neutral-200 active:scale-95"
            >
              {t("viewCatalog")}
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <a
              href={`tel:${STORE_INFO.phone}`}
              className="rounded-lg p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
              aria-label={STORE_INFO.phone}
            >
              <Phone className="h-5 w-5" />
            </a>
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-lg p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 focus:outline-none"
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
                  return (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.id}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white"
                    >
                      <span>{categoryName}</span>
                      {cat.id === "silah-muhimmat" && (
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
