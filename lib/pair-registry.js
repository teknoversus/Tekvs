// ============================================================
// Yayındaki karşılaştırma sayfalarının kalıcı kaydı (URL kalıcılığı).
//
// Kök neden (Search Console, 22 Ekim 2026: 404 sayısı 495 → 755 → 1.101 →
// 1.573, sürekli artıyor): karşılaştırma ikilileri skor komşuluğuyla
// seçiliyor. Ürün eklenince/silinince ya da fiyat değişince komşuluklar
// kayıyor, bir önceki build'de yayınlanmış ikililer üretilmez oluyor ve
// sayfaları 404 veriyor. Elle tutulan LEGACY_PAIRS listesi bunu yetiştiremedi.
//
// Çözüm: Bir kez yayınlanan her karşılaştırma lib/yayinda-ciftler.txt'e yazılır
// ve sonraki her build'de:
//   - iki ürün de katalogdaysa sayfa YİNE üretilir (indeksleme kuralları aynen
//     uygulanır; zayıf ikili noindex olur ama 404 olmaz),
//   - ürünlerden biri silindiyse adres kalan ürünün sayfasına 301 olur
//     (silinen ürün lib/silinen-urunler.json'da varsa onun yerine geçen ürünle
//     olan karşılaştırmaya).
//
// Dosya biçimi (satır başına bir sayfa, sıralı):
//   idA|idB<TAB>dosya-adi.html      (çözülmüş kayıt)
//   dosya-adi.html                  (henüz çözülmemiş — build katalogdan çözmeyi dener)
//
// CI, deploy başarıyla bitince bu dosyayı main'e geri yazar (deploy.yml).
// ============================================================
const fs = require('fs');
const path = require('path');
const { comparisonFileName } = require('./generate-comparisons');

const FILE = path.join('lib', 'yayinda-ciftler.txt');

// generate-comparisons.js'teki slugify + shortSlug ile birebir aynı
function slugify(text){
  return text.toString().toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}
const shortSlug = name => (slugify(name).slice(0, 34).replace(/-+$/,'') || 'urun');

function readRegistry(rootDir){
  const f = path.join(rootDir, FILE);
  if(!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#')).map(line => {
    const [left, right] = line.split('\t');
    if(right){ const [a, b] = left.split('|'); return { a, b, file: right }; }
    return { a: null, b: null, file: left };
  }).filter(e => /^[a-z0-9_.+-]+\.html$/.test(e.file));
}

// Hash'li dosya adını katalogdaki ürünlerle çözer (kısa slug eşleşmesi + SHA-256 kontrolü).
function makeResolver(catalog){
  const bySlug = new Map();
  catalog.forEach(p => {
    const s = shortSlug(p.name);
    if(!bySlug.has(s)) bySlug.set(s, []);
    bySlug.get(s).push(p);
  });
  return function resolve(file){
    const m = /^(.*)-([0-9a-f]{12})\.html$/.exec(file);
    if(!m) return null;
    const base = m[1];
    let idx = base.indexOf('-vs-');
    while(idx !== -1){
      const as = bySlug.get(base.slice(0, idx)) || [], bs = bySlug.get(base.slice(idx + 4)) || [];
      for(const a of as) for(const b of bs){
        if(a.id !== b.id && comparisonFileName(a, b) === file) return [a, b];
      }
      idx = base.indexOf('-vs-', idx + 1);
    }
    return null;
  };
}

// Kısmi çözüm: ürünlerden en az biri hâlâ katalogdaysa onun sayfasına yönlendirmek için.
function partialMatch(file, catalog){
  const m = /^(.*)-[0-9a-f]{12}\.html$/.exec(file);
  if(!m) return null;
  const slugs = new Map();
  catalog.forEach(p => { const s = shortSlug(p.name); if(!slugs.has(s)) slugs.set(s, p); });
  const base = m[1];
  let idx = base.indexOf('-vs-');
  while(idx !== -1){
    const a = slugs.get(base.slice(0, idx)), b = slugs.get(base.slice(idx + 4));
    if(a || b) return a || b;
    idx = base.indexOf('-vs-', idx + 1);
  }
  return null;
}

// Build'den ÖNCE: hangi ikililer zorunlu üretilecek, hangi adresler yönlendirilecek.
function planFromRegistry({ rootDir, catalog, productUrl }){
  const entries = readRegistry(rootDir);
  const byId = {};
  catalog.forEach(p => { byId[String(p.id)] = p; });
  const resolve = makeResolver(catalog);
  let replace = {};
  try{
    const j = JSON.parse(fs.readFileSync(path.join(rootDir, 'lib', 'silinen-urunler.json'), 'utf8'));
    (j.urunler || []).forEach(d => { if(d && d.id && d.yerine) replace[String(d.id)] = String(d.yerine); });
  }catch(e){}

  const sticky = [];          // [idA, idB]
  const redirects = [];       // [eskiDosya, hedefYol]  (hedef: kalıcı karşılaştırma ya da ürün sayfası)
  const resolved = [];        // kayıt güncellemesi için
  let unresolved = 0;
  entries.forEach(e => {
    let a = e.a, b = e.b;
    if(!a || !b){
      const r = resolve(e.file);
      if(r){ a = String(r[0].id); b = String(r[1].id); }
    }
    if(a && b){
      resolved.push({ a, b, file: e.file });
      const pa = byId[a], pb = byId[b];
      if(pa && pb){ sticky.push([a, b]); return; }
      // Silinen ürün: yerine geçen ürünle olan ikiliye, o da yoksa kalan ürünün sayfasına.
      const ra = pa || byId[replace[a]], rb = pb || byId[replace[b]];
      if(ra && rb && ra.id !== rb.id){ redirects.push([e.file, { pair: [ra, rb] }]); return; }
      const keep = pa || pb || ra || rb;
      if(keep) redirects.push([e.file, { url: productUrl(keep) }]);
      return;
    }
    resolved.push({ a: null, b: null, file: e.file });
    const keep = partialMatch(e.file, catalog);
    if(keep) redirects.push([e.file, { url: productUrl(keep) }]);
    else unresolved++;
  });
  console.log(`Yayındaki karşılaştırma kaydı: ${entries.length} kayıt, ${sticky.length} ikili korunacak, ${redirects.length} adres yönlendirilecek, ${unresolved} çözülemedi.`);
  return { sticky, redirects, resolved };
}

// Build'den SONRA: kayıt = eski kayıtlar ∪ bu build'de üretilenler.
function writeRegistry({ rootDir, resolved, generatedPairs }){
  const map = new Map();
  (resolved || []).forEach(e => map.set(e.file, e));
  (generatedPairs || []).forEach(([a, b, file]) => {
    const [x, y] = [String(a.id), String(b.id)].sort();
    map.set(file, { a: x, b: y, file });
  });
  const lines = [...map.values()].sort((p, q) => p.file.localeCompare(q.file))
    .map(e => (e.a && e.b) ? `${[e.a, e.b].sort().join('|')}\t${e.file}` : e.file);
  const head = '# Yayınlanmış karşılaştırma sayfaları (lib/pair-registry.js). Her deploy sonrası CI günceller; elle silmeyin.\n';
  fs.writeFileSync(path.join(rootDir, FILE), head + lines.join('\n') + '\n');
  console.log(`Yayındaki karşılaştırma kaydı güncellendi: ${lines.length} sayfa -> ${FILE}`);
}

module.exports = { planFromRegistry, writeRegistry, readRegistry };
