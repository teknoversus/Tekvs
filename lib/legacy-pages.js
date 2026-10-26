// ============================================================
// Search Console 404 raporunda görünen ESKİ ürün / inceleme / rehber adreslerini
// 301 ile bugünkü sayfalara yönlendirir (26 Ekim 2026 doğrulama raporu:
// 1.313 adresin 313'ü "başarısız", 1.000'i beklemede).
//
// Kaynak liste: lib/legacy-sayfa-urls.txt (satır başına bir yol, örn.
// "urun/garmin-f-nix-7-p_garmin_024.html"). Her yolun sonundaki ürün kimliği
// (id) aranır; ürün katalogdaysa güncel adrese, lib/silinen-urunler.json'da
// silinmişse yerine geçen ürüne yönlendirilir. Ürün hiç yoksa kural YAZILMAZ
// (silinmiş ürünün sayfasının 404 vermesi doğru davranış).
// Yol bugün zaten bir dosyaya karşılık geliyorsa (sayfa yayındaysa) dokunulmaz.
// "urun/urun/x.html" gibi çift klasörlü ve "?tag=..." eklentili eski bozuk
// adresler de aynı biçimde çözülür (sorgu dizesi yol eşleşmesine girmez).
//
// build.js'te TÜM generator'lardan sonra çağrılmalı (.htaccess'lere ekler).
// ============================================================
const fs = require('fs');
const path = require('path');

const SITE = 'https://teknoversus.com.tr';

function slugify(name){
  const trMap = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return String(name).split('').map(ch => trMap[ch] !== undefined ? trMap[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
const ps = p => `${slugify(p.name)}-${p.id}`;

function writeLegacyPageRedirects({ rootDir, products }){
  const listFile = path.join(rootDir, 'lib', 'legacy-sayfa-urls.txt');
  if(!fs.existsSync(listFile)) return;
  const byId = new Map();
  (products || []).forEach(p => byId.set(String(p.id), p));
  let replace = {};
  try{
    (JSON.parse(fs.readFileSync(path.join(rootDir, 'lib', 'silinen-urunler.json'), 'utf8')).urunler || [])
      .forEach(d => { if(d && d.id && d.yerine) replace[String(d.id)] = String(d.yerine); });
  }catch(e){}
  const exists = rel => fs.existsSync(path.join(rootDir, rel));
  // Kimliği olmayan çok eski adresler (urun/huawei-watch-d3.html): ad tek ürünle eşleşiyorsa.
  const byName = new Map();
  (products || []).forEach(p => { const n = slugify(p.name); byName.set(n, byName.has(n) ? null : p); });

  function findProduct(slugPart){
    const t = slugPart.split('-');
    for(let k = Math.min(7, t.length); k >= 1; k--){          // en uzun kimlik önce
      const id = t.slice(-k).join('-');
      if(byId.has(id)) return byId.get(id);
      if(replace[id] && byId.has(replace[id])) return byId.get(replace[id]);
    }
    return byName.get(slugPart) || null;
  }

  const rules = { urun: [], inceleme: [], rehber: [] };
  let done = 0, none = 0, live = 0;
  const seen = new Set();
  fs.readFileSync(listFile, 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#')).forEach(raw => {
    const clean = raw.split('?')[0].replace(/^\/+/, '');
    const m = /^(urun|inceleme|rehber)\/(?:urun\/)?([A-Za-z0-9_.+-]+?)\.html$/.exec(clean);
    if(!m) return;
    const dir = m[1];
    const oldRel = clean.replace(/^(urun|inceleme|rehber)\/urun\//, '$1/');
    const oldRelFull = clean;                                  // urun/urun/... dahil
    if(seen.has(oldRelFull)) return; seen.add(oldRelFull);
    if(exists(oldRelFull)){ live++; return; }                  // sayfa yayında, dokunma
    let slugPart = m[2], suffix = '';
    const sm = /^(.*)-(inceleme|alinir-mi|fiyat-performans)$/.exec(slugPart);
    if(sm){ slugPart = sm[1]; suffix = sm[2]; }
    const p = findProduct(slugPart);
    if(!p){ none++; return; }
    const prodUrl = `/urun/${ps(p)}.html`;
    let target = prodUrl;
    if(dir === 'inceleme' && exists(`inceleme/${ps(p)}-inceleme.html`)) target = `/inceleme/${ps(p)}-inceleme.html`;
    if(dir === 'rehber' && suffix && exists(`rehber/${ps(p)}-${suffix}.html`)) target = `/rehber/${ps(p)}-${suffix}.html`;
    if(`/${oldRel}` === target) return;
    // urun/urun/... yolu urun/ klasörünün .htaccess'ine tam yoluyla yazılır
    rules[dir].push([`/${oldRelFull}`, target]);
    done++;
  });

  const header = '\n# OTOMATIK URETILIR (lib/legacy-pages.js) - Search Console 404 listesindeki eski sayfalar.\n';
  Object.entries(rules).forEach(([dir, list]) => {
    if(!list.length) return;
    const dirPath = path.join(rootDir, dir);
    if(!fs.existsSync(dirPath)) return;
    const f = path.join(dirPath, '.htaccess');
    const prev = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/\n*# OTOMATIK URETILIR \(lib\/legacy-pages\.js\)[\s\S]*$/, '\n') : '';
    const uniq = [...new Map(list.map(([o, t]) => [o, t])).entries()].sort((a, b) => a[0].localeCompare(b[0]));
    fs.writeFileSync(f, (prev ? prev.replace(/\n*$/, '\n') : '') + header + uniq.map(([o, t]) => `Redirect 301 ${o} ${SITE}${t}`).join('\n') + '\n');
  });
  console.log(`Eski sayfa yönlendirmeleri: ${done} kural, ${none} adres ürünü bulunamadığı için atlandı (404 kalır), ${live} adres zaten yayında.`);
}

module.exports = { writeLegacyPageRedirects };
