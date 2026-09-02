import { useLocale, useTranslations } from "next-intl";
import { AlertOctagon, Phone, MessageCircle, FileText } from "lucide-react";
import { STORE_INFO } from "@/lib/store";
import { generateWhatsAppLink } from "@/lib/utils";

interface LicenseNoticeProps {
  productName: string;
}

export default function LicenseNotice({ productName }: LicenseNoticeProps) {
  const locale = useLocale();
  const t = useTranslations("Products");
  const tCommon = useTranslations("Common");

  const waMsg =
    locale === "tr"
      ? `Merhaba Güner Av Bayii, ${productName} için yasal satın alma prosedürleri ve fiyat hakkında bilgi almak istiyorum.`
      : `Hello Guner AV, I would like to inquire about legal purchasing procedures and pricing for ${productName}.`;

  const waUrl = generateWhatsAppLink(STORE_INFO.whatsappNumber, waMsg);

  return (
    <div className="rounded-2xl border border-red-300 dark:border-red-500/30 bg-red-50/80 dark:bg-gradient-to-b dark:from-red-950/40 dark:to-neutral-950 p-6 shadow-sm dark:shadow-2xl transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-300 dark:border-red-500/40 bg-white dark:bg-red-950/60 text-red-600 dark:text-red-400 shadow-sm">
          <AlertOctagon className="h-6 w-6 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-red-100 dark:bg-red-500/20 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/40">
              {t("licenseRequired")}
            </span>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
              {tCommon("permitRequiredNotice")}
            </span>
          </div>

          <h3 className="font-heading text-lg font-black text-neutral-950 dark:text-white">
            {t("licenseWarningTitle")}
          </h3>

          <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 font-medium">
            {t("licenseWarningText")}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all hover:bg-emerald-500"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{t("askOnWhatsapp")}</span>
            </a>

            <a
              href={`tel:${STORE_INFO.phone}`}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-sm"
            >
              <Phone className="h-4 w-4 text-[#b45309] dark:text-[#d4af37]" />
              <span>{STORE_INFO.phone}</span>
            </a>

            <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
              <FileText className="h-3.5 w-3.5 text-neutral-500" />
              <span>{tCommon("inStoreDeliveryPermit")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
