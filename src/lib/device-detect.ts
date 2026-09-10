/**
 * Güner AV — Server-side User-Agent Based Device Detector
 *
 * Sunucu tarafında HTTP User-Agent header'ından cihaz tipini tespit eder.
 * Client tarafındaki ekran genişliği (window.innerWidth) tabanlı tahmine
 * GÜVENME — çünkü pencere küçük açıksa PC "tablet" ya da "mobil" sayılır.
 *
 * Bu fonksiyon yalnızca sunucu tarafı route'larında (API routes) kullanılır.
 */
export function detectDeviceType(
  userAgent: string,
  is_ipad_pro_hint?: boolean
): "mobile" | "tablet" | "desktop" {
  if (!userAgent || userAgent === "unknown") {
    if (is_ipad_pro_hint) return "tablet";
    return "desktop";
  }

  const ua = userAgent.toLowerCase();

  // 1. Tablet kontrolü (mobile'dan önce olmalı, çünkü bazı tablet UA'ları "mobile" de içerir)
  if (
    /ipad/.test(ua) ||
    /matepad|mediapad/.test(ua) ||
    (ua.includes("huawei") && (ua.includes("tablet") || (!ua.includes("mobile") && !ua.includes("phone")))) ||
    /harmonyos.*tablet/.test(ua) ||
    /android(?!.*mobile)/.test(ua) ||        // Android tablet: "android" var ama "mobile" yok
    /\btablet\b/.test(ua) ||
    /kindle|silk/.test(ua) ||
    /playbook/.test(ua)
  ) {
    return "tablet";
  }

  // 2. Mobil kontrolü
  if (
    /mobile/.test(ua) ||
    /iphone|ipod/.test(ua) ||
    /android.*mobile/.test(ua) ||
    /blackberry/.test(ua) ||
    /windows phone/.test(ua) ||
    /\bwpdesktop\b/.test(ua) ||
    /opera mini/.test(ua) ||
    /\bmobi\b/.test(ua)
  ) {
    return "mobile";
  }

  // 3. iPad Pro hibrit kontrolü (macOS UA + touch points > 1)
  if (is_ipad_pro_hint && /macintosh/.test(ua)) {
    return "tablet";
  }

  // 4. Diğer her şey masaüstü
  return "desktop";
}
