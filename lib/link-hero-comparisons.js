// ============================================================
// TeknoVersus — Faz 11E: ürün detay hero'suna GERÇEK comparison
// linki ekler (server-side, JS'siz de crawlable).
//
// NEDEN AYRI BİR DOSYA: generate-site.js ürün sayfalarını üretirken
// henüz hiçbir comparison dosyası yok (generateComparisons ondan SONRA
// çalışıyor) — o yüzden gerçek URL'yi o anda bilemez. generate-comparisons.js
// dosyasına dokunmadan kalabilmek için, bu modül generateComparisons
// TAMAMLANDIKTAN SONRA çalışır: gerçekten üretilmiş karsilastir/*.html
// dosyalarını tarar, içeriklerinden (Faz 8'deki gibi) ürün ID'lerini
// çıkarır, ve ürün detay sayfasındaki HERO_CMP_LINK marker'ını gerçek
// bir <a href> ile doldurur. Comparison'ı olmayan ürünlerde marker
// boş bırakılır — kırık/uydurma link asla oluşmaz.
// ============================================================
const fs = require('fs');
const path = require('path');

function linkHeroComparisons({ rootDir }){
  const karsDir = path.join(rootDir, 'karsilastir');
  const urunDir = path.join(rootDir, 'urun');
  if(!fs.existsSync(karsDir) || !fs.existsSync(urunDir)) return;

  // id -> ilk bulunan gerçek comparison dosya adı
  const firstComparisonFor = {};
  const dosyalar = fs.readdirSync(karsDir).filter(f => f.endsWith('.html'));

  for(const dosya of dosyalar){
    const icerik = fs.readFileSync(path.join(karsDir, dosya), 'utf8');
    const linkler = [...new Set([...icerik.matchAll(/urun\/([a-z0-9_-]+)\.html/g)].map(m => m[1]))];
    if(linkler.length < 2) continue;
    for(const slugId of linkler){
      const m = slugId.match(/^(.*)-([a-z0-9_]+)$/);
      if(!m) continue;
      const id = m[2];
      if(!firstComparisonFor[id]) firstComparisonFor[id] = dosya;
    }
  }

  let linked = 0;
  const urunDosyalar = fs.readdirSync(urunDir).filter(f => f.endsWith('.html'));
  for(const dosya of urunDosyalar){
    const m = dosya.match(/-([a-z0-9_]+)\.html$/);
    if(!m) continue;
    const id = m[1];
    const cmpFile = firstComparisonFor[id];
    if(!cmpFile) continue;

    const filePath = path.join(urunDir, dosya);
    let html = fs.readFileSync(filePath, 'utf8');
    const linkHTML = `<a href="../karsilastir/${cmpFile}" class="btn-card-primary" style="max-width:200px;margin-top:10px;text-decoration:none;">Karşılaştır →</a>`;
    const yeni = html.replace(
      /<!-- HERO_CMP_LINK_START -->[\s\S]*?<!-- HERO_CMP_LINK_END -->/,
      `<!-- HERO_CMP_LINK_START -->${linkHTML}<!-- HERO_CMP_LINK_END -->`
    );
    if(yeni !== html){
      fs.writeFileSync(filePath, yeni);
      linked++;
    }
  }
  console.log(`${linked} ürün detay sayfasının hero'suna gerçek comparison linki eklendi.`);
}

module.exports = { linkHeroComparisons };
