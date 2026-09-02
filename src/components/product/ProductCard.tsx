import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { Product } from "@/types/product";
import { formatPrice, generateWhatsAppLink } from "@/lib/utils";
import { STORE_INFO } from "@/lib/store";
import { MessageCircle, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
}

export default function ProductCard({ product, categoryName }: ProductCardProps) {
  const locale = useLocale();
  const t = useTranslations("Products");

  const isTr = locale === "tr";
  const name = isTr ? product.name_tr : product.name_en;
  const description = isTr ? product.description_tr : product.description_en;
  const slug = (isTr ? product.slug_tr : product.slug_en) || product.id;

  const mainImage = product.images[0] || "/images/products/optics-1.webp";

  const waMsg = isTr
    ? `Merhaba Güner Av Bayii, ${name} hakkında bilgi almak istiyorum.`
    : `Hello Guner AV, I would like to receive details regarding the ${name}.`;

  const waLink = generateWhatsAppLink(STORE_INFO.whatsappNumber, waMsg);

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-800/90 bg-neutral-950 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700 hover:shadow-2xl hover:shadow-neutral-900/50">
      {/* Top Media Area */}
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
          <Link href={`/products/${slug}`} className="block h-full w-full">
            <Image
              src={mainImage}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Category / License Badge */}
            {product.requires_license ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-red-500/50 bg-red-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 backdrop-blur-md">
                <ShieldAlert className="h-3 w-3" />
                {t("licenseRequired")}
              </span>
            ) : categoryName ? (
              <span className="rounded-md border border-neutral-700 bg-neutral-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-300 backdrop-blur-md">
                {categoryName}
              </span>
            ) : null}

            {/* Discount Badge */}
            {product.discount_percent && (
              <span className="rounded-md border border-[#d4af37]/50 bg-[#d4af37]/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#d4af37] backdrop-blur-md">
                %{product.discount_percent} İNDİRİM
              </span>
            )}
          </div>

          {/* Stock Tag */}
          <div className="absolute bottom-3 left-3 pointer-events-none">
            {product.in_stock && (
              <span className="inline-flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 text-[10px] font-medium text-emerald-400 backdrop-blur-md border border-emerald-900/50">
                <CheckCircle2 className="h-2.5 w-2.5" />
                {t("inStock")}
              </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5">
          <Link href={`/products/${slug}`} className="group/title block">
            <h3 className="line-clamp-1 font-heading text-base font-bold text-white transition-colors group-hover/title:text-[#d4af37]">
              {name}
            </h3>
          </Link>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-400">
            {description}
          </p>
        </div>
      </div>

      {/* Bottom Pricing & Actions */}
      <div className="border-t border-neutral-900 bg-neutral-950/80 p-5 pt-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {product.requires_license ? "Yasal Durum" : "Tavsiye Fiyat"}
          </span>
          <div className="text-right">
            {product.price ? (
              <div className="flex flex-col items-end">
                {product.discount_percent ? (
                  <span className="text-[11px] text-neutral-400 line-through">
                    {formatPrice(Math.round(product.price * (1 + product.discount_percent / 100)), locale)}
                  </span>
                ) : null}
                <span className="font-heading text-base font-extrabold text-white">
                  {formatPrice(product.price, locale)}
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-neutral-400">
                {t("askPrice")}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/products/${slug}`}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 transition-all hover:bg-neutral-800 hover:text-white"
          >
            <span>{t("details")}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-black transition-all hover:bg-neutral-200 active:scale-95"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
            <span>Sor</span>
          </a>
        </div>
      </div>
    </article>
  );
}
