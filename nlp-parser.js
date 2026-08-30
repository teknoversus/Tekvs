// ============================================================
// TeknoVersus — Yerel Doğal Dil Kriter Çıkarıcı (API'siz)
// nlp-parser.js
//
// SIFIR ücretli API bağımlılığı. Hiçbir ağ isteği atmaz, hiçbir
// secret/API key gerektirmez. Tamamen deterministik, saf JS.
//
// Bu dosya shared.js'e ek olarak yüklenir (index.html'e bir
// <script> satırı eklenerek) ve runSmartSearch() bunu çağırır.
//
// KRİTİK KURAL: Sadece repo'da GERÇEKTEN var olan kategori/use-case/
// alanlar tanınır. Şemanın dışına çıkan hiçbir değer üretilmez.
// ============================================================

const NLP_VALID_CATEGORIES = ['Telefon','Dizüstü','Kulaklık','Kamera','Akıllı Saat','Tablet','Televizyon'];

// Kategori eş anlamlıları — gerçek CATS listesine eşleniyor.
// Sadece yaygın, açık eş anlamlılar; belirsiz/uydurma eşleme yok.
const NLP_CATEGORY_SYNONYMS = {
  'Telefon': ['telefon','cep telefonu','akıllı telefon','smartphone','iphone'],
  'Dizüstü': ['dizüstü','laptop','notebook','bilgisayar','macbook'],
  'Kulaklık': ['kulaklık','kulaklik','headphone','earphone','airpods'],
  'Kamera': ['kamera','fotoğraf makinesi','camera'],
  'Akıllı Saat': ['akıllı saat','akilli saat','smartwatch','galaxy watch','apple watch'],
  'Tablet': ['tablet','ipad','galaxy tab'],
  'Televizyon': ['televizyon','tv'],
};

// Sadece önceki turlarda onaylanan, gerçek spec alanlarıyla
// desteklenen use-case'ler.
const NLP_USE_CASE_KEYWORDS = {
  gaming: ['oyun', 'gaming', 'oyunlar için'],
  camera: ['kamera', 'kamerası', 'fotoğraf'],
  battery: ['pil', 'batarya', 'şarj', 'uzun ömür'],
  performance: ['performans', 'hızlı', 'güçlü'],
  display: ['ekran', 'görüntü'],
  office: ['ofis', 'iş için'],
  programming: ['kodlama', 'yazılım', 'programlama'],
  video_editing: ['video düzenleme', 'kurgu'],
  portability: ['hafif', 'taşınabilir', 'küçük'],
  durability: ['dayanıklı', 'su geçirmez', 'sağlam'],
};

/**
 * Türkçe (ve bazı yaygın kısaltma) sayı formatlarını sayıya çevirir.
 * Desteklenen formatlar: "20.000", "20 bin", "20K", "1,5 milyon",
 * "1.500,50" (karışık binlik+ondalık), düz "20000", düz ondalık "20.5".
 * Ayrıştırılamayan bir değer için null döner — asla tahmin üretmez.
 */
function nlpParseTurkishNumber(raw){
  if(typeof raw !== 'string') return null;
  const s = raw.trim().toLowerCase().replace(/tl|₺/g, '').trim();
  if(!s) return null;

  // "1,5 milyon" -> 1500000
  let m = s.match(/^(\d+(?:[.,]\d+)?)\s*milyon/);
  if(m) return parseFloat(m[1].replace(',', '.')) * 1_000_000;

  // "20 bin" -> 20000
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*bin/);
  if(m) return parseFloat(m[1].replace(',', '.')) * 1000;

  // "20k" -> 20000
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*k$/);
  if(m) return parseFloat(m[1].replace(',', '.')) * 1000;

  // "1.500,50" -> 1500.50 (nokta binlik + virgül ondalık, karışık format)
  if(/^\d{1,3}(\.\d{3})+,\d+$/.test(s)){
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  }

  // "20.000" veya "1.234.000" -> binlik ayıracı, tam sayı
  if(/^\d{1,3}(\.\d{3})+$/.test(s)){
    return parseFloat(s.replace(/\./g, ''));
  }

  // "20,5" -> sadece virgül ondalık
  if(/^\d+,\d+$/.test(s)){
    return parseFloat(s.replace(',', '.'));
  }

  // Düz sayı ("20000" ya da normal ondalık "20.5")
  const plain = parseFloat(s);
  if(Number.isFinite(plain)) return plain;

  return null;
}

