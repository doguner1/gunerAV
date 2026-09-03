import { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { STORE_INFO } from "@/lib/store";
import { generateWhatsAppLink } from "@/lib/utils";
import ContactForm from "@/components/contact/ContactForm";
import {
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Mail,
  Navigation,
  Star,
} from "lucide-react";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isTr = locale === "tr";
  return {
    title: isTr
      ? "İletişim & Mağaza Konumu | Malatya Av Güner Av Bayii"
      : "Contact & Store Location | Guner AV Hunting Dealer",
    description: isTr
      ? "Malatya Av Güner Av Bayii adres, telefon, WhatsApp ve Google Haritalar konumu. Yeşilyurt Malatya av malzemeleri dükkanı."
      : "Contact details, address, phone, WhatsApp and Google Maps coordinates for Guner AV Hunting Dealer in Malatya.",
    alternates: {
      canonical: `${STORE_INFO.siteUrl}/${locale}/contact`,
      languages: {
        tr: `${STORE_INFO.siteUrl}/tr/contact`,
        en: `${STORE_INFO.siteUrl}/en/contact`,
      },
    },
    openGraph: {
      title: isTr
        ? "İletişim & Mağaza Konumu | Malatya Av Güner Av Bayii"
        : "Contact & Store Location | Guner AV Hunting Dealer",
      description: isTr
        ? "Malatya Av Güner Av Bayii adres, telefon, WhatsApp ve Google Haritalar konumu. Yeşilyurt Malatya av malzemeleri dükkanı."
        : "Contact details, address, phone, WhatsApp and Google Maps coordinates for Guner AV Hunting Dealer in Malatya.",
      url: `${STORE_INFO.siteUrl}/${locale}/contact`,
      images: ["/images/og-image.jpg"],
    },
  };
}

export default async function ContactPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Contact" });
  const tStore = await getTranslations({ locale, namespace: "StoreInfo" });
  const tCommon = await getTranslations({ locale, namespace: "Common" });

  const isTr = locale === "tr";

  const waMsg = isTr
    ? "Merhaba Güner Av Bayii, web sitenizden ulaşıyorum. Bilgi almak istiyorum."
    : "Hello Guner AV, I am contacting you via your website.";

  const waUrl = generateWhatsAppLink(STORE_INFO.whatsappNumber, waMsg);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pt-20 pb-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
            {t("tagline")}
          </span>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-5xl mt-2">
            {t("mainHeading")}
          </h1>
          <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-400 leading-relaxed font-medium">
            {t("subtitle")}
          </p>
        </div>

        {/* Grid: Left Form, Right Store Details & Interactive Map */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Form */}
          <div className="lg:col-span-6">
            <ContactForm />

            {/* Quick Direct Buttons */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-xs font-black uppercase tracking-wider text-neutral-950 shadow-md transition-colors hover:bg-[#20ba59]"
              >
                <MessageCircle className="h-4 w-4 fill-neutral-950 text-neutral-950" />
                <span>{t("whatsappChat")}</span>
              </a>

              <a
                href={`tel:${STORE_INFO.phone}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-3 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-sm"
              >
                <Phone className="h-4 w-4 text-[#b45309] dark:text-[#d4af37]" />
                <span>{STORE_INFO.phone}</span>
              </a>
            </div>
          </div>

          {/* Right Column: Physical Location Card & Live Map */}
          <div className="space-y-6 lg:col-span-6">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 shadow-sm dark:shadow-2xl space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {tStore("statusOpen")}
                  </span>
                  <div className="flex items-center text-amber-500 dark:text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="ml-1 text-xs font-bold text-neutral-950 dark:text-white">5.0</span>
                  </div>
                </div>
                <h2 className="font-heading text-xl font-bold text-neutral-950 dark:text-white">
                  {STORE_INFO.name}
                </h2>
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  {tStore("category")}
                </span>
              </div>

              <div className="space-y-4 border-t border-neutral-100 dark:border-neutral-900 pt-4 text-xs">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 shrink-0 text-[#b45309] dark:text-[#d4af37] mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">{tStore("addressTitle")}:</span>
                    <p className="mt-0.5 text-neutral-900 dark:text-neutral-300 leading-relaxed font-semibold">
                      {STORE_INFO.address}
                    </p>
                    <p className="mt-0.5 text-[#b45309] dark:text-[#d4af37] font-bold">
                      📍 {STORE_INFO.plusCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">{tStore("hoursTitle")}:</span>
                    <p className="mt-0.5 text-neutral-700 dark:text-neutral-400 font-medium">
                      {tCommon("weekdaysSchedule")} 08:30 - 20:00
                    </p>
                    <p className="text-neutral-700 dark:text-neutral-400 font-medium">
                      {tCommon("sundaySchedule")} 10:00 - 18:00
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-[#b45309] dark:text-[#d4af37]" />
                  <div>
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">{tStore("phoneTitle")}:</span>
                    <a
                      href={`tel:${STORE_INFO.phone}`}
                      className="ml-2 font-black text-neutral-950 dark:text-white hover:underline"
                    >
                      {STORE_INFO.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-[#b45309] dark:text-[#d4af37]" />
                  <div>
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">{t("email")}:</span>
                    <a
                      href={`mailto:${STORE_INFO.email}`}
                      className="ml-2 text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white font-medium"
                    >
                      {STORE_INFO.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-900">
                <a
                  href={STORE_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 dark:bg-white py-3 text-xs font-bold uppercase tracking-wider text-white dark:text-black transition-colors hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm"
                >
                  <Navigation className="h-4 w-4" />
                  <span>{tStore("getDirections")}</span>
                </a>
              </div>
            </div>

            {/* Map Embed */}
            <div className="h-72 w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 shadow-md">
              <iframe
                title={STORE_INFO.name}
                src={`https://maps.google.com/maps?q=${STORE_INFO.coordinates.lat},${STORE_INFO.coordinates.lng}&hl=tr&z=17&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale contrast-125 opacity-90 hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
