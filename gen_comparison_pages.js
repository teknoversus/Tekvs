// Karşılaştırma ("X vs Y") sayfalarını üretir — TÜM kategoriler için.
const vm = require('vm');
const fs = require('fs');
const { generateComparisons } = require('./lib/generate-comparisons');

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
const colorFor = vm.runInContext('colorFor', context);
const computeScores = vm.runInContext('computeScores', context);

const categories = [...new Set(SEED.filter(p => !p.upcoming).map(p => p.cat))];

generateComparisons({
  products: SEED,
  colorFor,
  computeScores,
  categories,
  neighborCount: 2,
  rootDir: __dirname,
});

