import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import AnalyticsProvider from "@/components/providers/AnalyticsProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloatingButton from "@/components/common/WhatsAppFloatingButton";
import MobileQuickBar from "@/components/common/MobileQuickBar";
import CookieBanner from "@/components/common/CookieBanner";
import { StoreJsonLd } from "@/components/seo/JsonLd";
import { STORE_INFO } from "@/lib/store";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const siteUrl = STORE_INFO.siteUrl;

  return {
    title: {
      template: `%s | ${STORE_INFO.name}`,
      default: t("siteTitle"),
    },
    description: t("siteDescription"),
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        tr: `${siteUrl}/tr`,
        en: `${siteUrl}/en`,
      },
    },
    openGraph: {
      title: t("siteTitle"),
      description: t("siteDescription"),
      url: `${siteUrl}/${locale}`,
      siteName: STORE_INFO.name,
      images: [
        {
          url: "/images/og-image.jpg",
          width: 1200,
          height: 630,
          alt: STORE_INFO.name,
        },
      ],
      locale: locale === "tr" ? "tr_TR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("siteTitle"),
      description: t("siteDescription"),
      images: ["/images/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: "/icon.png",
      apple: "/icon.png",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") || undefined;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} className={`${inter.variable} ${heading.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/images/hero-bg-poster.jpg" fetchPriority="high" />
        <link rel="preload" as="video" href="/videos/hero-bg.mp4" type="video/mp4" fetchPriority="high" />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `
              try {
                const t = localStorage.getItem('gunerav_theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}
            ` }} />
        <StoreJsonLd nonce={nonce} />
        </head>
      <body className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col antialiased selection:bg-[#d4af37]/30 selection:text-black dark:selection:text-white transition-colors duration-200">
        <GoogleTagManager gtmId="GTM-P22MB2RK" nonce={nonce} />
<GoogleAnalytics gaId="G-K2WE6YE6KV" nonce={nonce} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AnalyticsProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppFloatingButton />
            <MobileQuickBar />
            <CookieBanner />
            <Analytics />
            <SpeedInsights />
          </AnalyticsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
