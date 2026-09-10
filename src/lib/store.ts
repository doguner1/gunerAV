const rawPhone = process.env.NEXT_PUBLIC_STORE_PHONE || "0545 876 87 99";
const cleanPhone = rawPhone.replace(/\s+/g, "");
const formattedPhone =
  cleanPhone.length === 11 && cleanPhone.startsWith("0")
    ? `${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7, 9)} ${cleanPhone.slice(9, 11)}`
    : rawPhone;

export const STORE_INFO = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Malatya Av Güner Av Bayii",
  nameShort: "Güner AV",
  category: "Av Malzemeleri Dükkanı",
  hidePrices: process.env.NEXT_PUBLIC_HIDE_PRICES !== "false", // Tüm ürünlerin fiyatını gizler (varsayılan: true)
  phone: formattedPhone,
  phoneDisplay: formattedPhone,
  phoneIntl: process.env.NEXT_PUBLIC_STORE_PHONE_INTL || "+905458768799",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "905458768799",
  email: process.env.NEXT_PUBLIC_STORE_EMAIL || "iletisim@gunerav.site",
  address:
    process.env.NEXT_PUBLIC_STORE_ADDRESS ||
    "Yunus pide fırının yanı, Şeyh Bayram, 6. Sk., 44090 Yeşilyurt/Malatya",
  plusCode: process.env.NEXT_PUBLIC_STORE_PLUS_CODE || "87QR+82 Yeşilyurt, Malatya",
  coordinates: {
    lat: Number(process.env.NEXT_PUBLIC_STORE_LAT) || 38.338339299357045,
    lng: Number(process.env.NEXT_PUBLIC_STORE_LNG) || 38.290050394441316,
  },
  rating: 5.0,
  reviewCount: 12,
  hours: {
    weekdays: "08:30 - 20:00",
    saturday: "08:30 - 20:00",
    sunday: "10:00 - 18:00",
    summary: "Açık · Kapanış saati: 20:00",
  },
  mapsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=38.338339299357045,38.290050394441316",
  mapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3131.956697858482!2d38.2874754!3d38.3383393!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4076378e90637b4f%3A0x87qr82!2s%C5%9Eeyh%20Bayram%2C%206.%20Sk.%2C%2044090%20Ye%C5%9Filyurt%2FMalatya!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.gunerav.site").replace(/\/+$/, ""),
};
