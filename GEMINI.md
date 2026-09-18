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
