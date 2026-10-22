// ============================================================
// Silinen (çift kayıt) ürünlerin eski sayfalarını 301 ile yönlendirir.
//
// lib/silinen-urunler.json'daki her ürün için:
//   urun/{slug}-{id}.html                      -> yerine geçen ürünün sayfası
//   inceleme/{slug}-{id}-inceleme.html         -> yerine geçenin incelemesi (yoksa ürün sayfası)
//   rehber/{slug}-{id}-alinir-mi.html          -> yerine geçenin "alınır mı"sı (yoksa ürün sayfası)
//   rehber/{slug}-{id}-fiyat-performans.html   -> yerine geçenin "fiyat/performans"ı (yoksa ürün sayfası)
//   karsilastir/{silinen vs X}                 -> karsilastir/{yerine vs X} (o sayfa üretildiyse)
//
// Kurallar ilgili klasörün .htaccess dosyasına (mod_alias "Redirect 301")
// yazılır. karsilastir/.htaccess'i generate-comparisons zaten yazıyor; bu
// modül onun SONUNA ekler. Bu yüzden build.js'te TÜM generator'lardan
// sonra çağrılmalı.
//
// GÜVENLİK: Silinmesi gereken ürün hâlâ katalogdaysa (admin'den henüz
// silinmediyse) o ürün için HİÇ kural yazılmaz — canlı bir sayfa yanlışlıkla
// yönlendirilmesin.
// ============================================================
const fs = require('fs');
const path = require('path');
const { comparisonFileName } = require('./generate-comparisons');

const SITE = 'https://teknoversus.com.tr';

// generate-reviews.js / generate-buying-guides.js / shared.js ile aynı slug kuralı
function slugify(name){
  const trMap = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return String(name).split('').map(ch => trMap[ch] !== undefined ? trMap[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
const ps = p => `${slugify(p.name)}-${p.id}`;

function writeDeletedProductRedirects({ rootDir, products }){
  const listFile = path.join(rootDir, 'lib', 'silinen-urunler.json');
  if(!fs.existsSync(listFile)) return;
  let list = [];
  try{ list = (JSON.parse(fs.readFileSync(listFile, 'utf8')).urunler) || []; }
  catch(e){ console.warn('UYARI: silinen-urunler.json okunamadı:', e.message); return; }

  const byId = {};
  (products || []).forEach(p => { byId[p.id] = p; });
  const exists = rel => fs.existsSync(path.join(rootDir, rel));
  const rules = { urun: [], inceleme: [], rehber: [], karsilastir: [] };
  let skipped = 0, done = 0;

  list.forEach(d => {
    if(!d || !d.id || !d.name || !d.yerine) return;
    if(byId[d.id]){ skipped++; console.warn(`UYARI: "${d.name}" (${d.id}) hâlâ katalogda — yönlendirme yazılmadı (önce admin'den sil).`); return; }
    const k = byId[d.yerine];
    if(!k){ skipped++; console.warn(`UYARI: "${d.name}" için hedef ürün (${d.yerine}) katalogda yok — yönlendirme yazılmadı.`); return; }
    done++;
    const oldS = ps(d), newS = ps(k);
    const urunT = `/urun/${newS}.html`;
    rules.urun.push([`/urun/${oldS}.html`, urunT]);
    rules.inceleme.push([`/inceleme/${oldS}-inceleme.html`, exists(`inceleme/${newS}-inceleme.html`) ? `/inceleme/${newS}-inceleme.html` : urunT]);
    ['alinir-mi', 'fiyat-performans'].forEach(suf => {
      rules.rehber.push([`/rehber/${oldS}-${suf}.html`, exists(`rehber/${newS}-${suf}.html`) ? `/rehber/${newS}-${suf}.html` : urunT]);
    });
    // Karşılaştırmalar: silinen ürünle aynı kategorideki her ürün için, yerine
    // geçen ürünle olan sayfası üretildiyse oraya yönlendir.
    (products || []).filter(p => p.cat === d.cat && p.id !== k.id).forEach(p => {
      const target = comparisonFileName(k, p);
      if(!exists(`karsilastir/${target}`)) return;
      const oldFile = comparisonFileName(d, p);
      if(oldFile === target || exists(`karsilastir/${oldFile}`)) return;
      rules.karsilastir.push([`/karsilastir/${oldFile}`, `/karsilastir/${target}`]);
    });
  });

  const header = '# OTOMATIK URETILIR (lib/deleted-redirects.js) - silinen cift kayit urunlerin eski sayfalari.\n';
  Object.entries(rules).forEach(([dir, list2]) => {
    if(!list2.length) return;
    const dirPath = path.join(rootDir, dir);
    if(!fs.existsSync(dirPath)) return;
    const f = path.join(dirPath, '.htaccess');
    const lines = list2.sort((a, b) => a[0].localeCompare(b[0])).map(([o, t]) => `Redirect 301 ${o} ${SITE}${t}`).join('\n');
    const prev = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/\n# OTOMATIK URETILIR \(lib\/deleted-redirects\.js\)[\s\S]*$/, '\n') : '';
    fs.writeFileSync(f, (prev ? prev.replace(/\n*$/, '\n') : '') + header + lines + '\n');
  });
  console.log(`Silinen ürün yönlendirmeleri: ${done} ürün, ${Object.values(rules).reduce((s, x) => s + x.length, 0)} kural${skipped ? `, ${skipped} ürün atlandı (yukarıdaki uyarılar)` : ''}.`);
}

module.exports = { writeDeletedProductRedirects };
