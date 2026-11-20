-- TeknoVersus — site içi arama kayıtları ("En çok arananlar" için)
-- Supabase > SQL Editor'e yapıştırıp bir kez çalıştır. Tekrar çalıştırmak zarar vermez.
-- Saklanan: aranan kelime, kaç sonuç çıktığı, sayfa (anasayfa/kategori), tarih.
-- Saklanmayan: IP, tarayıcı, kullanıcı — kişiyi tanıtan hiçbir şey.

create table if not exists search_logs (
  id         bigint generated always as identity primary key,
  query      text not null check (char_length(query) between 1 and 200),
  results    integer not null default 0 check (results >= 0),
  page       text not null default 'anasayfa' check (char_length(page) <= 40),
  created_at timestamptz not null default now()
);

create index if not exists search_logs_created_at_idx on search_logs (created_at desc);

alter table search_logs enable row level security;

-- Herkes kayıt ekleyebilir; sadece admin okuyabilir/silebilir (product_requests ile aynı model).
drop policy if exists "search_logs_public_insert" on search_logs;
create policy "search_logs_public_insert" on search_logs
  for insert with check (true);

drop policy if exists "search_logs_admin_select" on search_logs;
create policy "search_logs_admin_select" on search_logs
  for select using (auth.role() = 'authenticated');

drop policy if exists "search_logs_admin_delete" on search_logs;
create policy "search_logs_admin_delete" on search_logs
  for delete using (auth.role() = 'authenticated');

-- Admin paneli için hazır özet: son 30 günde en çok aranan kelimeler.
-- security_invoker sayesinde yukarıdaki RLS geçerli kalır (ziyaretçiler göremez).
create or replace view search_top_30d with (security_invoker = true) as
select
  lower(trim(query))                as query,
  count(*)                          as aranma,
  count(*) filter (where results=0) as sonucsuz,
  max(created_at)                   as son_arama
from search_logs
where created_at > now() - interval '30 days'
group by lower(trim(query))
order by aranma desc;