/**
 * Sorgudan bütçe aralığını (min/max) çıkarır.
 * Destekler: "X ile Y arasında", "X-Y arası", "X altında"/"en fazla X",
 * "X üzerinde"/"en az X", tek başına bir sayı (max olarak alınır).
 */
// Model adı bağlamındaki sayıların bütçe ile karıştırılmasını önlemek
// için kullanılan kalıp: bu kelimelerden HEMEN SONRA gelen sayı(lar)
// bütçe aramasından tamamen çıkarılır. Dar bir "sadece RTX" yaması
// değil — CPU/GPU marka/aile isimlerinin TAMAMINI kapsayan bir liste
// (katalogdan doğrulanmış gerçek marka/aile adları).
const NLP_MODEL_NAME_CONTEXT = /\b(rtx|gtx|snapdragon|ryzen|core\s*i\d|core\s*ultra|apple\s*m|apple\s*a|dimensity|helio|exynos|tensor|unisoc)\b[\s\-]*\d+(\s*(elite|gen\s*\d+|pro|plus|ultra|max|hx|h|u|p))?/gi;

function nlpExtractGpuModel(query){
  const m = query.match(/\b(rtx|gtx)\s*(\d{3,4})/i);
  if(m) return `${m[1].toUpperCase()} ${m[2]}`;
  return null;
}

