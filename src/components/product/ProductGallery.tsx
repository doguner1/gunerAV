"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const locale = useLocale();
  const isTr = locale === "tr";
  const [selected, setSelected] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Desktop Hover Magnifier State
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Lightbox Zoom & Pan State
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  const activeImage = images[selected] || images[0] || "/images/products/optics-1.webp";

  // Desktop Cursor Tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMousePos({ x, y });
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    resetModalZoom();
  };

  const resetModalZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Keyboard navigation & lock body scroll when Lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowRight") {
        setSelected((prev) => (prev + 1) % images.length);
        resetModalZoom();
      } else if (e.key === "ArrowLeft") {
        setSelected((prev) => (prev - 1 + images.length) % images.length);
        resetModalZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isLightboxOpen, images.length]);

  // Touch Pinch-to-Zoom & Double-Tap
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double-tap toggle zoom
        setZoomScale((prev) => (prev > 1 ? 1 : 2.5));
        setPanOffset({ x: 0, y: 0 });
      } else if (zoomScale > 1) {
        dragStartRef.current = {
          x: e.touches[0].clientX - panOffset.x,
          y: e.touches[0].clientY - panOffset.y,
        };
        setIsDragging(true);
      }
      lastTapRef.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialPinchDistRef.current;
      setZoomScale((prev) => Math.max(1, Math.min(4, prev * (ratio > 1 ? 1.03 : 0.97))));
    } else if (e.touches.length === 1 && isDragging && zoomScale > 1) {
      setPanOffset({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistRef.current = null;
    setIsDragging(false);
  };

  // Mouse drag inside Lightbox when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handleLightboxMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Main Image Showcase */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
        className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white shadow-sm dark:shadow-2xl cursor-zoom-in select-none"
      >
        {/* Scaled Image Container */}
        <div
          className="relative h-full w-full p-3 sm:p-5 flex items-center justify-center transition-transform duration-150 ease-out"
          style={{
            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
            transform: isHovered ? "scale(2.2)" : "scale(1)",
          }}
        >
          <Image
            src={activeImage}
            alt={`${productName} - ${isTr ? "Görsel" : "Image"} ${selected + 1}`}
            fill
            priority
            unoptimized={activeImage.startsWith("http")}
            sizes="(max-width: 1024px) 100vw, 800px"
            className="object-contain pointer-events-none"
          />
        </div>

        {/* Fullscreen Expand Button (Accessible on mobile & desktop) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-neutral-950/85 hover:bg-black text-white px-3 py-2 text-xs font-bold backdrop-blur-md border border-white/20 shadow-xl transition-all hover:scale-105 active:scale-95 z-10"
          title={isTr ? "Tam Ekran Büyüt & İncele" : "Fullscreen Zoom & Inspect"}
        >
          <Maximize2 className="h-4 w-4 text-[#d4af37]" />
          <span className="text-[11px] uppercase tracking-wider font-extrabold">
            {isTr ? "Tam Ekran Büyüt" : "Fullscreen"}
          </span>
        </button>

        {/* Subtle Hover Tip (Desktop) */}
        <div className="absolute top-3 left-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-md text-neutral-200 text-[10px] font-semibold px-2.5 py-1 rounded-md border border-white/10 hidden md:block">
          🔍 {isTr ? "İmleçle Yakınlaştır / Tıkla Büyüt" : "Hover to zoom / Click to expand"}
        </div>
      </div>

      {/* 2. Thumbnails Row (if more than 1 image) */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelected(idx);
                resetModalZoom();
              }}
              className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border p-1 bg-white transition-all ${
                selected === idx
                  ? "border-[#d4af37] ring-2 ring-[#d4af37]/40 shadow-md"
                  : "border-neutral-300 dark:border-neutral-800 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                unoptimized={img.startsWith("http")}
                sizes="80px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* 3. Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-2xl p-4 sm:p-6 select-none animate-in fade-in duration-200"
          onMouseMove={handleLightboxMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between z-20 pb-2 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-[#d4af37] tracking-wider uppercase">
                {selected + 1} / {images.length}
              </span>
              <h3 className="line-clamp-1 text-sm font-heading font-bold text-white max-w-xs sm:max-w-md">
                {productName}
              </h3>
            </div>

            {/* Zoom Controls & Close Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(4, prev + 0.5))}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15"
                title={isTr ? "Yakınlaştır (+)" : "Zoom In (+)"}
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(1, prev - 0.5))}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15"
                title={isTr ? "Uzaklaştır (-)" : "Zoom Out (-)"}
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              {zoomScale > 1 && (
                <button
                  type="button"
                  onClick={resetModalZoom}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-[#d4af37] transition-colors border border-white/15"
                  title={isTr ? "Sıfırla" : "Reset"}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}

              <button
                type="button"
                onClick={closeLightbox}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold transition-all shadow-lg active:scale-95 ml-2"
                title={isTr ? "Kapat (ESC)" : "Close (ESC)"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Center Image Display */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden my-4"
            onMouseDown={handleMouseDown}
          >
            {/* Previous Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((prev) => (prev - 1 + images.length) % images.length);
                  resetModalZoom();
                }}
                className="absolute left-2 sm:left-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                title={isTr ? "Önceki Görsel" : "Previous"}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Next Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((prev) => (prev + 1) % images.length);
                  resetModalZoom();
                }}
                className="absolute right-2 sm:right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                title={isTr ? "Sonraki Görsel" : "Next"}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Main Fullscreen Image with Pan and Zoom */}
            <div
              className={`relative h-full w-full max-w-5xl max-h-[75vh] flex items-center justify-center transition-transform duration-100 ${
                zoomScale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
              }`}
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
              }}
            >
              <Image
                src={activeImage}
                alt={`${productName} Fullscreen`}
                fill
                priority
                unoptimized={activeImage.startsWith("http")}
                sizes="100vw"
                className="object-contain select-none pointer-events-none"
              />
            </div>
          </div>

          {/* Modal Footer / Thumbnails & Touch Hint */}
          <div className="z-20 pt-2 border-t border-white/10 flex flex-col items-center gap-2">
            <div className="text-[11px] text-neutral-400 font-medium">
              {isTr
                ? "💡 Yakınlaştırmak için çift tıklayın veya iki parmağınızla büyütün · Çıkmak için (X) veya ESC"
                : "💡 Double tap or pinch to zoom · Press (X) or ESC to exit"}
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelected(idx);
                      resetModalZoom();
                    }}
                    className={`relative aspect-square w-14 shrink-0 overflow-hidden rounded-lg border p-0.5 bg-neutral-900 transition-all ${
                      selected === idx
                        ? "border-[#d4af37] ring-2 ring-[#d4af37]/60"
                        : "border-neutral-700 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumb ${idx + 1}`}
                      fill
                      unoptimized={img.startsWith("http")}
                      sizes="56px"
                      className="object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

