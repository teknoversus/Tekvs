-- TeknoVersus — Haber kapak görseli + yayın saati (Discover / Önemli haberler)
-- Supabase → SQL Editor'de BİR KEZ çalıştır. Tekrar çalıştırmak zararsızdır.
-- Kod push edilmeden ÖNCE çalıştırılmalı (admin paneli bu kolonları kullanıyor).
-- Sadece kolon/tetikleyici/depo ekler; hiçbir satırı değiştirmez, deploy tetiklemez.

-- 1) Yeni kolonlar
alter table news add column if not exists image_url    text;
alter table news add column if not exists image_alt    text default '';
alter table news add column if not exists image_credit text default '';
alter table news add column if not exists published_at timestamptz;
alter table news add column if not exists updated_at   timestamptz;

-- 2) Mevcut satırlara DOKUNULMAZ (UPDATE yok): her satır güncellemesi
--    Supabase webhook'unu tetikleyip gereksiz deploy başlatırdı. Eski
--    haberlerde published_at boş kalır; build bunun yerine created_at'i
--    kullanır (haberin tarihiyle aynı günse gerçek saat, değilse 09:00).

-- 3) Yeni haberlerde yayın zamanı otomatik dolsun (sadece yeni satırlar)
alter table news alter column published_at set default now();

-- 4) Her düzenlemede updated_at otomatik güncellensin (dateModified için).
--    Sadece içerikle ilgili bir alan değiştiğinde güncellenir; silme/onay gibi
--    işlemler "güncellendi" saymaz.
create or replace function news_touch_updated_at() returns trigger
language plpgsql as $$
begin
  if (new.title, new.summary, new.body, new.cat, new.image_url, new.image_alt, new.image_credit,
      new.tldr, new.table_data, new.faq, new.conclusion, new.related_product_id)
     is distinct from
     (old.title, old.summary, old.body, old.cat, old.image_url, old.image_alt, old.image_credit,
      old.tldr, old.table_data, old.faq, old.conclusion, old.related_product_id) then
    new.updated_at := now();
  end if;
  return new;
end $$;

drop trigger if exists news_touch_updated_at on news;
create trigger news_touch_updated_at
  before update on news
  for each row execute function news_touch_updated_at();

-- 5) Görsel deposu: herkese açık okunur 'news-images' klasörü (en fazla 10 MB,
--    sadece JPEG/PNG/WebP). Admin paneli fotoğrafı 2000 px'e küçültüp buraya yükler.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-images', 'news-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Sadece giriş yapmış admin yükleyip silebilir; okumak herkese açık (public bucket).
drop policy if exists "news_images_admin_insert" on storage.objects;
create policy "news_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'news-images');

drop policy if exists "news_images_admin_update" on storage.objects;
create policy "news_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'news-images')
  with check (bucket_id = 'news-images');

drop policy if exists "news_images_admin_delete" on storage.objects;
create policy "news_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'news-images');

-- Kontrol: aşağıdaki sorgu 5 satır döndürmeli.
select column_name, data_type from information_schema.columns
 where table_name = 'news' and column_name in ('image_url','image_alt','image_credit','published_at','updated_at');