function nlpExtractCpuModel(query){
  // Snapdragon (yeni nesil: "8 Elite", "8 Gen 3" gibi)
  let m = query.match(/snapdragon\s*(\d+)\s*(elite(\s*gen\s*\d+)?|gen\s*\d+|\+)?/i);
  if(m) return `Snapdragon ${m[0].replace(/snapdragon\s*/i,'').trim()}`;
  // Apple A/M serisi
  m = query.match(/apple\s*(a|m)\s*(\d+)\s*(pro|max|ultra)?/i);
  if(m) return `Apple ${m[1].toUpperCase()}${m[2]}${m[3]?' '+m[3]:''}`.trim();
  // Ryzen
  m = query.match(/ryzen\s*(\d+)/i);
  if(m) return `Ryzen ${m[1]}`;
  return null;
}
function nlpExtractBudget(query){
  // KRİTİK DÜZELTME (iki katman):
  // 1) "512 GB depolamalı" gibi birim-etiketli sayılar bütçe değildir.
  // 2) "Snapdragon 8 Elite", "RTX 4060" gibi CPU/GPU MODEL ADI
  //    bağlamındaki sayılar da bütçe değildir — bu, dar bir "sadece RTX"
  //    yaması değil, katalogdaki TÜM CPU/GPU marka/aile isimlerini
  //    kapsayan genel bir bağlam kuralı (NLP_MODEL_NAME_CONTEXT).
  //    Gerçek testte "Snapdragon 8 Elite" → budget_max:8,
  //    "RTX 4060" → budget_max:4060 gibi yanlış sonuçlar bulunup
  //    bu kuralla kökten düzeltildi.
  let q = query.toLowerCase()
    .replace(/\d+\s*(?:gb|tb|mp|inç|inc|hz|mah|w)\b/g, '')
    .replace(NLP_MODEL_NAME_CONTEXT, '');
  q = q.replace(/\blira\b/g, 'tl'); // "lira" -> "tl" eş anlamlı, tek noktadan işlensin
  const numToken = '(\\d+(?:[.,]\\d+)*\\s*(?:bin|milyon|k)?)';

  // "15-25 bin TL arası" gibi ORTAK SONEKLİ aralıklar: ilk sayıda "bin/milyon/k"
  // yazılmamış olsa bile (Türkçe'de doğal bir kısaltma), ikinci sayıdaki
  // çarpan ilk sayıya da uygulanır.
  let m = q.match(/(\d+(?:[.,]\d+)*)\s*-\s*(\d+(?:[.,]\d+)*)\s*(bin|milyon|k)\b/);
  if(m){
    const suffix = m[3];
    const a = nlpParseTurkishNumber(m[1] + ' ' + suffix);
    const b = nlpParseTurkishNumber(m[2] + ' ' + suffix);
    if(a != null && b != null) return { budget_min: Math.min(a,b), budget_max: Math.max(a,b) };
  }

  // "X ile Y arasında" / "X - Y arası" (her iki sayı da kendi çarpanını taşıyor)
  m = q.match(new RegExp(numToken + '\\s*(?:tl|₺)?\\s*(?:ile|-)\\s*' + numToken + '\\s*(?:tl|₺)?\\s*aras'));
  if(m){
    const a = nlpParseTurkishNumber(m[1]);
    const b = nlpParseTurkishNumber(m[2]);
    if(a != null && b != null){
      return { budget_min: Math.min(a,b), budget_max: Math.max(a,b) };
    }
  }

  // "en az X" / "X üzerinde" / "X ve üzeri" -> min
  m = q.match(new RegExp('(?:en az|minimum)\\s*' + numToken));
  if(!m) m = q.match(new RegExp(numToken + '\\s*(?:tl|₺)?\\s*(?:üzeri|üzerinde|ve üzeri)'));
  if(m){
    const v = nlpParseTurkishNumber(m[1]);
    if(v != null) return { budget_min: v, budget_max: null };
  }

  // "en fazla X" / "X altında"/"X altı" / "X'i geçmeyen" / "X'e kadar" /
  // "X'in altında" -> max (Türkçe'nin yaygın çekim ekleri dahil edildi)
  m = q.match(new RegExp('(?:en fazla|maksimum)\\s*' + numToken));
  if(!m) m = q.match(new RegExp(numToken + '\\s*(?:tl|₺)?[\'’]?(?:in|nin)?\\s*(?:altında|altta|alti|alt[ıi]|geçmeyen)'));
  if(!m) m = q.match(new RegExp(numToken + '\\s*(?:tl|₺)?[\'’]?(?:e|ye)?\\s*kadar'));
  if(m){
    const v = nlpParseTurkishNumber(m[1]);
    if(v != null) return { budget_min: null, budget_max: v };
  }

  // SON ÇARE: hiçbir bağlam kalıbı eşleşmediyse ama sorguda GEÇERLİ bir
  // sayısal ifade varsa, bunu budget_max olarak kabul et.
  m = q.match(new RegExp(numToken + '\\s*(?:tl|₺)?'));
  if(m){
    const v = nlpParseTurkishNumber(m[1]);
    if(v != null) return { budget_min: null, budget_max: v };
  }

  return { budget_min: null, budget_max: null };
}

function nlpExtractCategory(query){
  const q = query.toLowerCase();
  for(const [cat, synonyms] of Object.entries(NLP_CATEGORY_SYNONYMS)){
    if(synonyms.some(s => q.includes(s))) return cat;
  }
  return null;
}

function nlpExtractUseCases(query){
  const q = query.toLowerCase();
  return Object.entries(NLP_USE_CASE_KEYWORDS)
    .filter(([, kws]) => kws.some(kw => q.includes(kw)))
    .map(([uc]) => uc);
}

function nlpExtractSort(query){
  const q = query.toLowerCase();
  if(q.includes('en ucuz')) return 'price_asc';
  if(q.includes('en pahalı') || q.includes('en pahali')) return 'price_desc';
  if(q.includes('en iyi fiyat performans') || q.includes('fiyat performans')) return 'best_match';
  // "en iyi puanlı" BİLEREK desteklenmiyor — sistemde ürün bazlı
  // ortalama kullanıcı puanı hesaplayan bir mekanizma yok (doğrulandı,
  // sadece tek ürün bazlı ham yorum listesi var). Uydurma bir sıralama
  // vermemek için bu ifade "best_match"e düşer, sessizce yanlış
  // sıralamaya geçmez.
  return 'best_match';
}

