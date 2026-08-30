// ============================================================
// TeknoVersus — Ücretsiz CPU/GPU Performans Sıralaması (Faz 4)
// performance-data.js
//
// TEMEL İLKE: Bu dosya SAYISAL PUAN UYDURMAZ. Sadece ORDİNAL (sıra)
// bilgisi üretir — "A modeli B'den güçlü mü" sorusuna cevap verir,
// "A modeli tam olarak X puan" gibi bir kesinlik iddia etmez.
//
// ÇAPRAZ MARKA KIYASLAMA YAPILMAZ: Snapdragon ile Apple A serisini,
// ya da Intel ile AMD Ryzen'i DOĞRUDAN karşılaştırmak için ortak,
// güvenilir bir ölçek YOK (bu, Faz 4 ön analiz raporunda tespit
// edildi). Bunun yerine her CPU AİLESİ kendi İÇİNDE 0-100'e normalize
// edilir — "bu telefon kendi ailesinin (Snapdragon/Apple A/MediaTek)
// zirvesine ne kadar yakın" sorusuna cevap verir. Bu, hem dürüst
// hem de "en güçlü işlemcili telefon" gibi sorgularda her markadan
// gerçekten güçlü modelleri öne çıkarmaya yeter.
//
// GPU tarafında SADECE 4 gerçek dedike NVIDIA modeli var (katalogdan
// doğrulandı) — bunlar için KESİN ordinal sıra veriliyor (NVIDIA'nın
// kendi resmi ürün segmentasyonu: yüksek model no = yüksek segment).
// Entegre GPU'lar (Intel Iris Xe/Arc, Apple M-serisi GPU) ayrı bir
// "entegre" sınıfında tutuluyor, ARALARINDA sıralama YAPILMIYOR
// (nesiller arası güvenilir karşılaştırma verisi yok).
// ============================================================

// ---- GPU: sadece katalogda GERÇEKTEN var olan 4 dedike model ----
// Sıra 1 = en güçlü. NVIDIA'nın kendi model numaralandırması
// (40 serisi > 30 serisi, aynı seride yüksek son iki hane = üst segment).
const GPU_RANK_ORDER = ['rtx 4070', 'rtx 4060', 'rtx 3050 6gb', 'rtx 3050 4gb'];

function getGpuInfo(gpuText){
  if(!gpuText) return { tier: 'yok', rank: null };
  const t = String(gpuText).toLowerCase();
  if(t.includes('entegre')) return { tier: 'entegre', rank: null };
  for(let i = 0; i < GPU_RANK_ORDER.length; i++){
    if(t.includes(GPU_RANK_ORDER[i])) return { tier: 'dedike', rank: i + 1, total: GPU_RANK_ORDER.length };
  }
  // Katalogda olmayan bir model (örn. ileride eklenecek "RTX 5060") —
  // TAHMİN YAPILMAZ, "bilinmiyor" olarak işaretlenir.
  return { tier: 'bilinmiyor', rank: null };
}

/**
 * CPU metnini ailesine göre ayrıştırıp AİLE-İÇİ ordinal bir değer üretir.
 * "comparable" alanı, hangi ürünlerin birbiriyle kıyaslanabilir olduğunu
 * belirtir — FARKLI comparable değerine sahip iki CPU asla doğrudan
 * karşılaştırılmamalı.
 */
