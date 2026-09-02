import { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { STORE_INFO } from "@/lib/store";
import {
  ShieldCheck,
  Award,
  Users,
  Compass,
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  Star,
} from "lucide-react";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isTr = locale === "tr";
  return {
    title: isTr
      ? "Hakkımızda | Malatya Av Güner Av Bayii"
      : "About Us | Guner AV Hunting Dealer Malatya",
    description: isTr
      ? "Malatya'da 30 yılı aşkın tecrübe, yetkili bayilik lisansları ve 5.0 Google memnuniyeti ile av ve doğa sporları tutkunlarının hizmetindeyiz."
      : "Serving outdoor and hunting enthusiasts with over 30 years of field expertise and a flawless 5.0 Google rating in Malatya.",
    alternates: {
      canonical: `/${locale}/about`,
      languages: {
        tr: "/tr/about",
        en: "/en/about",
      },
    },
  };
}

export default function AboutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <div className="min-h-screen bg-black pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Hero */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
            30 Yıllık Malatya Esnaflığı
          </span>
          <h1 className="font-heading text-3xl font-extrabold uppercase tracking-tight text-white sm:text-5xl mt-2">
            Doğaya Saygı, Kusursuz Ekipman
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-neutral-300">
            Malatya Av Güner Av Bayii, avcılık ve outdoor tutkusunu dürüst esnaflık,
            yasalara tam uyum ve profesyonel teknik danışmanlıkla birleştirir.
          </p>
        </div>

        {/* Story & Store Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-6 space-y-6 text-sm leading-relaxed text-neutral-300">
            <h2 className="font-heading text-2xl font-bold uppercase text-white">
              Gelenekten Geleceğe Güvenilir Av Bayii
            </h2>
            <p>
              Şeyh Bayram Mahallesi Yeşilyurt adresinde yer alan mağazamız, kurulduğu
              günden bu yana Malatya ve Doğu Anadolu Bölgesi'ndeki av ve doğa meraklılarının
              ilk başvurduğu güvenilir merkezlerden biri olmuştur.
            </p>
            <p>
              Bizim için avcılık sadece bir spor değil; doğayı tanıma, sabır ve yüksek güvenlik
              disiplini gerektiren bir yaşam biçimidir. Bu nedenle mağazamızda sunduğumuz her bir
              ürün, bizzat arazi koşullarında test edilmiş ve dünyanın önde gelen üreticilerinin
              resmi distribütör garantisiyle raflarımızda yerini almıştır.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800 text-xs">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <span className="font-heading text-2xl font-extrabold text-white">5.0 ★</span>
                <p className="mt-1 text-neutral-400">Google Haritalar Kusursuz Puan</p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <span className="font-heading text-2xl font-extrabold text-white">30+ Yıl</span>
                <p className="mt-1 text-neutral-400">Sektörel Deneyim ve Güven</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl">
              <Image
                src="/images/store-facade.webp"
                alt="Güner Av Bayii Mağaza Görünümü"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Pillars / Values */}
        <div className="mb-24 rounded-3xl border border-neutral-800 bg-neutral-950 p-8 sm:p-14">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
              İlkelerimiz
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase text-white mt-1">
              Güven ve Yasal Uyum Esasımızdır
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-[#d4af37]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-white uppercase">
                Yasal Mevzuata Tam Uyum
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Tüm ateşli silah ve mühimmat devirleri, T.C. İçişleri Bakanlığı ve Emniyet Genel
                Müdürlüğü mevzuatlarına uygun olarak mağazamızda yasal belgelerle tamamlanır.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-[#d4af37]">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-white uppercase">
                %100 Orijinal Ürünler
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Sahte veya faturasız hiçbir ürün işletmemize giremez. Dünyanın ve Türkiye'nin en
                prestijli üreticilerinin yetkili bayisi olarak garantili hizmet veriyoruz.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-[#d4af37]">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-white uppercase">
                Sıcak Esnaf İletişimi
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Mağazamıza gelen her misafirimiz bizim için bir müşteriden önce bir avcı dostudur.
                Çayımızı içerken en doğru ekipman seçimini birlikte yaparız.
              </p>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold uppercase text-white mb-4">
            Mağazamıza Bekliyoruz
          </h2>
          <p className="text-xs text-neutral-400 max-w-md mx-auto mb-8">
            Yunus Pide Fırını yanı, Şeyh Bayram Yeşilyurt adresindeki mağazamızı dilediğiniz
            zaman ziyaret edebilirsiniz.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-xl bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-black hover:bg-neutral-200"
            >
              Mağaza İletişim Bilgileri
            </Link>
            <Link
              href="/products"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
            >
              Ürün Kataloğuna Göz At
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
