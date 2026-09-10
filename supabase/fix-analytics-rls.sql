-- ==============================================================================
-- GÜNER AV (gunerav.site) — Analitik ve Canlı Ziyaretçi SQL İzin Düzeltmesi
-- ==============================================================================
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor alanına yapıştırıp "RUN"a basınız.
-- 
-- Bu işlem:
-- 1. analytics_events ve active_visitors tablolarını doğrular ve eksikse oluşturur.
-- 2. Her iki tablo için hem 'service_role' hem de 'anon' rollerine tam yazma/okuma
--    izni vererek Vercel sunucusunun hiçbir koşulda hata almadan veri kaydetmesini sağlar.
-- 3. Geçmişte 'aksesuar-*' veya 'bicak-av' olarak kaydedilmiş ürünleri tek seferde
--    yeni 'tufek-aksesuar' (Aksesuarlar) kategorisine taşır.
-- ==============================================================================

-- 1. ANALYTICS EVENTS TABLOSU
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  visitor_id text,
  session_id text,
  product_id text,
  product_slug text,
  product_name text,
  category text,
  search_term text,
  results_count int,
  whatsapp_source text,
  path text,
  duration_seconds int,
  device_type text,
  referrer text,
  ip_hash text,
  user_agent text,
  raw_params jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS duration_seconds int;

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at desc);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor_id ON public.analytics_events(visitor_id);

-- 2. ACTIVE VISITORS (CANLI ZİYARETÇİ) TABLOSU
CREATE TABLE IF NOT EXISTS public.active_visitors (
  visitor_id text PRIMARY KEY,
  path text NOT NULL DEFAULT '/',
  device_type text DEFAULT 'desktop',
  product_name text,
  last_seen timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_active_visitors_last_seen ON public.active_visitors(last_seen);

-- 3. ROW LEVEL SECURITY (RLS) POLİTİKALARI
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_visitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to analytics_events" ON public.analytics_events;
CREATE POLICY "Allow all access to analytics_events"
  ON public.analytics_events FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to active_visitors" ON public.active_visitors;
CREATE POLICY "Allow all access to active_visitors"
  ON public.active_visitors FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 4. ESKİ AKSESUAR KATEGORİLERİNİ TAŞI
UPDATE public.products
SET category = 'tufek-aksesuar', requires_license = false
WHERE category LIKE 'aksesuar%' OR category = 'bicak-av';