function getCpuInfo(cpuText){
  if(!cpuText) return { family: null, comparable: null, rawRank: null };
  const t = String(cpuText);

  // Apple A-serisi (Telefon) — nesil numarası + "Pro" soneki
  let m = t.match(/Apple A(\d+)/i);
  if(m){
    let rank = parseInt(m[1], 10) * 10;
    if(/Pro/i.test(t)) rank += 5;
    return { family: 'Apple A-serisi', comparable: 'apple-a', rawRank: rank };
  }

  // Apple M-serisi (Dizüstü/Tablet) — nesil + Pro/Max/Ultra soneki
  m = t.match(/Apple M(\d+)/i);
  if(m){
    let rank = parseInt(m[1], 10) * 10;
    if(/Ultra/i.test(t)) rank += 9;
    else if(/Max/i.test(t)) rank += 6;
    else if(/Pro/i.test(t)) rank += 3;
    return { family: 'Apple M-serisi', comparable: 'apple-m', rawRank: rank };
  }

  // Snapdragon — İKİ FARKLI, BİRBİRİYLE KARIŞTIRILAMAYAN numaralandırma
  // dönemi var: eski düz 3-haneli sistem ("888", "778G" — yüksek sayı=
  // yeni/güçlü AMA bu dönemin KENDİ İÇİNDE) ve yeni "8 Gen X"/"8 Elite"
  // sistemi. "888" sayısı büyük görünse de "8 Gen 3"ten ESKİ bir çiptir —
  // bu yüzden ayrı "comparable" gruplarına konup KESİNLİKLE birbirleriyle
  // karşılaştırılmıyor (gerçek testte bu karışıklık bulunup düzeltildi).
  if(/snapdragon/i.test(t)){
    const isNewGen = /gen\s*\d+|elite/i.test(t);
    if(isNewGen){
      let rank = 0;
      const segMatch = t.match(/snapdragon\s*(\d+)/i);
      if(segMatch) rank += parseInt(segMatch[1], 10) * 10;
      if(/\+/.test(t)) rank += 5;
      if(/elite/i.test(t)) rank += 100;
      const genMatch = t.match(/gen\s*(\d+)/i);
      if(genMatch) rank += parseInt(genMatch[1], 10);
      return { family: 'Snapdragon (güncel nesil)', comparable: 'snapdragon-guncel', rawRank: rank };
    } else {
      const legacyMatch = t.match(/snapdragon\s*(\d+)/i);
      if(legacyMatch) return { family: 'Snapdragon (eski nesil)', comparable: 'snapdragon-eski', rawRank: parseInt(legacyMatch[1], 10) };
    }
  }

  // MediaTek — Dimensity (üst segment ailesi) vs Helio (giriş/orta segment ailesi)
  m = t.match(/dimensity\s*(\d+)/i);
  if(m) return { family: 'MediaTek Dimensity', comparable: 'mediatek', rawRank: 1000 + parseInt(m[1], 10) };
  m = t.match(/helio\s*[a-z]?(\d+)/i);
  if(m) return { family: 'MediaTek Helio', comparable: 'mediatek', rawRank: parseInt(m[1], 10) };

  // Intel — KESİN model sıralaması değil, süfiks bazlı KABA güç sınıfı
  // (U/P serisi = düşük güç, H/HX serisi = yüksek güç — Intel'in kendi
  // resmi isimlendirme kuralı). i5/i7/i9 etiketi buna ek bir katman.
  if(/intel/i.test(t) || /core i\d/i.test(t) || /core ultra/i.test(t) || /core \d/i.test(t)){
    let base = 0;
    if(/i9/i.test(t)) base = 90;
    else if(/i7/i.test(t) || /ultra 7/i.test(t)) base = 70;
    else if(/i5/i.test(t) || /core 7\b/i.test(t)) base = 50;
    else base = 40;
    const powerClass = /hx/i.test(t) ? 3 : (/h\b/i.test(t) ? 2 : 1); // HX>H>U/P
    return { family: 'Intel', comparable: 'intel', rawRank: base + powerClass };
  }

  // AMD Ryzen — segment numarası (sadece 2 veri noktası var, sınırlı ama tutarlı)
  m = t.match(/ryzen\s*(\d+)/i);
  if(m) return { family: 'AMD Ryzen', comparable: 'amd', rawRank: parseInt(m[1], 10) * 10 };

  // Exynos / Tensor / Unisoc / diğer — veri yetersiz, GÜVENİLİR bir sıra üretilemez
  return { family: 'diğer', comparable: null, rawRank: null };
}

/**
 * Bir CPU'nun KENDİ AİLESİ içinde 0-100'e normalize edilmiş gücünü
 * hesaplar. catalogPool, karşılaştırma için aynı comparable grubundaki
 * tüm ürünleri içermeli (genelde tüm kategori havuzu verilir, fonksiyon
 * kendi içinde filtreler).
 */
function getCpuTierScore(cpuText, catalogPool, specKey){
  const info = getCpuInfo(cpuText);
  if(info.rawRank == null || !info.comparable) return 0;
  const sameFamily = catalogPool
    .map(p => getCpuInfo(p.specs && p.specs[specKey]))
    .filter(i => i.comparable === info.comparable && i.rawRank != null)
    .map(i => i.rawRank);
  if(sameFamily.length < 2) return 50; // tek örnek varsa nötr orta değer, uydurma yok
  const min = Math.min(...sameFamily), max = Math.max(...sameFamily);
  return Math.round(((info.rawRank - min) / ((max - min) || 1)) * 100);
}

/** GPU için 0-100 normalize skor — sadece dedike modeller arasında. */
function getGpuTierScore(gpuText){
  const info = getGpuInfo(gpuText);
  if(info.tier !== 'dedike' || info.rank == null) return info.tier === 'entegre' ? 10 : 0;
  return Math.round(((info.total - info.rank) / (info.total - 1)) * 100);
}

if(typeof module !== 'undefined' && module.exports){
  module.exports = { getGpuInfo, getCpuInfo, getCpuTierScore, getGpuTierScore, GPU_RANK_ORDER };
}
