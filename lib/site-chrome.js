// ============================================================
// TeknoVersus — bütün sayfalarda aynı üst menü (21 Kasım 2026).
//
// Sayfa üreticilerinin her biri kendi menü bağlantılarını yazıyordu (12+
// farklı kopya, bazıları kaldırılan "#katalog" bölümüne gidiyordu). Bu adım
// build'in sonunda, bütün HTML üretildikten sonra çalışır ve her sayfadaki
// <nav class="nav-links" id="navLinks"> içeriğini aynı bağlantılarla
// değiştirir. Bağlantılar sayfanın klasör derinliğine göre göreli yazılır.
// Görünüm (renk, yazı tipi, footer) styles.css'ten gelir.
// ============================================================
const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['lib', 'node_modules', 'scripts', 'docs', 'assets', '.git', '.github']);
const SKIP_FILES = new Set(['admin.html', 'offline.html']);

function navLinks(root, isHome, hasFinder){
  const links = [
    [isHome ? '#kategoriler' : `${root}index.html#kategoriler`, 'Kategoriler'],
    [`${root}karsilastirmalar.html`, 'Karşılaştırmalar'],
    [`${root}haberler.html`, 'Haberler'],
    [`${root}yakinda-cikacak.html`, 'Yakında Çıkacak'],
  ];
  // Elektrikli araç bölümü yalnızca EV_PUBLISH=1 ile yayındayken menüde görünür.
  if(process.env.EV_PUBLISH === '1') links.splice(3, 0, [`${root}elektrikli-araclar/`, 'Elektrikli Araçlar']);
  // Kategori sayfalarındaki ürün bulucu: category.js bu bağlantıyı yakalayıp sayfa içinde açar.
  if(hasFinder && !root) links.push(['index.html?finder=1', 'Bulucu']);
  return links.map(([h, t]) => `      <a href="${h}">${t}</a>`).join('\n');
}

function walk(dir, rootDir, out){
  for(const e of fs.readdirSync(dir, { withFileTypes: true })){
    if(e.isDirectory()){
      if(dir === rootDir && SKIP_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), rootDir, out);
    }else if(e.name.endsWith('.html')){
      if(dir === rootDir && SKIP_FILES.has(e.name)) continue;
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

function applySiteChrome({ rootDir }){
  const files = walk(rootDir, rootDir, []);
  const re = /(<nav class="nav-links" id="navLinks">)[\s\S]*?(<\/nav>)/;
  let n = 0;
  for(const f of files){
    const html = fs.readFileSync(f, 'utf8');
    if(!re.test(html)) continue;
    const rel = path.relative(rootDir, f);
    const depth = rel.split(path.sep).length - 1;
    const root = depth ? '../'.repeat(depth) : '';
    const next = html.replace(re, (m, a, b) => `${a}\n${navLinks(root, rel === 'index.html', /'category\.js'/.test(html))}\n    ${b}`);
    if(next !== html){ fs.writeFileSync(f, next); n++; }
  }
  console.log(`→ Ortak üst menü: ${n} sayfa güncellendi.`);
}

module.exports = { applySiteChrome };
