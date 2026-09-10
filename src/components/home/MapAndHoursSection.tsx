import { useTranslations, useLocale } from "next-intl";
import { STORE_INFO } from "@/lib/store";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  ShieldCheck,
  Star,
} from "lucide-react";

export default function MapAndHoursSection() {
  const t = useTranslations("StoreInfo");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  return (
    <section id="magaza-konum" className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-950 py-24 transition-colors">
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1800px] px-4 sm:px-6 lg:px-12 xl:px-16">
        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
            {tCommon("physicalStoreAndDirections")}
          </span>
          <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-4xl mt-1">
            {t("sectionTitle")}
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
            {t("sectionSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Info Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/90 p-8 shadow-sm lg:col-span-5">
            <div className="space-y-6">
              {/* Store title & Google Stars */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {t("statusOpen")}
                  </span>
                  <div className="flex items-center text-amber-500 dark:text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                    <span className="ml-1 text-xs font-bold text-neutral-950 dark:text-white">5.0</span>
                  </div>
                </div>
                <h3 className="font-heading text-2xl font-black text-neutral-950 dark:text-white">
                  {STORE_INFO.name}
                </h3>
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  {t("category")}
                </span>
              </div>

              {/* Address details */}
              <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-5">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-[#b45309] dark:text-[#d4af37] mt-0.5" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      {t("addressTitle")}
                    </span>
                    <p className="mt-1 text-sm font-bold text-neutral-950 dark:text-white leading-relaxed">
                      {STORE_INFO.address}
                    </p>
                    <p className="mt-1 text-xs text-[#b45309] dark:text-[#d4af37] font-bold">
                      📍 {STORE_INFO.plusCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Working Hours breakdown */}
              <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-800 pt-5">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div className="w-full">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      {t("hoursTitle")}
                    </span>
                    <div className="mt-2 space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                      <div className="flex items-center justify-between">
                        <span>{tCommon("weekdaysSchedule")}</span>
                        <span className="font-bold text-neutral-950 dark:text-white">08:30 - 20:00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{tCommon("saturdaySchedule")}</span>
                        <span className="font-bold text-neutral-950 dark:text-white">08:30 - 20:00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{tCommon("sundaySchedule")}</span>
                        <span className="font-bold text-neutral-950 dark:text-white">10:00 - 18:00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone info */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-5">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-[#b45309] dark:text-[#d4af37]" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      {t("phoneTitle")}
                    </span>
                    <p className="text-lg font-black text-neutral-950 dark:text-white">
                      {STORE_INFO.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <a
                href={STORE_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 dark:bg-white px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-white dark:text-black transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md"
              >
                <Navigation className="h-4 w-4" />
                <span>{t("getDirections")}</span>
              </a>

              <a
                href={`tel:${STORE_INFO.phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white transition-all hover:bg-neutral-100 dark:hover:bg-neutral-750"
              >
                <Phone className="h-4 w-4 text-[#b45309] dark:text-[#d4af37]" />
                <span>{tCommon("callDirect")}</span>
              </a>
            </div>
          </div>

          {/* Interactive Map Embed */}
          <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 shadow-lg lg:col-span-7">
            <iframe
              title={STORE_INFO.name}
              src={STORE_INFO.mapsEmbedUrl || `https://maps.google.com/maps?q=${STORE_INFO.coordinates.lat},${STORE_INFO.coordinates.lng}&hl=${locale}&z=17&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "420px" }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[25%] contrast-105 hover:grayscale-0 transition-all duration-500"
            />
            
            {/* Overlay tag */}
            <div className="absolute top-4 right-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-black/85 px-3 py-2 text-xs text-neutral-900 dark:text-white backdrop-blur-md shadow-md">
              <span className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-4 w-4 text-[#b45309] dark:text-[#d4af37]" />
                Yeşilyurt / Malatya
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
