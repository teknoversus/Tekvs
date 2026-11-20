// ============================================================
// TeknoVersus — sitemap <lastmod> değerlerini gerçek içerik değişikliğine bağla.
//
// Sorun (20 Kasım 2026): Üreticilerin çoğu <lastmod>'a build tarihini (today)
// yazıyordu; her deploy'da ~1.150 URL "bugün değişti" görünüyordu. Google bu
// durumda lastmod'u görmezden gelmeyi öğrenir ve gerçekten güncellenen sayfalar
// (yeni editör incelemesi, rehber) öncelik kazanmaz.
//
// Çözüm: Her sayfanın <title> + <main> metninden bir içerik özeti (hash) çıkar.
// Önceki deploy'un yayımladığı /lastmod-manifest.json ile karşılaştır:
//   - hash aynıysa → önceki lastmod korunur
//   - hash değiştiyse veya sayfa yeniyse → bugünün tarihi
// Üreticinin bugünden FARKLI bir tarih yazdığı URL'lere (haberler gibi, zaten
// gerçek tarih kullananlar) dokunulmaz. Yeni manifest sitenin köküne yazılır ve
// deploy ile yayımlanır; bir sonraki build onu okur.
//
// İlk çalıştırmada manifest yoksa davranış eskisiyle aynıdır (hepsi bugün);
// ikinci build'den itibaren tarihler sabitlenir.
// build.js'te sitemap bölünmeden HEMEN ÖNCE (trafik-noindex'ten sonra) çalışır.
// ============================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE = 'https://teknoversus.com.tr';
const MANIFEST = 'lastmod-manifest.json';

function contentHash(html){
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
  let main = html;
  const a = html.indexOf('<main'), b = html.lastIndexOf('</main>');
  if(a >= 0 && b > a) main = html.slice(a, b);
  const text = (title + ' ' + main)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);
}

async function fetchPrevManifest(){
  try{
    const res = await fetch(`${SITE}/${MANIFEST}?b=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
    if(!res.ok) return null;
    const j = await res.json();
    return (j && typeof j === 'object' && j.urls) ? j.urls : null;
  }catch(e){ return null; }
}

function fileFor(rootDir, rel){
  if(!rel || rel.endsWith('/')) return path.join(rootDir, rel, 'index.html');
  return path.join(rootDir, rel);
}

async function applyContentLastmod({ rootDir }){
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(!fs.existsSync(sitemapPath)){ console.warn('UYARI: sitemap-lastmod — sitemap.xml yok, atlanıyor.'); return; }
  const today = new Date().toISOString().slice(0, 10);
  const prev = await fetchPrevManifest();
  const next = {};
  let korunan = 0, degisen = 0, yeni = 0, dokunulmayan = 0;

  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const out = xml.replace(/<url>[\s\S]*?<\/url>/g, block => {
    const loc = (block.match(/<loc>([^<]*)<\/loc>/) || [])[1] || '';
    const rel = loc.replace(/^https?:\/\/[^/]+\//, '');
    const file = fileFor(rootDir, rel);
    if(!fs.existsSync(file)) return block;
    const h = contentHash(fs.readFileSync(file, 'utf8'));
    const cur = (block.match(/<lastmod>([^<]*)<\/lastmod>/) || [])[1];

    // Üretici gerçek bir tarih vermişse (bugün değil) ona güven.
    if(cur && cur.slice(0, 10) !== today){
      next[rel] = { h, d: cur };
      dokunulmayan++;
      return block;
    }
    let d = today;
    const p = prev && prev[rel];
    if(p && p.h === h && p.d){ d = p.d; korunan++; }
    else if(p){ degisen++; }
    else { yeni++; }
    next[rel] = { h, d };
    if(cur) return block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${d}</lastmod>`);
    return block.replace(/<\/loc>/, `</loc>\n    <lastmod>${d}</lastmod>`);
  });

  fs.writeFileSync(sitemapPath, out);
  fs.writeFileSync(path.join(rootDir, MANIFEST), JSON.stringify({ generated: today, urls: next }));
  console.log(`→ Sitemap lastmod: ${korunan} korundu (içerik aynı), ${degisen} değişti, ${yeni} yeni, ${dokunulmayan} üreticinin tarihi${prev ? '' : ' — önceki manifest yok, ilk çalıştırma'}.`);
}

module.exports = { applyContentLastmod, contentHash };
