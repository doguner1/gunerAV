import { setRequestLocale, getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { STORE_INFO } from "@/lib/store";
import { ShieldCheck, Lock, Cookie, Scale } from "lucide-react";

export function generateStaticParams() {
  return [{ locale: "tr" }, { locale: "en" }];
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isTr = locale === "tr";
  return {
    title: isTr
      ? `Gizlilik Politikası & KVKK | ${STORE_INFO.name}`
      : `Privacy Policy & GDPR | ${STORE_INFO.name}`,
    description: isTr
      ? "Malatya Av Güner Av Bayii 6698 Sayılı KVKK ve Gizlilik Politikası Aydınlatma Metni."
      : "Privacy and Personal Data Protection Policy of Guner AV Hunting Store in Malatya.",
    alternates: {
      canonical: `${STORE_INFO.siteUrl}/${locale}/privacy`,
      languages: {
        tr: `${STORE_INFO.siteUrl}/tr/privacy`,
        en: `${STORE_INFO.siteUrl}/en/privacy`,
      },
    },
    openGraph: {
      title: isTr
        ? `Gizlilik Politikası & KVKK | ${STORE_INFO.name}`
        : `Privacy Policy & GDPR | ${STORE_INFO.name}`,
      description: isTr
        ? "Malatya Av Güner Av Bayii 6698 Sayılı KVKK ve Gizlilik Politikası Aydınlatma Metni."
        : "Privacy and Personal Data Protection Policy of Guner AV Hunting Store in Malatya.",
      url: `${STORE_INFO.siteUrl}/${locale}/privacy`,
      images: ["/images/og-image.jpg"],
    },
  };
}

export default async function PrivacyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Privacy" });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pt-28 pb-20 transition-colors">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 border-b border-neutral-200 dark:border-neutral-800/80 pb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
            {t("tagline")}
          </span>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-4xl mt-2">
            {t("mainHeading")}
          </h1>
          <p className="mt-2 text-xs text-neutral-500 font-medium">
            {t("updated")}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 font-medium">
          {/* Section 1 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-[#b45309] dark:text-[#d4af37]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-lg font-bold text-neutral-950 dark:text-white uppercase">
                {t("sec1Title")}
              </h2>
            </div>
            <p className="text-xs sm:text-sm">{t("sec1P1")}</p>
            <div className="mt-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4 text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-line font-mono">
              {t("sec1DataController")}
            </div>
          </div>

          {/* Section 2 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-[#b45309] dark:text-[#d4af37]">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-lg font-bold text-neutral-950 dark:text-white uppercase">
                {t("sec2Title")}
              </h2>
            </div>
            <p className="text-xs sm:text-sm">{t("sec2P1")}</p>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs sm:text-sm text-neutral-800 dark:text-neutral-300 font-semibold pl-2">
              <li>{t("sec2Li1")}</li>
              <li>{t("sec2Li2")}</li>
              <li>{t("sec2Li3")}</li>
            </ul>
            <p className="mt-3 text-xs sm:text-sm">{t("sec2P2")}</p>
          </div>

          {/* Section 3 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-[#b45309] dark:text-[#d4af37]">
                <Cookie className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-lg font-bold text-neutral-950 dark:text-white uppercase">
                {t("sec3Title")}
              </h2>
            </div>
            <p className="text-xs sm:text-sm">{t("sec3P1")}</p>
            <p className="mt-3 text-xs sm:text-sm">{t("sec3P2")}</p>
          </div>

          {/* Section 4 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-[#b45309] dark:text-[#d4af37]">
                <Scale className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-lg font-bold text-neutral-950 dark:text-white uppercase">
                {t("sec4Title")}
              </h2>
            </div>
            <p className="text-xs sm:text-sm">{t("sec4P")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
