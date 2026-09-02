import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { STORE_INFO } from "@/lib/store";
import { ShieldCheck, Lock, FileText, CheckCircle2 } from "lucide-react";

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
      ? "Gizlilik Politikası & KVKK | Malatya Av Güner Av Bayii"
      : "Privacy Policy & GDPR | Guner AV Hunting Dealer",
    description: isTr
      ? "Malatya Av Güner Av Bayii 6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Çerez Politikası bilgilendirme metni."
      : "Privacy Policy and personal data protection information for Guner AV Hunting Dealer.",
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: {
        tr: "/tr/privacy",
        en: "/en/privacy",
      },
    },
  };
}

export default function PrivacyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pt-28 pb-20 transition-colors">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
            Yasal Bilgilendirme
          </span>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-5xl mt-2">
            Gizlilik &amp; KVKK Politikası
          </h1>
          <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
            Son Güncelleme: Eylül 2026 · {STORE_INFO.name}
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 font-medium">
          {/* Section 1 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 text-neutral-950 dark:text-white">
              <ShieldCheck className="h-5 w-5 text-[#b45309] dark:text-[#d4af37]" />
              <h2 className="font-heading text-lg font-bold uppercase">
                1. Genel Bilgilendirme ve Veri Sorumlusu
              </h2>
            </div>
            <p>
              {STORE_INFO.name} (“Güner AV”) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu
              (“KVKK”) ve ilgili mevzuat uyarınca, müşterilerimizin ve web sitemizi ziyaret eden
              tüm kullanıcılarımızın kişisel verilerinin gizliliğine ve güvenliğine en üst düzeyde
              önem veriyoruz.
            </p>
            <p>
              Veri Sorumlusu: <strong>{STORE_INFO.name}</strong>
              <br />
              Adres: {STORE_INFO.address}
              <br />
              İletişim: {STORE_INFO.phone} | {STORE_INFO.email}
            </p>
          </div>

          {/* Section 2 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 text-neutral-950 dark:text-white">
              <Lock className="h-5 w-5 text-[#b45309] dark:text-[#d4af37]" />
              <h2 className="font-heading text-lg font-bold uppercase">
                2. Toplanan Kişisel Veriler ve İşlenme Amaçları
              </h2>
            </div>
            <p>
              Web sitemiz bir vitrin ve tanıtım platformudur. Kullanıcı kaydı, sepet veya online
              ödeme işlemleri yapılmamaktadır. Sitemiz üzerinden yalnızca:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>İletişim formu aracılığıyla ilettiğiniz ad, soyad, telefon ve e-posta bilgileri,</li>
              <li>WhatsApp bağlantısı üzerinden başlattığınız doğrudan yazışmalar,</li>
              <li>Dil tercihinizin (TR / EN) hatırlanması için kullanılan temel oturum çerezleri işlenmektedir.</li>
            </ul>
            <p>
              Bu veriler yalnızca taleplerinize cevap verilmesi, ürün bilgi taleplerinizin
              karşılanması ve müşteri ilişkilerinin yürütülmesi amacıyla sınırlı olarak işlenir.
            </p>
          </div>

          {/* Section 3 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 text-neutral-950 dark:text-white">
              <FileText className="h-5 w-5 text-[#b45309] dark:text-[#d4af37]" />
              <h2 className="font-heading text-lg font-bold uppercase">
                3. Çerez (Cookie) Kullanımı ve Tercihleriniz
              </h2>
            </div>
            <p>
              Web sitemizde ziyaretçilerimizin gezinme deneyimini geliştirmek amacıyla zorunlu ve
              tercih çerezleri kullanılmaktadır. Bu çerezler cihazınıza zarar vermez ve kişisel
              bilgilerinizi depolamaz.
            </p>
            <p>
              Tarayıcınızın ayarlarından çerezleri dilediğiniz zaman engelleyebilir, silebilir veya
              çerez gönderildiğinde uyarı alacak şekilde ayarlayabilirsiniz.
            </p>
          </div>

          {/* Section 4 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 text-neutral-950 dark:text-white">
              <CheckCircle2 className="h-5 w-5 text-[#b45309] dark:text-[#d4af37]" />
              <h2 className="font-heading text-lg font-bold uppercase">
                4. KVKK Kapsamındaki Haklarınız
              </h2>
            </div>
            <p>
              KVKK'nın 11. maddesi uyarınca veri sahipleri; kişisel verilerinin işlenip işlenmediğini
              öğrenme, işlenmişse bilgi talep etme, silinmesini veya düzeltilmesini isteme haklarına
              sahiptir. Bu kapsamdaki taleplerinizi {STORE_INFO.email} adresimize veya mağazamıza
              şahsen başvurarak iletebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
