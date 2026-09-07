import { useTranslations } from "next-intl";
import { AlertOctagon, FileText } from "lucide-react";

interface LicenseNoticeProps {
  productName?: string;
}

export default function LicenseNotice({ productName: _ }: LicenseNoticeProps) {
  const t = useTranslations("Products");
  const tCommon = useTranslations("Common");

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

          <div className="flex items-center gap-1.5 pt-2 text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
            <FileText className="h-3.5 w-3.5 text-neutral-500" />
            <span>{tCommon("inStoreDeliveryPermit")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
