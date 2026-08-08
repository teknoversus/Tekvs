// ============================================================
// TeknoVersus — otomatik build script'i
// ------------------------------------------------------------
// Bu script Netlify (veya başka bir hosting'in build adımı) tarafından
// HER DEPLOY'DA çalıştırılır. Yaptığı iş:
//   1. Supabase'deki 'products' tablosundan GÜNCEL ürün listesini çeker
//   2. Her ürün için urun/*.html SEO sayfasını üretir/günceller
//   3. sitemap.xml'i güncel URL listesiyle yeniden yazar
// Admin panelinden yeni bir ürün eklendiğinde, Supabase Database Webhook
// bu build'i otomatik tetikler (kurulum adımları için AUTOMATION.md'e bakın).
// ============================================================
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const { generateSite } = require('./lib/generate-site');
const { generateComparisons } = require('./lib/generate-comparisons');
const { generateNews } = require('./lib/generate-news');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qsetmleywkhjcntajphx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_z74ZnvDgMWR7JzQDezgdqg_G_eh3e5B';

const rootDir = __dirname;

// shared.js'ten sadece SAF YARDIMCI FONKSİYONLARI çıkar (SEED'i DEĞİL —
// ürün verisi artık Supabase'den geliyor, bu sadece render mantığı için).
function loadHelpers(){
  const sharedSrc = fs.readFileSync(path.join(rootDir, 'shared.js'), 'utf8');
  const PALETTE_MAP = {'--c1':'#2B6CB0','--c2':'#B23A5C','--c3':'#B8790F','--c4':'#1F7A6C','--c5':'#6B4C9A','--c6':'#4A5568','--c7':'#9A4B2F'};
  const context = {
    console,
    document: { documentElement: {}, getElementById: () => null },
    getComputedStyle: () => ({ getPropertyValue: (v) => PALETTE_MAP[v] || '' }),
    window: {},
  };
  vm.createContext(context);
  vm.runInContext(sharedSrc, context);
  return {
    CATS: vm.runInContext('CATS', context),
    ICONS: vm.runInContext('ICONS', context),
    colorFor: vm.runInContext('colorFor', context),
    fmtDate: vm.runInContext('fmtDate', context),
    computeScores: vm.runInContext('computeScores', context),
    productSlug: vm.runInContext('productSlug', context),
  };
}

function rowToProduct(row){
  return {
    id: row.id, name: row.name, cat: row.cat, blurb: row.blurb || '',
    addedAt: row.added_at, link: row.link || '', upcoming: !!row.upcoming,
    specs: row.specs || {},
  };
}

async function fetchProductsFromSupabase(){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?deleted=eq.false&select=*&order=added_at.desc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if(!res.ok){
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase'den ürün çekilemedi (HTTP ${res.status}): ${text}`);
  }
  const rows = await res.json();
  return rows.map(rowToProduct);
}

function rowToNews(row){
  return {
    id: row.id, title: row.title, cat: row.cat || 'Telefon',
    date: row.date, summary: row.summary || '',
    body: Array.isArray(row.body) ? row.body : [],
    relatedProductId: row.related_product_id || null,
  };
}

async function fetchNewsFromSupabase(){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/news?deleted=eq.false&select=*&order=date.desc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if(!res.ok){
    const text = await res.text().catch(() => '');
    console.warn(`UYARI: Supabase'den haber çekilemedi (HTTP ${res.status}): ${text} — haberler.html mevcut haliyle bırakılacak.`);
    return null; // 'news' tablosu henüz yoksa/erişilemezse build'i durdurma
  }
  const rows = await res.json();
  return rows.map(rowToNews);
}

async function main(){
  console.log('→ Supabase\'den canlı ürün verisi çekiliyor...');
  const products = await fetchProductsFromSupabase();
  console.log(`→ ${products.length} ürün bulundu.`);

  if(!products.length){
    console.warn('UYARI: Supabase\'de hiç ürün bulunamadı — sitemap/urun sayfaları boş kalabilir. seed_products.sql çalıştırıldı mı?');
  }

  const helpers = loadHelpers();
  generateSite({ products, ...helpers, rootDir });

  const categories = [...new Set(products.filter(p => !p.upcoming).map(p => p.cat))];
  generateComparisons({
    products, colorFor: helpers.colorFor, computeScores: helpers.computeScores,
    categories, neighborCount: 2, rootDir,
  });

  console.log('→ Supabase\'den haber verisi çekiliyor...');
  const news = await fetchNewsFromSupabase();
  if(news !== null){
    console.log(`→ ${news.length} haber bulundu.`);
    generateNews({ news, products, productSlug: helpers.productSlug, rootDir });
  }

  console.log('✓ Build tamamlandı.');
}

main().catch(err => {
  console.error('BUILD HATASI:', err.message);
  process.exit(1); // Netlify build'i başarısız işaretlesin, yarım/hatalı bir site yayınlanmasın
});
