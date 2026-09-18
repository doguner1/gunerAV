-- ==============================================================================
-- Güner AV - Tedarikçi Birebir Ürün Linki (supplier_url) Migration
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor alanına yapıştırıp "Run"a basınız.
-- ==============================================================================

-- 1. supplier_id ve supplier_url kolonlarını ekle (Mevcut verileri kesinlikle bozmaz)
alter table public.products add column if not exists supplier_id integer default 2;
alter table public.products add column if not exists supplier_url text;

-- 2. Bilgilendirme Notu:
-- Artık eklenti üzerinden tekli veya toplu çekilen ürünlerin tedarikçi kaynak linki
-- gizli olarak admin panelinizde saklanır ve '🔗 ozlerav' / '🔗 arslansilah' olarak tıklanabilir.
