import { Link } from "@/i18n/routing";
import { STORE_INFO } from "@/lib/store";
import { generateWhatsAppLink } from "@/lib/utils";
import { MessageCircle, Phone, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function HomeCtaBanner() {
  const locale = useLocale();
  const tCommon = useTranslations("Common");

  const waMsg =
    locale === "tr"
      ? "Merhaba Güner Av Bayii, mağazanızdaki ürünler ve fiyatlar hakkında bilgi almak istiyorum."
      : "Hello Guner AV, I would like to receive information about your products and in-store pricing.";

  const waUrl = generateWhatsAppLink(STORE_INFO.whatsappNumber, waMsg);

  return (
    <section className="bg-neutral-50 dark:bg-black py-20 relative overflow-hidden transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-950 to-black p-8 sm:p-14 shadow-2xl">
          {/* Subtle gold / ambient accent */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#d4af37]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-6">
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#d4af37]">
              {tCommon("contactUsToday")}
            </span>

            <h2 className="font-heading text-3xl font-extrabold uppercase tracking-tight text-white sm:text-5xl">
              {tCommon("chooseGearTogether")}
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-neutral-300">
              {tCommon("ctaBannerDesc")}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-neutral-950 shadow-xl transition-all hover:bg-[#20ba59] active:scale-95"
              >
                <MessageCircle className="h-4 w-4 fill-neutral-950 text-neutral-950" />
                <span>{tCommon("askOnWhatsapp")}</span>
              </a>

              <a
                href={`tel:${STORE_INFO.phone}`}
                className="inline-flex items-center gap-2.5 rounded-xl border border-neutral-700 bg-neutral-900 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:border-neutral-600 hover:bg-neutral-800"
              >
                <Phone className="h-4 w-4 text-[#d4af37]" />
                <span>{STORE_INFO.phone}</span>
              </a>

              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 px-5 py-3.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                <MapPin className="h-4 w-4 text-[#d4af37]" />
                <span>{tCommon("storeDirections")}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
