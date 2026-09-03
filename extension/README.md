# 🦅 Güner AV — Chrome Ürün Aktarma Eklentisi Kullanım Kılavuzu

Bu eklenti; tedarikçi sitelerinden av tüfeği, taktik optik, bıçak, kamp ve balıkçılık ürünlerini **tek tıkla çekip** Supabase veritabanınıza ve doğrudan **gunerav.site** web sitenize aktarmanızı sağlar.

---

## 🚀 1. Adım: Supabase Veritabanını Hazırlama (1 Dakika)

1. [Supabase Dashboard](https://supabase.com/dashboard) panelinize girin ve projenizi açın.
2. Sol menüden **SQL Editor** simgesine tıklayın.
3. `extension/supabase-schema.sql` dosyasındaki SQL kodunun tamamını kopyalayıp buraya yapıştırın ve sağ alttaki yeşil **"Run"** butonuna basın.
4. Sol menüden **Settings (Dişli) -> API** bölümüne gidin ve şu iki bilgiyi not edin:
   - **Project URL** (Örn: `https://abcdefghijklmnop.supabase.co`)
   - **anon / public Key** (Örn: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`)

---

## 🧩 2. Adım: Eklentiyi Chrome'a Yükleme (30 Saniye)

1. Google Chrome tarayıcınızı açın ve adres çubuğuna şunu yazın:
   `chrome://extensions/`
2. Sağ üst köşedeki **"Geliştirici modu" (Developer mode)** anahtarını açın.
3. Sol üstte beliren **"Paketlenmemiş öğe yükle" (Load unpacked)** butonuna tıklayın.
4. Bilgisayarınızdaki proje klasörünün içindeki **`GunerAV/extension`** klasörünü seçin.
5. Eklentiniz Chrome araç çubuğuna eklenecektir! Sağ üstteki yapboz simgesine tıklayıp **Güner AV** eklentisini sabitleyebilirsiniz (Pin).

---

## ⚙️ 3. Adım: Eklentiye Supabase Bilgilerini Girme (Sadece İlk Sefer)

1. Chrome'da Güner AV eklentisi simgesine tıklayın.
2. Açılan pencerede **"⚙️ Supabase"** sekmesine geçin.
3. 1. Adımda aldığınız **Project URL** ve **Anon Key** değerlerini yapıştırıp **"Ayarları Kaydet"**e basın.

---

## 🎯 4. Adım: Ürün Ekleme (2 Farklı Yöntem)

### YÖNTEM 1: Açık Olan Tedarikçi Sayfasından Otomatik Çekme
1. Tedarikçinizin ürün sayfasına girin (örn: Castello av tüfeği sayfası).
2. Güner AV eklentisine tıklayın.
3. **"🔍 Açık Olan Tedarikçi Sayfasını Tara"** butonuna basın.
4. Eklenti sayfadaki:
   - Ürün adını
   - Görsel linklerini
   - Marka ve Model bilgisini
   - Teknik özellikler tablosunu (Kalibre, Namlu, Sistem, Fişek Yuvası vb.)
   otomatik olarak yakalayıp form kutularına dolduracaktır!

### YÖNTEM 2: Manuel JSON Yapıştırma (AI Destekli)
1. Google Build veya herhangi bir yapay zekaya sayfa metnini verip çıkarttığınız JSON çıktısını kopyalayın.
2. Eklentide **"📋 Manuel / JSON"** sekmesine geçin ve kutuya yapıştırın.
3. **"⚡ JSON'u Forma Aktar"** butonuna basın.

---

## 🎛️ 5. Adım: Sitede Gösterim & Vitrin Ayarları (Özel Tikler)

Ürünü göndermeden önce istediğiniz seçenekleri seçebilirsiniz:

- **Vitrin Ekipmanı (Öne Çıkan):** Açık olursa ürün ana sayfa vitrininde ve katalogda en üst sıralarda çıkar.
- **Ana Sayfa Amiral Gemisi (Hero Spotlight):** Açık olursa ana sayfanın en üstündeki dev taktik vitrinde (sağdaki amiral gemisi kartta) tek olarak bu ürün sergilenir!
- **İndirim / Kampanyalı Ürün:** Açılırsa indirim yüzdesi (örn: `%15`) girebilirsiniz; sitede kırmızı indirim rozeti yanar.
- **Ruhsat Gerektirir:** Ateşli silahlar için yasal 2521 sayılı mevzuat uyarısı ve *"Sadece Mağaza Teslimi"* uyarısını otomatik ekler.
- **Mağazada Stokta:** Yeşil canlı stok göstergesi açar.

---

## 🚀 6. Adım: Gönderme

En alttaki **"🚀 Supabase'e Aktar & Sitede Yayınla"** butonuna bastığınız anda ürün saniyeler içinde Supabase'e yazılır ve web sitenizde listelenmeye başlar!
