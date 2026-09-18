-- ==============================================================================
-- GÜNER AV (gunerav.site) — Cihaz Ayarları & Takip Dışı Bırakma Tablosu
-- ==============================================================================
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor alanına yapıştırıp "RUN"a basabilirsiniz.
-- Tablo oluşturulmasa dahi sistem otomatik olarak analytics_events tablosu üzerinden
-- çalışmaya devam eder (geriye dönük tam uyumlu).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.device_settings (
  visitor_id text PRIMARY KEY,
  alias text NOT NULL DEFAULT '',
  is_ignored boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_settings_is_ignored ON public.device_settings(is_ignored);

ALTER TABLE public.device_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to device_settings" ON public.device_settings;
CREATE POLICY "Allow all access to device_settings"
  ON public.device_settings FOR ALL
  USING (true)
  WITH CHECK (true);
