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
      aria-label="Çerez ve Gizlilik Bildirimi"
      className="fixed bottom-4 left-4 z-40 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Cookie className="h-5 w-5 text-[#d4af37]" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Çerez Bildirimi
            </h4>
          </div>
          <button
            type="button"
            onClick={handleDecline}
            className="text-neutral-500 hover:text-white"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-neutral-400">
          {t("text")}{" "}
          <Link
            href="/privacy"
            className="text-white underline hover:text-neutral-300"
          >
            {t("policyLink")}
          </Link>
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-neutral-200"
          >
            {t("accept")}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="rounded-lg border border-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            {t("decline")}
          </button>
        </div>
      </div>
    </aside>
  );
}
