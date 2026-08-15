-- ============================================================
-- TeknoVersus — Supabase ilk kurulum şeması
-- ------------------------------------------------------------
-- Bu dosyayı Supabase panelinde SQL Editor'e yapıştırıp BİR KEZ çalıştır.
-- Sıra önemli: önce bu dosya, SONRA seed_products.sql (ürün verisini doldurur).
--
-- Oluşturduğu tablolar, kod tarafında (shared.js, admin.html, build.js)
-- zaten kullanılan şu 4 tablodur:
--   products          → ürün kataloğu (kaynak: admin panel + seed_products.sql)
--   views              → her ürünün görüntülenme sayacı
--   ratings            → kullanıcı puan/yorumları (admin onayı gerekir)
--   product_requests   → sitede aratılıp bulunamayan ürün talepleri
-- ============================================================

-- ---- 1) products ------------------------------------------------------
create table if not exists products (
  id         text primary key,
  name       text not null,
  cat        text not null,
  blurb      text default '',
  added_at   date,
  link       text default '',
  upcoming   boolean not null default false,
  specs      jsonb not null default '{}'::jsonb,
  deleted    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists products_cat_idx on products (cat);
create index if not exists products_added_at_idx on products (added_at desc);
create index if not exists products_deleted_idx on products (deleted);

alter table products enable row level security;

-- Herkes (anon dahil) silinmemiş ürünleri okuyabilir — site bunu client-side'da çekiyor.
drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products
  for select using (deleted = false);

-- Sadece giriş yapmış (admin) kullanıcı ekleyip/güncelleyip/silebilir (soft-delete dahil).
drop policy if exists "products_admin_write" on products;
create policy "products_admin_write" on products
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---- 2) views (görüntülenme sayaçları) --------------------------------
create table if not exists views (
  product_id text primary key references products(id) on delete cascade,
  count      integer not null default 0
);

alter table views enable row level security;

-- Herkes okuyabilir; herkes artırabilir (anonim ziyaretçi sayacı) —
-- kötüye kullanım riski düşük önceliktedir, ileride rate-limit eklenebilir.
drop policy if exists "views_public_read" on views;
create policy "views_public_read" on views
  for select using (true);

drop policy if exists "views_public_upsert" on views;
create policy "views_public_upsert" on views
  for insert with check (true);

drop policy if exists "views_public_update" on views;
create policy "views_public_update" on views
  for update using (true) with check (true);

-- ---- 3) ratings (ürün puan/yorumları) ---------------------------------
create table if not exists ratings (
  id         bigint generated always as identity primary key,
  product_id text not null references products(id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  name       text default 'Anonim',
  comment    text default '',
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ratings_product_id_idx on ratings (product_id);
create index if not exists ratings_approved_idx on ratings (approved);

alter table ratings enable row level security;

-- Herkes ONAYLANMIŞ yorumları görebilir; kendi yeni yorumunu ekleyebilir (approved=false ile başlar).
drop policy if exists "ratings_public_read_approved" on ratings;
create policy "ratings_public_read_approved" on ratings
  for select using (approved = true);

drop policy if exists "ratings_public_insert" on ratings;
create policy "ratings_public_insert" on ratings
  for insert with check (approved = false);

-- Admin: onaysızlar dahil hepsini görür, onaylar/siler.
drop policy if exists "ratings_admin_read_all" on ratings;
create policy "ratings_admin_read_all" on ratings
  for select using (auth.role() = 'authenticated');

drop policy if exists "ratings_admin_write" on ratings;
create policy "ratings_admin_write" on ratings
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "ratings_admin_delete" on ratings;
create policy "ratings_admin_delete" on ratings
  for delete using (auth.role() = 'authenticated');

-- ---- 4) product_requests (bulunamayan arama talepleri) ----------------
create table if not exists product_requests (
  id         bigint generated always as identity primary key,
  query      text not null,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table product_requests enable row level security;

-- Herkes yeni talep ekleyebilir; sadece admin okuyup/çözümleyip/silebilir.
drop policy if exists "requests_public_insert" on product_requests;
create policy "requests_public_insert" on product_requests
  for insert with check (true);

drop policy if exists "requests_admin_all" on product_requests;
create policy "requests_admin_all" on product_requests
  for select using (auth.role() = 'authenticated');

drop policy if exists "requests_admin_update" on product_requests;
create policy "requests_admin_update" on product_requests
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "requests_admin_delete" on product_requests;
create policy "requests_admin_delete" on product_requests
  for delete using (auth.role() = 'authenticated');

-- ---- 5) news (haberler — admin panelinden CRUD, ayrıca yarı-otonom agent) --
-- id = URL slug'ının kendisi (örn. "google-pixel-11-serisi-tanitildi").
-- body: paragraf dizisi (jsonb array of text) — admin formunda boş satırla
-- ayrılan paragraflar otomatik diziye çevrilir.
-- pending_review: agent'ın bulup yazdığı ama admin henüz onaylamadığı haberler
-- true kalır — public_read policy'si bunları göstermez, sadece admin görür.
create table if not exists news (
  id                 text primary key,
  title              text not null,
  cat                text not null default 'Telefon',
  date               date,
  summary            text default '',
  body               jsonb not null default '[]'::jsonb,
  related_product_id text references products(id) on delete set null,
  pending_review     boolean not null default false,
  deleted            boolean not null default false,
  created_at         timestamptz not null default now(),
  -- GEO kuralları (Faz 1): AI motorlarının alıntılayabileceği yapılandırılmış alanlar.
  tldr               text default '',
  table_data         jsonb default '[]'::jsonb,
  faq                jsonb default '[]'::jsonb,
  conclusion         text default ''
);

create index if not exists news_date_idx on news (date desc);
create index if not exists news_deleted_idx on news (deleted);
create index if not exists news_pending_review_idx on news (pending_review);

alter table news enable row level security;

-- Herkes (anon dahil) silinmemiş VE onaylanmış haberleri okuyabilir.
drop policy if exists "news_public_read" on news;
create policy "news_public_read" on news
  for select using (deleted = false and pending_review = false);

-- Admin: onay bekleyenler dahil hepsini görebilir (review kuyruğu için).
drop policy if exists "news_admin_read_all" on news;
create policy "news_admin_read_all" on news
  for select using (auth.role() = 'authenticated');

-- Sadece giriş yapmış (admin) kullanıcı ekleyip/güncelleyip/silebilir (soft-delete dahil).
drop policy if exists "news_admin_write" on news;
create policy "news_admin_write" on news
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Haber agent'ı (kimliksiz/anon, GitHub Actions'tan çalışır) SADECE onay
-- bekleyen taslak ekleyebilir — asla direkt yayınlayamaz, güncelleyemez,
-- silemez. Agent'ın kimlik bilgisi sızsa bile en fazla "spam taslak"
-- oluşturabilir, siteye zarar veremez.
drop policy if exists "news_agent_insert_pending" on news;
create policy "news_agent_insert_pending" on news
  for insert
  with check (pending_review = true and deleted = false);

-- ============================================================
-- Kurulum burada bitmiyor — sırada 2 manuel adım var (aşağıya bak).
-- ============================================================
