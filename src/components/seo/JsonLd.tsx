import { STORE_INFO } from "@/lib/store";
import { Product } from "@/types/product";

export function StoreJsonLd({ nonce }: { nonce?: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SportingGoodsStore",
    "name": STORE_INFO.name,
    "image": `${STORE_INFO.siteUrl}/images/og-image.jpg`,
    "@id": `${STORE_INFO.siteUrl}/#store`,
    "url": STORE_INFO.siteUrl,
    "telephone": STORE_INFO.phoneIntl,
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Şeyh Bayram, 6. Sk. (Yunus pide fırının yanı)",
      "addressLocality": "Yeşilyurt",
      "addressRegion": "Malatya",
      "postalCode": "44090",
      "addressCountry": "TR",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": STORE_INFO.coordinates.lat,
      "longitude": STORE_INFO.coordinates.lng,
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": STORE_INFO.rating.toFixed(1),
      "reviewCount": STORE_INFO.reviewCount.toString(),
      "bestRating": "5",
      "worstRating": "1",
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "08:30",
        "closes": "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Sunday"],
        "opens": "10:00",
        "closes": "18:00",
      },
    ],
  };

  return (
    <script
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}

export function ProductJsonLd({
  nonce,

  product,
  locale = "tr",
}: {
  product: Product;
  locale?: string;
  nonce?: string;
}) {
  const isTr = locale === "tr";
  const name = isTr ? product.name_tr : product.name_en;
  const description = isTr ? product.description_tr : product.description_en;
  const slug = (isTr ? product.slug_tr : product.slug_en) || product.id;

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": name,
    "image": product.images.map((img) =>
      img.startsWith("http") ? img : `${STORE_INFO.siteUrl}${img}`
    ),
    "description": description,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Güner AV",
    },
    ...(!product.requires_license && product.price && !STORE_INFO.hidePrices
      ? {
          "offers": {
            "@type": "Offer",
            "url": `${STORE_INFO.siteUrl}/${locale}/products/${slug}`,
            "priceCurrency": "TRY",
            "price": product.price,
            "availability": product.in_stock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": STORE_INFO.name,
            },
          },
        }
      : {}),
  };

  return (
    <script
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}

export function BreadcrumbListJsonLd({
  nonce,

  items,
}: {
  items: { name: string; url: string }[];
  nonce?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith("http") ? item.url : `${STORE_INFO.siteUrl}${item.url}`,
    })),
  };

  return (
    <script
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}

export function CollectionPageJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": name,
    "description": description,
    "url": url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}

export function WebPageJsonLd({
  name,
  description,
  url,
  type = "WebPage",
}: {
  name: string;
  description: string;
  url: string;
  type?: "WebPage" | "AboutPage" | "ContactPage";
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": type,
    "name": name,
    "description": description,
    "url": url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}

export function FAQPageJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}

export function ItemListJsonLd({
  items,
  url,
}: {
  items: { name: string; url: string }[];
  url: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "url": url,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": item.url,
      "name": item.name,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}
