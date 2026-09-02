"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const locale = useLocale();
  const isTr = locale === "tr";
  const [selected, setSelected] = useState(0);
  const activeImage = images[selected] || images[0] || "/images/products/optics-1.webp";

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Showcase */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 shadow-sm dark:shadow-2xl">
        <Image
          src={activeImage}
          alt={`${productName} - ${isTr ? "Görsel" : "Image"} ${selected + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-all duration-300"
        />
      </div>

      {/* Thumbnails row (if more than 1 image) */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelected(idx)}
              className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border transition-all ${
                selected === idx
                  ? "border-neutral-950 dark:border-white ring-2 ring-amber-400/40"
                  : "border-neutral-300 dark:border-neutral-800 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
