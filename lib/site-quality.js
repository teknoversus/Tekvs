// ============================================================
// TeknoVersus — site kalite son adımları (24 Kasım 2026 site denetimi).
//
// 1) Sayfalama sayfaları (telefon-sayfa-2.html, karsilastirmalar-7.html …)
//    "noindex, follow" olur. Bunlar yalnızca kart listesi; Google'da trafik
//    almıyorlar, sitemap'te de yoklar. follow sayesinde linkler taranmaya
//    devam eder, ürün sayfalarının keşfi bozulmaz.
// 2) lib/haber-noindex.json'daki haberler "noindex, follow" olur ve
//    sitemap.xml / sitemap-news.xml'den çıkar. Aynı olayı ikinci kez anlatan
//    haberler için. Haber SİLİNMEZ, metni DEĞİŞMEZ, adresi çalışmaya devam eder;
//    sayfaya, aynı konunun asıl haberine canonical verilmez (içerik farklı).
// 3) Var olmayan liste/ sayfalarına giden iç linkler düz metne çevrilir
//    (liste sayfası ürün eşiği altında kaldığında üretilmiyor; kategori
//    sayfalarının statik şablonunda link kalıyordu → kırık link).
//
// build.js'te applyTrafficNoindex'ten sonra, sitemap bölünmeden önce çalışır.
// ============================================================
const fs = require('fs');
const path = require('path');

