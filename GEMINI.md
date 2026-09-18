# Güner AV - Proje Geliştirme ve Mimari Kuralları

## 1. Kod Hafızası ve Bağımlılık Grafiği Kullanımı (`codebase-memory`)
- **Mimari & Çok Dosyalı Analizlerde Zorunlu Kullanım:**
  - Birden fazla bileşeni, sayfayı veya veri akışını etkileyen mimari değişikliklerde,
  - Temel veri modelleri (`Product`, `Category`, `AnalyticsEvent`, `Session` vb.), Supabase veya API şeması güncellemelerinde,
  - Bir değişikliğin projede nereleri kırabileceğini (`blast radius`), fonksiyon çağrı zincirini ve dosya bağımlılıklarını incelerken,
  mutlaka `codebase-memory` MCP araçlarını (`search_graph`, `trace_path`, `get_architecture`, `query_graph`) kullan ve yan etkileri haritalandır.
- **Hafif & Odaklı İşlerde Doğrudan Müdahale:**
  - Basit UI/CSS hizalamaları, metin/i18n güncellemeleri veya tek dosyaya odaklı izole bugfix'lerde token ve bağlam şişmesini önlemek, hızlı sonuç üretmek için doğrudan `grep_search` ve `view_file` araçlarıyla devam et.

## 2. Stil ve CSP (Content Security Policy) Standartları
- Güvenlik politikaları gereği, SSR aşamasında görsel bozulmaları önlemek için inline `style="..."` attribute'ları yerine öncelikli olarak Tailwind CSS sınıflarını kullan.
- Next.js `<Image fill />` bileşenlerinde ilk yüklemede resmin yukarı yapışmasını veya kaymasını engellemek için `className` içine `!absolute !inset-0 !w-full !h-full object-contain object-center` sınıflarını daima dahil et.

## 3. Zaman Dilimi Standardı
- Projedeki tüm zaman damgaları Türkiye Saati (`Europe/Istanbul`, UTC+3) ile uyumlu olmalıdır. Sunucu tarafında tarih/saat formatlanırken `timeZone: "Europe/Istanbul"` parametresi mutlaka eklenmelidir.

## 4. Tedarikçi Entegrasyonları ve B2B Kuralları
- **Tedarikçi Kimlikleri (Supplier IDs):**
  - `supplier_id: 1`: Arslan Silah (`arslansilah.com`) - Castello ve yerli markalar.
  - `supplier_id: 2`: Özler Av (`ozlerav.com.tr`) - Sterling, Huğlu, Retay, yabancı fişekler. B2B ASP.NET Identity çerezi kullanılır.
  - `supplier_id: 3`: Altunbaş Bayi (`bayi.altunbasas.com.tr`) - Ata Arms yetkili distribütörü. B2B girişi `/hesabim/giris` endpoint'i üzerinden yapılır.
- **Ateşli Silah ve Ruhsat Kuralları:**
  - `requires_license: true` olan ateşli silahların fiyatları Türk mevzuatı gereği veritabanında `price: null` olarak tutulur ve vitrinde "Fiyat Bilgisi İçin İletişime Geçin" etiketiyle sunulur.
  - Ata Arms tüfek modelleri:
    - `SP` serisi modeller: `tufek-superpoze` kategorisine atanır.
    - `Neo`, `CY`, `Venza` serisi modeller: `tufek-yari-otomatik` kategorisine atanır.
    - Pompalı modeller: `tufek-pompali` kategorisine atanır.

## 5. Ürün İçe Aktarma, Görsel ve Açıklama Standartları
- **Görsel Ayrıştırma ve İzolasyon:**
  - Tedarikçi sitelerinden ürün çekilirken yalnızca ana ürün galerisindeki (`.xzoom` vb.) tüfeğin kendi vitrin resimleri alınır.
  - Sayfa altındaki/yanındaki önerilen ürünler (`.related-slider`, `.owl-carousel` vb.) kesinlikle filtrelenmeli; alakasız bıçak, kulaklık, çanta, dürbün görselleri ürün galerisine asla dahil edilmemelidir.
- **Tedarikçi Gizliliği (B2B Confidentiality):**
  - Müşteri arayüzünde ve teknik özelliklerde (`specs_tr`, `specs_en`) ASLA toptancı/tedarikçi adı (`Tedarikçi: Altunbaş`, `Özler Av`, `Arslan Silah` vb.) yazılmaz.
  - Tedarikçi bilgisi sadece dahili arka plan alanları olan `supplier_id` ve `supplier_url` içinde tutulur.
- **Kurumsal Standart Açıklama Şablonu:**
  - Tedarikçilerdeki ham fabrika metinleri yerine daima aşağıdaki kurumsal standart şablon kullanılır:
    `[Ürün Adı], Malatya Av Güner Av Bayii resmi güvencesiyle mağazamızda. Teknik detaylar sayfanın altındadır.`
- **Teknik Özellikler (Specs):**
  - Kalibre, Fişek Yatağı, Namlu Boyu, Şok, Ağırlık, Kundak, RIB gibi parametreler sayfa içi tablolardan temizlenerek `specs_tr` nesnesine eklenir.
