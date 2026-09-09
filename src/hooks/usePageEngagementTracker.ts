"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Güner AV — Sayfa Etkileşim Süresi İzleyici (Page Engagement Tracker)
 *
 * Next.js App Router'ın "soft navigation" (sayfadan sayfaya <Link> ile geçiş)
 * modelinde doğru çalışan süre takip hook'u.
 *
 * TEMEL MANTIK:
 * - Ekran genişliğine bağlı cihaz tespiti TAMAMEN KALDIRILDı (sunucu tarafı UA tespiti yapıyor)
 * - pathname değişince useEffect cleanup tetiklenir → süre gönderilir → yeni sayaç başlar
 * - Sekme gizlendiğinde (visibilitychange: hidden) sayaç duraklar, geri dönünce devam eder
 * - "beforeunload" fallback da ekli (tarayıcı sekmesi aniden kapatılırsa)
 * - Çift gönderimi önlemek için `sent` flag'i kullanılıyor
 */
export function usePageEngagementTracker(context: {
  type: "product" | "category" | "page";
  id?: string;
  name?: string;
  slug?: string;
}) {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0); // sekme gizliyken biriktirilen ms
  const isVisibleRef = useRef<boolean>(true);
  const sentRef = useRef<boolean>(false);

  useEffect(() => {
    // Yeni route/mount başlangıcı — sayaçları sıfırla
    startTimeRef.current = Date.now();
    accumulatedRef.current = 0;
    sentRef.current = false;
    isVisibleRef.current = document.visibilityState === "visible";

    const handleVisibility = () => {
      const now = Date.now();
      if (document.visibilityState === "hidden" && isVisibleRef.current) {
        // Sekme gizlenince o ana kadarki aktif süreyi biriktir, sayacı durdur
        accumulatedRef.current += now - startTimeRef.current;
        isVisibleRef.current = false;
      } else if (document.visibilityState === "visible" && !isVisibleRef.current) {
        // Sekmeye geri dönünce yeni sayaç başlat
        startTimeRef.current = now;
        isVisibleRef.current = true;
      }
    };

    const sendTimeSpent = () => {
      if (sentRef.current) return;
      const now = Date.now();
      // Biriktirilen (gizli sekme dışı) + şu an aktifse son parçayı ekle
      const finalMs =
        accumulatedRef.current + (isVisibleRef.current ? now - startTimeRef.current : 0);
      const seconds = Math.round(finalMs / 1000);

      if (seconds < 2) return; // anlık geçişleri sayma (bounce)

      sentRef.current = true;

      trackEvent("page_time_spent", {
        context_type: context.type,
        item_id: context.id,
        item_name: context.name,
        slug: context.slug || context.id,
        path: pathname,
        duration_seconds: seconds,
      });
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", sendTimeSpent);

    return () => {
      // Component unmount = route değişimi veya sayfa kapatma
      sendTimeSpent();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", sendTimeSpent);
    };

    // pathname değişince effect yeniden çalışır:
    // 1. Cleanup → eski sayfa için süre gönderilir
    // 2. Yeni effect → yeni sayaç başlar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
