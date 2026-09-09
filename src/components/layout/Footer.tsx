"use client";

import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { STORE_INFO } from "@/lib/store";
import { getAllCategories } from "@/lib/products";
import { trackMapClick, trackPhoneClick } from "@/lib/analytics";
import {
  ShieldAlert,
  Phone,
  MapPin,
  Clock,
  ExternalLink,
  Lock,
  Crosshair,
} from "lucide-react";

export default function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navigation");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isTr = locale === "tr";
  const categories = getAllCategories();

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 transition-colors">
      {/* Statutory License Warning Bar */}
      <div className="border-b border-red-200 dark:border-red-950/60 bg-red-50/80 dark:bg-red-950/30 px-4 py-4 transition-colors">
        <div className="mx-auto flex max-w-[1600px] 2xl:max-w-[1800px] items-center gap-3 text-xs text-red-700 dark:text-red-400">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-600 dark:text-red-500" />
          <p className="font-semibold leading-relaxed">
            <strong className="text-red-800 dark:text-red-300 font-extrabold">{tCommon("licensedOfficialHuntingStore")} ({tCommon("permitRequiredNotice")}):</strong>{" "}
            {t("legalWarningText")}
          </p>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1800px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-950 dark:text-white">
                <Crosshair className="h-5 w-5 text-[#b45309] dark:text-[#d4af37]" />
              </div>
              <span className="font-heading text-xl font-black uppercase tracking-wider text-neutral-950 dark:text-white">
                GÜNER <span className="text-[#d4af37]">AV</span>
              </span>
            </div>

            <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 font-medium">
              {t("aboutStore")}
            </p>

            <div className="pt-2">
              <a
                href={STORE_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackMapClick("footer_google_business")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
              >
                <span>{tCommon("googleBusiness")}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="font-heading text-xs font-black uppercase tracking-wider text-neutral-950 dark:text-white">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link
                  href="/"
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  {tNav("home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  {tNav("catalog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  {tNav("about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  {tNav("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <Lock className="h-3 w-3 text-neutral-400" />
                  <span>{tNav("privacy")}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div className="space-y-3">
            <h3 className="font-heading text-xs font-black uppercase tracking-wider text-neutral-950 dark:text-white">
              {tNav("categories")}
            </h3>
            <ul className="space-y-2 text-xs font-semibold">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.id}`}
                    className="hover:text-black dark:hover:text-white transition-colors"
                  >
                    {isTr ? cat.name_tr : cat.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Store Info & Working Hours */}
          <div className="space-y-3">
            <h3 className="font-heading text-xs font-black uppercase tracking-wider text-neutral-950 dark:text-white">
              {tCommon("storeAndContact")}
            </h3>
            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-[#b45309] dark:text-[#d4af37] mt-0.5" />
                <p className="leading-relaxed">
                  {STORE_INFO.address}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-[#b45309] dark:text-[#d4af37]" />
                <a
                  href={`tel:${STORE_INFO.phone}`}
                  onClick={() => trackPhoneClick("footer_phone")}
                  className="font-bold text-neutral-900 dark:text-neutral-200 hover:text-black dark:hover:text-white"
                >
                  {STORE_INFO.phone}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {tCommon("openSummary")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & legal disclaimer */}
        <div className="mt-12 border-t border-neutral-200 dark:border-neutral-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-medium">
          <p>© {new Date().getFullYear()} {t("copyright")}</p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              {tCommon("privacyAndKvkk")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
