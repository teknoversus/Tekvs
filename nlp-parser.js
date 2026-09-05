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
  'Telefon': ['telefon','cep telefonu','akıllı telefon','smartphone'],
  'Dizüstü': ['dizüstü','laptop','notebook','bilgisayar'],
  'Kulaklık': ['kulaklık','kulaklik','headphone','earphone'],
  'Kamera': ['kamera','fotoğraf makinesi','camera'],
  'Akıllı Saat': ['akıllı saat','akilli saat','smartwatch'],
  'Tablet': ['tablet'],
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
function nlpExtractBudget(query){
  const q = query.toLowerCase();
  const numToken = '(\\d+(?:[.,]\\d+)*\\s*(?:bin|milyon|k)?)';

  // "X ile Y arasında" / "X - Y arası"
  let m = q.match(new RegExp(numToken + '\\s*(?:tl|₺)?\\s*(?:ile|-)\\s*' + numToken + '\\s*(?:tl|₺)?\\s*aras'));
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

  // "en fazla X" / "X altında" / "X'i geçmeyen" -> max
  m = q.match(new RegExp('(?:en fazla|maksimum)\\s*' + numToken));
  if(!m) m = q.match(new RegExp(numToken + '\\s*(?:tl|₺)?\\s*(?:altında|alti|geçmeyen)'));
  if(m){
    const v = nlpParseTurkishNumber(m[1]);
    if(v != null && v >= 100) return { budget_min: null, budget_max: v };
  }

  // SON ÇARE: hiçbir bağlam kalıbı (arası/altında/üzerinde/en az/en fazla)
  // eşleşmediyse ama sorguda GEÇERLİ bir sayısal ifade varsa (örn. sadece
  // "20.000 TL" ya da "20 bin" tek başına), bunu budget_max olarak kabul
  // et — Türkçe'de bağlamsız bir bütçe rakamı genelde üst sınır anlamına
  // gelir. Sayısal ifade hiç yoksa null/null döner, uydurma olmaz.
  m = q.match(new RegExp(numToken + '\\s*(?:tl|₺)?'));
  if(m){
    const v = nlpParseTurkishNumber(m[1]);
    if(v != null && v >= 100) return { budget_min: null, budget_max: v };
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

/**
 * Ana giriş noktası: doğal dil sorgusunu alır, TAMAMEN yerel/deterministik
 * olarak kriter objesine çevirir. Hiçbir ağ isteği yok.
 */
function extractCriteriaLocally(query){
  const budget = nlpExtractBudget(query);
  return {
    category: nlpExtractCategory(query),
    budget_min: budget.budget_min,
    budget_max: budget.budget_max,
    use_case: nlpExtractUseCases(query),
    preferred_brand: null,
    excluded_brand: null,
    sort_preference: nlpExtractSort(query),
    requested_count: 4,
  };
}

if(typeof module !== 'undefined' && module.exports){
  module.exports = { extractCriteriaLocally, nlpParseTurkishNumber, nlpExtractBudget, nlpExtractCategory, nlpExtractUseCases, nlpExtractSort };
}
