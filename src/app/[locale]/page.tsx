import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
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

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <FeaturedCategories />
      <FeaturedProducts />
      <CampaignSection />
      <TrustSection />
      <TestimonialsSection />
      <MapAndHoursSection />
      <HomeCtaBanner />
    </>
  );
}
