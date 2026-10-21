// ============================================================
// TeknoVersus — PWA etiketlerini sitedeki TÜM sayfalara ekler.
//
// Neden: manifest.json bağlantısı yalnızca elle yazılmış ~15 sayfada vardı;
// Google'dan en çok trafik alan ürün/karşılaştırma/haber sayfalarında yoktu,
// bu yüzden ziyaretçilerin çoğuna "uygulamayı yükle" önerisi hiç çıkmıyordu.
// Her generate-*.js'in kendi <head> şablonunu tek tek düzeltmek yerine,
// build'in sonunda üretilen her .html dosyasının <head>'ine eksik olanları
// ekliyoruz (zaten varsa dokunmaz; idempotent ve deterministik).
//
// build.js'te TÜM sayfalar üretildikten sonra çağrılmalı.
// ============================================================
const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'lib', 'scripts', 'docs']);

const TAGS = [
  { has: /rel=["']manifest["']/i, tag: '<link rel="manifest" href="/manifest.json" />' },
  { has: /name=["']theme-color["']/i, tag: '<meta name="theme-color" content="#2B6CB0" />' },
  { has: /rel=["']apple-touch-icon["']/i, tag: '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />' },
  { has: /name=["']apple-mobile-web-app-capable["']/i, tag: '<meta name="apple-mobile-web-app-capable" content="yes" />' },
  { has: /name=["']apple-mobile-web-app-title["']/i, tag: '<meta name="apple-mobile-web-app-title" content="TeknoVersus" />' },
  { has: /src=["'][^"']*pwa\.js/i, tag: '<script src="/pwa.js" defer></script>' },
];

function walk(dir, out){
  for(const ent of fs.readdirSync(dir, { withFileTypes: true })){
    if(ent.isDirectory()){
      if(SKIP_DIRS.has(ent.name) || ent.name.startsWith('.')) continue;
      walk(path.join(dir, ent.name), out);
    } else if(ent.isFile() && ent.name.endsWith('.html')){
      out.push(path.join(dir, ent.name));
    }
  }
  return out;
}

function injectPwaTags({ rootDir }){
  const files = walk(rootDir, []);
  let changed = 0;
  for(const f of files){
    if(path.basename(f) === 'admin.html') continue; // yönetim paneli uygulama olarak önerilmesin
    let html = fs.readFileSync(f, 'utf8');
    const headEnd = html.search(/<\/head>/i);
    if(headEnd === -1) continue;
    const head = html.slice(0, headEnd);
    const missing = TAGS.filter(t => !t.has.test(head)).map(t => t.tag);
    if(!missing.length) continue;
    html = html.slice(0, headEnd) + missing.join('\n') + '\n' + html.slice(headEnd);
    fs.writeFileSync(f, html);
    changed++;
  }
  console.log(`PWA etiketleri: ${files.length} sayfa tarandı, ${changed} sayfaya eksik etiketler eklendi.`);
}

module.exports = { injectPwaTags };
