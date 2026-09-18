-- ==============================================================================
-- GÜNER AV (gunerav.site) — İletişim Formu Mesajları Tablo Şeması
-- ==============================================================================
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor alanına yapıştırıp "RUN"a basabilirsiniz.
-- Tablo oluşturulmasa dahi sistem otomatik olarak fallback mekanizmasıyla
-- çalışmaya devam eder (hiçbir mesaj kaybolmaz).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  subject text NOT NULL DEFAULT 'general',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  user_agent text
);

-- Hızlı filtreleme ve listeleme indeksleri
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON public.contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_phone ON public.contact_messages(phone);

-- Güvenlik (Row Level Security)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 1. Service Role (Next.js Admin Sunucusu) tam yetki
DROP POLICY IF EXISTS "Allow service_role full access to contact_messages" ON public.contact_messages;
CREATE POLICY "Allow service_role full access to contact_messages"
  ON public.contact_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Web sitesi ziyaretçileri (anon) sadece yeni mesaj ekleyebilir (INSERT)
DROP POLICY IF EXISTS "Allow public insert to contact_messages" ON public.contact_messages;
CREATE POLICY "Allow public insert to contact_messages"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
