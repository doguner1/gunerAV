-- ==============================================================================
-- Güner AV (gunerav.site) - Supabase Ürün Tablosu ve Yetkilendirme Şeması
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor alanına yapıştırıp "Run"a basınız.
-- ==============================================================================

-- 1. Ürünler Tablosunu Oluştur
create table if not exists public.products (
  id text primary key,                                 -- slug formatında benzersiz id (örn: castello-mod-505)
  category text not null,                              -- 'tufek-bullpup', 'tufek-sarjorlu', 'tufek-yari-otomatik', 'tufek-pompali', 'tufek-tek-kirma', 'tufek-superpoze', 'tufek-cifte', 'kamp', 'optik', 'bicak', 'giyim', 'muhimmat'
  name_tr text not null,                               -- Türkçe başlık
  name_en text,                                        -- İngilizce başlık
  slug_tr text,                                        -- Türkçe SEO dostu URL slug
  slug_en text,                                        -- İngilizce SEO dostu URL slug
  brand text,                                          -- Marka (Castello, Steiner vb.)
  model text,                                          -- Model (MOD-505, Ranger 8 vb.)
  description_tr text,                                 -- Türkçe açıklama
  description_en text,                                 -- İngilizce açıklama
  price numeric,                                       -- Tavsiye edilen fiyat (boş bırakılabilir)
  discount_percent integer,                            -- İndirim yüzdesi (örn: 15)
  images text[] not null default '{}'::text[],         -- Görsel URL dizisi
  featured boolean default false,                      -- Vitrin ürünü mü? (Katalog ve ana sayfada öne çıkar)
  is_hero_spotlight boolean default false,             -- Ana sayfa en üstündeki amiral gemisi tek ürün alanında gösterilsin mi?
  requires_license boolean default false,              -- Yasal ruhsat gerektirir mi?
  in_stock boolean default true,                       -- Stokta var mı?
  specs_tr jsonb not null default '{}'::jsonb,         -- DİNAMİK TEKNİK ÖZELLİKLER (Tüfek, balık, bıçak fark etmeksizin)
  specs_en jsonb not null default '{}'::jsonb,         -- İngilizce teknik özellikler
  variants jsonb default '[]'::jsonb,                  -- RENK & MODEL VARYANTLARI (CR01, CR02 vb. görselleriyle)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Var olan veritabanı için ek kolon (Hata vermez):
alter table public.products add column if not exists variants jsonb default '[]'::jsonb;

-- 2. Hızlı Arama & Filtreleme İndeksleri
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_featured on public.products(featured);
create index if not exists idx_products_hero_spotlight on public.products(is_hero_spotlight);
create index if not exists idx_products_specs_tr on public.products using gin(specs_tr);

-- 3. Güvenlik ve Yetkilendirme (Row Level Security - RLS)
alter table public.products enable row level security;

-- Herkes SADECE okuyabilir (Sitemiz ziyaretçileri ve arama motorları için)
drop policy if exists "Allow insert and update for authenticated or anon" on public.products;
drop policy if exists "Allow all for authenticated or anon" on public.products;
drop policy if exists "Public read access for products" on public.products;
drop policy if exists "Public read-only for products" on public.products;

create policy "Public read-only for products"
  on public.products for select
  to anon, authenticated
  using (true);

-- Not: Ürün ekleme/güncelleme/silme işlemleri sadece eklentinizde 'service_role' anahtarı
-- kullanılarak güvenle yapılır. Dışarıdan hiç kimse anon key ile ürün silemez!

-- Otomatik Güncelleme Tetikleyicisi (updated_at)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

-- Bilgi Notu:
-- Bu tablo kurulduktan sonra eklenti üzerinden gönderilen her ürün anında bu tabloya yazılır.
