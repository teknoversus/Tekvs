// ============================================================
// TeknoVersus — Fiyat/Performans İndeksi (Linkable Asset)
// generate-fiyat-performans-indeksi.js
//
// AMAÇ: Bu sayfa, dışarıdan (teknoloji siteleri, forumlar, gazeteciler)
// atıfta bulunulmak (backlink almak) için özel olarak tasarlanmış bir
// "linkable asset" — kataloğumuzdaki GERÇEK, hesaplanmış fiyat/performans
// skorlarına dayanan, kategori bazlı bir "En İyi 10" sıralaması sunar.
// Var olan generate-*.js dosyalarıyla aynı desen: dışarıdan products ve
// computeScores alır, hiçbir veri uydurmaz — sadece mevcut skorları
// yeniden düzenler ve sunar.
// ============================================================

const fs = require('fs');
const path = require('path');

function pfGetPrice(p){
  const raw = p.specs && p.specs['Fiyat (₺)'];
  if(raw == null) return null;
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateFiyatPerformansIndeksi({ products, computeScores, productSlug, rootDir }){
  const catalog = (products || []).filter(p => !p.upcoming);
  const scores = computeScores(catalog);
  const categories = [...new Set(catalog.map(p => p.cat))];

  const currentYear = new Date().getFullYear();
  const totalProducts = catalog.length;
  const lastUpdate = new Date().toISOString().slice(0, 10);

  // Her kategori için, GERÇEK fiyatı olan ürünler arasından skora göre
  // sıralanmış ilk 10 (fiyatı olmayan ürünler bu sıralamaya hiç girmez —
  // fiyat/performans skoru fiyatsız anlamlı değildir).
  const sections = categories.map(cat => {
    const inCat = catalog.filter(p => p.cat === cat && pfGetPrice(p) != null);
    const ranked = inCat
      .map(p => ({ p, score: scores[p.id] || 0, price: pfGetPrice(p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if(!ranked.length) return '';

    const rows = ranked.map((r, i) => {
      const slug = productSlug ? productSlug(r.p) : r.p.id;
      return `        <tr>
          <td>${i + 1}</td>
          <td><a href="urun/${esc(slug)}.html">${esc(r.p.name)}</a></td>
          <td>${r.score}/100</td>
          <td>${r.price.toLocaleString('tr-TR')} ₺</td>
        </tr>`;
    }).join('\n');

    return `
    <h2 id="${esc(cat.toLowerCase())}">${esc(cat)} — En İyi 10 Fiyat/Performans</h2>
    <table class="index-table">
      <thead><tr><th>#</th><th>Ürün</th><th>Skor</th><th>Fiyat</th></tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>`;
  }).filter(Boolean).join('\n');

  const tocLinks = categories.map(cat =>
    `<a class="chip-filter" href="#${esc(cat.toLowerCase())}">${esc(cat)}</a>`
  ).join('\n      ');

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `TeknoVersus Fiyat/Performans İndeksi ${currentYear}`,
    "description": `${totalProducts} ürünün gerçek fiyat/performans skorlarına dayanan, kategori bazlı sıralama.`,
    "url": `https://teknoversus.com.tr/fiyat-performans-indeksi-${currentYear}.html`,
    "dateModified": lastUpdate,
    "creator": { "@type": "Organization", "name": "TeknoVersus" }
  };

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>TeknoVersus Fiyat/Performans İndeksi ${currentYear} — ${totalProducts} Ürün Karşılaştırması</title>
<meta name="description" content="TeknoVersus'un ${totalProducts} ürünlük kataloğundan hesaplanan, kategori bazlı fiyat/performans sıralaması. Telefon, dizüstü, tablet ve daha fazlası için en iyi 10 ürün listesi." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://teknoversus.com.tr/fiyat-performans-indeksi-${currentYear}.html" />
<meta property="og:type" content="website" />
<meta property="og:title" content="TeknoVersus Fiyat/Performans İndeksi ${currentYear}" />
<meta property="og:description" content="${totalProducts} ürünün gerçek verilerine dayanan kategori bazlı fiyat/performans sıralaması." />
<link rel="stylesheet" href="styles.css" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<main style="max-width:900px;margin:0 auto;padding:20px;">
  <a href="index.html">← Anasayfa</a>
  <h1>TeknoVersus Fiyat/Performans İndeksi ${currentYear}</h1>
  <p style="color:#666;">Son güncelleme: ${lastUpdate} · ${totalProducts} ürün · ${categories.length} kategori</p>
  <p>Bu sayfa, kataloğumuzdaki her ürün için hesapladığımız gerçek fiyat/performans skorlarına dayanır — hiçbir sıralama elle veya sübjektif olarak belirlenmemiştir. Skor, ürünün fiyatına göre sunduğu donanım/özellik değerinin kategori içi karşılaştırmalı bir ölçüsüdür.</p>
  <div style="margin:16px 0;display:flex;flex-wrap:wrap;gap:8px;">
      ${tocLinks}
  </div>
${sections}
  <p style="margin-top:30px;font-size:13px;color:#888;">Bu veri setine atıfta bulunurken lütfen <a href="https://teknoversus.com.tr/fiyat-performans-indeksi-${currentYear}.html">bu sayfaya</a> link verin. Sorularınız için: <a href="mailto:info@teknoversus.com.tr">info@teknoversus.com.tr</a></p>
</main>
</body>
</html>`;

  fs.writeFileSync(path.join(rootDir, `fiyat-performans-indeksi-${currentYear}.html`), html);
  console.log(`Fiyat/Performans İndeksi oluşturuldu -> fiyat-performans-indeksi-${currentYear}.html (${categories.length} kategori, ${totalProducts} ürün)`);
}

module.exports = { generateFiyatPerformansIndeksi };
