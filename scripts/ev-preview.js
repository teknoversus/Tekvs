// Elektrikli araç bölümünün önizlemesi: repo DIŞINA yazar, siteye hiçbir şey eklemez.
// Kullanım: node scripts/ev-preview.js [çıktı-klasörü]
const path = require('path');
const { generateEv } = require('../ev/generate-ev');
generateEv({ rootDir: path.join(__dirname, '..'), outDir: process.argv[2] || '/tmp/ev-preview', publish: false });