const TAG = '<meta name="robots" content="noindex, follow" />';
function setNoindex(html){
  if(/<meta\s+name="robots"[^>]*>/i.test(html)) return html.replace(/<meta\s+name="robots"[^>]*>/i, TAG);
  return html.replace(/<head([^>]*)>/i, m => `${m}\n${TAG}`);
}
function removeFromSitemap(file, rels){
  if(!fs.existsSync(file) || !rels.size) return 0;
  let n = 0;
  const xml = fs.readFileSync(file, 'utf8').replace(/\s*<url>[\s\S]*?<\/url>/g, block => {
    const loc = (block.match(/<loc>([^<]*)<\/loc>/) || [])[1] || '';
    const rel = loc.replace(/^https?:\/\/[^/]+\//, '');
    if(rels.has(rel)){ n++; return ''; }
    return block;
  });
  fs.writeFileSync(file, xml);
  return n;
}
function walk(dir, out = []){
  for(const e of fs.readdirSync(dir, { withFileTypes: true })){
    if(e.name.startsWith('.') || ['node_modules', 'lib', 'scripts', 'docs', 'rapor'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if(e.isDirectory()) walk(p, out); else if(e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function applySiteQuality({ rootDir }){
  const noindexed = new Set();

  // 1) sayfalama
  let pag = 0;
  for(const f of fs.readdirSync(rootDir)){
    if(!/^[a-z0-9-]+-sayfa-\d+\.html$/.test(f) && !/^karsilastirmalar-\d+\.html$/.test(f)) continue;
    const p = path.join(rootDir, f);
    fs.writeFileSync(p, setNoindex(fs.readFileSync(p, 'utf8')));
    noindexed.add(f); pag++;
  }

  // 2) tekrar haberler
  let hab = 0;
  const listFile = path.join(__dirname, 'haber-noindex.json');
  const liste = fs.existsSync(listFile) ? (JSON.parse(fs.readFileSync(listFile, 'utf8')).haberler || []) : [];
  for(const h of liste){
    const rel = `haberler/${h.id}.html`, p = path.join(rootDir, rel);
    if(!fs.existsSync(p)) continue;
    fs.writeFileSync(p, setNoindex(fs.readFileSync(p, 'utf8')));
    noindexed.add(rel); hab++;
  }
  // indekslenebilir ama sitemap'te olmayan tek sayfalar (ör. fiyat-performans-indeksi-2026.html)
  const smPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(smPath)){
    let xml = fs.readFileSync(smPath, 'utf8');
    for(const f of fs.readdirSync(rootDir).filter(f => /^fiyat-performans-indeksi-\d{4}\.html$/.test(f))){
      const html = fs.readFileSync(path.join(rootDir, f), 'utf8');
      if(/noindex/i.test((html.match(/<meta name="robots" content="([^"]*)"/i) || [])[1] || '')) continue;
      if(xml.includes(`/${f}</loc>`)) continue;
      xml = xml.replace('</urlset>', `  <url>\n    <loc>https://teknoversus.com.tr/${f}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`);
    }
    fs.writeFileSync(smPath, xml);
  }
  const s1 = removeFromSitemap(path.join(rootDir, 'sitemap.xml'), noindexed);
  const s2 = removeFromSitemap(path.join(rootDir, 'sitemap-news.xml'), noindexed);

  // 3) kırık liste/ linkleri
  let kirik = 0;
  for(const p of walk(rootDir)){
    const html = fs.readFileSync(p, 'utf8');
    if(!html.includes('liste/')) continue;
    const dir = path.dirname(p);
    const yeni = html.replace(/<a\b([^>]*?)href="((?:\.\.\/)?liste\/[a-z0-9-]+\.html)"([^>]*)>([\s\S]*?)<\/a>/g, (m, a, href, b, text) => {
      if(fs.existsSync(path.join(dir, href))) return m;
      kirik++;
      return `<span${(a + b).match(/\sclass="[^"]*"/)?.[0] || ''}>${text}</span>`;
    });
    if(yeni !== html) fs.writeFileSync(p, yeni);
  }

  // 4) Search Console'da 404 görünen eski marka karşılaştırma adresleri
  //    (lib/legacy-marka-karsilastir.txt). Ters sıralı ikili ya da eşdeğer marka adı
  //    (redmi → xiaomi) yayındaysa ona, değilse karşılaştırmalar sayfasına 301.
  let mk = 0;
  const mkList = path.join(__dirname, 'legacy-marka-karsilastir.txt');
  const mkDir = path.join(rootDir, 'marka-karsilastir');
  if(fs.existsSync(mkList) && fs.existsSync(mkDir)){
    const ALIAS = { redmi: 'xiaomi', poco: 'xiaomi', turtle: 'turtle-beach' };
    const lines = [];
    fs.readFileSync(mkList, 'utf8').split('\n').map(x => x.trim()).filter(x => x && !x.startsWith('#')).forEach(slug => {
      if(fs.existsSync(path.join(mkDir, slug + '.html'))) return;
      const m = slug.match(/^(.+)-vs-(.+)-(telefon|televizyon|kulaklik|tablet|akilli-saat|dizustu|kamera)$/);
      let target = '/karsilastirmalar.html';
      if(m){
        const [, a0, b0, cat] = m;
        const a = ALIAS[a0] || a0, b = ALIAS[b0] || b0;
        const cands = [`${a}-vs-${b}-${cat}`, `${b}-vs-${a}-${cat}`];
        const hit = cands.find(c => fs.existsSync(path.join(mkDir, c + '.html')));
        if(hit) target = `/marka-karsilastir/${hit}.html`;
        else if(fs.existsSync(path.join(rootDir, 'marka', `${a}-${cat}.html`))) target = `/marka/${a}-${cat}.html`;
      }
      lines.push(`Redirect 301 /marka-karsilastir/${slug}.html https://teknoversus.com.tr${target}`);
      mk++;
    });
    if(lines.length){
      const ht = path.join(mkDir, '.htaccess');
      const MARK = '# OTOMATIK URETILIR (lib/site-quality.js eski marka karsilastir)';
      let cur = fs.existsSync(ht) ? fs.readFileSync(ht, 'utf8') : '';
      cur = cur.replace(new RegExp(`\\n?${MARK}[\\s\\S]*?# SON\\n?`), '\n');
      fs.writeFileSync(ht, `${MARK}\n${lines.join('\n')}\n# SON\n` + cur);
    }
  }

  // 5) Search Console'da 404 görünen diğer eski adresler (lib/legacy-404.txt).
  //    Yayındaki en yakın sayfa bulunursa ona, bulunamazsa ilgili üst sayfaya 301.
  let l404 = 0;
  const l404File = path.join(__dirname, 'legacy-404.txt');
  if(fs.existsSync(l404File)){
    const ID = /^([a-z]{1,2}\d{1,3}|[0-9a-f]{12}|p_[a-z0-9_]+|comp_[0-9_]+|trend_\d+|monster_\d+)$/;
    const base = s => { const t = s.split('-'); return ID.test(t[t.length - 1]) ? t.slice(0, -1).join('-') : s; };
    const ls = d => { try { return fs.readdirSync(path.join(rootDir, d)).filter(f => f.endsWith('.html')); } catch(e){ return []; } };
    const urun = ls('urun'), kars = ls('karsilastir');
    const findUrun = slug => {
      let t = base(slug).split('-');
      while(t.length >= 3){ const b = t.join('-'); const f = urun.find(x => x.startsWith(b + '-')); if(f) return f; t = t.slice(0, -1); }
      return null;
    };
    const exists = rel => fs.existsSync(path.join(rootDir, rel));
    const byDir = {};
    fs.readFileSync(l404File, 'utf8').split('\n').map(x => x.trim()).filter(x => x && !x.startsWith('#')).forEach(rel => {
      let forced = null;
      if(rel.includes('|')){ [rel, forced] = rel.split('|').map(x => x.trim()); }
      if(exists(rel)) return;
      const dir = rel.split('/')[0], name = rel.split('/').slice(1).join('/').replace(/\.html$/, '');
      let target = null;
      if(dir === 'karsilastir' && name.startsWith('urun/')){
        const f = findUrun(name.slice(5)); target = f ? `/urun/${f}` : '/karsilastirmalar.html';
      } else if(dir === 'karsilastir'){
        const [a, b] = name.split('-vs-');
        if(a && b){
          const ba = base(a), bb = base(b);
          const hit = kars.find(f => (f.startsWith(ba + '-') || f.startsWith(ba + '-vs-')) && f.includes('-vs-' + bb)) ||
                      kars.find(f => (f.startsWith(bb + '-') || f.startsWith(bb + '-vs-')) && f.includes('-vs-' + ba));
          if(hit) target = `/karsilastir/${hit}`;
          else { const fa = findUrun(a) || findUrun(b); target = fa ? `/urun/${fa}` : '/karsilastirmalar.html'; }
        }
      } else if(dir === 'liste'){
        const cat = ['kulaklik', 'kamera', 'telefon', 'tablet', 'akilli-saat', 'dizustu', 'televizyon'].find(c => name.endsWith('-' + c) || name === c);
        target = cat && exists(`${cat}.html`) ? `/${cat}.html` : '/';
      } else if(dir === 'marka'){
        const alt = name.replace(/^(redmi|poco)-/, 'xiaomi-');
        target = exists(`marka/${alt}.html`) ? `/marka/${alt}.html` : '/';
      } else if(dir === 'urun'){
        const f = findUrun(name); if(f) target = `/urun/${f}`;
      }
      if(forced) target = forced;
      if(!target) return;
      (byDir[dir] = byDir[dir] || []).push(`Redirect 301 /${rel} https://teknoversus.com.tr${target}`);
      l404++;
    });
    const MARK = '# OTOMATIK URETILIR (lib/site-quality.js legacy-404)';
    for(const [dir, lines] of Object.entries(byDir)){
      const ht = path.join(rootDir, dir, '.htaccess');
      let cur = fs.existsSync(ht) ? fs.readFileSync(ht, 'utf8') : '';
      fs.writeFileSync(ht, `${MARK}\n${lines.join('\n')}\n# SON\n` + cur);
    }
  }
  console.log(`→ Diğer eski 404 adresleri: ${l404} yönlendirme.`);

  console.log(`→ Eski marka karşılaştırma adresleri: ${mk} yönlendirme.`);
  console.log(`→ Site kalitesi: ${pag} sayfalama sayfası ve ${hab} tekrar haber noindex (sitemap'ten ${s1 + s2} URL çıktı); ${kirik} kırık liste linki düz metne çevrildi.`);
}

module.exports = { applySiteQuality };
