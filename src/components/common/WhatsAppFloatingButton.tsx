"use client";

import { STORE_INFO } from "@/lib/store";
import { generateWhatsAppLink } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function WhatsAppFloatingButton() {
  const locale = useLocale();
  const t = useTranslations("Common");

  const defaultMsg =
    locale === "tr"
      ? "Merhaba Güner Av Bayii, mağazanızdaki ürünler ve stok durumu hakkında bilgi almak istiyorum."
      : "Hello Guner AV, I would like to inquire about your product catalog and availability.";

  const whatsappUrl = generateWhatsAppLink(STORE_INFO.whatsappNumber, defaultMsg);

  return (
    <aside aria-label={t("whatsappSupport")} className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("whatsappInquiryLine")}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-[#20ba59] active:scale-95"
      >
        {/* Radar ping effect */}
        <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-[#25D366] opacity-40"></span>

        <MessageCircle className="h-7 w-7 transition-transform group-hover:rotate-12" />

        {/* Hover Tooltip */}
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 px-3 py-1.5 text-xs font-bold text-neutral-950 dark:text-white shadow-xl backdrop-blur-md md:group-hover:block">
          {t("chatOnWhatsapp")}
        </span>
      </a>
    </aside>
  );
}
