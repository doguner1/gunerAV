import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
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
  ShieldCheck,
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
      canonical: `/${locale}/contact`,
      languages: {
        tr: "/tr/contact",
        en: "/en/contact",
      },
    },
  };
}

export default function ContactPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const isTr = locale === "tr";

  const waMsg = isTr
    ? "Merhaba Güner Av Bayii, web sitenizden ulaşıyorum. Bilgi almak istiyorum."
    : "Hello Guner AV, I am contacting you via your website.";

  const waUrl = generateWhatsAppLink(STORE_INFO.whatsappNumber, waMsg);

  return (
    <div className="min-h-screen bg-black pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
            Bize Ulaşın
          </span>
          <h1 className="font-heading text-3xl font-extrabold uppercase tracking-tight text-white sm:text-5xl mt-2">
            İletişim &amp; Mağaza Ziyareti
          </h1>
          <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
            Sorularınız, ürün danışmanlığı, yasal ruhsat süreçleri veya mağaza yol tarifi
            için bize dilediğiniz iletişim kanalı üzerinden ulaşabilirsiniz.
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
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-[#20ba59]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp İletişim</span>
              </a>

              <a
                href={`tel:${STORE_INFO.phone}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800"
              >
                <Phone className="h-4 w-4 text-[#d4af37]" />
                <span>{STORE_INFO.phone}</span>
              </a>
            </div>
          </div>

          {/* Right Column: Physical Location Card & Live Map */}
          <div className="space-y-6 lg:col-span-6">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                    Açık · Kapanış 20:00
                  </span>
                  <div className="flex items-center text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="ml-1 text-xs font-bold text-white">5.0</span>
                  </div>
                </div>
                <h2 className="font-heading text-xl font-bold text-white">
                  {STORE_INFO.name}
                </h2>
                <span className="text-xs text-neutral-400">
                  {STORE_INFO.category}
                </span>
              </div>

              <div className="space-y-4 border-t border-neutral-900 pt-4 text-xs">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 shrink-0 text-[#d4af37] mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-300">Adres:</span>
                    <p className="mt-0.5 text-neutral-400 leading-relaxed">
                      {STORE_INFO.address}
                    </p>
                    <p className="mt-0.5 text-[#d4af37] font-semibold">
                      📍 {STORE_INFO.plusCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-300">Çalışma Saatleri:</span>
                    <p className="mt-0.5 text-neutral-400">Hafta İçi &amp; Cumartesi: 08:30 - 20:00</p>
                    <p className="text-neutral-400">Pazar: 10:00 - 18:00</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-[#d4af37]" />
                  <div>
                    <span className="font-bold text-neutral-300">Telefon:</span>
                    <a
                      href={`tel:${STORE_INFO.phone}`}
                      className="ml-2 font-bold text-white hover:underline"
                    >
                      {STORE_INFO.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-[#d4af37]" />
                  <div>
                    <span className="font-bold text-neutral-300">E-Posta:</span>
                    <a
                      href={`mailto:${STORE_INFO.email}`}
                      className="ml-2 text-neutral-400 hover:text-white"
                    >
                      {STORE_INFO.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-900">
                <a
                  href={STORE_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-neutral-200"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Google Haritalar'da Yol Tarifi Al</span>
                </a>
              </div>
            </div>

            {/* Map Embed */}
            <div className="h-72 w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
              <iframe
                title="Güner Av Bayii Harita"
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
