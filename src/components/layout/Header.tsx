"use client";

import { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "@/components/common/ThemeToggle";
import { STORE_INFO } from "@/lib/store";
import { Menu, X, Phone, ShieldCheck, Crosshair, ChevronDown } from "lucide-react";
import { getAllCategories } from "@/lib/products";

export default function Header() {
  const t = useTranslations("Navigation");
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
            ? "border-b border-neutral-200 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-950/90 shadow-md backdrop-blur-xl"
            : "border-b border-neutral-200/60 dark:border-neutral-900/40 bg-white/85 dark:bg-neutral-950/60 backdrop-blur-md"
        }`}
      >
        {/* Top notification bar */}
        <div className="hidden border-b border-neutral-200/70 dark:border-neutral-800/40 bg-neutral-100 dark:bg-neutral-900/40 px-4 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 sm:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                {STORE_INFO.hours.summary}
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">|</span>
              <span className="hidden md:inline text-neutral-600 dark:text-neutral-400 font-medium">
                📍 {STORE_INFO.address}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-[#d4af37]" />
                Google 5.0 ★ Malatya Resmi Av Bayii
              </span>
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 transition-all group-hover:border-[#d4af37] group-hover:shadow-[0_0_15px_rgba(212,175,55,0.25)]">
              <Crosshair className="h-6 w-6 text-neutral-950 dark:text-white transition-transform duration-300 group-hover:rotate-45 group-hover:text-[#d4af37]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-black tracking-wider text-neutral-950 dark:text-white uppercase sm:text-2xl">
                GÜNER <span className="text-[#d4af37]">AV</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">
                MALATYA · AV &amp; OUTDOOR
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3.5 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white font-medium"
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
                className="flex items-center gap-1 rounded-md px-3.5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white"
              >
                <span>{t("categories")}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
              </button>

              {categoriesOpen && (
                <div
                  onMouseLeave={() => setCategoriesOpen(false)}
                  className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-2 shadow-2xl backdrop-blur-2xl"
                >
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.id}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold text-neutral-800 dark:text-neutral-300 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white"
                    >
                      <span>{cat.name_tr}</span>
                      {cat.id === "silah-muhimmat" && (
                        <span className="rounded bg-red-100 dark:bg-red-950/80 px-1.5 py-0.5 text-[9px] font-bold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                          Ruhsatlı
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Items */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Direct Phone Call */}
            <a
              href={`tel:${STORE_INFO.phone}`}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/60 px-3.5 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all hover:bg-neutral-200 dark:hover:border-neutral-700 hover:text-black dark:hover:text-white"
            >
              <Phone className="h-3.5 w-3.5 text-[#d4af37]" />
              <span>{STORE_INFO.phone}</span>
            </a>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Primary Action Button */}
            <Link
              href="/products"
              className="rounded-lg bg-neutral-950 dark:bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white dark:text-black transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:shadow-lg active:scale-95"
            >
              {t("viewCatalog")}
            </Link>
          </div>

          {/* Mobile Menu & Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-2 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:text-white focus:outline-none"
              aria-label="Menüyü Aç/Kapat"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed top-20 right-0 bottom-0 w-full max-w-sm border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-2xl overflow-y-auto">
            <div className="flex flex-col gap-6">
              {/* Phone quick bar */}
              <a
                href={`tel:${STORE_INFO.phone}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-3 text-sm font-bold text-neutral-950 dark:text-white shadow-sm"
              >
                <Phone className="h-4 w-4 text-[#d4af37]" />
                <span>{STORE_INFO.phone}</span>
              </a>

              {/* Navigation Links */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-3 py-1">
                  Menü
                </span>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-3 text-base font-semibold transition-colors ${
                      pathname === link.href
                        ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-white"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Categories list in mobile */}
              <div className="flex flex-col gap-1 border-t border-neutral-200 dark:border-neutral-800 pt-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-3 py-1">
                  {t("categories")}
                </span>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white"
                  >
                    <span>{cat.name_tr}</span>
                    {cat.id === "silah-muhimmat" && (
                      <span className="rounded bg-red-100 dark:bg-red-950 px-1.5 py-0.5 text-[9px] font-bold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                        Ruhsatlı
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Store Address & Hours info */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
                <div className="font-bold text-neutral-900 dark:text-neutral-200">
                  📍 {STORE_INFO.name}
                </div>
                <div>{STORE_INFO.address}</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {STORE_INFO.hours.summary}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