// Marka tespiti — UYDURMA bir liste değil, önceki oturumlarda TeknoVersus
// kataloğunda GERÇEKTEN doğrulanmış marka isimlerinden derlendi (bkz.
// generate-populer-karsilastirmalar.js BUYUK_MARKALAR sabiti).
const NLP_KNOWN_BRANDS = [
  'Apple','Samsung','Xiaomi','Sony','Asus','HP','Lenovo','Dell','Huawei',
  'Google','LG','Microsoft','MSI','Acer','Bose','JBL','Garmin','GoPro',
  'Canon','Nikon','Fujifilm','Panasonic','OnePlus','Motorola','Oppo',
  'Vivo','Realme','Honor','Nothing','Nubia','Casper','Reeder','Tecno',
  'Infinix','TCL','General Mobile','Poco','ZTE',
  // Doğrulanmış alt-ürün serisi isimleri (ürün adında GERÇEKTEN geçiyor,
  // ayrı bir "marka" değil ama pratikte aynı şekilde filtrelenebilir):
  'iPhone','MacBook','iPad','AirPods',
];

function nlpExtractBrand(query){
  const q = query.toLowerCase();
  // "hariç"/"istemiyorum" gibi olumsuzluk kelimeleri varsa excluded_brand,
  // yoksa preferred_brand olarak değerlendirilir.
  const negWords = ['istemiyorum','olmasın','hariç','dışında'];
  for(const brand of NLP_KNOWN_BRANDS){
    const idx = q.indexOf(brand.toLowerCase());
    if(idx === -1) continue;
    const after = q.slice(idx + brand.length, idx + brand.length + 20);
    if(negWords.some(w => after.includes(w))){
      return { preferred_brand: null, excluded_brand: brand };
    }
    return { preferred_brand: brand, excluded_brand: null };
  }
  return { preferred_brand: null, excluded_brand: null };
}
function nlpExtractRam(query){
  const m = query.toLowerCase().match(/(\d+)\s*gb\s*ram|ram\s*(\d+)\s*gb/);
  if(m) return Number(m[1] || m[2]);
  return null;
}

function nlpExtractStorage(query){
  const q = query.toLowerCase();
  // Önce açık bağlam kelimeli hali dene ("512 GB depolama/hafıza/disk")
  let m = q.match(/(\d+)\s*(gb|tb)\s*(?:depolama|hafıza|disk)/);
  if(m){
    let val = Number(m[1]);
    if(m[2] === 'tb') val *= 1000;
    return val;
  }
  // Bağlamsız "256 GB tablet" gibi ifadeler: "GB ram" DEĞİLSE ve sorguda
  // zaten bir RAM ifadesi yakalanmadıysa, tek başına "X GB" depolama
  // anlamına gelir (Türkçe'de yaygın kısaltma — "16 GB RAM" hariç tüm
  // "X GB" ifadeleri pratikte depolamayı işaret eder).
  m = q.match(/(\d+)\s*(gb|tb)\b(?!\s*ram)/);
  if(m && !/ram\s*(\d+)\s*gb/.test(q)){
    let val = Number(m[1]);
    if(m[2] === 'tb') val *= 1000;
    return val;
  }
  return null;
}

function extractCriteriaLocally(query){
  const budget = nlpExtractBudget(query);
  const brand = nlpExtractBrand(query);
  return {
    category: nlpExtractCategory(query),
    budget_min: budget.budget_min,
    budget_max: budget.budget_max,
    use_case: nlpExtractUseCases(query),
    min_ram_gb: nlpExtractRam(query),
    min_storage_gb: nlpExtractStorage(query),
    gpu_model: nlpExtractGpuModel(query),
    cpu_model: nlpExtractCpuModel(query),
    preferred_brand: brand.preferred_brand,
    excluded_brand: brand.excluded_brand,
    sort_preference: nlpExtractSort(query),
    requested_count: 4,
  };
}

if(typeof module !== 'undefined' && module.exports){
  module.exports = { extractCriteriaLocally, nlpParseTurkishNumber, nlpExtractBudget, nlpExtractCategory, nlpExtractUseCases, nlpExtractSort, nlpExtractBrand, nlpExtractRam, nlpExtractStorage, nlpExtractGpuModel, nlpExtractCpuModel };
}
