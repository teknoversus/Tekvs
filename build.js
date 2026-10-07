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
const { generateSite, illustrationFor, productImageFor } = require('./lib/generate-site');
const { generateComparisons } = require('./lib/generate-comparisons');
const { linkHeroComparisons } = require('./lib/link-hero-comparisons');
const { generateNews } = require('./lib/generate-news');
const { generateSubcategories, buildSubcatMap } = require('./lib/generate-subcategories');
const { generateBuyingGuides } = require('./lib/generate-buying-guides');
const { generateTopicalGuides } = require('./lib/generate-topical-guides');
const { generateReviews } = require('./lib/generate-reviews');
const { generateBrandPages } = require('./lib/generate-brand-pages');
const { generateBrandVsBrandPages } = require('./lib/generate-brand-vs-brand');
const { generateClusterArticles } = require('./lib/generate-cluster-articles');
const { refreshCategoryCards } = require('./lib/refresh-category-cards');
const { generatePopulerKarsilastirmalar } = require('./lib/generate-populer-karsilastirmalar');
const { generateLandingPages } = require('./lib/generate-landing-pages');
const { generateFiyatPerformansIndeksi } = require('./lib/generate-fiyat-performans-indeksi');
const { pingIndexNow, extractSitemapUrls } = require('./scripts/indexnow-ping');
const { splitSitemap } = require('./lib/split-sitemap');

// Faz 2/3 hedef ürün listeleri artık main() içinde, o an gelen canlı
// ürün verisine göre dinamik hesaplanıyor (bkz. aşağıda).

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
    prosConsFor: vm.runInContext('prosConsFor', context),
    cardSpecEntries: vm.runInContext('cardSpecEntries', context),
    // Gösterim öncesi veri hijyeni (yer tutucular, iç notlar, bozuk hücreler,
    // şablon açıklamalar) — tarayıcıdaki ile AYNI fonksiyon (bkz. shared.js).
    prepareProducts: vm.runInContext('prepareProducts', context),
  };
}

function rowToProduct(row){
  return {
    id: row.id, name: row.name, cat: row.cat, blurb: row.blurb || '',
    addedAt: row.added_at, link: row.link || '', upcoming: !!row.upcoming,
    specs: row.specs || {},
    // GSC hızlı-kazanç pilotu: bu iki alan Supabase'den select=* ile
    // geliyordu ama burada hiç çıkarılmadığı için generate-site.js'e
    // hiç ulaşmıyordu — title/description hep otomatik şablona düşüyordu.
    custom_title: row.custom_title || null,
    custom_description: row.custom_description || null,
  };
}

async function fetchProductsFromSupabase(){
  // PostgREST tek istekte en fazla 1000 satır döndürür. Tarayıcı tarafı
  // (shared.js loadSharedProducts) bunu 3 Ekim 2026'da sayfalayarak çözmüştü;
  // build tarafı tek istekle kalmıştı — katalog 1000'i geçtiği anda en eski
  // ürünlerin sayfaları sessizce üretilmeyecekti. Aynı sayfalama burada da var.
  const PAGE_SIZE = 1000;
  let rows = [];
  for(let offset = 0, guard = 0; guard < 50; guard++, offset += PAGE_SIZE){
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?deleted=eq.false&select=*&order=added_at.desc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Range-Unit': 'items', Range: `${offset}-${offset + PAGE_SIZE - 1}` }
    });
    if(!res.ok){
      if(offset === 0){
        const text = await res.text().catch(() => '');
        throw new Error(`Supabase'den ürün çekilemedi (HTTP ${res.status}): ${text}`);
      }
      break; // sonraki sayfa yok (ör. 416) — elimizdeki satırlarla devam
    }
    const page = await res.json();
    rows = rows.concat(page);
    if(page.length < PAGE_SIZE) break;
  }
  return rows.map(rowToProduct);
}

function rowToNews(row){
  return {
    id: row.id, title: row.title, cat: row.cat || 'Telefon',
    date: row.date, summary: row.summary || '',
    body: Array.isArray(row.body) ? row.body : [],
    relatedProductId: row.related_product_id || null,
    tldr: row.tldr || '',
    table: Array.isArray(row.table_data) ? row.table_data : [],
    faq: Array.isArray(row.faq) ? row.faq : [],
    conclusion: row.conclusion || '',
  };
}

