// Yerel/manuel üretim: shared.js içindeki SEED verisiyle sayfaları üretir.
// Canlıda otomatik build için build.js kullanılır (Supabase'den canlı veri çeker).
const vm = require('vm');
const fs = require('fs');
const { generateSite } = require('./lib/generate-site');

const sharedSrc = fs.readFileSync('shared.js', 'utf8');
const PALETTE_MAP = {'--c1':'#2B6CB0','--c2':'#B23A5C','--c3':'#B8790F','--c4':'#1F7A6C','--c5':'#6B4C9A','--c6':'#4A5568','--c7':'#9A4B2F'};

const context = {
  console,
  document: { documentElement: {}, getElementById: () => null },
  getComputedStyle: () => ({ getPropertyValue: (v) => PALETTE_MAP[v] || '' }),
  window: {},
};
vm.createContext(context);
vm.runInContext(sharedSrc, context);

const SEED = vm.runInContext('SEED', context);
const CATS = vm.runInContext('CATS', context);
const ICONS = vm.runInContext('ICONS', context);
const colorFor = vm.runInContext('colorFor', context);
const fmtDate = vm.runInContext('fmtDate', context);
const computeScores = vm.runInContext('computeScores', context);
const productSlug = vm.runInContext('productSlug', context);

generateSite({
  products: SEED,
  CATS, ICONS, colorFor, fmtDate, computeScores, productSlug,
  rootDir: __dirname,
});
