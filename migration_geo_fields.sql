-- TeknoVersus — Faz 1 (GEO kuralları): news tablosuna yeni alanlar
-- Supabase SQL Editor'de çalıştır.

alter table news add column if not exists tldr text default '';
alter table news add column if not exists table_data jsonb default '[]'::jsonb;
alter table news add column if not exists faq jsonb default '[]'::jsonb;
alter table news add column if not exists conclusion text default '';