async function fetchNewsFromSupabase(){
  // Not: pending_review=eq.false burada iki kat güvenlik — RLS zaten anon
  // kullanıcıya onay bekleyen taslakları göstermiyor, ama açıkça filtrelemek
  // kodu okuyan biri için niyeti netleştiriyor.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/news?deleted=eq.false&pending_review=eq.false&select=*&order=date.desc`, {
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

// Onaylanmış (approved=true) yorumlardan ürün başına {count, average} özeti çıkarır.
// GERÇEK kullanıcı verisi olmadan AggregateRating YAZILMAZ — hiç yorumu olmayan
// bir ürün için schema.org AggregateRating eklemek yanıltıcı/kural ihlali olur.
async function fetchRatingsSummary(){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ratings?approved=eq.true&select=product_id,stars`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if(!res.ok){
    console.warn('UYARI: Supabase\'den yorum verisi çekilemedi — AggregateRating eklenmeyecek.');
    return {};
  }
  const rows = await res.json();
  const byProduct = {};
  rows.forEach(r => {
    if(!byProduct[r.product_id]) byProduct[r.product_id] = [];
    byProduct[r.product_id].push(r.stars);
  });
  const summary = {};
  Object.entries(byProduct).forEach(([pid, stars]) => {
    const count = stars.length;
    const avg = stars.reduce((a,b) => a+b, 0) / count;
    summary[pid] = { count, average: Math.round(avg * 10) / 10 };
  });
  return summary;
}

async function main(){
  console.log('→ Supabase\'den canlı ürün verisi çekiliyor...');
  const rawProducts = await fetchProductsFromSupabase();
  console.log(`→ ${rawProducts.length} ürün bulundu.`);

  if(!rawProducts.length){
    console.warn('UYARI: Supabase\'de hiç ürün bulunamadı — sitemap/urun sayfaları boş kalabilir. seed_products.sql çalıştırıldı mı?');
  }

  const helpers = loadHelpers();
  // Tüm üreticiler ham veritabanı kaydını değil, gösterime hazırlanmış ürünü alır.
  const products = helpers.prepareProducts(rawProducts);
  // Rehber/inceleme sayfaları artık TÜM (upcoming olmayan) kataloğu kapsıyor —
  // yeni ürün eklendiğinde otomatik dahil olur, elle liste güncellemeye gerek yok.
  const FAZ2_TARGET_IDS = products.filter(p => !p.upcoming).map(p => p.id);
  const FAZ3_TARGET_IDS = FAZ2_TARGET_IDS;
  const subcatMap = buildSubcatMap(products);
  console.log('→ Onaylanmış yorum özeti çekiliyor (AggregateRating için)...');
  const ratingsSummary = await fetchRatingsSummary();
  generateSite({ products, ...helpers, rootDir,
    reviewedIds: new Set(FAZ3_TARGET_IDS), guidedIds: new Set(FAZ2_TARGET_IDS), subcatMap, ratingsSummary });
  // Not: helpers içinde prosConsFor zaten var (loadHelpers'ta çıkarılıyor),
  // spread ile generateSite'a otomatik geçiyor.

  const categories = [...new Set(products.filter(p => !p.upcoming).map(p => p.cat))];
  generateComparisons({
    products, colorFor: helpers.colorFor, computeScores: helpers.computeScores,
    categories, neighborCount: 2, rootDir, illustrationFor, productImageFor, prosConsFor: helpers.prosConsFor,
  });
  linkHeroComparisons({ rootDir });

  console.log('→ Supabase\'den haber verisi çekiliyor...');
  const news = await fetchNewsFromSupabase();
  if(news !== null){
    console.log(`→ ${news.length} haber bulundu.`);
    generateNews({ news, products, productSlug: helpers.productSlug, rootDir });
  }

  console.log('→ Alt kategori sayfaları üretiliyor...');
  generateSubcategories({ products, productSlug: helpers.productSlug, computeScores: helpers.computeScores, rootDir });

  generatePopulerKarsilastirmalar({ products, computeScores: helpers.computeScores, rootDir });

  refreshCategoryCards({ products, colorFor: helpers.colorFor, fmtDate: helpers.fmtDate, computeScores: helpers.computeScores, ICONS: helpers.ICONS, rootDir, cardSpecEntries: helpers.cardSpecEntries });

  console.log('→ "Alınır mı" / "Fiyat-performans" rehber sayfaları üretiliyor...');
  generateBuyingGuides({ products, prosConsFor: helpers.prosConsFor, computeScores: helpers.computeScores, targetIds: FAZ2_TARGET_IDS, rootDir });

  console.log('→ Konu kümesi (topical authority) rehberleri üretiliyor...');
  generateTopicalGuides({ rootDir });

  console.log('→ Konu kümesi destek makaleleri üretiliyor...');
  generateClusterArticles({ rootDir });

  console.log('→ İnceleme sayfaları üretiliyor...');
  generateReviews({ products, prosConsFor: helpers.prosConsFor, computeScores: helpers.computeScores, targetIds: FAZ3_TARGET_IDS, rootDir });

  console.log('→ Marka sayfaları üretiliyor...');
  generateBrandPages({ products, computeScores: helpers.computeScores, rootDir });

  console.log('→ Marka vs marka sayfaları üretiliyor...');
  generateBrandVsBrandPages({ products, computeScores: helpers.computeScores, rootDir });

  generateLandingPages({ products, computeScores: helpers.computeScores, rootDir });

  console.log('→ Fiyat/Performans İndeksi (linkable asset) üretiliyor...');
  generateFiyatPerformansIndeksi({ products, computeScores: helpers.computeScores, productSlug: helpers.productSlug, rootDir });

  // ---- sitemap.xml'i WAF limiti altında kalacak parçalara böl ----
  // TÜM generate-*.js modülleri sitemap.xml'i tamamladıktan sonra, en son adım
  // olarak çalışmalı (bkz. lib/split-sitemap.js'teki kök neden açıklaması).
  console.log('→ sitemap.xml parçalara bölünüyor (hosting WAF limiti için)...');
  splitSitemap({ rootDir });

  // ---- IndexNow bildirimi ----
  // Sitemap tamamen üretildikten sonra Bing/Yandex'e "işte güncel URL
  // listesi" diye bildiriyoruz. Bu, Google'ı etkilemez (IndexNow'u
  // kullanmıyor) ama Bing'in hızlı taraması üzerinden ChatGPT arama ve
  // Copilot görünürlüğüne doğrudan katkı sağlıyor. Başarısız olursa build'i
  // DURDURMUYORUZ — ikincil bir sinyal, deploy'u engellememeli.
  console.log('→ IndexNow\'a bildiriliyor...');
  const sitemapUrls = extractSitemapUrls(rootDir);
  await pingIndexNow(sitemapUrls);

  console.log('✓ Build tamamlandı.');
}

main().catch(err => {
  console.error('BUILD HATASI:', err.message);
  process.exit(1); // Netlify build'i başarısız işaretlesin, yarım/hatalı bir site yayınlanmasın
});
