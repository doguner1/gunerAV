"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Cookie, X } from "lucide-react";

export default function CookieBanner() {
  const t = useTranslations("CookieBanner");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("gunerav_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("gunerav_cookie_consent", "accepted");
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem("gunerav_cookie_consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside
      aria-label={t("ariaLabel")}
      className="fixed bottom-4 left-4 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 p-5 shadow-2xl backdrop-blur-xl transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-neutral-950 dark:text-white">
            <Cookie className="h-5 w-5 text-[#b45309] dark:text-[#d4af37]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-950 dark:text-white">
              {t("title")}
            </h4>
          </div>
          <button
            type="button"
            onClick={handleDecline}
            className="text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 font-medium">
          {t("text")}{" "}
          <Link
            href="/privacy"
            className="text-neutral-950 dark:text-white underline font-semibold hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            {t("policyLink")}
          </Link>
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-neutral-950 dark:bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white dark:text-black transition-colors hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm"
          >
            {t("accept")}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="rounded-lg border border-neutral-300 dark:border-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-400 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white"
          >
            {t("decline")}
          </button>
        </div>
      </div>
    </aside>
  );
}
