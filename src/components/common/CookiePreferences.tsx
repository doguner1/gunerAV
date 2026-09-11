"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ShieldAlert, CheckCircle2, Sliders } from "lucide-react";

export default function CookiePreferences({ locale }: { locale: string }) {
  const isTr = locale === "tr";
  const searchParams = useSearchParams();
  const fromBanner = searchParams.get("ref") === "cookie";

  const [consent, setConsent] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setConsent(localStorage.getItem("gunerav_cookie_consent"));
    }
  }, []);

  const handleSetConsent = (status: "accepted" | "declined") => {
    localStorage.setItem("gunerav_cookie_consent", status);
    setConsent(status);
    setFeedback(
      status === "accepted"
        ? isTr
          ? "Çerez tercihiniz kaydedildi: Çerez kullanımı kabul edildi."
          : "Your preference is saved: Cookies accepted."
        : isTr
        ? "Çerez tercihiniz kaydedildi: İsteğe bağlı çerezler reddedildi."
        : "Your preference is saved: Optional cookies declined."
    );
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div
      className={`mt-6 rounded-2xl border p-5 transition-all ${
        fromBanner
          ? "border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/5 shadow-lg ring-1 ring-amber-500/30"
          : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sliders className="h-4 w-4 text-[#b45309] dark:text-[#d4af37]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
          {isTr ? "Çerez Yönetimi ve Tercihleriniz" : "Cookie Management & Preferences"}
        </h3>
      </div>

      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {fromBanner
          ? isTr
            ? "Çerez bildirimimiz üzerinden bu sayfaya ulaştınız. Mağazamızın anonim analiz ve kullanıcı deneyimi çerezlerini aşağıdan kabul edebilir veya dilediğiniz zaman reddedebilirsiniz."
            : "You reached this page via our cookie banner. You can accept or decline our anonymous analytics cookies below at any time."
          : isTr
          ? "Mevcut çerez tercihiniz aşağıda belirtilmiştir. Dilediğiniz zaman bu ayarı değiştirebilirsiniz."
          : "Your current cookie preference is shown below. You can change this setting at any time."}
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs font-mono">
        <span className="text-neutral-500 font-bold">{isTr ? "Mevcut Durum:" : "Status:"}</span>
        <span
          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
            consent === "accepted"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : consent === "declined"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          }`}
        >
          {consent === "accepted"
            ? isTr
              ? "✓ Kabul Edildi"
              : "✓ Accepted"
            : consent === "declined"
            ? isTr
              ? "✗ Reddedildi"
              : "✗ Declined"
            : isTr
            ? "Belirtilmedi (Temel Mod)"
            : "Not Set"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => handleSetConsent("accepted")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
            consent === "accepted"
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-neutral-950 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          <span>{isTr ? "Çerezleri Kabul Et" : "Accept Cookies"}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSetConsent("declined")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
            consent === "declined"
              ? "border-red-500 bg-red-950/40 text-red-300"
              : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white"
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>{isTr ? "Çerezleri Reddet" : "Decline Cookies"}</span>
        </button>
      </div>

      {feedback && (
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
