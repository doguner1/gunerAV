-- ==============================================================================
-- GÜNER AV (gunerav.site) - Supabase RLS Güvenlik Duvarı Sıkılaştırma Scripti
-- Bu kodu Supabase Dashboard -> SQL Editor alanına yapıştırıp "Run"a basınız.
-- ==============================================================================

-- 1. Tabloda RLS (Row Level Security) Kesin Olarak Aktif Edilsin
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Eski Güvensiz Politikaları Temizle (Anonim Silme / Güncelleme Açığını Kapat)
DROP POLICY IF EXISTS "Allow insert and update for authenticated or anon" ON public.products;
DROP POLICY IF EXISTS "Allow all for authenticated or anon" ON public.products;
DROP POLICY IF EXISTS "Public read access for products" ON public.products;
DROP POLICY IF EXISTS "Public read-only for products" ON public.products;

-- 3. ZİYARETÇİLER VE WEB SİTESİ İÇİN: SADECE OKUMA (SELECT) İZNİ
-- İnternetteki hiç kimse (anon key dahil) ürün silemez veya fiyat/ürün güncelleyemez!
CREATE POLICY "Public read-only for products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. YAZMA / GÜNCELLEME / SİLME:
-- Sadece 'service_role' (Admin) yetkisine sahip Chrome Eklentiniz tarafından yapılabilir.
-- 'service_role' anahtarı Supabase tarafından RLS'i otomatik bypass ettiği için
-- ek bir gevşek RLS politikası açmaya gerek yoktur (Zero-Trust Fail-Closed).

-- Bilgi: Bu script çalıştırıldıktan sonra anon key ile atılacak herhangi bir DELETE / UPDATE
-- isteği doğrudan "HTTP 403 Forbidden / RLS Policy Violation" hatası alır.
