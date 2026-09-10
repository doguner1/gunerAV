-- ==============================================================================
-- GÜNER AV (gunerav.site) — Kalıcı Analitik & İstatistik Veritabanı Şeması
-- ==============================================================================
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor alanına yapıştırıp "RUN" butonuna basınız.
-- ==============================================================================

-- 1. ANALYTICS EVENTS (Ham Olay Tablosu)
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,              -- 'view_item' | 'product_zoom' | 'search' |
                                          -- 'contact_whatsapp' | 'select_category' |
                                          -- 'select_variant' | 'click_phone' | 'click_location'
  visitor_id text,                       -- anonim, çerez/localStorage tabanlı UUID (kişisel veri değil)
  session_id text,                       -- tek oturumu gruplama
  product_id text,
  product_slug text,
  product_name text,
  category text,
  search_term text,
  results_count int,
  whatsapp_source text,
  path text,
  duration_seconds int,                  -- Sayfada kalma süresi (sn)
  device_type text,                      -- 'desktop' | 'mobile' | 'tablet'
  referrer text,
  ip_hash text,                          -- KVKK: Ham IP asla saklanmaz, SHA-256 ile hash'lenir
  user_agent text,
  raw_params jsonb default '{}'::jsonb
);

-- Eğer tablo zaten varsa yeni kolonu güvenle ekler:
alter table public.analytics_events add column if not exists duration_seconds int;

-- 2. HIZLI RAPORLAMA İNDEKSLERİ
create index if not exists idx_analytics_event_type on public.analytics_events(event_type);
create index if not exists idx_analytics_product_id on public.analytics_events(product_id);
create index if not exists idx_analytics_product_slug on public.analytics_events(product_slug);
create index if not exists idx_analytics_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_visitor_id on public.analytics_events(visitor_id);
create index if not exists idx_analytics_session_id on public.analytics_events(session_id);

-- 3. ROW LEVEL SECURITY (RLS) & GÜVENLİK
-- Anon (ziyaretçiler) doğrudan bu tabloya SQL ile yazamaz veya okuyamaz.
-- Yazma ve okuma sadece sunucu tarafında Next.js API route üzerinden service_role key ile yapılır.
alter table public.analytics_events enable row level security;

-- Anonim erişim kapalıdır (Varsayılan RED).
-- Sadece service_role anahtarı RLS'i bypass ederek güvenle yazar ve okur.
-- Eğer geçici olarak anon key ile test edilecekse aşağıdaki kural açılabilir:
create policy "Allow service_role full access to analytics_events"
  on public.analytics_events
  for all
  to service_role
  using (true)
  with check (true);

-- 4. AGGREGATION VIEW (En Çok İlgi Gören Ürünler Özeti)
create or replace view public.analytics_top_products as
select 
  coalesce(product_slug, product_id, 'bilinmeyen') as product_key,
  coalesce(product_name, 'İsimsiz Ürün') as product_name,
  count(*) filter (where event_type = 'view_item') as view_count,
  count(*) filter (where event_type = 'product_zoom') as zoom_count,
  count(*) filter (where event_type = 'contact_whatsapp') as whatsapp_count,
  count(*) as total_interactions,
  max(created_at) as last_interaction_at
from public.analytics_events
where product_id is not null or product_slug is not null
group by coalesce(product_slug, product_id, 'bilinmeyen'), coalesce(product_name, 'İsimsiz Ürün')
order by view_count desc;

-- 5. AGGREGATION VIEW (En Çok Aranan Terimler & Kaçırılan Talepler)
create or replace view public.analytics_search_summary as
select 
  lower(trim(search_term)) as term,
  count(*) as search_count,
  count(*) filter (where results_count = 0) as zero_result_count,
  max(created_at) as last_searched_at
from public.analytics_events
where event_type = 'search' and search_term is not null and trim(search_term) <> ''
group by lower(trim(search_term))
order by search_count desc;

-- 6. VERİ SAKLAMA / ARŞİVLEME (12 Aydan Eski Verileri Temizleme / Rollup)
create table if not exists public.analytics_monthly_rollup (
  month_date date primary key,
  event_type text not null,
  total_count int not null default 0,
  unique_visitors int not null default 0
);

-- 12 aydan eski verileri temizleme fonksiyonu (Manuel veya Supabase pg_cron ile çalıştırılabilir)
create or replace function public.cleanup_old_analytics_events()
returns int
language plpgsql
security definer
as $$
declare
  deleted_count int;
begin
  delete from public.analytics_events
  where created_at < (now() - interval '12 months');
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- 7. ACTIVE VISITORS (Canlı Ziyaretçi & Presence Heartbeat Tablosu)
create table if not exists public.active_visitors (
  visitor_id text primary key,
  path text not null default '/',
  device_type text default 'desktop',
  product_name text,
  last_seen timestamptz not null default now()
);

create index if not exists idx_active_visitors_last_seen on public.active_visitors (last_seen);

-- Row Level Security (RLS) Etkinleştir
alter table public.active_visitors enable row level security;
-- Anonim roller için hiçbir kural eklenmemiştir (varsayılan RED). Yalnızca service_role erişebilir.

