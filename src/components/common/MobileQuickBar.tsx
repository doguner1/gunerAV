"use client";

import { STORE_INFO } from "@/lib/store";
import { MapPin, PhoneCall } from "lucide-react";
import { useTranslations } from "next-intl";

export default function MobileQuickBar() {
  const t = useTranslations("Hero");

  return (
    <aside
      aria-label="Hızlı Erişim & İletişim"
      className="fixed bottom-3 inset-x-3 z-40 sm:hidden pointer-events-none"
    >
      <div className="pointer-events-auto grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-neutral-950/95 dark:bg-black/95 backdrop-blur-2xl border border-white/20 shadow-[0_16px_36px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)]">
        {/* Konum / Google Haritalar */}
        <a
          href={STORE_INFO.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl bg-white text-black hover:bg-neutral-100 active:scale-95 font-bold text-xs uppercase tracking-wider shadow-md transition-all"
        >
          <MapPin className="h-4 w-4 text-[#b45309] fill-[#b45309]/20 shrink-0" />
          <span className="truncate">{t("heroDirections")}</span>
        </a>

        {/* Hemen Ara */}
        <a
          href={`tel:${STORE_INFO.phoneIntl || STORE_INFO.phone}`}
          className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 font-bold text-xs uppercase tracking-wider shadow-md transition-all"
        >
          <PhoneCall className="h-4 w-4 shrink-0 animate-pulse" />
          <span className="truncate">{t("heroCall")}</span>
        </a>
      </div>
    </aside>
  );
}
