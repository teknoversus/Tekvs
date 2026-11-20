// ============================================================
// TeknoVersus — trafik almayan otomatik sayfaları noindex yapma.
//
// 20 Kasım 2026 analizi: sitemap'teki 4.157 URL'nin ~%94'ü veriden otomatik
// üretilmiş sayfa (ürün, inceleme, karşılaştırma, marka-vs-marka). AdSense'in
// "düşük değerli içerik" reddinin en olası nedeni bu oran. Bu adım, son 3 ayda
// Google'dan hiç trafik almamış otomatik sayfaları "noindex, follow" yapıp
// sitemap'ten çıkarır. Sayfalar sitede kalır, linkler çalışır; yalnızca
// Google'a "bunları değerlendirme" denir.
//
// ASLA dokunulmayanlar:
//   - lib/gsc-trafik-sayfalar.txt (inceleme/urun/marka-karsilastir: ≥1 tıklama veya ≥20 gösterim)
//   - lib/gsc-korunan-sayfalar.txt (karşılaştırma: ilk 1000, gösterime göre)
//   - Editör değerlendirmesi olan sayfalar (class="editor-review")
//   - Son YENI_GUN gün içinde çıkmış (addedAt) ürünlere ait/link veren sayfalar
//     (henüz trafik birikmemiş olabilirler)
//
// build.js'te sitemap bölünmeden HEMEN ÖNCE çalışmalı.
// ============================================================
const fs = require('fs');
const path = require('path');

const TURLER = ['urun', 'inceleme', 'marka-karsilastir', 'karsilastir'];
const YENI_GUN = 120;

function readList(file){
  if(!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n')
    .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    .map(l => l.split('\t')[0]);
}

function setRobotsNoindex(html){
  const tag = '<meta name="robots" content="noindex, follow" />';
  if(/<meta\s+name="robots"[^>]*>/i.test(html)) return html.replace(/<meta\s+name="robots"[^>]*>/i, tag);
  return html.replace(/<head([^>]*)>/i, m => `${m}\n${tag}`);
}

function applyTrafficNoindex({ rootDir, products, productSlug }){
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(!fs.existsSync(sitemapPath)){ console.warn('UYARI: trafik-noindex — sitemap.xml yok, atlanıyor.'); return; }

  const korunan = new Set(readList(path.join(__dirname, 'gsc-trafik-sayfalar.txt')));
  readList(path.join(__dirname, 'gsc-korunan-sayfalar.txt')).forEach(n => korunan.add('karsilastir/' + n));

  const sinir = Date.now() - YENI_GUN * 864e5;
  const yeniSluglar = new Set(products
    .filter(p => !p.upcoming && p.addedAt && new Date(p.addedAt).getTime() >= sinir)
    .map(p => productSlug(p)));

  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const sayac = {};
  TURLER.forEach(t => sayac[t] = { toplam: 0, noindex: 0 });

  const yeniXml = xml.replace(/<url>[\s\S]*?<\/url>\s*/g, block => {
    const loc = (block.match(/<loc>([^<]*)<\/loc>/) || [])[1] || '';
    const rel = loc.replace(/^https?:\/\/[^/]+\//, '');
    const tur = rel.split('/')[0];
    if(!TURLER.includes(tur) || rel.split('/').length !== 2) return block;
    sayac[tur].toplam++;
    if(korunan.has(rel)) return block;

    const file = path.join(rootDir, rel);
    if(!fs.existsSync(file)) return block;
    const html = fs.readFileSync(file, 'utf8');
    if(html.includes('class="editor-review')) return block;

    const ad = rel.split('/')[1].replace(/\.html$/, '');
    if(tur === 'urun' && yeniSluglar.has(ad)) return block;
    if(tur === 'inceleme' && yeniSluglar.has(ad.replace(/-inceleme$/, ''))) return block;
    if(tur === 'karsilastir' || tur === 'marka-karsilastir'){
      // Yalnızca ana içerikteki ürün linkleri; karşılaştırmada ilk iki ürün = karşılaştırılan ürünler.
      const ana = html.slice(Math.max(0, html.indexOf('<main')));
      let linkler = [...new Set([...ana.matchAll(/urun\/([^"'#?/]+)\.html/g)].map(m => m[1]))];
      if(tur === 'karsilastir') linkler = linkler.slice(0, 2);
      if(linkler.some(s => yeniSluglar.has(s))) return block;
    }

    fs.writeFileSync(file, setRobotsNoindex(html));
    sayac[tur].noindex++;
    return '';
  });

  fs.writeFileSync(sitemapPath, yeniXml);
  const ozet = TURLER.map(t => `${t}: ${sayac[t].noindex}/${sayac[t].toplam}`).join(', ');
  console.log(`→ Trafiksiz otomatik sayfalar noindex yapıldı ve sitemap'ten çıkarıldı (${ozet}). Yeni ürün sınırı: ${YENI_GUN} gün, ${yeniSluglar.size} yeni ürün korundu.`);
}

module.exports = { applyTrafficNoindex };
