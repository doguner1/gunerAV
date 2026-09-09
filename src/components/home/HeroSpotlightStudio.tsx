"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Crosshair, MapPin, ArrowRight, Sliders, Copy, Check, RotateCcw, X, Eye } from "lucide-react";
import { Product } from "@/types/product";

interface HeroSpotlightStudioProps {
  spotlightProduct?: Product;
  featuredProductSlug: string;
  spotlightTitle: string;
  spotlightImage: string;
  badgeText: string;
  inStockText: string;
  featuredModelText: string;
  storePickupText: string;
  reviewCount: number;
  inspectText: string;
}

interface DesignConfig {
  width: number;        // px
  offsetX: number;      // px (translate X: negative = left/center, positive = right)
  offsetY: number;      // px (translate Y: negative = up, positive = down)
  imageHeight: number;  // px
  borderRadius: number; // px
  bgOpacity: number;    // %
  padding: number;      // px
}

const DEFAULT_CONFIG: DesignConfig = {
  width: 445,
  offsetX: 80,
  offsetY: -200,
  imageHeight: 315,
  borderRadius: 40,
  bgOpacity: 30,
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
  storePickupText,
  reviewCount,
  inspectText,
}: HeroSpotlightStudioProps) {
  const [config, setConfig] = useState<DesignConfig>(DEFAULT_CONFIG);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isStudioEnabled, setIsStudioEnabled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [safeOffset, setSafeOffset] = useState<{ x: number; y: number }>({
    x: DEFAULT_CONFIG.offsetX,
    y: DEFAULT_CONFIG.offsetY,
  });

  // Check desktop viewport & dynamically clamp offsets so card never slips under header
  useEffect(() => {
    const updateLayout = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);

      if (desktop && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Calculate the slot position at scroll = 0
        const pageTop = rect.top + window.scrollY;

        // Navbar is fixed h-16 (64px). Safe distance from top of viewport is 80px (16px clearance buffer)
        const minTop = 80;
        const maxNegativeY = minTop - pageTop;
        const safeY = Math.max(config.offsetY, maxNegativeY);

        // Clamped horizontal offset to prevent hugging or overflowing right edge
        const pageRight = rect.right + window.scrollX;
        const maxAllowedRight = window.innerWidth - 16;
        const safeX =
          config.offsetX > 0
            ? Math.min(config.offsetX, Math.max(0, maxAllowedRight - pageRight))
            : config.offsetX;

        setSafeOffset({
          x: Math.round(safeX),
          y: Math.round(safeY),
        });
      }
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);

    const parentSection = containerRef.current?.closest("section");
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && parentSection) {
      observer = new ResizeObserver(() => updateLayout());
      observer.observe(parentSection);
    }

    return () => {
      window.removeEventListener("resize", updateLayout);
      if (observer) observer.disconnect();
    };
  }, [config]);

  // Studio is hidden for normal visitors, but activates whenever ?design=1 is in URL or saved in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("design") || params.has("studio") || params.has("edit") || localStorage.getItem("gunerav_studio_active") === "true") {
        setIsStudioEnabled(true);
      }
    }
  }, []);

  // Load from localStorage if user tweaked it previously in this browser session
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gunerav_hero_design_config_v2");
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const updateParam = (key: keyof DesignConfig, value: number) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem("gunerav_hero_design_config_v2", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const applyPreset = (preset: Partial<DesignConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...preset };
      try {
        localStorage.setItem("gunerav_hero_design_config_v2", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const resetDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.removeItem("gunerav_hero_design_config_v2");
    } catch {
      // ignore
    }
  };

  const getLogJson = () => {
    return JSON.stringify(
      {
        kartGenislik: `${config.width}px`,
        yatayKonum: `${config.offsetX}px (${config.offsetX < 0 ? `${Math.abs(config.offsetX)}px Sola/Ortaya` : `${config.offsetX}px Sağa`})`,
        dikeyKonum: `${config.offsetY}px (${config.offsetY < 0 ? `${Math.abs(config.offsetY)}px Yukarı` : `${config.offsetY}px Aşağı`})`,
        resimYukseklik: `${config.imageHeight}px`,
        koseYuvarlakligi: `${config.borderRadius}px`,
        arkaplanSaydamlik: `%${config.bgOpacity}`,
        icBosluk: `${config.padding}px`,
        hamDegerler: config,
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
      {/* 1. SPOTLIGHT CARD CONTAINER (Serbest Masaüstü Konumlandırma) */}
      <div
        ref={containerRef}
        className="w-full sm:max-w-md lg:max-w-none lg:w-auto lg:shrink-0 lg:self-start lg:ml-auto relative mt-6 lg:mt-0 transition-all duration-75"
      >
        {/* Dynamic Desktop Sizing & Translation Wrapper */}
        <div
          className="w-full transition-all duration-75"
          style={{
            maxWidth: isDesktop ? `${config.width}px` : "100%",
            transform: isDesktop ? `translate3d(${safeOffset.x}px, ${safeOffset.y}px, 0)` : "none",
            marginLeft: "auto",
          }}
        >
          {/* iOS Liquid Glass Container */}
          <div
            className="relative bg-neutral-900 dark:bg-black backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.35)] overflow-hidden text-white transition-all duration-75"
            style={{
              borderRadius: `${config.borderRadius}px`,
              backgroundColor: `rgba(18, 18, 18, ${config.bgOpacity / 100})`,
              padding: `${config.padding}px`,
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

            {/* Hero Product Visual Display - Height controlled live */}
            <Link
              href={featuredProductSlug}
              className="group block relative my-3 rounded-xl bg-black/45 border border-white/15 overflow-hidden backdrop-blur-xl shadow-inner p-3 transition-all duration-75"
              style={{
                height: `${config.imageHeight}px`,
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-3 pointer-events-none">
                  <div className="text-white min-w-0">
                    <div className="text-[9.5px] font-mono font-bold tracking-widest text-[#d4af37] uppercase truncate">
                      [ + ] {featuredModelText}
                    </div>
                    <div className="text-sm font-heading font-black truncate">
                      {spotlightTitle}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              )}
            </Link>

            {/* Spotlight Footer & Action */}
            <div className="flex items-center justify-between pt-3 border-t border-white/15 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-[#d4af37] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10.5px] uppercase tracking-wider font-bold text-white/90 truncate">
                    {storePickupText}
                  </span>
                  <span className="text-[9.5px] text-white/60 truncate">
                    Google 5.0 &#9733; ({reviewCount})
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
        </div>
      </div>

      {/* 2. FLOATING LIVE DESIGN TOOLBOX (Yalnızca ?design=1 ile açılır, normal ziyaretçilere kapalıdır) */}
      {isStudioEnabled && (
        <div className="hidden lg:block fixed bottom-6 left-6 z-50">
        {!isPanelOpen ? (
          <button
            onClick={() => setIsPanelOpen(true)}
            className="flex items-center gap-2.5 rounded-2xl bg-neutral-950/90 hover:bg-black border border-[#d4af37]/60 text-white px-4 py-3 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all hover:scale-105 group"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4af37] text-black font-bold">
              <Sliders className="h-4 w-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-[#d4af37]">
              🛠️ Tasarım Editörünü Aç
            </span>
          </button>
        ) : (
          <div className="w-80 rounded-2xl bg-neutral-950/95 border border-neutral-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-4 text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#d4af37] text-black font-bold">
                  <Sliders className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-heading font-black text-white uppercase tracking-wider">
                    Canlı Tasarım Editörü
                  </h4>
                  <p className="text-[10px] text-neutral-400">Kaydırarak anlık yerini ve boyutunu değiştirin</p>
                </div>
              </div>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mb-3 pb-3 border-b border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-[#d4af37] block mb-1.5">
                ⚡ Hızlı Hazır Konumlar:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset({ width: 440, offsetX: -140, offsetY: -40, imageHeight: 230 })}
                  className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-left truncate transition-colors"
                >
                  🎯 Namlu Üzeri (Dengeli)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset({ width: 460, offsetX: -320, offsetY: -20, imageHeight: 250 })}
                  className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-left truncate transition-colors"
                >
                  🎯 Ortaya Doğru
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset({ width: 400, offsetX: 0, offsetY: -80, imageHeight: 210 })}
                  className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-left truncate transition-colors"
                >
                  🎯 Tam Sağ Üst
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset({ width: 520, offsetX: -160, offsetY: -30, imageHeight: 280 })}
                  className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-left truncate transition-colors"
                >
                  🎯 Geniş & Büyük Vitrin
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 text-xs">
              {/* 1. Genişlik (En) */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-neutral-300 font-bold">📏 Kart Genişliği:</span>
                  <span className="font-mono text-[#d4af37] font-bold">{config.width}px</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="650"
                  step="5"
                  value={config.width}
                  onChange={(e) => updateParam("width", Number(e.target.value))}
                  className="w-full accent-[#d4af37] cursor-pointer"
                />
              </div>

              {/* 2. Yatay Konum (Sağa / Sola / Ortaya) */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-neutral-300 font-bold">↔️ Yatay Konum (Sola / Sağa):</span>
                  <span className="font-mono text-[#d4af37] font-bold">
                    {config.offsetX < 0 ? `${Math.abs(config.offsetX)}px Sola` : `${config.offsetX}px Sağa`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-650"
                  max="150"
                  step="5"
                  value={config.offsetX}
                  onChange={(e) => updateParam("offsetX", Number(e.target.value))}
                  className="w-full accent-[#d4af37] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-neutral-400 mt-0.5">
                  <span>⬅️ Ekranın Ortasına (Sola)</span>
                  <span>Sağa Doğru ➡️</span>
                </div>
              </div>

              {/* 3. Dikey Konum (Yukarı / Aşağı) */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-neutral-300 font-bold">↕️ Dikey Konum (Yukarı / Aşağı):</span>
                  <span className="font-mono text-[#d4af37] font-bold">
                    {config.offsetY < 0 ? `${Math.abs(config.offsetY)}px Yukarı` : `${config.offsetY}px Aşağı`}
                    {safeOffset.y !== config.offsetY && (
                      <span className="text-[9px] text-emerald-400 ml-1.5 font-normal">
                        (Aktif: {Math.abs(safeOffset.y)}px)
                      </span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="150"
                  step="5"
                  value={config.offsetY}
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
                  <span className="font-mono text-[#d4af37] font-bold">{config.imageHeight}px</span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="400"
                  step="5"
                  value={config.imageHeight}
                  onChange={(e) => updateParam("imageHeight", Number(e.target.value))}
                  className="w-full accent-[#d4af37] cursor-pointer"
                />
              </div>

              {/* 5. Köşe Yuvarlaklığı */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-neutral-300 font-bold">🔘 Köşe Yuvarlaklığı:</span>
                  <span className="font-mono text-[#d4af37] font-bold">{config.borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="40"
                  step="2"
                  value={config.borderRadius}
                  onChange={(e) => updateParam("borderRadius", Number(e.target.value))}
                  className="w-full accent-[#d4af37] cursor-pointer"
                />
              </div>

              {/* 6. Arkaplan Koyu Saydamlığı */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-neutral-300 font-bold">🌫️ Arkaplan Saydamlığı:</span>
                  <span className="font-mono text-[#d4af37] font-bold">%{config.bgOpacity}</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="95"
                  step="5"
                  value={config.bgOpacity}
                  onChange={(e) => updateParam("bgOpacity", Number(e.target.value))}
                  className="w-full accent-[#d4af37] cursor-pointer"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-col gap-2">
              <button
                onClick={handleCopyLog}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-heading font-black py-2.5 px-4 text-xs uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Log Kopyalandı!" : "📋 Bitti! Log Çıkart & Kopyala"}</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={resetDefaults}
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

      {/* 3. LOG MODAL (Eğer panoya kopyalama çalışmazsa direkt seçebilsin) */}
      {showLogModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-[#d4af37]/40 p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-800">
              <h3 className="font-heading font-black text-sm text-[#d4af37] uppercase">
                Tasarım Yapılandırma Logu
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-300 mb-2">
              Aşağıdaki kodları kopyalayıp bana (sohbete) yapıştırın. Kartı tam olarak belirlediğiniz bu ölçülere sabitleyeceğim:
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
