import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getAllProducts } from "@/lib/products";
import HomeScrollRestorer from "@/components/home/HomeScrollRestorer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CampaignSection from "@/components/home/CampaignSection";
import TrustSection from "@/components/home/TrustSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import MapAndHoursSection from "@/components/home/MapAndHoursSection";
import HomeCtaBanner from "@/components/home/HomeCtaBanner";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const revalidate = 60;

export default async function HomePage({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const products = await getAllProducts();

  return (
    <>
      <HomeScrollRestorer />
      <HeroSection products={products} />
      <FeaturedCategories products={products} />
      <FeaturedProducts products={products} />
      <CampaignSection products={products} />
      <TrustSection />
      <TestimonialsSection />
      <MapAndHoursSection />
      <HomeCtaBanner />
    </>
  );
}
