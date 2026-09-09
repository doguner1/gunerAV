-- ==============================================================================
-- ⚠️ WARNING: DO NOT RUN THIS IN PRODUCTION ⚠️
-- 
-- This script opens anonymous write access to your products table, which allows
-- ANYONE on the internet to add or modify products if they find your anon key.
--
-- This was a temporary workaround for the Chrome extension during development.
-- For production, ALWAYS use the `service_role` key in the extension settings
-- (which bypasses RLS safely as an admin) and run `security-harden.sql` instead
-- to ensure the database remains secure!
-- ==============================================================================
--
-- ==============================================================================
-- GÜNER AV (gunerav.site) - Eklenti Yazma İzni / Supabase RLS Düzeltme Kodu
-- ==============================================================================
-- HATA SEBEBİ:
-- Eğer eklentiye "anon key" girdiyseniz, Supabase güvenlik duvarı (RLS)
-- varsayılan olarak anonim yazmaya (INSERT / UPDATE) izin vermez.
-- Hata Kodu: 42501 (new row violates row-level security policy for table "products")
--
-- ==============================================================================
-- ÇÖZÜM 1 (KOD ÇALIŞTIRMADAN - EN KOLAY & EN GÜVENLİ):
-- Supabase Dashboard -> Project Settings -> API sayfasına gidin.
-- Oradaki "service_role" (secret) anahtarını kopyalayın.
-- Chrome eklentisinde Ayarlar sekmesine girip "Supabase Key" alanına yapıştırıp kaydedin.
-- 'service_role' admin anahtarı olduğu için RLS'e takılmadan anında ekler!
-- ==============================================================================
--
-- ÇÖZÜM 2 (ANON KEY İLE EKLEMEK İSTERSENİZ BU KODU ÇALIŞTIRIN):
-- Aşağıdaki 2 satırı Supabase -> SQL Editor'e yapıştırıp "RUN"a basınız:

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anon key'in ürün eklemesine ve güncellemesine izin ver:
CREATE POLICY "Allow anon insert and update on products"
  ON public.products
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Not: Artık anon key kullansanız dahi eklentiden tek tıkla ürün ekleyebilirsiniz!
