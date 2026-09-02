"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleToggle = (nextLocale: "tr" | "en") => {
    if (nextLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/80 p-1 text-xs backdrop-blur-md">
      <div className="flex items-center px-1.5 text-neutral-500 dark:text-neutral-400">
        <Globe className="h-3.5 w-3.5" />
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleToggle("tr")}
        className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-wider transition-all ${
          locale === "tr"
            ? "bg-neutral-950 dark:bg-white text-white dark:text-black shadow-sm"
            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
        }`}
        aria-label="TR - Türkçe Dil Seçeneği"
      >
        TR
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleToggle("en")}
        className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-wider transition-all ${
          locale === "en"
            ? "bg-neutral-950 dark:bg-white text-white dark:text-black shadow-sm"
            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
        }`}
        aria-label="EN - English Language Option"
      >
        EN
      </button>
    </div>
  );
}
