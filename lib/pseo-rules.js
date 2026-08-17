// ============================================================
// TeknoVersus — Programmatic SEO kural motoru.
//
// AMAÇ: Filtre kombinasyonlarından sayfa üretirken "ince içerik" (thin
// content) tuzağına düşmemek. Google'ın Helpful Content sistemi, ölçekli
// üretilmiş ama içeriği olmayan sayfaları site GENELİNDE cezalandırıyor —
// yani birkaç yüz boş sayfa, iyi çalışan diğer sayfaları da aşağı çeker.
//
// KADEMELİ KURAL:
//   0 ürün    -> sayfa HİÇ üretilmez
//   1 ürün    -> üretilir, canonical ürünün kendi sayfasına, noindex
//   2-3 ürün  -> üretilir, noindex + follow (link akışı korunur, indeks dışı)
//   4-7 ürün  -> indekslenebilir, sitemap'e girer (priority 0.6)
//   8+ ürün   -> yüksek öncelikli landing (priority 0.8, hub'larda öne çıkar)
//
// Katalog büyüdükçe eşiği geçen kombinasyonlar OTOMATİK indekslenebilir hale
// gelir; elle müdahale gerekmez.
// ============================================================

const TIER = {
  SKIP:      'skip',       // 0 ürün
  CANONICAL: 'canonical',  // 1 ürün
  NOINDEX:   'noindex',    // 2-3 ürün
  INDEX:     'index',      // 4-7 ürün
  PRIORITY:  'priority'    // 8+ ürün
};

function classify(count){
  if(count === 0) return TIER.SKIP;
  if(count === 1) return TIER.CANONICAL;
  if(count <= 3)  return TIER.NOINDEX;
  if(count <= 7)  return TIER.INDEX;
  return TIER.PRIORITY;
}

// Sayfa üretilmeli mi?
// STATİK SİTE UYARLAMASI: 1 ürünlük kombinasyonlar da üretilmez.
// Dinamik filtre sistemlerinde bu sayfalar kullanıcı filtre tıklayınca
// oluşur ve canonical ile yönetilir. Bizim sayfalarımız statik — URL ancak
// biz link verirsek var olur. 1 ürünlük sayfayı üretsek kimse linklemez,
// kullanıcı ulaşamaz, Google canonical yüzünden indekslemez: sadece tarama
// bütçesi harcayan yetim (orphan) dosya olur. O ürünün kendi sayfası zaten
// var ve kategori sayfasından erişilebilir durumda.
function shouldGenerate(count){
  const t = classify(count);
  return t !== TIER.SKIP && t !== TIER.CANONICAL;
}

// Sitemap'e girmeli mi? (SADECE indekslenebilir olanlar)
function shouldIndex(count){
  const t = classify(count);
  return t === TIER.INDEX || t === TIER.PRIORITY;
}

function sitemapPriority(count){
  return classify(count) === TIER.PRIORITY ? '0.8' : '0.6';
}

// <head> içine konacak robots meta etiketi.
// selfUrl: bu sayfanın kendi adresi
// fallbackUrl: 1 ürünlük sayfalarda canonical'ın işaret edeceği adres
//              (tercihen ürünün KENDİ sayfası — asıl içerik orada)
function headDirectives(count, selfUrl, fallbackUrl){
  const t = classify(count);
  if(t === TIER.CANONICAL){
    return {
      robots: '<meta name="robots" content="noindex, follow" />',
      canonical: `<link rel="canonical" href="${fallbackUrl}" />`,
      // Not: Tek ürünlük bir filtre sayfası, o ürünün sayfasının zayıf bir
      // kopyasıdır. Canonical'ı ürüne vererek sinyali doğru yere topluyoruz.
    };
  }
  if(t === TIER.NOINDEX){
    return {
      robots: '<meta name="robots" content="noindex, follow" />',
      canonical: `<link rel="canonical" href="${selfUrl}" />`,
      // follow: içerideki ürün linkleri taranmaya devam etsin, sadece bu
      // sayfa indekse girmesin.
    };
  }
  return {
    robots: '<meta name="robots" content="index, follow" />',
    canonical: `<link rel="canonical" href="${selfUrl}" />`
  };
}

// Denetim/raporlama için: bir sayı listesini kademelere göre böler
function audit(counts){
  const r = { skip:0, canonical:0, noindex:0, index:0, priority:0 };
  counts.forEach(n => { r[classify(n)]++; });
  r.uretilen = r.canonical + r.noindex + r.index + r.priority;
  r.indekslenebilir = r.index + r.priority;
  return r;
}

module.exports = { TIER, classify, shouldGenerate, shouldIndex, sitemapPriority, headDirectives, audit };
