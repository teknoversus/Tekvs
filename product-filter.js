// ============================================================
// TeknoVersus — Deterministik Ürün Filtreleme/Sıralama (API'siz)
// product-filter.js
//
// nlp-parser.js'ten gelen kriter objesini alır, mevcut ürün
// kataloğu üzerinde SIRAYLA filtreler, sonra sıralar. Hiçbir
// ağ isteği, hiçbir AI çağrısı yok — computeScores() dahil her şey
// zaten var olan, mevcut fonksiyonları kullanıyor.
//
// EKSİK ALAN KURALI: "zorunlu" bir kriter (min_ram_gb, min_storage_gb)
// için ürünün ilgili spec alanı hiç yoksa, ürün SESSİZCE geçirilmez —
// filtreden ÇIKARILIR. Bu davranış, "eksik veri = kriteri karşılıyor"
// gibi yanlış bir varsayım yapılmasını engelliyor.
// ============================================================

function pfGetPrice(p){
  const raw = p.specs && p.specs['Fiyat (₺)'];
  if(raw == null) return null;
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function pfGetNumericSpec(p, key){
  const raw = p.specs && p.specs[key];
  if(raw == null) return null;
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// ============================================================
// KATEGORİYE ÖZEL SKORLAR (Faz 3 — Görev 4/5/6)
//
// computeScores() bir GENEL fiyat/performans skorudur — "oyun için
// iyi mi" veya "kamerası iyi mi" sorularına cevap vermez, bunu
// yanlışlıkla genel kalite skoru gibi kullanmamak için burada AYRI,
// dar kapsamlı skorlar tanımlanıyor. Her biri SADECE gerçek, doğrulanmış
// spec alanlarını kullanıyor — hiçbir veri uydurulmuyor.
// ============================================================

/**
 * Oyun uygunluğu (0-100). Kategoriye göre FARKLI alanlar kullanılır
 * çünkü "oyun için telefon" ile "oyun için laptop" aynı kriter değildir:
 *  - Dizüstü: gerçek GPU metninde "entegre" GEÇMİYORSA (yani NVIDIA RTX/GTX
 *    gibi dedike bir model adı varsa) yüksek puan. Bu, veriden GERÇEKTEN
 *    okunabilen bir ayrım (bkz. "Ekran Kartı" alanının doğrulanmış
 *    içeriği) — GPU'nun MODELİNE göre bir güç sıralaması YAPILMIYOR
 *    (böyle bir referans veri yok), sadece "entegre mi/dedike mi" ikili
 *    ayrımı yapılıyor.
 *  - Telefon: Yenileme Hızı (Hz) ve RAM (GB), her ikisi de kategori
 *    içinde normalize edilip ortalanıyor. Bu da GERÇEK oyun performansını
 *    ölçmez, sadece bu iki alanın yüksek olmasının oyun deneyimine
 *    genelde katkı sağladığı bilinen bir vekil göstergedir.
 *  - Diğer kategoriler: gaming kavramı anlamlı değil, 0 döner.
 */
function pfGamingScore(p, categoryPool){
  if(p.cat === 'Dizüstü'){
    const gpu = String(p.specs['Ekran Kartı'] || '').toLowerCase();
    if(!gpu) return 0;
    return gpu.includes('entegre') ? 20 : 90; // dedike GPU açıkça ayırt edilebiliyor
  }
  if(p.cat === 'Telefon'){
    const hz = pfGetNumericSpec(p, 'Yenileme Hızı (Hz)');
    const ram = pfGetNumericSpec(p, 'RAM (GB)');
    if(hz == null && ram == null) return 0;
    const pool = categoryPool.filter(x => x.cat === 'Telefon');
    const hzVals = pool.map(x => pfGetNumericSpec(x,'Yenileme Hızı (Hz)')).filter(v=>v!=null);
    const ramVals = pool.map(x => pfGetNumericSpec(x,'RAM (GB)')).filter(v=>v!=null);
    const norm = (v, arr) => (v==null || !arr.length) ? 0 : (v - Math.min(...arr)) / ((Math.max(...arr)-Math.min(...arr)) || 1);
    return Math.round(((norm(hz,hzVals) + norm(ram,ramVals)) / 2) * 100);
  }
  return 0;
}

/**
 * Kamera uygunluğu (0-100). DÜRÜSTLÜK NOTU: katalogda kamera kalitesini
 * belirleyen (sensör, lens, işlemci gibi) çok boyutlu bir veri YOK —
 * sadece "Kamera (MP)" sayısı var. MP, gerçek fotoğraf kalitesiyle
 * doğrudan ve güvenilir şekilde ilişkili DEĞİLDİR (düşük MP'li ama
 * iyi sensörlü telefonlar daha iyi fotoğraf çekebilir). Bu yüzden bu
 * skor kasıtlı olarak "camera_score" (MP'ye dayalı kaba bir gösterge)
 * olarak adlandırılıyor, "gerçek kamera kalitesi" diye SUNULMUYOR.
 */
function pfCameraScore(p, categoryPool){
  const mp = pfGetNumericSpec(p, 'Kamera (MP)');
  if(mp == null) return 0;
  const pool = categoryPool.filter(x => x.cat === p.cat);
  const vals = pool.map(x => pfGetNumericSpec(x,'Kamera (MP)')).filter(v=>v!=null);
  if(!vals.length) return 0;
  const min = Math.min(...vals), max = Math.max(...vals);
  return Math.round(((mp - min) / ((max-min)||1)) * 100);
}

/**
 * Pil uygunluğu (0-100). Birim kategoriye göre FARKLI (Telefon: mAh,
 * Dizüstü/Akıllı Saat: saat) — bu yüzden karşılaştırma SADECE aynı
 * kategori içinde, kendi biriminde yapılıyor, birimler arası çevrim
 * YAPILMIYOR (uydurma bir dönüşüm katsayısı kullanılmıyor).
 */
function pfBatteryScore(p, categoryPool){
  const field = p.specs['Pil (mAh)'] != null ? 'Pil (mAh)' : (p.specs['Pil (saat)'] != null ? 'Pil (saat)' : null);
  if(!field) return 0;
  const val = pfGetNumericSpec(p, field);
  if(val == null) return 0;
  const pool = categoryPool.filter(x => x.cat === p.cat);
  const vals = pool.map(x => pfGetNumericSpec(x, field)).filter(v=>v!=null);
  if(!vals.length) return 0;
  const min = Math.min(...vals), max = Math.max(...vals);
  return Math.round(((val - min) / ((max-min)||1)) * 100);
}

/**
 * Ekran uygunluğu (0-100). Sadece "Ekran (inç)" alanı olan kategorilerde
 * (Telefon, Dizüstü, Tablet, Televizyon — doğrulandı) anlamlı; diğerlerinde
 * 0 döner (uydurma veri yok).
 */
function pfDisplayScore(p, categoryPool){
  const size = pfGetNumericSpec(p, 'Ekran (inç)');
  if(size == null) return 0;
  const pool = categoryPool.filter(x => x.cat === p.cat);
  const vals = pool.map(x => pfGetNumericSpec(x,'Ekran (inç)')).filter(v=>v!=null);
  if(!vals.length) return 0;
  const min = Math.min(...vals), max = Math.max(...vals);
  return Math.round(((size - min) / ((max-min)||1)) * 100);
}

/**
 * Kriterlere göre kataloğu filtreler ve computeScores()'a (ya da
 * fiyat sıralamasına) göre sıralar. Ürün bulunamazsa boş dizi döner
 * — hata fırlatmaz.
 *
 * @param {object} criteria - nlp-parser.js'in extractCriteriaLocally() çıktısı
 * @param {array} products - tüm ürün kataloğu (upcoming dahil olabilir, burada filtrelenir)
 * @param {object} scores - computeScores(products) çıktısı, {id: skor}
 */
function filterAndRankProducts(criteria, products, scores){
  let pool = (products || []).filter(p => !p.upcoming);
  const fullCatalog = pool; // kategori-içi normalize hesapları için tam havuz saklanıyor

  // 1) Kategori
  if(criteria.category){
    pool = pool.filter(p => p.cat === criteria.category);
  }

  // 2) Bütçe (fiyat alanı olmayan ürün, bütçe kriteri varsa elenir)
  if(criteria.budget_max != null || criteria.budget_min != null){
    pool = pool.filter(p => {
      const price = pfGetPrice(p);
      if(price == null) return false; // fiyat bilinmiyorsa bütçe kriterini karşılayamaz
      if(criteria.budget_max != null && price > criteria.budget_max) return false;
      if(criteria.budget_min != null && price < criteria.budget_min) return false;
      return true;
    });
  }

  // 3) Zorunlu teknik kriterler — spec alanı YOKSA ürün elenir (sessizce geçirilmez)
  if(criteria.min_ram_gb != null){
    pool = pool.filter(p => {
      const ram = pfGetNumericSpec(p, 'RAM (GB)');
      return ram != null && ram >= criteria.min_ram_gb;
    });
  }
  if(criteria.min_storage_gb != null){
    pool = pool.filter(p => {
      const storage = pfGetNumericSpec(p, 'Depolama (GB)');
      return storage != null && storage >= criteria.min_storage_gb;
    });
  }

  // 4) Marka (dahil/hariç)
  if(criteria.preferred_brand){
    const b = criteria.preferred_brand.toLowerCase();
    pool = pool.filter(p => p.name.toLowerCase().includes(b));
  }
  if(criteria.excluded_brand){
    const b = criteria.excluded_brand.toLowerCase();
    pool = pool.filter(p => !p.name.toLowerCase().includes(b));
  }

  // 5) use_case bonusu — artık "var/yok" değil, GERÇEK normalize
  // skorlar kullanılıyor (bkz. pfGamingScore/pfCameraScore/vb.)
  const useCaseBonus = (p) => {
    if(!criteria.use_case || !criteria.use_case.length) return 0;
    let bonus = 0;
    for(const uc of criteria.use_case){
      if(uc === 'gaming') bonus += pfGamingScore(p, fullCatalog);
      if(uc === 'camera') bonus += pfCameraScore(p, fullCatalog);
      if(uc === 'battery') bonus += pfBatteryScore(p, fullCatalog);
      if(uc === 'display') bonus += pfDisplayScore(p, fullCatalog);
      if(uc === 'portability' && pfGetNumericSpec(p,'Ürünün Ağırlığı (g)') != null) bonus += 20;
      if(uc === 'durability' && p.specs['Su Geçirmezlik'] && p.specs['Su Geçirmezlik'] !== 'Yok') bonus += 20;
    }
    return bonus;
  };

  if(pool.length === 0) return [];

  // 6) Sıralama
  const getPrice = pfGetPrice;
  if(criteria.sort_preference === 'price_asc'){
    pool.sort((a,b) => (getPrice(a) ?? Infinity) - (getPrice(b) ?? Infinity));
  } else if(criteria.sort_preference === 'price_desc'){
    pool.sort((a,b) => (getPrice(b) ?? -Infinity) - (getPrice(a) ?? -Infinity));
  } else if(criteria.use_case && criteria.use_case.length){
    // use-case belirtilmişse, GENEL fiyat/performans yerine ÖNCELİKLE
    // use-case bonusuna göre sırala (computeScores küçük bir tamamlayıcı
    // ağırlık olarak kalır) — "oyun için laptop" sorgusunda artık dedike
    // GPU'lu modeller gerçekten öne çıkıyor.
    pool.sort((a,b) => {
      const scoreA = useCaseBonus(a) + (scores[a.id]||0) * 0.2;
      const scoreB = useCaseBonus(b) + (scores[b.id]||0) * 0.2;
      return scoreB - scoreA;
    });
  } else {
    // use-case yoksa: saf computeScores (genel fiyat/performans) — bu,
    // "en iyi X" gibi belirsiz isteklerde varsayılan davranış, GÖREV 5'in
    // istediği ayrım burada korunuyor (fiyat/performans ≠ diğer skorlar).
    pool.sort((a,b) => (scores[b.id]||0) - (scores[a.id]||0));
  }

  return pool.slice(0, criteria.requested_count || 4);
}

if(typeof module !== 'undefined' && module.exports){
  module.exports = { filterAndRankProducts, pfGetPrice, pfGetNumericSpec, pfGamingScore, pfCameraScore, pfBatteryScore, pfDisplayScore };
}
