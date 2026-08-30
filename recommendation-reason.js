// ============================================================
// TeknoVersus — Öneri Gerekçelendirme Motoru (Faz 5)
// recommendation-reason.js
//
// TEMEL İLKE: Bu dosya SIRALAMA YAPMAZ, SKOR HESAPLAMAZ — sadece
// product-filter.js'in ZATEN belirlediği sonuç listesindeki her ürün
// için "neden bu ürün?" sorusuna, SADECE gerçek p.specs ve criteria
// verisinden, en fazla 3 kısa gerekçe üretir.
//
// KESİN KURAL: Katalogda olmayan hiçbir özellik/benchmark/FPS/kamera
// kalitesi/soğutma vb. UYDURULMAZ. Bir spec alanı yoksa, o gerekçe
// hiç üretilmez — boş veya genel bir cümleyle doldurulmaz.
//
// "En iyi" gibi kesin ifadeler KULLANILMAZ; gerçek üstünlük verisi
// yoksa temkinli bir ifadeye ("öne çıkan seçeneklerden biri") düşülür.
// ============================================================

function rrGetPrice(p){
  const raw = p.specs && p.specs['Fiyat (₺)'];
  if(raw == null) return null;
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function rrGetNumeric(p, key){
  const raw = p.specs && p.specs[key];
  if(raw == null) return null;
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function rrFormatTL(n){
  return Math.round(n).toLocaleString('tr-TR') + ' TL';
}

/**
 * Kullanıcının AÇIKÇA belirttiği kriterlere göre, öncelik sırasıyla
 * aday gerekçe listesi üretir. Her aday sadece GERÇEKTEN doğrulanabilir
 * bir veri varsa listeye eklenir — aksi halde o aday hiç oluşmaz.
 */
function rrBuildCandidates(product, criteria, score){
  const candidates = [];
  const specs = product.specs || {};

  // 1) BÜTÇE — kullanıcı belirttiyse ve gerçek fiyat verisi varsa, en öncelikli
  if(criteria && (criteria.budget_max != null || criteria.budget_min != null)){
    const price = rrGetPrice(product);
    if(price != null){
      if(criteria.budget_max != null && price <= criteria.budget_max){
        candidates.push(`Belirttiğin ${rrFormatTL(criteria.budget_max)} bütçenin altında (${rrFormatTL(price)}).`);
      } else if(criteria.budget_min != null && price >= criteria.budget_min){
        candidates.push(`Belirttiğin ${rrFormatTL(criteria.budget_min)} ve üzeri bütçe aralığında (${rrFormatTL(price)}).`);
      }
    }
  }

  // 2) DOĞRUDAN GPU/CPU MODEL SORGUSU — kullanıcı spesifik bir model istediyse
  if(criteria && criteria.gpu_model && specs['Ekran Kartı']){
    const gpuText = String(specs['Ekran Kartı']);
    if(gpuText.toLowerCase().includes(criteria.gpu_model.toLowerCase())){
      candidates.push(`${gpuText} ekran kartına sahip.`);
    }
  }
  if(criteria && criteria.cpu_model && specs['İşlemci']){
    const cpuText = String(specs['İşlemci']);
    if(cpuText.toLowerCase().includes(criteria.cpu_model.toLowerCase())){
      candidates.push(`${cpuText} işlemcisine sahip.`);
    }
  }

  // 3) RAM / DEPOLAMA — kullanıcı minimum belirttiyse ve gerçek veri varsa
  if(criteria && criteria.min_ram_gb != null){
    const ram = rrGetNumeric(product, 'RAM (GB)');
    if(ram != null && ram >= criteria.min_ram_gb){
      candidates.push(`${ram} GB RAM ile istediğin ${criteria.min_ram_gb} GB seviyesini karşılıyor.`);
    }
  }
  if(criteria && criteria.min_storage_gb != null){
    const storage = rrGetNumeric(product, 'Depolama (GB)');
    if(storage != null && storage >= criteria.min_storage_gb){
      candidates.push(`${storage} GB depolama ile istediğin ${criteria.min_storage_gb} GB seviyesini karşılıyor.`);
    }
  }

  // 4) MARKA — kullanıcı belirttiyse
  if(criteria && criteria.preferred_brand){
    candidates.push(`İstediğin ${criteria.preferred_brand} seçeneklerinden biri.`);
  }

  // 5) USE-CASE bazlı gerekçeler — sadece ilgili GERÇEK spec varsa
  const useCases = (criteria && criteria.use_case) || [];

  if(useCases.includes('gaming')){
    if(product.cat === 'Dizüstü' && specs['Ekran Kartı']){
      const gpuText = String(specs['Ekran Kartı']);
      if(!gpuText.toLowerCase().includes('entegre')){
        candidates.push(`Dedike ${gpuText} ekran kartı ile oyun kullanımında avantaj sağlıyor.`);
      }
      // Entegre GPU varsa gaming gerekçesi ÜRETİLMEZ — olumsuz bir
      // özelliği öne çıkarmak yerine sessizce atlanır.
    } else if(product.cat === 'Telefon'){
      const hz = rrGetNumeric(product, 'Yenileme Hızı (Hz)');
      if(hz != null && hz >= 120){
        candidates.push(`${hz} Hz yenileme hızlı ekranı, oyun kullanımında akıcı görüntü sağlıyor.`);
      }
    }
  }

  if(useCases.includes('performance') && specs['İşlemci']){
    candidates.push(`${specs['İşlemci']} işlemcisi, kategorisindeki alternatifler arasında öne çıkan seçeneklerden biri.`);
  }

  if(useCases.includes('camera')){
    const mp = rrGetNumeric(product, 'Kamera (MP)');
    if(mp != null){
      candidates.push(`${mp} MP kamera çözünürlüğü ile öne çıkıyor.`);
    }
  }

  if(useCases.includes('battery')){
    // BİRİM KARIŞIKLIĞI RİSKİ: Telefon mAh, Dizüstü/Akıllı Saat saat
    // cinsinden — asla birbirine karıştırılmıyor, her biri kendi
    // biriminde, ayrı cümle olarak ifade ediliyor.
    const mah = specs['Pil (mAh)'];
    const saat = specs['Pil (saat)'];
    if(mah != null){
      candidates.push(`${mah} mAh pil kapasitesine sahip.`);
    } else if(saat != null){
      candidates.push(`${saat} saat pil ömrüne sahip.`);
    }
  }

  if(useCases.includes('display')){
    const inch = rrGetNumeric(product, 'Ekran (inç)');
    const hz = rrGetNumeric(product, 'Yenileme Hızı (Hz)');
    if(inch != null){
      candidates.push(`${inch}" ekran boyutuna sahip.`);
    } else if(hz != null && hz > 60){
      candidates.push(`${hz} Hz yenileme hızlı ekranı, akıcı görüntü isteyen kullanıcılar için avantaj sağlıyor.`);
    }
  }

  // 6) SON ÇARE — hiçbir spesifik kriter/gerekçe üretilemediyse, HER
  // ZAMAN üretilebilen, temkinli bir genel gerekçe. "En iyi" gibi kesin
  // bir iddia İÇERMİYOR — sadece skorun/sıralamanın var olduğunu belirtir.
  if(candidates.length === 0 && score != null){
    candidates.push('Belirttiğin kriterlere göre öne çıkan seçeneklerden biri.');
  }

  return candidates;
}

/**
 * Ana giriş noktası. En fazla 3 gerekçe döndürür, kullanıcının
 * belirttiği kriterlere göre öncelik sırasıyla (rrBuildCandidates
 * zaten bu sırayla üretiyor). Sıralama/skor hesabına HİÇ dokunmaz —
 * sadece var olan bir sonucu AÇIKLAR.
 */
function generateRecommendationReasons(product, criteria, score){
  if(!product || !product.specs) return [];
  // Savunma katmanı: criteria hiç yoksa (aktif bir arama/kriter seti
  // yok demektir) HİÇBİR gerekçe üretilmez — genel "son çare" cümlesi
  // bile. Bu, sadece render()'daki searchIds kontrolüne güvenmek yerine,
  // fonksiyonun kendi başına da güvenli olmasını sağlıyor.
  if(!criteria) return [];
  try{
    return rrBuildCandidates(product, criteria, score).slice(0, 3);
  }catch(e){
    // Gerekçe üretimi başarısız olsa bile arama sonucu ASLA bozulmaz —
    // sessizce boş liste döner, kart "Neden öneriyoruz?" bölümünü hiç
    // göstermez.
    return [];
  }
}

if(typeof module !== 'undefined' && module.exports){
  module.exports = { generateRecommendationReasons };
}
