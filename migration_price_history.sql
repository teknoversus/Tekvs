-- TeknoVersus — Faz 7: Gerçek fiyat geçmişi altyapısı
-- Supabase SQL Editor'de çalıştır.

create table if not exists price_history (
  id           bigint generated always as identity primary key,
  product_id   text not null references products(id) on delete cascade,
  price        numeric not null,
  recorded_at  date not null default current_date,
  unique(product_id, recorded_at)
);

create index if not exists price_history_product_idx on price_history (product_id, recorded_at);

alter table price_history enable row level security;

-- Herkes okuyabilir (ürün sayfasındaki grafik için).
drop policy if exists "price_history_public_read" on price_history;
create policy "price_history_public_read" on price_history
  for select using (true);

-- Sadece haftalık kayıt script'i (kimliksiz/anon, GitHub Actions'tan) ekleyebilir.
-- Admin de dahil kimse mevcut kayıtları GÜNCELLEYEMEZ/SİLEMEZ — geçmiş veri
-- olduğu gibi kalmalı, sonradan "düzeltilmemeli".
drop policy if exists "price_history_insert_only" on price_history;
create policy "price_history_insert_only" on price_history
  for insert with check (true);
