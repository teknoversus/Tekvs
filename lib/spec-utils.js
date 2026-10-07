// ============================================================
// Özellik değeri "yok" mu? ("Belirtilmemiş", "-", boş vb.)
// shared.js'teki specValueMissing ile AYNI kural (build tarafı için kopya).
// 6 Ekim 2026: Toplu eklenen ürünlerde 47 alanın çoğu "Belirtilmemiş" metniyle
// geliyor; bunlar artık tablolarda satır olarak gösterilmiyor.
// ============================================================
function specValueMissing(v){
  const t = String(v == null ? '' : v).trim().toLowerCase();
  return !t || /^(belirtilmemiş|belirtilmemis|henüz doğrulanmadı|henuz dogrulanmadi|bilinmiyor|bilgi yok|yok bilgi|-|—|–|n\/a|null|undefined)$/.test(t);
}
// [[anahtar, değer], ...] — yalnızca gerçek değeri olanlar
function realSpecEntries(specs){
  return Object.entries(specs || {}).filter(([, v]) => !specValueMissing(v));
}

// ============================================================
// SAYFA KALİTE EŞİĞİ (7 Ekim 2026)
//
// AdSense başvurusu "düşük değere sahip içerik" gerekçesiyle reddedildi.
// Sitede ürün başına 4 şablon sayfa üretiliyordu (ürün + inceleme + "alınır
// mı" + "fiyat/performans") ve bunların hepsi, verisi ne kadar az olursa
// olsun indeksleniyordu. Buradaki kurallar "bu sayfa arama motoruna
// gösterilmeye değecek kadar gerçek veri taşıyor mu?" sorusunu TEK YERDE
// cevaplar; üretici modüller (generate-site / reviews / buying-guides /
// comparisons) buraya sorar.
//
// Eşiğin altındaki sayfa SİLİNMEZ: üretilmeye, linklenmeye ve ziyaretçiye
// açık olmaya devam eder; yalnızca "noindex, follow" alır ve sitemap'e
// girmez. Ürünün verisi tamamlandığında bir sonraki build'de kendiliğinden
// indekslenebilir hale gelir.
// ============================================================
const MIN_REAL_SPECS = 8;          // fiyat hariç, gerçek değeri olan özellik sayısı
const MIN_SHARED_COMPARE_ROWS = 6; // karşılaştırmada iki tarafta da dolu olan satır
const MAX_COMPARE_PRICE_RATIO = 2; // skor komşusu çiftlerde pahalı/ucuz fiyat oranı üst sınırı

function priceOf(p){
  const specs = (p && p.specs) || {};
  const key = Object.keys(specs).find(k => /fiyat/i.test(k));
  if(!key) return null;
  const n = parseFloat(String(specs[key]).replace(/[^\d.,]/g, '').replace(',', '.'));
  return isNaN(n) || n <= 0 ? null : n;
}
function realSpecCount(p){
  return realSpecEntries((p && p.specs) || {}).filter(([k]) => !/fiyat/i.test(k)).length;
}
// Ürün sayfası indekslenmeli mi?
function productIndexable(p){
  return !!p && !p.upcoming && priceOf(p) != null && realSpecCount(p) >= MIN_REAL_SPECS;
}
// İki üründe de gerçek değeri olan ortak özellik satırı sayısı (fiyat hariç)
function sharedSpecRows(a, b){
  const sa = (a && a.specs) || {}, sb = (b && b.specs) || {};
  return Object.keys(sa).filter(k => !/fiyat/i.test(k) && !specValueMissing(sa[k]) && !specValueMissing(sb[k])).length;
}
// Karşılaştırma sayfası indekslenmeli mi?
// curated: elle seçilmiş (nesil zinciri / rakip çift / GSC ile trafik aldığı
// bilinen) çift — fiyat yakınlığı şartından muaftır, çünkü "S24 Ultra mı S26
// Ultra mı" gibi sorgular fiyat farkına rağmen gerçekten aranıyor.
function comparisonIndexable(a, b, { curated = false } = {}){
  if(!productIndexable(a) || !productIndexable(b)) return false;
  if(String(a.name).trim().toLocaleLowerCase('tr-TR') === String(b.name).trim().toLocaleLowerCase('tr-TR')) return false; // "X vs X"
  if(sharedSpecRows(a, b) < MIN_SHARED_COMPARE_ROWS) return false;
  if(!curated){
    const pa = priceOf(a), pb = priceOf(b);
    if(Math.max(pa, pb) / Math.min(pa, pb) > MAX_COMPARE_PRICE_RATIO) return false;
  }
  return true;
}

// ============================================================
// Marka adı birleştirme: "ASUS" ve "Asus" (ya da "LENOVO" / "Lenovo") aynı
// markadır. Ürün adının ilk kelimesi marka sayıldığı için yazım farkı iki ayrı
// marka üretiyor, bu da aynı slug'a iki kez yazılan marka sayfalarına ve
// "asus-vs-asus" gibi bir markayı kendisiyle karşılaştıran sayfalara yol
// açıyordu. Dönen fonksiyon, bir marka adını o markanın katalogda EN SIK
// geçen yazımına çevirir.
// ============================================================
function brandCanonicalizer(products, brandOf){
  const counts = {};
  products.forEach(p => {
    const b = brandOf(p);
    const k = String(b).toLowerCase();
    counts[k] = counts[k] || {};
    counts[k][b] = (counts[k][b] || 0) + 1;
  });
  const best = {};
  Object.keys(counts).forEach(k => {
    best[k] = Object.entries(counts[k]).sort((x, y) => y[1] - x[1])[0][0];
  });
  return b => best[String(b).toLowerCase()] || b;
}

module.exports = {
  brandCanonicalizer,
  specValueMissing, realSpecEntries,
  MIN_REAL_SPECS, MIN_SHARED_COMPARE_ROWS, MAX_COMPARE_PRICE_RATIO,
  priceOf, realSpecCount, productIndexable, sharedSpecRows, comparisonIndexable,
};
