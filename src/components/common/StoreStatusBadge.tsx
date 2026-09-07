"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function StoreStatusBadge({ className = "" }: { className?: string }) {
  const tCommon = useTranslations("Common");

  // Determine open/closed status based on Turkey time (Europe/Istanbul)
  // Store is open every day from 08:30 until 20:00 (saat 8). After 20:00 it is closed.
  const [isOpen, setIsOpen] = useState<boolean>(true);

  useEffect(() => {
    function computeOpenStatus() {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Europe/Istanbul",
          hour: "numeric",
          minute: "numeric",
          hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
        const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
        const totalMinutes = hour * 60 + minute;

        // Open: 08:30 (510 min) to 20:00 (1200 min)
        const openMin = 8 * 60 + 30; // 08:30
        const closeMin = 20 * 60;    // 20:00 (saat 8)

        setIsOpen(totalMinutes >= openMin && totalMinutes < closeMin);
      } catch {
        setIsOpen(true);
      }
    }

    computeOpenStatus();
    const timer = setInterval(computeOpenStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  if (isOpen) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-black/40 px-3.5 py-1.5 text-xs text-white backdrop-blur-md shadow-lg ${className}`}
      >
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-emerald-400 font-bold border border-emerald-500/30">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="uppercase tracking-wider text-[11px] font-black">
            {tCommon("open")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-neutral-700/60 bg-black/40 px-3.5 py-1.5 text-xs text-neutral-300 backdrop-blur-md shadow-lg ${className}`}
    >
      <div className="flex items-center gap-1.5 rounded-full bg-neutral-800/80 px-2.5 py-0.5 text-neutral-300 font-bold border border-neutral-700/80">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex h-2 w-2 rounded-full bg-neutral-400"></span>
        </span>
        <span className="uppercase tracking-wider text-[11px] font-black">
          {tCommon("closed")}
        </span>
      </div>
    </div>
  );
}
