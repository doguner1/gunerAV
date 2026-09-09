"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Crosshair, MapPin, ArrowRight, Sliders, Copy, Check, RotateCcw, X, Eye, Monitor, Smartphone, Star, Sparkles } from "lucide-react";
import { Product } from "@/types/product";

interface HeroSpotlightStudioProps {
  spotlightProduct?: Product;
  featuredProductSlug: string;
  spotlightTitle: string;
  spotlightImage: string;
  badgeText: string;
  inStockText: string;
  featuredModelText?: string;
  discountPrefixText?: string;
  discountHighlightText?: string;
  googleBadgeTitle?: string;
  googleBadgeSubtitle?: string;
  reviewCount: number;
  mapsUrl?: string;
  inspectText: string;
}

export interface DesignConfig {
  width: number;        // px
  offsetX: number;      // px (translate X: negative = left/center, positive = right)
  offsetY: number;      // px (translate Y: negative = up, positive = down)
  imageHeight: number;  // px
  borderRadius: number; // px
  bgOpacity: number;    // %
  padding: number;      // px
}

// 1. TAM EKRAN (1920x1080) KULLANICININ SABİTLEDİĞİ AYAR (KORUMALI)
export const FULLSCREEN_CONFIG: DesignConfig = {
  width: 445,
  offsetX: 80,
  offsetY: -200,
  imageHeight: 315,
  borderRadius: 40,
  bgOpacity: 30,
  padding: 18,
};

// 2. PENCERE / YARIM EKRAN KULLANICININ ONAYLADIĞI YENİ AYAR
export const DEFAULT_WINDOWED_CONFIG: DesignConfig = {
  width: 430,
  offsetX: 80,
  offsetY: -180,
  imageHeight: 290,
  borderRadius: 40,
  bgOpacity: 20,
  padding: 18,
};

