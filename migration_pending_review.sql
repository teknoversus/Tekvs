-- TeknoVersus — Yarı-otonom haber agent'ı için şema güncellemesi
-- Supabase SQL Editor'de çalıştır (supabase_setup.sql'den SONRA, tek seferlik).

alter table news add column if not exists pending_review boolean not null default false;

create index if not exists news_pending_review_idx on news (pending_review);

-- Herkese açık okuma: onaylanmış VE silinmemiş haberler.
drop policy if exists "news_public_read" on news;
create policy "news_public_read" on news
  for select using (deleted = false and pending_review = false);

-- Admin: onay bekleyenler dahil HER ŞEYİ görebilir (review kuyruğu için gerekli).
drop policy if exists "news_admin_read_all" on news;
create policy "news_admin_read_all" on news
  for select using (auth.role() = 'authenticated');

-- Haber agent'ı (kimliksiz/anon, GitHub Actions'tan çalışır) SADECE onay
-- bekleyen taslak ekleyebilir — asla direkt yayınlayamaz, güncelleyemez,
-- silemez. Agent'ın kimlik bilgisi sızsa bile en fazla "spam taslak"
-- oluşturabilir, siteye zarar veremez.
drop policy if exists "news_agent_insert_pending" on news;
create policy "news_agent_insert_pending" on news
  for insert
  with check (pending_review = true and deleted = false);
