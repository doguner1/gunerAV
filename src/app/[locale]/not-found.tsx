import { Link } from "@/i18n/routing";
import { Crosshair, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-black px-4 pt-20">
      <div className="relative max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-[#d4af37]">
          <Crosshair className="h-10 w-10 animate-spin-slow" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          HATA KODU 404
        </span>

        <h1 className="font-heading text-4xl font-extrabold uppercase text-white sm:text-5xl mt-2">
          Hedef Bulunamadı
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-neutral-400 leading-relaxed">
          Aradığınız sayfa kaldırılmış, bağlantı değişmiş veya rotadan sapmış olabilirsiniz.
          Av ve doğa ekipmanlarımızı incelemek için aşağıdaki bağlantıları kullanabilirsiniz.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-neutral-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Ana Sayfa</span>
          </Link>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
          >
            <Compass className="h-4 w-4 text-[#d4af37]" />
            <span>Ürün Kataloğu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
