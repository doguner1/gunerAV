# Güner AV — Malatya Av Malzemeleri & Doğa Sporları Vitrin Web Sitesi

Malatya Av Güner Av Bayii için geliştirilmiş; modern, yüksek hızlı, SEO uyumlu, çift dilli (TR/EN) ve siyah-beyaz lüks kontrast tasarımına sahip tanıtım ve vitrin web sitesi.

---

## 🌟 Öne Çıkan Özellikler

- **Modern Teknoloji Yığını:** Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS.
- **Çift Dilli Destek (i18n):** `next-intl` ile kusursuz TR (`/tr/...`) ve EN (`/en/...`) dil rotalaması ve dinamik dil değiştirici.
- **İzole Veri Katmanı:** Tüm ürünler [`/data/products.json`](./data/products.json) ve kategoriler [`/data/categories.json`](./data/categories.json) içerisinde tutulur. Bileşenlerde hardcoded veri yoktur; dosya güncellendiğinde tüm site anında güncellenir.
- **Yasal Ruhsat & Regülasyon Koruması:** Ateşli silah ve mühimmat gibi yasal ruhsat gerektiren ürünlerde otomatik yasal uyarı kutusu gösterilir ve doğrudan mağaza/WhatsApp yönlendirmesi yapılır (online sepet/satış yoktur).
- **Google İşletmem & Harita Entegrasyonu:** Malatya Yeşilyurt mağazasının net koordinatları, Plus Code (`87QR+82`), açılış-kapanış saatleri ve 5.0 Google değerlendirmeleri.
- **Google Lighthouse:** Masaüstü **100/100**, Mobil **90+** performans, erişilebilirlik ve SEO skorları.
- **Tam Kapsamlı SEO:** JSON-LD `LocalBusiness` ve `Product` şemaları, dinamik `sitemap.xml`, `robots.txt` ve OpenGraph meta etiketleri.
- **WhatsApp Canlı Destek:** Sağ altta sabit, ilgili ürünün adını otomatik mesaja ekleyen WhatsApp iletişim butonu.

---

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Ortam Değişkenlerini Tanımlayın
`.env.example` dosyasını `.env.local` olarak kopyalayabilir veya düzenleyebilirsiniz:
```bash
cp .env.example .env.local
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

### 4. Üretim (Production) Derlemesi
```bash
npm run build
npm run start
```

---

## 📁 Proje Yapısı

```text
├── data/
│   ├── categories.json       # Dinamik kategori listesi
│   └── products.json         # Tüm ürün verileri (buradan düzenlenir)
├── public/
│   ├── images/
│   │   ├── categories/       # Kategori görselleri (WebP)
│   │   └── products/         # Ürün görselleri (WebP)
│   └── icon.png              # Favicon
├── src/
│   ├── app/                  # Next.js App Router sayfaları
│   │   └── [locale]/         # TR ve EN dinamik rotaları
│   ├── components/           # UI ve layout bileşenleri
│   ├── i18n/                 # next-intl konfigürasyonu
│   ├── lib/                  # Yardımcı fonksiyonlar & veri erişim katmanı
│   ├── messages/             # TR ve EN çeviri sözlükleri
│   └── types/                # TypeScript tip tanımlamaları
└── tailwind.config.ts        # Monokrom taktik tasarım sistemi
```

---

## 📍 Mağaza Bilgileri

- **İşletme:** Malatya Av Güner Av Bayii (Google 5.0 ★)
- **Adres:** Yunus pide fırının yanı, Şeyh Bayram, 6. Sk., 44090 Yeşilyurt/Malatya
- **Telefon & WhatsApp:** 0545 876 87 99
- **Plus Code:** 87QR+82 Yeşilyurt, Malatya
- **Koordinatlar:** 38.338339299357045, 38.290050394441316
