import { setRequestLocale, getTranslations } from "next-intl/server";
import { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { STORE_INFO } from "@/lib/store";
import { ShieldCheck, Award, Users } from "lucide-react";

export function generateStaticParams() {
  return [{ locale: "tr" }, { locale: "en" }];
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isTr = locale === "tr";
  const title = isTr
    ? `Hakkımızda | ${STORE_INFO.name}`
    : `About Us | ${STORE_INFO.name}`;
  const description = isTr
    ? "Malatya Av Güner Av Bayii hakkında kurumsal bilgiler, mağaza geçmişimiz, misyonumuz ve ilkelerimiz."
    : "Corporate profile, store history, mission, and operational ethics of Guner AV Hunting Store in Malatya.";

  return {
    title,
    description,
    alternates: {
      canonical: `${STORE_INFO.siteUrl}/${locale}/about`,
      languages: {
        tr: `${STORE_INFO.siteUrl}/tr/about`,
        en: `${STORE_INFO.siteUrl}/en/about`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${STORE_INFO.siteUrl}/${locale}/about`,
      images: ["/images/store-facade.webp"],
    },
  };
}

export default async function AboutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "About" });
  const tCommon = await getTranslations({ locale, namespace: "Common" });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pt-28 pb-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Hero */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
            {t("tagline")}
          </span>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-5xl mt-2">
            {t("mainHeading")}
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-neutral-700 dark:text-neutral-300 font-medium">
            {t("intro")}
          </p>
        </div>

        {/* Story & Store Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-6 space-y-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 font-medium">
            <h2 className="font-heading text-2xl font-black uppercase text-neutral-950 dark:text-white">
              {t("storyTitle")}
            </h2>
            <p>{t("storyP1")}</p>
            <p>{t("storyP2")}</p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs">
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 shadow-sm">
                <span className="font-heading text-2xl font-black text-neutral-950 dark:text-white">
                  {t("statGoogleTitle")}
                </span>
                <p className="mt-1 text-neutral-600 dark:text-neutral-400 font-medium">
                  {t("statGoogleDesc")}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 shadow-sm">
                <span className="font-heading text-2xl font-black text-neutral-950 dark:text-white">
                  {t("statExpTitle")}
                </span>
                <p className="mt-1 text-neutral-600 dark:text-neutral-400 font-medium">
                  {t("statExpDesc")}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 shadow-xl">
              <Image
                src="/images/store-facade.webp"
                alt={STORE_INFO.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Pillars / Values */}
        <div className="mb-24 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-8 sm:p-14 shadow-sm dark:shadow-2xl">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
              {t("principlesTag")}
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase text-neutral-950 dark:text-white mt-1">
              {t("principlesHeading")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[#b45309] dark:text-[#d4af37]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-neutral-950 dark:text-white uppercase">
                {t("principle1Title")}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                {t("principle1Desc")}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[#b45309] dark:text-[#d4af37]">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-neutral-950 dark:text-white uppercase">
                {t("principle2Title")}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                {t("principle2Desc")}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[#b45309] dark:text-[#d4af37]">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-neutral-950 dark:text-white uppercase">
                {t("principle3Title")}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                {t("principle3Desc")}
              </p>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="text-center">
          <h2 className="font-heading text-2xl font-black uppercase text-neutral-950 dark:text-white mb-4">
            {tCommon("weWelcomeYou")}
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-8 font-medium">
            {tCommon("weWelcomeYouDesc")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-xl bg-neutral-950 dark:bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm"
            >
              {tCommon("storeContactInfo")}
            </Link>
            <Link
              href="/products"
              className="rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-3 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-sm"
            >
              {tCommon("browseCatalog")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
