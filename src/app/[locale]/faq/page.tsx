import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import { STORE_INFO } from "@/lib/store";
import { FAQPageJsonLd, WebPageJsonLd } from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return [{ locale: "tr" }, { locale: "en" }];
}

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";
  
  const title = isTr
    ? `Sıkça Sorulan Sorular | ${STORE_INFO.name}`
    : `Frequently Asked Questions | ${STORE_INFO.name}`;
  const description = isTr
    ? "Malatya Av Güner Av Bayii hakkında sıkça sorulan sorular, kargo, ruhsat işlemleri ve iade politikalarımız."
    : "Frequently asked questions about Guner AV Hunting Store, shipping, license procedures, and return policies.";

  return {
    title,
    description,
    alternates: {
      canonical: `${STORE_INFO.siteUrl}/${locale}/faq`,
      languages: {
        tr: `${STORE_INFO.siteUrl}/tr/faq`,
        en: `${STORE_INFO.siteUrl}/en/faq`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${STORE_INFO.siteUrl}/${locale}/faq`,
      images: ["/images/og-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/og-image.jpg"],
    },
  };
}

export default async function FAQPage({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isTr = locale === "tr";
  const title = isTr
    ? `Sıkça Sorulan Sorular | ${STORE_INFO.name}`
    : `Frequently Asked Questions | ${STORE_INFO.name}`;
  const description = isTr
    ? "Malatya Av Güner Av Bayii hakkında sıkça sorulan sorular, kargo, ruhsat işlemleri ve iade politikalarımız."
    : "Frequently asked questions about Guner AV Hunting Store, shipping, license procedures, and return policies.";

  const faqs = isTr ? [
    {
      question: "Ruhsatlı av tüfeği satın almak için hangi belgeler gereklidir?",
      answer: "Yivsiz av tüfeği satın alma belgesi, nüfus cüzdanı fotokopisi, sağlık raporu, biyometrik fotoğraf ve vergi dairesinden alınacak borcu yoktur yazısı gerekmektedir."
    },
    {
      question: "Kargo ile tüfek gönderimi yapıyor musunuz?",
      answer: "Yasal mevzuatlar gereği ateşli silahlar ve ruhsata tabi ürünler kargo ile gönderilemez. Bu ürünleri doğrudan mağazamızdan gerekli belgelerle teslim almanız gerekmektedir."
    },
    {
      question: "Hangi kargo şirketleriyle çalışıyorsunuz?",
      answer: "Aksesuarlar, giyim ürünleri, kamp malzemeleri ve ruhsata tabi olmayan diğer tüm ürünlerimizi Yurtiçi Kargo ve Aras Kargo güvencesiyle Türkiye'nin her yerine gönderiyoruz."
    },
    {
      question: "İade ve değişim şartlarınız nelerdir?",
      answer: "Kullanılmamış ve ambalajı bozulmamış ürünleri 14 gün içerisinde faturası ile birlikte iade edebilir veya değiştirebilirsiniz."
    }
  ] : [
    {
      question: "What documents are required to buy a licensed hunting shotgun?",
      answer: "A valid shotgun purchase permit, ID copy, health report, biometric photos, and tax clearance document are legally required."
    },
    {
      question: "Do you ship firearms?",
      answer: "Due to legal regulations, firearms and licensed products cannot be shipped via cargo. These items must be collected in person from our store with the required documentation."
    },
    {
      question: "Which shipping companies do you use?",
      answer: "For accessories, apparel, camping gear, and all non-licensed products, we offer nationwide shipping across Turkey using Yurtiçi Kargo and Aras Kargo."
    },
    {
      question: "What is your return and exchange policy?",
      answer: "You can return or exchange unused items in their original packaging within 14 days, provided you have the original receipt."
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pt-20 pb-20 transition-colors">
      <WebPageJsonLd
        name={title}
        description={description}
        url={`${STORE_INFO.siteUrl}/${locale}/faq`}
        type="WebPage"
      />
      <FAQPageJsonLd faqs={faqs} />
      
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-b border-neutral-200 dark:border-neutral-800/80 pb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
            {isTr ? "SSS" : "FAQ"}
          </span>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-4xl mt-2">
            {isTr ? "Sıkça Sorulan Sorular" : "Frequently Asked Questions"}
          </h1>
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 font-medium max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
              <h2 className="font-heading text-lg font-bold text-neutral-950 dark:text-white mb-3">
                {faq.question}
              </h2>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
