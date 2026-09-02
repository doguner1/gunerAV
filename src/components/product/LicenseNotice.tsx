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

  const waMsg =
    locale === "tr"
      ? `Merhaba Güner Av Bayii, ${productName} için yasal satın alma prosedürleri ve fiyat hakkında bilgi almak istiyorum.`
      : `Hello Guner AV, I would like to inquire about legal purchasing procedures and pricing for ${productName}.`;

  const waUrl = generateWhatsAppLink(STORE_INFO.whatsappNumber, waMsg);

  return (
    <div className="rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-950/40 to-neutral-950 p-6 shadow-2xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/40 bg-red-950/60 text-red-400">
          <AlertOctagon className="h-6 w-6 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-red-500/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-400 border border-red-500/40">
              {t("licenseRequired")}
            </span>
            <span className="text-xs text-neutral-400">
              5188 / 2521 Sayılı Kanun Hükümleri
            </span>
          </div>

          <h3 className="font-heading text-lg font-bold text-white">
            {t("licenseWarningTitle")}
          </h3>

          <p className="text-xs leading-relaxed text-neutral-300">
            {t("licenseWarningText")}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-emerald-950/50"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{t("askOnWhatsapp")}</span>
            </a>

            <a
              href={`tel:${STORE_INFO.phone}`}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-neutral-800"
            >
              <Phone className="h-4 w-4 text-[#d4af37]" />
              <span>{STORE_INFO.phone}</span>
            </a>

            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <FileText className="h-3.5 w-3.5 text-neutral-500" />
              <span>Satın Alma Belgesi ile Mağaza Teslimi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
