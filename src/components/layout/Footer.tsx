import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { STORE_INFO } from "@/lib/store";
import { getAllCategories } from "@/lib/products";
import {
  Crosshair,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Star,
} from "lucide-react";

export default function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Navigation");
  const categories = getAllCategories();

  return (
    <footer className="border-t border-neutral-800 bg-black text-neutral-400">
      {/* Top Banner: Statutory compliance notice */}
      <div className="border-b border-neutral-800/80 bg-neutral-950 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-start gap-3 text-xs text-neutral-400">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white">{t("legalWarningTitle")}</strong>{" "}
            {t("legalWarningText")}
          </p>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900">
                <Crosshair className="h-5 w-5 text-[#d4af37]" />
              </div>
              <span className="font-heading text-xl font-extrabold tracking-wider text-white uppercase">
                GÜNER <span className="text-[#d4af37]">AV</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-neutral-400">
              {t("aboutStore")}
            </p>
            {/* Google Rating Badge */}
            <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <span className="font-bold text-white">5.0</span>
              <span className="text-[11px] text-neutral-400">
                Google İşletmem
              </span>
            </div>
          </div>

          {/* Col 2: Fast Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-white"
                >
                  {tNav("home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="transition-colors hover:text-white"
                >
                  {tNav("catalog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-white"
                >
                  {tNav("about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-white"
                >
                  {tNav("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-white"
                >
                  {tNav("privacy")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              {tNav("categories")}
            </h3>
            <ul className="space-y-2.5 text-xs">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.id}`}
                    className="transition-colors hover:text-white"
                  >
                    {cat.name_tr}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & Store Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Mağaza &amp; İletişim
            </h3>
            <div className="space-y-3 text-xs text-neutral-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[#d4af37] mt-0.5" />
                <span>{STORE_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#d4af37]" />
                <a
                  href={`tel:${STORE_INFO.phone}`}
                  className="text-white hover:underline font-semibold"
                >
                  {STORE_INFO.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#d4af37]" />
                <a
                  href={`mailto:${STORE_INFO.email}`}
                  className="hover:text-white"
                >
                  {STORE_INFO.email}
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <div className="space-y-0.5 text-[11px]">
                  <div>Pzt - Cmt: {STORE_INFO.hours.weekdays}</div>
                  <div>Pazar: {STORE_INFO.hours.sunday}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-800/80 pt-8 text-xs text-neutral-400 sm:flex-row">
          <p>© {new Date().getFullYear()} {t("copyright")}</p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="transition-colors hover:text-white"
            >
              KVKK &amp; Gizlilik Politikası
            </Link>
            <span className="text-neutral-700">|</span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              T.C. Yetkili Av Bayii
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