export default function HeroSpotlightStudio({
  spotlightProduct,
  featuredProductSlug,
  spotlightTitle,
  spotlightImage,
  badgeText,
  inStockText,
  featuredModelText,
  discountPrefixText,
  discountHighlightText,
  googleBadgeTitle,
  googleBadgeSubtitle,
  reviewCount,
  mapsUrl,
  inspectText,
}: HeroSpotlightStudioProps) {
  const [fullscreenConfig, setFullscreenConfig] = useState<DesignConfig>(FULLSCREEN_CONFIG);
  const [windowedConfig, setWindowedConfig] = useState<DesignConfig>(DEFAULT_WINDOWED_CONFIG);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isStudioEnabled, setIsStudioEnabled] = useState(false); // Varsayılan kapalı (ziyaretçiler ve temiz görünüm için)
  const [isDesktop, setIsDesktop] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 1920, height: 1080 });
  const [editMode, setEditMode] = useState<"windowed" | "fullscreen">("windowed");
  const [copied, setCopied] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // URL parametresi (?design=1, ?studio=1, ?tasarim=1) veya Alt+D kısayolu ile istendiğinde stüdyoyu aç
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("studio") === "1" || params.get("design") === "1" || params.get("tasarim") === "1") {
        setIsStudioEnabled(true);
        setIsPanelOpen(true);
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        // Alt + D veya Ctrl + Shift + D ile stüdyo açılıp kapanabilir
        if ((e.altKey && (e.key === "d" || e.key === "D")) || (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d"))) {
          e.preventDefault();
          setIsStudioEnabled((prev) => !prev);
          setIsPanelOpen((prev) => !prev);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, []);

  // Ekran boyutunu anlık takip et
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsDesktop(w >= 1024);
      setScreenSize({ width: w, height: h });

      // Eğer ekran 1920x1080 tam ekran değilse (pencere / laptop) pencere moduna geç
      if (w < 1880 || h < 940) {
        setEditMode("windowed");
      } else {
        setEditMode("fullscreen");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Şu anki ekran pencere / yarım ekran modunda mı?
  const isCurrentlyWindowed = isDesktop && (screenSize.width < 1880 || screenSize.height < 940);

  // Önceden ayarlanmış değerler varsa yükle
  useEffect(() => {
    try {
      const savedWin = localStorage.getItem("gunerav_hero_windowed_config_v3");
      if (savedWin) {
        setWindowedConfig(JSON.parse(savedWin));
      }
      const savedFull = localStorage.getItem("gunerav_hero_fullscreen_config_v3");
      if (savedFull) {
        setFullscreenConfig(JSON.parse(savedFull));
      }
    } catch {
      // ignore
    }
  }, []);

  // Seçili modun parametresini güncelle
  const updateParam = (key: keyof DesignConfig, value: number) => {
    if (editMode === "windowed") {
      setWindowedConfig((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem("gunerav_hero_windowed_config_v3", JSON.stringify(next));
        } catch {}
        return next;
      });
    } else {
      setFullscreenConfig((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem("gunerav_hero_fullscreen_config_v3", JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  // Hazır konumu uygula
  const applyPreset = (preset: Partial<DesignConfig>) => {
    if (editMode === "windowed") {
      setWindowedConfig((prev) => {
        const next = { ...prev, ...preset };
        try {
          localStorage.setItem("gunerav_hero_windowed_config_v3", JSON.stringify(next));
        } catch {}
        return next;
      });
    } else {
      setFullscreenConfig((prev) => {
        const next = { ...prev, ...preset };
        try {
          localStorage.setItem("gunerav_hero_fullscreen_config_v3", JSON.stringify(next));
          return next;
        } catch {}
        return next;
      });
    }
  };

  // Sıfırla
  const resetCurrentMode = () => {
    if (editMode === "windowed") {
      setWindowedConfig(DEFAULT_WINDOWED_CONFIG);
      try {
        localStorage.removeItem("gunerav_hero_windowed_config_v3");
      } catch {}
    } else {
      setFullscreenConfig(FULLSCREEN_CONFIG);
      try {
        localStorage.removeItem("gunerav_hero_fullscreen_config_v3");
      } catch {}
    }
  };

  // Ekranda uygulanan aktif config:
  // Panel açıksa kullanıcının canlı kaydırdığı modu gösterir; kapalıyken onaylanmış resmi değerleri tam ekran / pencereye göre otomatik uygular
  const activeConfig = (isStudioEnabled && isPanelOpen)
    ? (editMode === "windowed" ? windowedConfig : fullscreenConfig)
    : (isCurrentlyWindowed ? DEFAULT_WINDOWED_CONFIG : FULLSCREEN_CONFIG);
  const currentConfig = editMode === "windowed" ? windowedConfig : fullscreenConfig;

  // Log JSON formatı
  const getLogJson = () => {
    const targetConfig = editMode === "windowed" ? windowedConfig : fullscreenConfig;
    const modeLabel = editMode === "windowed" ? "Pencere / Yarım Ekran Modu" : "Tam Ekran Modu";
    return JSON.stringify(
      {
        ayarTuru: modeLabel,
        mevcutEkran: `${screenSize.width}x${screenSize.height}px`,
        kartGenislik: `${targetConfig.width}px`,
        yatayKonum: `${targetConfig.offsetX}px (${targetConfig.offsetX < 0 ? `${Math.abs(targetConfig.offsetX)}px Sola` : `${targetConfig.offsetX}px Sağa`})`,
        dikeyKonum: `${targetConfig.offsetY}px (${targetConfig.offsetY < 0 ? `${Math.abs(targetConfig.offsetY)}px Yukarı` : `${targetConfig.offsetY}px Aşağı`})`,
        resimYukseklik: `${targetConfig.imageHeight}px`,
        koseYuvarlakligi: `${targetConfig.borderRadius}px`,
        arkaplanSaydamlik: `%${targetConfig.bgOpacity}`,
        icBosluk: `${targetConfig.padding}px`,
        hamDegerler: targetConfig,
      },
      null,
      2
    );
  };

  const handleCopyLog = async () => {
    const text = getLogJson();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShowLogModal(true);
    }
  };

  return (
    <>
      {/* 1. SPOTLIGHT CARD CONTAINER (Masaüstü Canlı Konumlandırma) */}
      <div
        className="w-full sm:max-w-md lg:max-w-none lg:w-auto lg:shrink-0 lg:self-start lg:ml-auto relative mt-6 lg:mt-0 transition-all duration-75"
      >
        {/* Dynamic Desktop Sizing & Translation Wrapper */}
        <div
          className="w-full transition-all duration-75 relative"
          style={{
            maxWidth: isDesktop ? `${activeConfig.width}px` : "100%",
            transform: isDesktop
              ? `translate3d(${activeConfig.offsetX}px, ${activeConfig.offsetY}px, 0)`
              : "none",
            marginLeft: "auto",
          }}
        >
          {/* iOS Liquid Glass Container */}
          <div
            className="relative bg-neutral-900 dark:bg-black backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.35)] overflow-hidden text-white transition-all duration-75"
            style={{
              borderRadius: `${activeConfig.borderRadius}px`,
              backgroundColor: `rgba(18, 18, 18, ${activeConfig.bgOpacity / 100})`,
              padding: `${activeConfig.padding}px`,
            }}
          >
            {/* Spotlight Header Bar */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/15">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 backdrop-blur-md border border-white/20">
                  <Crosshair className="h-3.5 w-3.5 text-[#d4af37]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                  {badgeText}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{inStockText}</span>
              </div>
            </div>

            {/* Hero Product Visual Display - Seamless Pure White Studio Box */}
            <Link
              href={featuredProductSlug}
              className="group block relative my-3 rounded-2xl bg-white border border-neutral-200/60 overflow-hidden shadow-md p-3 transition-all duration-75"
              style={{
                height: `${activeConfig.imageHeight}px`,
              }}
            >
              <Image
                src={spotlightImage}
                alt={spotlightTitle}
                fill
                unoptimized={spotlightImage.startsWith("http") || spotlightImage.startsWith("/api/img")}
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-contain p-2 object-center transition-transform duration-500 group-hover:scale-105"
              />
              {spotlightProduct ? (
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex items-end p-3.5 pointer-events-none rounded-b-2xl">
                  <div className="text-white min-w-0">
                    <div className="text-[9.5px] font-mono font-bold tracking-widest text-[#d4af37] uppercase truncate drop-shadow-md">
                      [ + ] {featuredModelText}
                    </div>
                    <div className="text-sm font-heading font-black truncate drop-shadow-md text-white">
                      {spotlightTitle}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
              )}
            </Link>

            {/* Spotlight Footer & Action */}
            <div className="flex items-center justify-between pt-3 border-t border-white/15 gap-2">
              {/* Sınırlı Süre İçin %10 İndirimde (Hafif Belirgin & Şık) */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-[#d4af37]/35 text-[#d4af37] shadow-inner shrink-0">
                  <Sparkles className="h-4 w-4 text-[#d4af37]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400/90 whitespace-nowrap">
                    {discountPrefixText || "Sınırlı Süre İçin"}
                  </span>
                  <span className="text-xs font-heading font-black text-white tracking-wide whitespace-nowrap">
                    <span className="text-[#d4af37] font-black">{discountHighlightText || "%10 İndirimde"}</span>
                  </span>
                </div>
              </div>

              <Link
                href={featuredProductSlug}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-black uppercase tracking-wider shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <span>{inspectText}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 3. FLOATING TRUST INDICATOR PILL (Google Haritalar 5.0 Star Badge) */}
          <a
            href={mapsUrl || "https://maps.google.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2.5 absolute -bottom-10 -left-4 z-20 rounded-2xl border border-white/20 bg-neutral-950/95 hover:bg-black text-white py-2 px-3.5 shadow-[0_15px_35px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all hover:scale-105 group cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-[#d4af37] group-hover:scale-110 transition-transform shrink-0">
              <Star className="h-4 w-4 fill-[#d4af37] text-[#d4af37]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-extrabold text-white tracking-wide flex items-center gap-1">
                {googleBadgeTitle || "5.0 ★ Google Haritalar"}
              </span>
              <span className="text-[10px] font-medium text-neutral-400 group-hover:text-neutral-300 transition-colors">
                {googleBadgeSubtitle || "Malatya'nın En Yüksek Puanlı Bayii"} ({reviewCount} Yorum)
              </span>
            </div>
          </a>
        </div>
      </div>

      {/* 2. FLOATING LIVE DESIGN TOOLBOX */}
      {isStudioEnabled && (
        <div className="hidden lg:block fixed bottom-6 left-6 z-50">
          {!isPanelOpen ? (
            <button
              onClick={() => setIsPanelOpen(true)}
              className="flex items-center gap-2.5 rounded-2xl bg-neutral-950/90 hover:bg-black border border-[#d4af37]/70 text-white px-4 py-3 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all hover:scale-105 group"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4af37] text-black font-bold">
                <Sliders className="h-4 w-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-[#d4af37]">
                🛠️ Tasarım Editörünü Aç
              </span>
              {isCurrentlyWindowed && (
                <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] px-1.5 py-0.5 font-bold">
                  Yarım Ekran
                </span>
              )}
            </button>
          ) : (
            <div className="w-84 rounded-2xl bg-neutral-950/95 border border-neutral-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-4 text-white">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#d4af37] text-black font-bold">
                    <Sliders className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-heading font-black text-white uppercase tracking-wider">
                      Canlı Tasarım Stüdyosu
                    </h4>
                    <p className="text-[10px] text-neutral-400">
                      Anlık Çözünürlük: {screenSize.width}x{screenSize.height}px
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* DUAL-MODE SWITCHER (Yarım Ekran vs Tam Ekran) */}
              <div className="flex rounded-xl bg-black/80 p-1 border border-neutral-800 mb-3 gap-1">
                <button
                  type="button"
                  onClick={() => setEditMode("windowed")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    editMode === "windowed"
                      ? "bg-[#d4af37] text-black shadow-md"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>💻 Yarım / Pencere Ekran</span>
                  {isCurrentlyWindowed && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Şu Anki Ekranınız Bu Modda" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode("fullscreen")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    editMode === "fullscreen"
                      ? "bg-[#d4af37] text-black shadow-md"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>🖥️ Tam Ekran</span>
                  {!isCurrentlyWindowed && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Şu Anki Ekranınız Bu Modda" />
                  )}
                </button>
              </div>

              {/* Status Note */}
              <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-neutral-300 flex items-center justify-between">
                <span>
                  Şu an <strong>{editMode === "windowed" ? "Yarım Ekran / Pencere" : "Tam Ekran"}</strong> ayarını düzenliyorsunuz.
                </span>
                {isCurrentlyWindowed && editMode === "windowed" && (
                  <span className="text-emerald-400 font-bold">● Canlı Görünüm</span>
                )}
                {!isCurrentlyWindowed && editMode === "fullscreen" && (
                  <span className="text-emerald-400 font-bold">● Canlı Görünüm</span>
                )}
              </div>

              {/* Quick Presets */}
              <div className="mb-3 pb-3 border-b border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-[#d4af37] block mb-1.5">
                  ⚡ Hızlı Hazır Konumlar ({editMode === "windowed" ? "Pencere" : "Tam Ekran"}):
                </span>
                {editMode === "windowed" ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset({ width: 445, offsetX: 30, offsetY: -75, imageHeight: 315 })}
                      className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-left truncate transition-colors"
                    >
                      🎯 Dengeli Pencere
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset({ width: 420, offsetX: -40, offsetY: -60, imageHeight: 290 })}
                      className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-left truncate transition-colors"
                    >
                      🎯 Ortaya Doğru
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset({ width: 400, offsetX: 0, offsetY: -50, imageHeight: 260 })}
                      className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-left truncate transition-colors"
                    >
                      🎯 Kompakt Boyut
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset({ width: 450, offsetX: -80, offsetY: -40, imageHeight: 315 })}
                      className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-left truncate transition-colors"
                    >
                      🎯 Namlu Hizasında
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset(FULLSCREEN_CONFIG)}
                      className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-left truncate transition-colors"
                    >
                      🎯 Mükemmel Tam Ekran
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset({ width: 445, offsetX: 40, offsetY: -180, imageHeight: 315 })}
                      className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-left truncate transition-colors"
                    >
                      🎯 Hafif Alçak
                    </button>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 text-xs">
                {/* 1. Genişlik (En) */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-neutral-300 font-bold">📏 Kart Genişliği:</span>
                    <span className="font-mono text-[#d4af37] font-bold">{currentConfig.width}px</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="650"
                    step="5"
                    value={currentConfig.width}
                    onChange={(e) => updateParam("width", Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>

                {/* 2. Yatay Konum (Sağa / Sola / Ortaya) */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-neutral-300 font-bold">↔️ Yatay Konum (Sola / Sağa):</span>
                    <span className="font-mono text-[#d4af37] font-bold">
                      {currentConfig.offsetX < 0 ? `${Math.abs(currentConfig.offsetX)}px Sola` : `${currentConfig.offsetX}px Sağa`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-600"
                    max="150"
                    step="5"
                    value={currentConfig.offsetX}
                    onChange={(e) => updateParam("offsetX", Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-400 mt-0.5">
                    <span>⬅️ Ekran Ortasına (Sola)</span>
                    <span>Sağa Doğru ➡️</span>
                  </div>
                </div>

                {/* 3. Dikey Konum (Yukarı / Aşağı) */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-neutral-300 font-bold">↕️ Dikey Konum (Yukarı / Aşağı):</span>
                    <span className="font-mono text-[#d4af37] font-bold">
                      {currentConfig.offsetY < 0 ? `${Math.abs(currentConfig.offsetY)}px Yukarı` : `${currentConfig.offsetY}px Aşağı`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="150"
                    step="5"
                    value={currentConfig.offsetY}
                    onChange={(e) => updateParam("offsetY", Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-400 mt-0.5">
                    <span>⬆️ Daha Yukarı</span>
                    <span>Daha Aşağı ⬇️</span>
                  </div>
                </div>

                {/* 4. Resim Yüksekliği */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-neutral-300 font-bold">🖼️ Fotoğraf Yüksekliği:</span>
                    <span className="font-mono text-[#d4af37] font-bold">{currentConfig.imageHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="400"
                    step="5"
                    value={currentConfig.imageHeight}
                    onChange={(e) => updateParam("imageHeight", Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>

                {/* 5. Köşe Yuvarlaklığı */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-neutral-300 font-bold">🔘 Köşe Yuvarlaklığı:</span>
                    <span className="font-mono text-[#d4af37] font-bold">{currentConfig.borderRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="40"
                    step="2"
                    value={currentConfig.borderRadius}
                    onChange={(e) => updateParam("borderRadius", Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>

                {/* 6. Arkaplan Koyu Saydamlığı */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-neutral-300 font-bold">🌫️ Arkaplan Saydamlığı:</span>
                    <span className="font-mono text-[#d4af37] font-bold">%{currentConfig.bgOpacity}</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    step="5"
                    value={currentConfig.bgOpacity}
                    onChange={(e) => updateParam("bgOpacity", Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-3 border-t border-neutral-800 flex flex-col gap-2">
                <button
                  onClick={handleCopyLog}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-heading font-black py-2.5 px-4 text-xs uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? "Log Kopyalandı!" : `📋 ${editMode === "windowed" ? "Yarım Ekran" : "Tam Ekran"} Logunu Kopyala`}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={resetCurrentMode}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 py-1.5 px-2 text-[10px] font-bold transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Sıfırla</span>
                  </button>
                  <button
                    onClick={() => setShowLogModal(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 py-1.5 px-2 text-[10px] font-bold transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Kodu Gör</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. LOG MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-[#d4af37]/40 p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-800">
              <h3 className="font-heading font-black text-sm text-[#d4af37] uppercase">
                {editMode === "windowed" ? "💻 Yarım Ekran" : "🖥️ Tam Ekran"} Tasarım Logu
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-300 mb-2">
              Aşağıdaki kodları kopyalayıp sohbete yapıştırın. Bu ölçüleri kalıcı olarak sisteme kodlayacağım:
            </p>
            <textarea
              readOnly
              value={getLogJson()}
              className="w-full h-44 bg-black/80 font-mono text-[11px] text-emerald-400 p-3 rounded-xl border border-neutral-700 mb-3 select-all"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getLogJson());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="rounded-xl bg-[#d4af37] text-black font-bold px-4 py-2 text-xs uppercase"
              >
                {copied ? "Kopyalandı!" : "Metni Kopyala"}
              </button>
              <button
                onClick={() => setShowLogModal(false)}
                className="rounded-xl bg-neutral-800 text-white font-bold px-4 py-2 text-xs uppercase"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
