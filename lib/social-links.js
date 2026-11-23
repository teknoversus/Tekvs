// ============================================================
// Sosyal medya bağlantıları: tüm sayfaların <footer> bölümüne Instagram linki ekler.
// Altbilgiler çok sayıda şablonda tekrarlandığı için tek noktadan, build sonunda
// çıktı HTML'lerine uygulanır. Zaten eklenmişse tekrar eklemez.
// ============================================================
const fs = require('fs');
const path = require('path');

const IG_URL = 'https://www.instagram.com/teknoversus2026/';
const SKIP = new Set(['node_modules', '.git', '.github', 'docs', 'scripts']);
const CHIP = /(<a class="chip-filter" href="televizyon\.html">Televizyon<\/a>)/;
const ANCHOR = /(<a href="[^"]*cerez-politikasi\.html"( style="[^"]*")?>Çerez Politikası<\/a>)/;

function walk(dir, out){
  for(const e of fs.readdirSync(dir, { withFileTypes: true })){
    if(SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if(e.isDirectory()) walk(p, out);
    else if(e.name.endsWith('.html')) out.push(p);
  }
}

function applySocialLinks({ rootDir }){
  const files = []; walk(rootDir, files);
  let n = 0;
  for(const f of files){
    let html;
    try{ html = fs.readFileSync(f, 'utf8'); }catch(e){ continue; }
    if(html.includes(IG_URL) && /Instagram<\/a>/.test(html)) continue;
    const fi = html.indexOf('<footer');
    if(fi < 0) continue;
    const head = html.slice(0, fi), foot = html.slice(fi);
    const m = foot.match(ANCHOR);
    if(!m){
      const c = foot.match(CHIP);
      if(!c) continue;
      const chip = `\n    <a class="chip-filter" href="${IG_URL}" rel="me noopener" target="_blank">Instagram</a>`;
      fs.writeFileSync(f, head + foot.replace(CHIP, c[1] + chip));
      n++;
      continue;
    }
    const style = m[2] || '';
    const link = ` · <a href="${IG_URL}" rel="me noopener" target="_blank"${style}>Instagram</a>`;
    fs.writeFileSync(f, head + foot.replace(ANCHOR, m[1] + link));
    n++;
  }
  console.log(`→ ${n} sayfanın altbilgisine Instagram bağlantısı eklendi.`);
}
module.exports = { applySocialLinks };
