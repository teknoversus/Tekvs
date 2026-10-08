// Yerel/manuel TAM üretim: shared.js içindeki SEED ve NEWS_SEED verisiyle
// ürün sayfalarını, karşılaştırma sayfalarını ve haber sayfalarını tek seferde üretir.
// Canlıda otomatik build için build.js kullanılır (Supabase'den canlı veri çeker).
const vm = require('vm');
const fs = require('fs');
const { generateSite } = require('./lib/generate-site');
const { generateComparisons } = require('./lib/generate-comparisons');
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

const sharedSrc = fs.readFileSync('shared.js', 'utf8');
const seedDataSrc = fs.readFileSync('seed-data.js', 'utf8'); // SEED/NEWS_SEED artık ayrı dosyada
const PALETTE_MAP = {'--c1':'#2B6CB0','--c2':'#B23A5C','--c3':'#B8790F','--c4':'#1F7A6C','--c5':'#6B4C9A','--c6':'#4A5568','--c7':'#9A4B2F'};

const context = {
  console,
  document: { documentElement: {}, getElementById: () => null },
  getComputedStyle: () => ({ getPropertyValue: (v) => PALETTE_MAP[v] || '' }),
  window: {},
};
vm.createContext(context);
vm.runInContext(sharedSrc, context);
vm.runInContext(seedDataSrc, context);

const SEED = vm.runInContext('prepareProducts', context)(vm.runInContext('SEED', context));
const NEWS_SEED = vm.runInContext('NEWS_SEED', context);
const CATS = vm.runInContext('CATS', context);
const ICONS = vm.runInContext('ICONS', context);
const colorFor = vm.runInContext('colorFor', context);
const fmtDate = vm.runInContext('fmtDate', context);
const computeScores = vm.runInContext('computeScores', context);
const productSlug = vm.runInContext('productSlug', context);
const prosConsFor = vm.runInContext('prosConsFor', context);

// Faz 2/3 hedef ürün listeleri — artık TÜM kataloğu kapsıyor (157 ürün).
// Yeni ürün eklendiğinde otomatik olarak dahil olur, elle liste güncellemeye gerek yok.
const FAZ2_TARGET_IDS = SEED.filter(p => !p.upcoming).map(p => p.id);
const FAZ3_TARGET_IDS = SEED.filter(p => !p.upcoming).map(p => p.id);

const subcatMap = buildSubcatMap(SEED);

generateSite({ products: SEED, CATS, ICONS, colorFor, fmtDate, computeScores, productSlug, prosConsFor, rootDir: __dirname,
  reviewedIds: new Set(FAZ3_TARGET_IDS), guidedIds: new Set(FAZ2_TARGET_IDS), subcatMap });

const categories = [...new Set(SEED.filter(p => !p.upcoming).map(p => p.cat))];
generateComparisons({ products: SEED, colorFor, computeScores, categories, neighborCount: 2, rootDir: __dirname });

generateNews({ news: NEWS_SEED, products: SEED, productSlug, rootDir: __dirname });

generateSubcategories({ products: SEED, productSlug, computeScores, rootDir: __dirname });

generatePopulerKarsilastirmalar({ products: SEED, computeScores, rootDir: __dirname });

refreshCategoryCards({ products: SEED, colorFor, fmtDate, computeScores, ICONS, rootDir: __dirname, cardSpecEntries: vm.runInContext('cardSpecEntries', context) });

// Faz 2: en yüksek trafik potansiyelli 31 ürün için "alınır mı" + "fiyat/performans mı" sayfaları
generateBuyingGuides({ products: SEED, prosConsFor, computeScores, targetIds: FAZ2_TARGET_IDS, rootDir: __dirname });

generateTopicalGuides({ rootDir: __dirname, products: SEED, computeScores, productSlug });

generateClusterArticles({ rootDir: __dirname });

// Faz 3: 28 ürün için 12 bölümlü tam inceleme (kategori çeşitliliği gözetilerek)
generateReviews({ products: SEED, prosConsFor, computeScores, targetIds: FAZ3_TARGET_IDS, rootDir: __dirname });

generateBrandPages({ products: SEED, computeScores, rootDir: __dirname });

generateBrandVsBrandPages({ products: SEED, computeScores, rootDir: __dirname });

generateLandingPages({ products: SEED, computeScores, rootDir: __dirname });

console.log('✓ Yerel tam build tamamlandı (ürünler + karşılaştırmalar + haberler + alt kategoriler + rehberler + incelemeler + marka sayfaları).');
