// ============================================================
// TeknoVersus — "X vs Y" karşılaştırma sayfası üretimi.
// generate-site.js ile aynı tasarım/şablon dilini kullanır.
//
// ÖNEMLİ TASARIM KARARI: Kategorideki HER ürünü birbiriyle eşleştirmez
// (n*(n-1)/2 patlaması + anlamsız eşleşmeler + Google'da "thin content"
// riski). Bunun yerine her ürünü sadece fiyat/performans skoruna göre
// EN YAKIN `neighborCount` komşusuyla eşleştirir — gerçekten "hangisini
// alsam" diye aranabilecek, anlamlı çiftler üretir.
// ============================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};

// BUG DÜZELTMESİ (27 Eylül 2026): Bu esc() sadece " işaretini kaçırıyordu;
// kod tabanındaki diğer 11 esc() implementasyonu (refresh-category-cards.js,
// generate-reviews.js, vb.) &, <, > karakterlerini de kaçırıyor. Supabase'den
// gelen serbest metinde (ürün adı/blurb) < veya > geçerse bu, karşılaştırma
// sayfalarında HTML enjeksiyonuna yol açabilirdi — artık diğerleriyle tutarlı.
function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function slugify(text){
  return text.toString().toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

// Karşılaştırma dosya adları: ürün adının tamamını fiziksel filename'e yazma.
// Deterministik, kısa ve çakışmaya dayanıklı. ENAMETOOLONG'u önlemek için
// filename 120 UTF-8 byte sınırında tutulur; hash ürün ID çiftinden üretilir.
const MAX_COMPARISON_FILENAME_BYTES = 120;
function comparisonFileName(first, second){
  const ordered = [first, second].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const ids = ordered.map(p => String(p.id));
  const pairKey = ids.join('|');
  const hash = crypto.createHash('sha256').update(pairKey, 'utf8').digest('hex').slice(0, 12);

  const shortSlug = (name) => {
    let s = slugify(name).slice(0, 34).replace(/-+$/,'');
    return s || 'urun';
  };

  let filename = `${shortSlug(ordered[0].name)}-vs-${shortSlug(ordered[1].name)}-${hash}.html`;

  // UTF-8 byte sınırını garanti et. ASCII slug kullandığımız için normalde
  // bu dal çalışmaz; yine de gelecekte slugify değişirse güvenlik katmanı olarak kalır.
  if(Buffer.byteLength(filename, 'utf8') > MAX_COMPARISON_FILENAME_BYTES){
    filename = `cmp-${hash}.html`;
  }
  return filename;
}

function amazonHref(p){
  const tag = 'teknoversus-21';
  return p.link
    ? p.link + (p.link.includes('?') ? '&' : '?') + `tag=${tag}`
    : `https://www.amazon.com.tr/s?k=${encodeURIComponent(p.name)}&tag=${tag}`;
}

// Fiyatı specs'ten ayıklar (generate-site.js'deki mantıkla aynı)
function priceOf(p){
  const specs = p.specs || {};
  const key = Object.keys(specs).find(k => /fiyat/i.test(k));
  if(!key) return null;
  const num = parseFloat(specs[key].toString().replace(/[^\d.,]/g,'').replace(',','.'));
  return isNaN(num) ? null : num;
}

function generateComparisons({ products, colorFor, computeScores, categories, neighborCount = 2, rootDir, illustrationFor, productImageFor, prosConsFor }){
  // GSC hızlı-kazanç pilotu: yüksek gösterim/düşük CTR alan belirli comparison
  // sayfaları için elle yazılmış, daha çekici title/description. İsim bazlı
  // eşleştirme kullanılıyor (dosya adındaki ID değişse/farklı olsa bile çalışır).
  // Bu ürün çiftleri ayrıca noindex kuralından İSTİSNA tutulur — çünkü GSC
  // verisi bu sayfaların, skorlarından bağımsız olarak GERÇEK arama trafiği
  // aldığını kanıtlıyor (örn. iPhone 15 vs 17: 141 gösterim, pozisyon 12.11).
  function normPair(a, b){ return [a,b].sort().join('|'); }
  const COMPARISON_OVERRIDES = {
    [normPair('iPhone 15','iPhone 17')]: {
      title: 'iPhone 15 mi iPhone 17 mi? 2026 Fiyat/Performans Karşılaştırması',
      description: 'iPhone 15 ile iPhone 17 arasında kalanlar için: fiyat farkı, kamera, performans ve pil ömrü karşılaştırması. Hangisi paranıza değer?'
    },
    [normPair('Samsung Galaxy S25 Ultra','Samsung Galaxy S26 Ultra')]: {
      title: 'Galaxy S25 Ultra mı S26 Ultra mı? Fark Bu Kadar mı?',
      description: 'Samsung Galaxy S25 Ultra ve S26 Ultra arasındaki gerçek farklar: kamera, performans, fiyat. Yeni modele geçmeye değer mi?'
    },
    [normPair('Apple Watch Series 8','Apple Watch Series 9')]: {
      title: 'Apple Watch Series 8 mi 9 mu? Yükseltmeye Değer mi?',
      description: 'Apple Watch Series 8 ve Series 9 karşılaştırması: yeni özellikler neler, fiyat farkı ne kadar, hangisini almalısınız?'
    },
    [normPair('iFFALCON 65U95A','TCL 65C6K')]: {
      title: 'iFFALCON 65U95A mı TCL 65C6K mı? 65 İnç TV Karşılaştırması',
      description: '65 inç TV ararken iFFALCON 65U95A ve TCL 65C6K arasında kalanlar için fiyat, görüntü kalitesi ve özellik karşılaştırması.'
    },
    [normPair('Samsung Galaxy S24 Ultra','Samsung Galaxy S26 Ultra')]: {
      title: 'Galaxy S24 Ultra mı S26 Ultra mı? İki Nesil Arasındaki Fark',
      description: 'Samsung Galaxy S24 Ultra ile S26 Ultra arasındaki gerçek performans ve kamera farkları. İki nesil atlamaya değer mi?'
    },
    [normPair('Apple Watch Series 10','Apple Watch Series 11 (42mm)')]: {
      title: 'Apple Watch Series 10 mu 11 mi? Yükseltmeye Değer mi?',
      description: 'Apple Watch Series 10 ve Series 11 arasındaki yenilikler, fiyat farkı ve hangisini seçmeniz gerektiği.'
    },
    [normPair('iPhone 14 Pro','iPhone 15 Pro')]: {
      title: 'iPhone 14 Pro mu 15 Pro mu? Fiyat Farkına Değer mi?',
      description: 'iPhone 14 Pro ile 15 Pro arasındaki kamera, performans ve fiyat farkları. Bir nesil atlamaya gerçekten değer mi?'
    },
    [normPair('iPhone 11','iPhone 17')]: {
      title: 'iPhone 11 Kullanıcıları için iPhone 17 Ne Kadar Fark Yaratıyor?',
      description: 'iPhone 11 kullanıcıları için iPhone 17 geçişinin getirdiği fark: kamera, performans, pil ömrü karşılaştırması.'
    },
    [normPair('Honor 600 Pro','Samsung Galaxy S24 Ultra')]: {
      title: 'Honor 600 Pro mu Samsung S24 Ultra mı? Amiral Gemisi Kıyaslaması',
      description: 'Honor 600 Pro ve Samsung Galaxy S24 Ultra arasında kalanlar için kamera, performans ve fiyat/performans karşılaştırması.'
    },
    [normPair('iPhone 14','iPhone 17')]: {
      title: 'iPhone 14 mü iPhone 17 mi? 3 Nesil Arasındaki Fark',
      description: 'iPhone 14 ile iPhone 17 arasındaki fark neler? Kamera, performans ve fiyat farkına göre değerlendirme.'
    },
    [normPair('iPhone 13','iPhone 13 Pro')]: {
      title: 'iPhone 13 mü 13 Pro mu? Standart ve Pro Arasındaki Fark',
      description: 'iPhone 13 ve 13 Pro arasındaki kamera ve performans farkları. Pro versiyonun fiyat farkına değip değmediği.'
    },
    [normPair('Apple iPhone 17 Pro Max','iPhone 15 Pro')]: {
      title: 'iPhone 17 Pro Max mı 15 Pro mu? İki Nesil Farkı',
      description: 'iPhone 17 Pro Max ile 15 Pro arasındaki kamera, performans ve fiyat farkı. İki nesil atlamaya değer mi?'
    },
    [normPair('iPhone 14 Pro','Samsung Galaxy S26 Ultra')]: {
      title: 'iPhone 14 Pro mu Samsung S26 Ultra mı? Marka Karşılaştırması',
      description: 'iPhone 14 Pro ve Samsung Galaxy S26 Ultra arasında kalanlar için kamera, performans ve fiyat karşılaştırması.'
    },
    [normPair('Apple Watch SE (2. Nesil)','Apple Watch Series 11 (42mm)')]: {
      title: 'Apple Watch SE mi Series 11 mi? Fiyat Farkına Değer mi?',
      description: 'Apple Watch SE (2. Nesil) ve Series 11 arasındaki özellik ve fiyat farkı. Hangisi ihtiyacınıza uygun?'
    },
    [normPair('iFFALCON 65U95A','TCL 65C655')]: {
      title: 'iFFALCON 65U95A mı TCL 65C655 mi? 65 İnç TV Kıyaslaması',
      description: '65 inç TV ararken iFFALCON 65U95A ve TCL 65C655 arasındaki fiyat ve görüntü kalitesi farkları.'
    },
    [normPair('Honor 600 Pro','Honor Magic8 Pro')]: {
      title: 'Honor 600 Pro mu Magic8 Pro mu? Aynı Markanın Modelleri',
      description: 'Honor 600 Pro ve Honor Magic8 Pro arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple Watch Series 11 (42mm)','Apple Watch Series 9')]: {
      title: 'Apple Watch Series 11 mi 9 mu? Yükseltmeye Değer mi?',
      description: 'Apple Watch Series 11 ve Series 9 arasındaki fark, yeni özellikler ve fiyat karşılaştırması.'
    },
    [normPair('iPhone 15 Pro','iPhone 16 Pro')]: {
      title: 'iPhone 15 Pro mu 16 Pro mu? Fiyat Farkına Değer mi?',
      description: 'iPhone 15 Pro ve 16 Pro arasındaki kamera, performans ve fiyat farkı. Bir nesil atlamaya değer mi?'
    },
    [normPair('Samsung Galaxy S23 Ultra','Samsung Galaxy S25 Ultra')]: {
      title: 'Galaxy S23 Ultra mı S25 Ultra mı? İki Nesil Arasındaki Fark',
      description: 'Samsung Galaxy S23 Ultra ve S25 Ultra arasındaki performans ve kamera farkları karşılaştırması.'
    },
    [normPair('Apple Watch Series 10','Apple Watch Series 9')]: {
      title: 'Apple Watch Series 10 mu 9 mu? Yükseltmeye Değer mi?',
      description: 'Apple Watch Series 10 ve Series 9 arasındaki yenilikler ve fiyat farkı karşılaştırması.'
    },
    [normPair('AirPods Pro (2. Nesil)','Apple AirPods 4')]: {
      title: 'AirPods Pro 2 mi AirPods 4 mü? Hangisini Almalısınız?',
      description: 'AirPods Pro (2. Nesil) ve AirPods 4 arasındaki gürültü önleme ve fiyat farkı karşılaştırması.'
    },
    [normPair('Samsung Galaxy S23 Ultra','Samsung Galaxy S24 Ultra')]: {
      title: 'Galaxy S23 Ultra mı S24 Ultra mı? Yükseltmeye Değer mi?',
      description: 'Samsung Galaxy S23 Ultra ve S24 Ultra arasındaki performans, kamera ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple iPad Air (4. Nesil)','Apple iPad Pro (M4, 11")')]: {
      title: 'iPad Air mi iPad Pro M4 mü? Fiyat Farkına Değer mi?',
      description: 'iPad Air (4. Nesil) ve iPad Pro M4 arasındaki performans farkı. Pro modelin fiyat farkına değip değmediği.'
    },
    [normPair('Apple MacBook Air (M5, 13")','Lenovo ThinkPad E14')]: {
      title: 'MacBook Air M5 mi ThinkPad E14 mü? Marka Karşılaştırması',
      description: 'MacBook Air M5 ve Lenovo ThinkPad E14 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Apple MacBook Air (M5, 13")','MacBook Air (M2, 13")')]: {
      title: 'MacBook Air M5 mi M2 mi? Yükseltmeye Değer mi?',
      description: 'MacBook Air M5 ve M2 arasındaki performans farkı. Yeni çipe geçmeye gerçekten değer mi?'
    },
    [normPair('Canon EOS R50','Sony ZV-E10')]: {
      title: 'Canon EOS R50 mü Sony ZV-E10 mu? Vlog Kamerası Kıyaslaması',
      description: 'Canon EOS R50 ve Sony ZV-E10 arasında kalan içerik üreticileri için görüntü kalitesi ve fiyat karşılaştırması.'
    },
    [normPair('Apple iPad Pro (M4, 11")','Apple iPad Pro (M5, 11")')]: {
      title: 'iPad Pro M4 mü M5 mi? Yükseltmeye Değer mi?',
      description: 'iPad Pro M4 ve M5 arasındaki performans farkı. Bir nesil atlamaya gerçekten değer mi?'
    },
    [normPair('Casper VIA A40','Casper VIA X40')]: {
      title: 'Casper VIA A40 mı X40 mı? Aynı Serinin Modelleri',
      description: 'Casper VIA A40 ve VIA X40 arasındaki özellik ve fiyat farkı. Hangisi bütçenize daha uygun?'
    },
    [normPair('Apple iPad Pro (M2, 11")','Apple iPad Pro (M5, 11")')]: {
      title: 'iPad Pro M2 mi M5 mi? Fiyat Farkına Değer mi?',
      description: 'iPad Pro M2 ve M5 arasındaki performans farkı. Üç nesil atlamaya gerçekten değer mi?'
    },
    [normPair('iPhone 14','iPhone 16')]: {
      title: 'iPhone 14 mü 16 mı? İki Nesil Arasındaki Fark',
      description: 'iPhone 14 ve iPhone 16 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Samsung Galaxy S22 Ultra','Samsung Galaxy S24')]: {
      title: 'Galaxy S22 Ultra mı S24 mü? Ultra ve Standart Karşılaştırması',
      description: 'Samsung Galaxy S22 Ultra ve S24 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Canon EOS R6 Mark II','Sony A7 IV')]: {
      title: 'Canon EOS R6 Mark II mi Sony A7 IV mü? Amiral Gemisi Kıyaslaması',
      description: 'Canon EOS R6 Mark II ve Sony A7 IV arasında kalan fotoğrafçılar için görüntü kalitesi ve fiyat karşılaştırması.'
    },
    [normPair('iPhone 13 Pro','Samsung Galaxy S23 Ultra')]: {
      title: 'iPhone 13 Pro mu Samsung S23 Ultra mı? Marka Karşılaştırması',
      description: 'iPhone 13 Pro ve Samsung Galaxy S23 Ultra arasında kalanlar için kamera ve performans karşılaştırması.'
    },
    [normPair('iPhone 14 Pro','Samsung Galaxy S25 Ultra')]: {
      title: 'iPhone 14 Pro mu Samsung S25 Ultra mı? Amiral Gemisi Kıyaslaması',
      description: 'iPhone 14 Pro ve Samsung Galaxy S25 Ultra arasında kalanlar için kamera ve performans karşılaştırması.'
    },
    [normPair('Apple iPhone SE (2022)','iPhone 11')]: {
      title: 'iPhone SE mi iPhone 11 mi? Kompakt ve Standart Karşılaştırması',
      description: 'iPhone SE (2022) ve iPhone 11 arasındaki performans ve fiyat farkı. Hangisi ihtiyacınıza uygun?'
    },
    [normPair('AirPods Pro (2. Nesil)','Apple AirPods Pro 3')]: {
      title: 'AirPods Pro 2 mi Pro 3 mü? Yükseltmeye Değer mi?',
      description: 'AirPods Pro (2. Nesil) ve AirPods Pro 3 arasındaki gürültü önleme ve fiyat farkı karşılaştırması.'
    },
    [normPair('iPhone 11','iPhone 14')]: {
      title: 'iPhone 11 mi iPhone 14 mü? Fiyat Farkına Değer mi?',
      description: 'iPhone 11 ve iPhone 14 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple iPad Mini (7. Nesil)','Apple iPad Pro (M4, 11")')]: {
      title: 'iPad Mini mi iPad Pro M4 mü? Kompakt ve Güçlü Karşılaştırması',
      description: 'iPad Mini (7. Nesil) ve iPad Pro M4 arasındaki performans farkı ve fiyat karşılaştırması.'
    },
    [normPair('Apple Watch Series 7','Apple Watch Series 8')]: {
      title: 'Apple Watch Series 7 mi 8 mi? Yükseltmeye Değer mi?',
      description: 'Apple Watch Series 7 ve Series 8 arasındaki yenilikler ve fiyat farkı karşılaştırması.'
    },
    [normPair('Samsung Galaxy Tab S10 FE','Xiaomi Redmi Pad 2 Pro')]: {
      title: 'Galaxy Tab S10 FE mi Redmi Pad 2 Pro mu? Marka Karşılaştırması',
      description: 'Samsung Galaxy Tab S10 FE ve Xiaomi Redmi Pad 2 Pro arasında kalanlar için tablet karşılaştırması.'
    },
    [normPair('iPhone 13','iPhone 14')]: {
      title: 'iPhone 13 mü 14 mü? Yükseltmeye Değer mi?',
      description: 'iPhone 13 ve iPhone 14 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple MacBook Air (M5, 13")','MacBook Air (M1, 13")')]: {
      title: 'MacBook Air M5 mi M1 mi? Üç Nesil Arasındaki Fark',
      description: 'MacBook Air M5 ve M1 arasındaki performans farkı. Üç nesil atlamaya gerçekten değer mi?'
    },
    [normPair('Samsung Galaxy S22 Ultra','Samsung Galaxy S23 Ultra')]: {
      title: 'Galaxy S22 Ultra mı S23 Ultra mı? Yükseltmeye Değer mi?',
      description: 'Samsung Galaxy S22 Ultra ve S23 Ultra arasındaki performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Huawei MatePad Pro 13.2','Samsung Galaxy Tab S11 Ultra')]: {
      title: 'Huawei MatePad Pro mu Galaxy Tab S11 Ultra mı? Marka Karşılaştırması',
      description: 'Huawei MatePad Pro 13.2 ve Samsung Galaxy Tab S11 Ultra arasında kalanlar için tablet karşılaştırması.'
    },
    [normPair('Samsung Galaxy S24','Samsung Galaxy S24 Ultra')]: {
      title: 'Galaxy S24 mü S24 Ultra mı? Standart ve Ultra Farkı',
      description: 'Samsung Galaxy S24 ve S24 Ultra arasındaki kamera ve performans farkı. Ultra modeline değer mi?'
    },
    [normPair('iPhone 13','iPhone 15')]: {
      title: 'iPhone 13 mü 15 mi? İki Nesil Arasındaki Fark',
      description: 'iPhone 13 ve iPhone 15 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple iPad (10. Nesil)','Samsung Galaxy Tab S10 FE')]: {
      title: 'iPad 10. Nesil mi Galaxy Tab S10 FE mi? Marka Karşılaştırması',
      description: 'Apple iPad (10. Nesil) ve Samsung Galaxy Tab S10 FE arasında kalanlar için tablet karşılaştırması.'
    },
    [normPair('iPhone 15','iPhone 16')]: {
      title: 'iPhone 15 mi 16 mı? Yükseltmeye Değer mi?',
      description: 'iPhone 15 ve iPhone 16 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Samsung Galaxy S21 Ultra','Samsung Galaxy S23 Ultra')]: {
      title: 'Galaxy S21 Ultra mı S23 Ultra mı? İki Nesil Arasındaki Fark',
      description: 'Samsung Galaxy S21 Ultra ve S23 Ultra arasındaki performans ve kamera farkları karşılaştırması.'
    },
    [normPair('iPhone 13','Samsung Galaxy S26 Ultra')]: {
      title: 'iPhone 13 mü Samsung S26 Ultra mı? Marka Karşılaştırması',
      description: 'iPhone 13 ve Samsung Galaxy S26 Ultra arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Samsung Galaxy Tab S10 FE','Samsung Galaxy Tab S9 FE')]: {
      title: 'Galaxy Tab S10 FE mi S9 FE mi? Yükseltmeye Değer mi?',
      description: 'Samsung Galaxy Tab S10 FE ve S9 FE arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Samsung Galaxy S24 Ultra','Samsung Galaxy S25 Ultra')]: {
      title: 'Galaxy S24 Ultra mı S25 Ultra mı? Yükseltmeye Değer mi?',
      description: 'Samsung Galaxy S24 Ultra ve S25 Ultra arasındaki performans ve kamera farkı karşılaştırması.'
    },
    [normPair('iPhone 13 Pro','Samsung Galaxy S22 Ultra')]: {
      title: 'iPhone 13 Pro mu Samsung S22 Ultra mı? Marka Karşılaştırması',
      description: 'iPhone 13 Pro ve Samsung Galaxy S22 Ultra arasında kalanlar için kamera ve performans karşılaştırması.'
    },
    [normPair('Canon EOS R50','Sony Alpha a6400')]: {
      title: 'Canon EOS R50 mü Sony Alpha a6400 mü? Vlog Kamerası Kıyaslaması',
      description: 'Canon EOS R50 ve Sony Alpha a6400 arasında kalan içerik üreticileri için görüntü kalitesi karşılaştırması.'
    },
    [normPair('iPhone 14','iPhone 14 Pro')]: {
      title: 'iPhone 14 mü 14 Pro mu? Standart ve Pro Arasındaki Fark',
      description: 'iPhone 14 ve 14 Pro arasındaki kamera ve performans farkları. Pro versiyonun fiyat farkına değip değmediği.'
    },
    [normPair('AirPods Pro (2. Nesil)','Sony WH-1000XM5')]: {
      title: 'AirPods Pro 2 mi Sony WH-1000XM5 mü? Marka Karşılaştırması',
      description: 'AirPods Pro (2. Nesil) ve Sony WH-1000XM5 arasında kalanlar için gürültü önleme karşılaştırması.'
    },
    [normPair('Samsung Galaxy A56 5G','Samsung Galaxy S24')]: {
      title: 'Galaxy A56 5G mi S24 mü? Orta Segment ve Amiral Gemisi Farkı',
      description: 'Samsung Galaxy A56 5G ve S24 arasında kalanlar için performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Samsung Galaxy A56 5G','Samsung Galaxy S22 Ultra')]: {
      title: 'Galaxy A56 5G mi S22 Ultra mı? Yeni ve Eski Amiral Gemisi',
      description: 'Samsung Galaxy A56 5G ve S22 Ultra arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Samsung Galaxy A55','Samsung Galaxy S24')]: {
      title: 'Galaxy A55 mi S24 mü? Orta Segment ve Amiral Gemisi Farkı',
      description: 'Samsung Galaxy A55 ve S24 arasında kalanlar için performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple iPad Pro (M2, 11")','Samsung Galaxy Tab S11 Ultra')]: {
      title: 'iPad Pro M2 mi Galaxy Tab S11 Ultra mı? Marka Karşılaştırması',
      description: 'iPad Pro M2 ve Samsung Galaxy Tab S11 Ultra arasında kalanlar için tablet karşılaştırması.'
    },
    [normPair('General Mobile GM 26 Pro 5G','POCO X6 Pro')]: {
      title: 'GM 26 Pro 5G mi POCO X6 Pro mu? Bütçe Telefon Kıyaslaması',
      description: 'General Mobile GM 26 Pro 5G ve POCO X6 Pro arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('iFFALCON 65U95A','Toshiba 50UA2263DG')]: {
      title: 'iFFALCON 65U95A mı Toshiba 50UA2263DG mi? TV Kıyaslaması',
      description: 'iFFALCON 65U95A ve Toshiba 50UA2263DG arasında kalanlar için görüntü kalitesi ve fiyat karşılaştırması.'
    },
    [normPair('TCL 65C655','TCL 65C6K')]: {
      title: 'TCL 65C655 mi 65C6K mı? Aynı Serinin Modelleri',
      description: 'TCL 65C655 ve 65C6K arasındaki özellik ve fiyat farkı. Hangisi bütçenize daha uygun?'
    },
    [normPair('MacBook Pro 14" (M1 Pro)','MacBook Pro 14" (M4)')]: {
      title: 'MacBook Pro 14 M1 Pro mu M4 mü? Üç Nesil Arasındaki Fark',
      description: 'MacBook Pro 14 M1 Pro ve M4 arasındaki performans farkı. Üç nesil atlamaya değer mi?'
    },
    [normPair('iPhone 14','iPhone 15')]: {
      title: 'iPhone 14 mü 15 mi? Yükseltmeye Değer mi?',
      description: 'iPhone 14 ve iPhone 15 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple iPad (10. Nesil)','Samsung Galaxy Tab S9 FE')]: {
      title: 'iPad 10. Nesil mi Galaxy Tab S9 FE mi? Marka Karşılaştırması',
      description: 'Apple iPad (10. Nesil) ve Samsung Galaxy Tab S9 FE arasında kalanlar için tablet karşılaştırması.'
    },
    [normPair('Apple Watch Series 7','Apple Watch Series 9')]: {
      title: 'Apple Watch Series 7 mi 9 mu? İki Nesil Arasındaki Fark',
      description: 'Apple Watch Series 7 ve Series 9 arasındaki yenilikler ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple iPad Air (4. Nesil)','Apple iPad Pro (M2, 11")')]: {
      title: 'iPad Air mi iPad Pro M2 mi? Fiyat Farkına Değer mi?',
      description: 'iPad Air (4. Nesil) ve iPad Pro M2 arasındaki performans farkı. Pro modelin fiyat farkına değip değmediği.'
    },
    [normPair('iPhone 15 Pro','iPhone 17')]: {
      title: 'iPhone 15 Pro mu iPhone 17 mi? İki Nesil Arasındaki Fark',
      description: 'iPhone 15 Pro ve iPhone 17 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('iPhone 15 Pro','Samsung Galaxy S24 Ultra')]: {
      title: 'iPhone 15 Pro mu Samsung S24 Ultra mı? Amiral Gemisi Kıyaslaması',
      description: 'iPhone 15 Pro ve Samsung Galaxy S24 Ultra arasında kalanlar için kamera ve performans karşılaştırması.'
    },
    [normPair('Apple Watch Series 10','Apple Watch Series 8')]: {
      title: 'Apple Watch Series 10 mu 8 mi? İki Nesil Arasındaki Fark',
      description: 'Apple Watch Series 10 ve Series 8 arasındaki yenilikler ve fiyat farkı karşılaştırması.'
    },
    [normPair('iPhone 11','iPhone 13')]: {
      title: 'iPhone 11 mi iPhone 13 mü? İki Nesil Arasındaki Fark',
      description: 'iPhone 11 ve iPhone 13 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple iPhone SE (2022)','iPhone 14')]: {
      title: 'iPhone SE mi iPhone 14 mü? Kompakt ve Standart Karşılaştırması',
      description: 'iPhone SE (2022) ve iPhone 14 arasındaki performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Casper VIA X40','General Mobile GM Era 50')]: {
      title: 'Casper VIA X40 mı GM Era 50 mi? Bütçe Telefon Kıyaslaması',
      description: 'Casper VIA X40 ve General Mobile GM Era 50 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Honor 600 Pro','iPhone 12')]: {
      title: 'Honor 600 Pro mu iPhone 12 mi? Marka Karşılaştırması',
      description: 'Honor 600 Pro ve iPhone 12 arasında kalanlar için kamera ve performans karşılaştırması.'
    },
    [normPair('Apple Watch Series 11 (42mm)','Samsung Galaxy Watch7')]: {
      title: 'Apple Watch Series 11 mi Galaxy Watch7 mi? Marka Karşılaştırması',
      description: 'Apple Watch Series 11 ve Samsung Galaxy Watch7 arasında kalanlar için akıllı saat karşılaştırması.'
    },
    [normPair('General Mobile GM Fenix II Pro 5G','Samsung Galaxy S23 Ultra')]: {
      title: 'GM Fenix II Pro mu Samsung S23 Ultra mı? Marka Karşılaştırması',
      description: 'General Mobile GM Fenix II Pro 5G ve Samsung Galaxy S23 Ultra arasındaki fiyat/performans farkı.'
    },
    [normPair('General Mobile GM 26 Pro 5G','Samsung Galaxy S21 Ultra')]: {
      title: 'GM 26 Pro 5G mi Samsung S21 Ultra mı? Marka Karşılaştırması',
      description: 'General Mobile GM 26 Pro 5G ve Samsung Galaxy S21 Ultra arasındaki fiyat/performans farkı.'
    },
    [normPair('Apple MacBook Air (M5, 13")','MacBook Air (M3, 13")')]: {
      title: 'MacBook Air M5 mi M3 mü? Yükseltmeye Değer mi?',
      description: 'MacBook Air M5 ve M3 arasındaki performans farkı. Bir nesil atlamaya gerçekten değer mi?'
    },
    [normPair('Reeder P13 Blue Max','Xiaomi Redmi 13C')]: {
      title: 'Reeder P13 Blue Max mı Redmi 13C mü? Bütçe Telefon Kıyaslaması',
      description: 'Reeder P13 Blue Max ve Xiaomi Redmi 13C arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Apple AirPods 4','Huawei FreeBuds Pro 3')]: {
      title: 'AirPods 4 mü Huawei FreeBuds Pro 3 mü? Marka Karşılaştırması',
      description: 'Apple AirPods 4 ve Huawei FreeBuds Pro 3 arasında kalanlar için ses kalitesi karşılaştırması.'
    },
    [normPair('iPhone 12','iPhone 14')]: {
      title: 'iPhone 12 mi iPhone 14 mü? İki Nesil Arasındaki Fark',
      description: 'iPhone 12 ve iPhone 14 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple iPad Pro (M1, 11")','Apple iPad Pro (M4, 11")')]: {
      title: 'iPad Pro M1 mü M4 mü? Üç Nesil Arasındaki Fark',
      description: 'iPad Pro M1 ve M4 arasındaki performans farkı. Üç nesil atlamaya gerçekten değer mi?'
    },
    [normPair('Huawei MatePad 11.5','Lenovo Yoga Tab 11')]: {
      title: 'Huawei MatePad 11.5 mi Lenovo Yoga Tab 11 mi? Marka Karşılaştırması',
      description: 'Huawei MatePad 11.5 ve Lenovo Yoga Tab 11 arasında kalanlar için tablet karşılaştırması.'
    },
    [normPair('Sony WF-1000XM5','Sony WH-1000XM5')]: {
      title: 'Sony WF-1000XM5 mü WH-1000XM5 mi? Kulak İçi ve Kulak Üstü',
      description: 'Sony WF-1000XM5 ve WH-1000XM5 arasındaki fark. Hangi form faktörü size daha uygun?'
    },
    [normPair('Samsung Galaxy Tab S10 FE','Xiaomi Pad 6')]: {
      title: 'Galaxy Tab S10 FE mi Xiaomi Pad 6 mı? Marka Karşılaştırması',
      description: 'Samsung Galaxy Tab S10 FE ve Xiaomi Pad 6 arasında kalanlar için tablet karşılaştırması.'
    },
    [normPair('Nubia Z80 Ultra','Samsung Galaxy S25 Ultra')]: {
      title: 'Nubia Z80 Ultra mı Samsung S25 Ultra mı? Amiral Gemisi Kıyaslaması',
      description: 'Nubia Z80 Ultra ve Samsung Galaxy S25 Ultra arasında kalanlar için kamera ve performans karşılaştırması.'
    },
    [normPair('Apple MacBook Pro 16" (M3 Pro)','MacBook Pro 14" (M4)')]: {
      title: 'MacBook Pro 16 M3 Pro mu 14 M4 mü? Boyut ve Performans Farkı',
      description: 'MacBook Pro 16 M3 Pro ve 14 M4 arasındaki performans ve taşınabilirlik karşılaştırması.'
    },
    [normPair('iPhone 12','iPhone 13')]: {
      title: 'iPhone 12 mi iPhone 13 mü? Yükseltmeye Değer mi?',
      description: 'iPhone 12 ve iPhone 13 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('TCL 55C655','Xiaomi TV A Pro 55')]: {
      title: 'TCL 55C655 mi Xiaomi TV A Pro 55 mi? Marka Karşılaştırması',
      description: 'TCL 55C655 ve Xiaomi TV A Pro 55 arasında kalanlar için görüntü kalitesi karşılaştırması.'
    },
    [normPair('Samsung Galaxy A56 5G','Samsung Galaxy S21 Ultra')]: {
      title: 'Galaxy A56 5G mi S21 Ultra mı? Yeni ve Eski Amiral Gemisi',
      description: 'Samsung Galaxy A56 5G ve S21 Ultra arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Honor Magic8 Pro','Samsung Galaxy S26 Ultra')]: {
      title: 'Honor Magic8 Pro mu Samsung S26 Ultra mı? Amiral Gemisi Kıyaslaması',
      description: 'Honor Magic8 Pro ve Samsung Galaxy S26 Ultra arasında kalanlar için kamera ve performans karşılaştırması.'
    },
    [normPair('Apple Watch SE (2. Nesil)','Huawei Watch GT 5')]: {
      title: 'Apple Watch SE mi Huawei Watch GT 5 mi? Marka Karşılaştırması',
      description: 'Apple Watch SE (2. Nesil) ve Huawei Watch GT 5 arasında kalanlar için akıllı saat karşılaştırması.'
    },
    [normPair('Apple iPad (10. Nesil)','Apple iPad Pro (M2, 11")')]: {
      title: 'iPad 10. Nesil mi iPad Pro M2 mi? Fiyat Farkına Değer mi?',
      description: 'iPad 10. Nesil ve iPad Pro M2 arasındaki performans farkı. Pro modelin fiyat farkına değip değmediği.'
    },
    [normPair('Apple iPad Mini (7. Nesil)','Apple iPad Pro (M5, 11")')]: {
      title: 'iPad Mini mi iPad Pro M5 mi? Kompakt ve Güçlü Karşılaştırması',
      description: 'iPad Mini (7. Nesil) ve iPad Pro M5 arasındaki performans farkı ve fiyat karşılaştırması.'
    },
    [normPair('iPhone 15','Samsung Galaxy S26 Ultra')]: {
      title: 'iPhone 15 mi Samsung S26 Ultra mı? Marka Karşılaştırması',
      description: 'iPhone 15 ve Samsung Galaxy S26 Ultra arasında kalanlar için kamera ve performans karşılaştırması.'
    },
    [normPair('Apple iPad Mini (7. Nesil)','Apple iPad Pro (M2, 11")')]: {
      title: 'iPad Mini mi iPad Pro M2 mi? Kompakt ve Güçlü Karşılaştırması',
      description: 'iPad Mini (7. Nesil) ve iPad Pro M2 arasındaki performans farkı ve fiyat karşılaştırması.'
    },
    [normPair('Honor 600 Pro','Huawei P60 Pro')]: {
      title: 'Honor 600 Pro mu Huawei P60 Pro mu? Aynı Ekosistem Karşılaştırması',
      description: 'Honor 600 Pro ve Huawei P60 Pro arasında kalanlar için kamera ve performans karşılaştırması.'
    },
    [normPair('Asus ROG Strix G16','MacBook Pro 14" (M1 Pro)')]: {
      title: 'ROG Strix G16 mı MacBook Pro 14 mü? Oyun ve Üretkenlik Farkı',
      description: 'Asus ROG Strix G16 ve MacBook Pro 14 M1 Pro arasında kalanlar için performans karşılaştırması.'
    },
    [normPair('AirPods Pro (2. Nesil)','Sony WF-1000XM5')]: {
      title: 'AirPods Pro 2 mi Sony WF-1000XM5 mü? Marka Karşılaştırması',
      description: 'AirPods Pro (2. Nesil) ve Sony WF-1000XM5 arasında kalanlar için gürültü önleme karşılaştırması.'
    },
    [normPair('Xiaomi Pad 6','Xiaomi Redmi Pad 2 Pro')]: {
      title: 'Xiaomi Pad 6 mı Redmi Pad 2 Pro mu? Aynı Markanın Modelleri',
      description: 'Xiaomi Pad 6 ve Xiaomi Redmi Pad 2 Pro arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Nikon Z6 III','Sony A7 IV')]: {
      title: 'Nikon Z6 III mü Sony A7 IV mü? Amiral Gemisi Kıyaslaması',
      description: 'Nikon Z6 III ve Sony A7 IV arasında kalan fotoğrafçılar için görüntü kalitesi ve fiyat karşılaştırması.'
    },
    [normPair('Anker Soundcore R50i NC','JBL Live Pro 2')]: {
      title: 'Anker Soundcore R50i NC mi JBL Live Pro 2 mi? Marka Karşılaştırması',
      description: 'Anker Soundcore R50i NC ve JBL Live Pro 2 arasında kalanlar için ses kalitesi karşılaştırması.'
    },
    [normPair('Bose QuietComfort Ultra Earbuds','Sony WH-1000XM5')]: {
      title: 'Bose QC Ultra Earbuds mü Sony WH-1000XM5 mü? Marka Karşılaştırması',
      description: 'Bose QuietComfort Ultra Earbuds ve Sony WH-1000XM5 arasında kalanlar için gürültü önleme karşılaştırması.'
    },
    [normPair('Apple iPhone 17 Pro Max','iPhone 16 Pro')]: {
      title: 'iPhone 17 Pro Max mı 16 Pro mu? Yükseltmeye Değer mi?',
      description: 'iPhone 17 Pro Max ve iPhone 16 Pro arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('iPhone 11','iPhone 16')]: {
      title: 'iPhone 11 mi iPhone 16 mı? Beş Nesil Arasındaki Fark',
      description: 'iPhone 11 ve iPhone 16 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Samsung Galaxy S26 Ultra','Samsung Galaxy Z Flip6')]: {
      title: 'Galaxy S26 Ultra mı Z Flip6 mı? Standart ve Katlanabilir Farkı',
      description: 'Samsung Galaxy S26 Ultra ve Z Flip6 arasında kalanlar için form faktörü ve performans karşılaştırması.'
    },
    [normPair('Canon PowerShot G7X Mark III','Fujifilm X-T5')]: {
      title: 'Canon PowerShot G7X mü Fujifilm X-T5 mi? Kompakt ve Aynasız',
      description: 'Canon PowerShot G7X Mark III ve Fujifilm X-T5 arasında kalanlar için görüntü kalitesi karşılaştırması.'
    },
    [normPair('Bose QuietComfort Ultra Earbuds','Sony WF-1000XM5')]: {
      title: 'Bose QC Ultra Earbuds mü Sony WF-1000XM5 mü? Marka Karşılaştırması',
      description: 'Bose QuietComfort Ultra Earbuds ve Sony WF-1000XM5 arasında kalanlar için gürültü önleme karşılaştırması.'
    },
    [normPair('Lenovo Legion 5 Pro','MacBook Pro 14" (M4)')]: {
      title: 'Legion 5 Pro mu MacBook Pro 14 mü? Oyun ve Üretkenlik Farkı',
      description: 'Lenovo Legion 5 Pro ve MacBook Pro 14 M4 arasında kalanlar için performans karşılaştırması.'
    },
    [normPair('iPhone 13 Pro','iPhone 14 Pro')]: {
      title: 'iPhone 13 Pro mu 14 Pro mu? Yükseltmeye Değer mi?',
      description: 'iPhone 13 Pro ve 14 Pro arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('iPhone 13 Pro','iPhone 15 Pro')]: {
      title: 'iPhone 13 Pro mu 15 Pro mu? İki Nesil Arasındaki Fark',
      description: 'iPhone 13 Pro ve 15 Pro arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple AirPods Pro 3','Bose QuietComfort Ultra Earbuds')]: {
      title: 'AirPods Pro 3 mü Bose QC Ultra mı? Marka Karşılaştırması',
      description: 'Apple AirPods Pro 3 ve Bose QuietComfort Ultra Earbuds arasında kalanlar için gürültü önleme karşılaştırması.'
    },
    [normPair('iPhone 13 Pro','iPhone 14')]: {
      title: 'iPhone 13 Pro mu iPhone 14 mü? Pro ve Standart Karşılaştırması',
      description: 'iPhone 13 Pro ve iPhone 14 arasındaki kamera, performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Canon EOS R50','Canon PowerShot G7X Mark III')]: {
      title: 'Canon EOS R50 mü PowerShot G7X mü? Aynasız ve Kompakt Farkı',
      description: 'Canon EOS R50 ve Canon PowerShot G7X Mark III arasındaki form faktörü ve görüntü kalitesi karşılaştırması.'
    },
    [normPair('Fujifilm X-T5','Fujifilm X100VI')]: {
      title: 'Fujifilm X-T5 mi X100VI mı? Aynı Markanın Modelleri',
      description: 'Fujifilm X-T5 ve X100VI arasındaki özellik ve fiyat farkı. Hangisi ihtiyacınıza uygun?'
    },
    [normPair('Apple AirPods Pro 3','Sony WF-1000XM5')]: {
      title: 'AirPods Pro 3 mü Sony WF-1000XM5 mü? Marka Karşılaştırması',
      description: 'Apple AirPods Pro 3 ve Sony WF-1000XM5 arasında kalanlar için gürültü önleme karşılaştırması.'
    },
    [normPair('General Mobile GM 26 Pro 5G','iPhone 12')]: {
      title: 'GM 26 Pro 5G mi iPhone 12 mi? Bütçe ve Amiral Gemisi Farkı',
      description: 'General Mobile GM 26 Pro 5G ve iPhone 12 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('iPhone 16','Samsung Galaxy S24')]: {
      title: 'iPhone 16 mı Samsung S24 mü? Marka Karşılaştırması',
      description: 'iPhone 16 ve Samsung Galaxy S24 arasında kalanlar için kamera ve performans karşılaştırması.'
    },
    [normPair('Reeder P13 Blue Max','Xiaomi Redmi Note 13 Pro')]: {
      title: 'Reeder P13 Blue Max mı Redmi Note 13 Pro mu? Bütçe Kıyaslaması',
      description: 'Reeder P13 Blue Max ve Xiaomi Redmi Note 13 Pro arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Honor Magic8 Lite','Samsung Galaxy A36 5G')]: {
      title: 'Honor Magic8 Lite mı Galaxy A36 5G mi? Orta Segment Kıyaslaması',
      description: 'Honor Magic8 Lite ve Samsung Galaxy A36 5G arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('General Mobile GM Era 50','Xiaomi Redmi Note 13 Pro')]: {
      title: 'GM Era 50 mi Redmi Note 13 Pro mu? Bütçe Telefon Kıyaslaması',
      description: 'General Mobile GM Era 50 ve Xiaomi Redmi Note 13 Pro arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Apple iPad Air (4. Nesil)','Apple iPad Pro (M5, 11")')]: {
      title: 'iPad Air mi iPad Pro M5 mi? Fiyat Farkına Değer mi?',
      description: 'iPad Air (4. Nesil) ve iPad Pro M5 arasındaki performans farkı. Pro modelin fiyat farkına değip değmediği.'
    },
    [normPair('Apple iPad Mini (7. Nesil)','Samsung Galaxy Tab A9')]: {
      title: 'iPad Mini mi Galaxy Tab A9 mu? Marka Karşılaştırması',
      description: 'iPad Mini (7. Nesil) ve Samsung Galaxy Tab A9 arasında kalanlar için tablet karşılaştırması.'
    },
    [normPair('Apple Watch Series 6','Apple Watch Series 8')]: {
      title: 'Apple Watch Series 6 mı 8 mi? İki Nesil Arasındaki Fark',
      description: 'Apple Watch Series 6 ve Series 8 arasındaki yenilikler ve fiyat farkı karşılaştırması.'
    },
    [normPair('AirPods Pro (2. Nesil)','Samsung Galaxy Buds3')]: {
      title: 'AirPods Pro 2 mi Galaxy Buds3 mü? Marka Karşılaştırması',
      description: 'AirPods Pro (2. Nesil) ve Samsung Galaxy Buds3 arasında kalanlar için ses kalitesi karşılaştırması.'
    },
    [normPair('Apple iPhone 17 Pro Max','Apple iPhone SE (2022)')]: {
      title: 'iPhone 17 Pro Max mı iPhone SE mi? Amiral Gemisi ve Kompakt Farkı',
      description: 'iPhone 17 Pro Max ve iPhone SE arasındaki performans ve fiyat farkı karşılaştırması.'
    },
    [normPair('Samsung Galaxy A55','Samsung Galaxy S22 Ultra')]: {
      title: 'Galaxy A55 mi S22 Ultra mı? Yeni Orta Segment ve Eski Ultra',
      description: 'Samsung Galaxy A55 ve S22 Ultra arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Canon PowerShot G7X Mark III','Sony ZV-E10')]: {
      title: 'Canon PowerShot G7X mü Sony ZV-E10 mu? Vlog Kamerası Kıyaslaması',
      description: 'Canon PowerShot G7X Mark III ve Sony ZV-E10 arasında kalan içerik üreticileri için karşılaştırma.'
    },
    [normPair('Casper VIA A40','Casper VIA M40')]: {
      title: 'Casper VIA A40 mı M40 mı? Aynı Serinin Modelleri',
      description: 'Casper VIA A40 ve VIA M40 arasındaki özellik ve fiyat farkı. Hangisi bütçenize daha uygun?'
    },
    [normPair('Grundig 55 GUA 9200','Xiaomi TV A Pro 55')]: {
      title: 'Grundig 55 GUA 9200 mü Xiaomi TV A Pro 55 mi? Marka Karşılaştırması',
      description: 'Grundig 55 GUA 9200 ve Xiaomi TV A Pro 55 arasında kalanlar için görüntü kalitesi karşılaştırması.'
    },
    [normPair('Apple AirPods 4','Samsung Galaxy Buds3')]: {
      title: 'AirPods 4 mü Galaxy Buds3 mü? Marka Karşılaştırması',
      description: 'Apple AirPods 4 ve Samsung Galaxy Buds3 arasında kalanlar için ses kalitesi karşılaştırması.'
    },
    [normPair('General Mobile GM 26 Pro 5G','Samsung Galaxy A56 5G')]: {
      title: 'GM 26 Pro 5G mi Galaxy A56 5G mi? Bütçe Telefon Kıyaslaması',
      description: 'General Mobile GM 26 Pro 5G ve Samsung Galaxy A56 5G arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('General Mobile GM Fenix II Pro 5G','iPhone 13 Pro')]: {
      title: 'GM Fenix II Pro mu iPhone 13 Pro mu? Marka Karşılaştırması',
      description: 'General Mobile GM Fenix II Pro 5G ve iPhone 13 Pro arasındaki fiyat/performans farkı.'
    },
    [normPair('MacBook Air (M1, 13")','MacBook Air (M2, 13")')]: {
      title: 'MacBook Air M1 mi M2 mi? Yükseltmeye Değer mi?',
      description: 'MacBook Air M1 ve M2 arasındaki performans farkı. Bir nesil atlamaya gerçekten değer mi?'
    },
    [normPair('Canon EOS R6 Mark II','Nikon Z6 III')]: {
      title: 'Canon EOS R6 Mark II mi Nikon Z6 III mü? Amiral Gemisi Kıyaslaması',
      description: 'Canon EOS R6 Mark II ve Nikon Z6 III arasında kalan fotoğrafçılar için görüntü kalitesi karşılaştırması.'
    },
    [normPair('MacBook Pro 14" (M3)','MacBook Pro 14" (M4)')]: {
      title: 'MacBook Pro 14 M3 mü M4 mü? Yükseltmeye Değer mi?',
      description: 'MacBook Pro 14 M3 ve M4 arasındaki performans farkı. Bir nesil atlamaya gerçekten değer mi?'
    },
    [normPair('Casper VIA M40','Casper VIA X40')]: {
      title: 'Casper VIA M40 mı X40 mı? Aynı Serinin Modelleri',
      description: 'Casper VIA M40 ve VIA X40 arasındaki özellik ve fiyat farkı. Hangisi bütçenize daha uygun?'
    },
    [normPair('MacBook Air (M2, 13")','MacBook Air (M3, 13")')]: {
      title: 'MacBook Air (M2, 13") mı MacBook Air (M3, 13") mı? Karşılaştırması',
      description: 'MacBook Air (M2, 13") ve MacBook Air (M3, 13") arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Apple iPad mini (7. Nesil)','Honor MagicPad 4')]: {
      title: 'Apple iPad mini (7. Nesil) mi Honor MagicPad 4 mi? Hangisini Almalısınız?',
      description: 'Apple iPad mini (7. Nesil) ve Honor MagicPad 4 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('MacBook Air (M1, 13")','MacBook Air (M3, 13")')]: {
      title: 'MacBook Air (M1, 13") mı MacBook Air (M3, 13") mü? Fiyat/Performans Kıyaslaması',
      description: 'MacBook Air (M1, 13") ve MacBook Air (M3, 13") arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Huawei MatePad 11.5','Xiaomi Pad 6')]: {
      title: 'Huawei MatePad 11.5 ile Xiaomi Pad 6 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Huawei MatePad 11.5 ve Xiaomi Pad 6 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple Watch SE (2. Nesil)','Apple Watch Ultra')]: {
      title: 'Apple Watch SE (2. Nesil) mı Apple Watch Ultra mı? Karşılaştırması',
      description: 'Apple Watch SE (2. Nesil) ve Apple Watch Ultra arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Samsung Galaxy S26 Ultra','Samsung Galaxy Z Fold6')]: {
      title: 'Samsung Galaxy S26 Ultra mi Samsung Galaxy Z Fold6 mi? Hangisini Almalısınız?',
      description: 'Samsung Galaxy S26 Ultra ve Samsung Galaxy Z Fold6 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Nubia Z80 Ultra','Samsung Galaxy S23 Ultra')]: {
      title: 'Nubia Z80 Ultra mı Samsung Galaxy S23 Ultra mü? Fiyat/Performans Kıyaslaması',
      description: 'Nubia Z80 Ultra ve Samsung Galaxy S23 Ultra arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Apple iPad Pro (M4, 11")','Samsung Galaxy Tab S9 FE')]: {
      title: 'Apple iPad Pro (M4, 11") ile Samsung Galaxy Tab S9 FE Karşılaştırması: Hangisi Daha İyi?',
      description: 'Apple iPad Pro (M4, 11") ve Samsung Galaxy Tab S9 FE arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple iPad (10. Nesil)','Samsung Galaxy Tab A9')]: {
      title: 'Apple iPad (10. Nesil) mı Samsung Galaxy Tab A9 mı? Karşılaştırması',
      description: 'Apple iPad (10. Nesil) ve Samsung Galaxy Tab A9 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('POCO X6 Pro','Samsung Galaxy A55')]: {
      title: 'POCO X6 Pro mi Samsung Galaxy A55 mi? Hangisini Almalısınız?',
      description: 'POCO X6 Pro ve Samsung Galaxy A55 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Honor Magic8 Lite','Samsung Galaxy A55')]: {
      title: 'Honor Magic8 Lite mı Samsung Galaxy A55 mü? Fiyat/Performans Kıyaslaması',
      description: 'Honor Magic8 Lite ve Samsung Galaxy A55 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Reeder P13 Blue Max','Vivo V29')]: {
      title: 'Reeder P13 Blue Max ile Vivo V29 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Reeder P13 Blue Max ve Vivo V29 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('MacBook Air (M3, 13")','MacBook Pro 14" (M4)')]: {
      title: 'MacBook Air (M3, 13") mı MacBook Pro 14" (M4) mı? Karşılaştırması',
      description: 'MacBook Air (M3, 13") ve MacBook Pro 14" (M4) arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('HP Omen 16','Lenovo Legion 5 Pro')]: {
      title: 'HP Omen 16 mi Lenovo Legion 5 Pro mi? Hangisini Almalısınız?',
      description: 'HP Omen 16 ve Lenovo Legion 5 Pro arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Apple iPhone SE (2022)','iPhone 15 Pro')]: {
      title: 'Apple iPhone SE (2022) mı iPhone 15 Pro mü? Fiyat/Performans Kıyaslaması',
      description: 'Apple iPhone SE (2022) ve iPhone 15 Pro arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Casper VIA M40','Vivo V29')]: {
      title: 'Casper VIA M40 ile Vivo V29 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Casper VIA M40 ve Vivo V29 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Samsung Galaxy S25 Ultra','Samsung Galaxy Z Flip6')]: {
      title: 'Samsung Galaxy S25 Ultra mı Samsung Galaxy Z Flip6 mı? Karşılaştırması',
      description: 'Samsung Galaxy S25 Ultra ve Samsung Galaxy Z Flip6 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('iPhone 15','Samsung Galaxy S24')]: {
      title: 'iPhone 15 mi Samsung Galaxy S24 mi? Hangisini Almalısınız?',
      description: 'iPhone 15 ve Samsung Galaxy S24 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Huawei MateBook D14','MacBook Pro 14" (M1 Pro)')]: {
      title: 'Huawei MateBook D14 mı MacBook Pro 14" (M1 Pro) mü? Fiyat/Performans Kıyaslaması',
      description: 'Huawei MateBook D14 ve MacBook Pro 14" (M1 Pro) arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('HP Omen 16','Monster Abra A5 V21')]: {
      title: 'HP Omen 16 ile Monster Abra A5 V21 Karşılaştırması: Hangisi Daha İyi?',
      description: 'HP Omen 16 ve Monster Abra A5 V21 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Hisense 55U7','TCL 65C655')]: {
      title: 'Hisense 55U7 mı TCL 65C655 mı? Karşılaştırması',
      description: 'Hisense 55U7 ve TCL 65C655 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Apple Watch Series 6','Apple Watch Series 9')]: {
      title: 'Apple Watch Series 6 mi Apple Watch Series 9 mi? Hangisini Almalısınız?',
      description: 'Apple Watch Series 6 ve Apple Watch Series 9 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Samsung Galaxy S25 Ultra','Xiaomi 15')]: {
      title: 'Samsung Galaxy S25 Ultra mı Xiaomi 15 mü? Fiyat/Performans Kıyaslaması',
      description: 'Samsung Galaxy S25 Ultra ve Xiaomi 15 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('AirPods Pro (2. Nesil)','Huawei FreeBuds Pro 3')]: {
      title: 'AirPods Pro (2. Nesil) ile Huawei FreeBuds Pro 3 Karşılaştırması: Hangisi Daha İyi?',
      description: 'AirPods Pro (2. Nesil) ve Huawei FreeBuds Pro 3 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Honor Magic8 Pro','Samsung Galaxy S25 Ultra')]: {
      title: 'Honor Magic8 Pro mı Samsung Galaxy S25 Ultra mı? Karşılaştırması',
      description: 'Honor Magic8 Pro ve Samsung Galaxy S25 Ultra arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Apple AirPods 4','Beats Studio Buds+')]: {
      title: 'Apple AirPods 4 mi Beats Studio Buds+ mi? Hangisini Almalısınız?',
      description: 'Apple AirPods 4 ve Beats Studio Buds+ arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('General Mobile GM Fenix II Pro 5G','Samsung Galaxy S22 Ultra')]: {
      title: 'General Mobile GM Fenix II Pro 5G mı Samsung Galaxy S22 Ultra mü? Fiyat/Performans Kıyaslaması',
      description: 'General Mobile GM Fenix II Pro 5G ve Samsung Galaxy S22 Ultra arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Infinix Note 40','Reeder P13 Blue Max')]: {
      title: 'Infinix Note 40 ile Reeder P13 Blue Max Karşılaştırması: Hangisi Daha İyi?',
      description: 'Infinix Note 40 ve Reeder P13 Blue Max arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('TCL 55C655','TCL 65C655')]: {
      title: 'TCL 55C655 mı TCL 65C655 mı? Karşılaştırması',
      description: 'TCL 55C655 ve TCL 65C655 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Huawei P60 Pro','Samsung Galaxy S24 Ultra')]: {
      title: 'Huawei P60 Pro mi Samsung Galaxy S24 Ultra mi? Hangisini Almalısınız?',
      description: 'Huawei P60 Pro ve Samsung Galaxy S24 Ultra arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Asus ROG Strix G16','Casper Excalibur G915')]: {
      title: 'Asus ROG Strix G16 mı Casper Excalibur G915 mü? Fiyat/Performans Kıyaslaması',
      description: 'Asus ROG Strix G16 ve Casper Excalibur G915 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('JBL Live Pro 2','Xiaomi Redmi Buds 5')]: {
      title: 'JBL Live Pro 2 ile Xiaomi Redmi Buds 5 Karşılaştırması: Hangisi Daha İyi?',
      description: 'JBL Live Pro 2 ve Xiaomi Redmi Buds 5 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('General Mobile GM Era 50','Xiaomi Redmi 13C')]: {
      title: 'General Mobile GM Era 50 mı Xiaomi Redmi 13C mı? Karşılaştırması',
      description: 'General Mobile GM Era 50 ve Xiaomi Redmi 13C arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Apple Watch Series 11 (42mm)','Huawei Watch GT 5')]: {
      title: 'Apple Watch Series 11 (42mm) mi Huawei Watch GT 5 mi? Hangisini Almalısınız?',
      description: 'Apple Watch Series 11 (42mm) ve Huawei Watch GT 5 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Sony WH-1000XM4','Sony WH-1000XM5')]: {
      title: 'Sony WH-1000XM4 mı Sony WH-1000XM5 mü? Fiyat/Performans Kıyaslaması',
      description: 'Sony WH-1000XM4 ve Sony WH-1000XM5 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Apple Watch Series 6','Apple Watch Series 7')]: {
      title: 'Apple Watch Series 6 ile Apple Watch Series 7 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Apple Watch Series 6 ve Apple Watch Series 7 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple AirPods Pro 3','Sony WH-1000XM5')]: {
      title: 'Apple AirPods Pro 3 mı Sony WH-1000XM5 mı? Karşılaştırması',
      description: 'Apple AirPods Pro 3 ve Sony WH-1000XM5 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('iPhone 11','iPhone 15')]: {
      title: 'iPhone 11 mi iPhone 15 mi? Hangisini Almalısınız?',
      description: 'iPhone 11 ve iPhone 15 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('TCL 55C655','TCL 65C6K')]: {
      title: 'TCL 55C655 mı TCL 65C6K mü? Fiyat/Performans Kıyaslaması',
      description: 'TCL 55C655 ve TCL 65C6K arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Apple Watch Series 8','Honor Watch GS 4')]: {
      title: 'Apple Watch Series 8 ile Honor Watch GS 4 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Apple Watch Series 8 ve Honor Watch GS 4 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('POCO X6 Pro','Samsung Galaxy S22 Ultra')]: {
      title: 'POCO X6 Pro mı Samsung Galaxy S22 Ultra mı? Karşılaştırması',
      description: 'POCO X6 Pro ve Samsung Galaxy S22 Ultra arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Lenovo Legion 5 Pro','MSI Katana 15')]: {
      title: 'Lenovo Legion 5 Pro mi MSI Katana 15 mi? Hangisini Almalısınız?',
      description: 'Lenovo Legion 5 Pro ve MSI Katana 15 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Apple iPad Pro (M4, 11")','Huawei MatePad Pro 13.2')]: {
      title: 'Apple iPad Pro (M4, 11") mı Huawei MatePad Pro 13.2 mü? Fiyat/Performans Kıyaslaması',
      description: 'Apple iPad Pro (M4, 11") ve Huawei MatePad Pro 13.2 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Apple Watch Ultra','Polar Vantage V3')]: {
      title: 'Apple Watch Ultra ile Polar Vantage V3 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Apple Watch Ultra ve Polar Vantage V3 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('iPhone 14','Samsung Galaxy S26 Ultra')]: {
      title: 'iPhone 14 mı Samsung Galaxy S26 Ultra mı? Karşılaştırması',
      description: 'iPhone 14 ve Samsung Galaxy S26 Ultra arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Casper VIA A40','Tecno Camon 30')]: {
      title: 'Casper VIA A40 mi Tecno Camon 30 mi? Hangisini Almalısınız?',
      description: 'Casper VIA A40 ve Tecno Camon 30 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('iPhone 13 Pro','iPhone 16')]: {
      title: 'iPhone 13 Pro mı iPhone 16 mü? Fiyat/Performans Kıyaslaması',
      description: 'iPhone 13 Pro ve iPhone 16 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('iPhone 14 Pro','Samsung Galaxy S24 Ultra')]: {
      title: 'iPhone 14 Pro ile Samsung Galaxy S24 Ultra Karşılaştırması: Hangisi Daha İyi?',
      description: 'iPhone 14 Pro ve Samsung Galaxy S24 Ultra arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Anker Soundcore R50i NC','JBL Tune 510BT')]: {
      title: 'Anker Soundcore R50i NC mı JBL Tune 510BT mı? Karşılaştırması',
      description: 'Anker Soundcore R50i NC ve JBL Tune 510BT arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Hisense 55U7','TCL 65C6K')]: {
      title: 'Hisense 55U7 mi TCL 65C6K mi? Hangisini Almalısınız?',
      description: 'Hisense 55U7 ve TCL 65C6K arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('iPhone 14 Pro','iPhone 16 Pro')]: {
      title: 'iPhone 14 Pro mı iPhone 16 Pro mü? Fiyat/Performans Kıyaslaması',
      description: 'iPhone 14 Pro ve iPhone 16 Pro arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('iPhone 15 Pro','iPhone 16')]: {
      title: 'iPhone 15 Pro ile iPhone 16 Karşılaştırması: Hangisi Daha İyi?',
      description: 'iPhone 15 Pro ve iPhone 16 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Samsung Galaxy Buds3','Xiaomi Buds 4')]: {
      title: 'Samsung Galaxy Buds3 mı Xiaomi Buds 4 mı? Karşılaştırması',
      description: 'Samsung Galaxy Buds3 ve Xiaomi Buds 4 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Acer Nitro Lite 16','Casper Nirvana X500')]: {
      title: 'Acer Nitro Lite 16 mi Casper Nirvana X500 mi? Hangisini Almalısınız?',
      description: 'Acer Nitro Lite 16 ve Casper Nirvana X500 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Fujifilm X-T5','Sony ZV-E10')]: {
      title: 'Fujifilm X-T5 mı Sony ZV-E10 mü? Fiyat/Performans Kıyaslaması',
      description: 'Fujifilm X-T5 ve Sony ZV-E10 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('TCL 65C6K','Xiaomi TV A Pro 55')]: {
      title: 'TCL 65C6K ile Xiaomi TV A Pro 55 Karşılaştırması: Hangisi Daha İyi?',
      description: 'TCL 65C6K ve Xiaomi TV A Pro 55 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple AirPods Pro 3','Samsung Galaxy Buds3')]: {
      title: 'Apple AirPods Pro 3 mı Samsung Galaxy Buds3 mı? Karşılaştırması',
      description: 'Apple AirPods Pro 3 ve Samsung Galaxy Buds3 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Casper VIA A40','Vivo V29')]: {
      title: 'Casper VIA A40 mi Vivo V29 mi? Hangisini Almalısınız?',
      description: 'Casper VIA A40 ve Vivo V29 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Lenovo Tab M10 Plus','Xiaomi Redmi Pad 2 Pro')]: {
      title: 'Lenovo Tab M10 Plus mı Xiaomi Redmi Pad 2 Pro mü? Fiyat/Performans Kıyaslaması',
      description: 'Lenovo Tab M10 Plus ve Xiaomi Redmi Pad 2 Pro arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Hisense 55U7','TCL 55C655')]: {
      title: 'Hisense 55U7 ile TCL 55C655 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Hisense 55U7 ve TCL 55C655 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('iFFALCON 65U95A','Philips 55PUS8118')]: {
      title: 'iFFALCON 65U95A mı Philips 55PUS8118 mı? Karşılaştırması',
      description: 'iFFALCON 65U95A ve Philips 55PUS8118 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Apple Watch Series 11 (42mm)','Garmin Forerunner 165')]: {
      title: 'Apple Watch Series 11 (42mm) mi Garmin Forerunner 165 mi? Hangisini Almalısınız?',
      description: 'Apple Watch Series 11 (42mm) ve Garmin Forerunner 165 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Honor 600 Pro','Samsung Galaxy Z Flip6')]: {
      title: 'Honor 600 Pro mı Samsung Galaxy Z Flip6 mü? Fiyat/Performans Kıyaslaması',
      description: 'Honor 600 Pro ve Samsung Galaxy Z Flip6 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Regal 55R8UB','TCL 65C655')]: {
      title: 'Regal 55R8UB ile TCL 65C655 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Regal 55R8UB ve TCL 65C655 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('General Mobile GM 26 Pro 5G','OnePlus 12')]: {
      title: 'General Mobile GM 26 Pro 5G mı OnePlus 12 mı? Karşılaştırması',
      description: 'General Mobile GM 26 Pro 5G ve OnePlus 12 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('iPhone 12','Samsung Galaxy S26 Ultra')]: {
      title: 'iPhone 12 mi Samsung Galaxy S26 Ultra mi? Hangisini Almalısınız?',
      description: 'iPhone 12 ve Samsung Galaxy S26 Ultra arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('General Mobile GM Fenix II Pro 5G','Xiaomi 14')]: {
      title: 'General Mobile GM Fenix II Pro 5G mı Xiaomi 14 mü? Fiyat/Performans Kıyaslaması',
      description: 'General Mobile GM Fenix II Pro 5G ve Xiaomi 14 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Apple AirPods Pro 3','Sony WH-1000XM4')]: {
      title: 'Apple AirPods Pro 3 ile Sony WH-1000XM4 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Apple AirPods Pro 3 ve Sony WH-1000XM4 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Apple iPad Pro (M2, 11")','Huawei MatePad Pro 13.2')]: {
      title: 'Apple iPad Pro (M2, 11") mı Huawei MatePad Pro 13.2 mı? Karşılaştırması',
      description: 'Apple iPad Pro (M2, 11") ve Huawei MatePad Pro 13.2 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Regal 55R8UB','TCL 55C655')]: {
      title: 'Regal 55R8UB mi TCL 55C655 mi? Hangisini Almalısınız?',
      description: 'Regal 55R8UB ve TCL 55C655 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Honor Magic8 Pro','iPhone 13')]: {
      title: 'Honor Magic8 Pro mı iPhone 13 mü? Fiyat/Performans Kıyaslaması',
      description: 'Honor Magic8 Pro ve iPhone 13 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Honor 200 Pro','Samsung Galaxy A55')]: {
      title: 'Honor 200 Pro ile Samsung Galaxy A55 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Honor 200 Pro ve Samsung Galaxy A55 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('General Mobile GM Era 50','POCO X6 Pro')]: {
      title: 'General Mobile GM Era 50 mı POCO X6 Pro mı? Karşılaştırması',
      description: 'General Mobile GM Era 50 ve POCO X6 Pro arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Casper VIA M40','Tecno Camon 30')]: {
      title: 'Casper VIA M40 mi Tecno Camon 30 mi? Hangisini Almalısınız?',
      description: 'Casper VIA M40 ve Tecno Camon 30 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('iPhone 11','Samsung Galaxy S26 Ultra')]: {
      title: 'iPhone 11 mı Samsung Galaxy S26 Ultra mü? Fiyat/Performans Kıyaslaması',
      description: 'iPhone 11 ve Samsung Galaxy S26 Ultra arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Amazon Fire HD 10','Apple iPad Pro (M1, 11")')]: {
      title: 'Amazon Fire HD 10 ile Apple iPad Pro (M1, 11") Karşılaştırması: Hangisi Daha İyi?',
      description: 'Amazon Fire HD 10 ve Apple iPad Pro (M1, 11") arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Sony A7 IV','Sony Alpha a6400')]: {
      title: 'Sony A7 IV mı Sony Alpha a6400 mı? Karşılaştırması',
      description: 'Sony A7 IV ve Sony Alpha a6400 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Huawei MatePad 11.5','Lenovo Tab M10 Plus')]: {
      title: 'Huawei MatePad 11.5 mi Lenovo Tab M10 Plus mi? Hangisini Almalısınız?',
      description: 'Huawei MatePad 11.5 ve Lenovo Tab M10 Plus arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Huawei FreeBuds Pro 3','Samsung Galaxy Buds3')]: {
      title: 'Huawei FreeBuds Pro 3 mı Samsung Galaxy Buds3 mü? Fiyat/Performans Kıyaslaması',
      description: 'Huawei FreeBuds Pro 3 ve Samsung Galaxy Buds3 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Nubia Z80 Ultra','Samsung Galaxy S24 Ultra')]: {
      title: 'Nubia Z80 Ultra ile Samsung Galaxy S24 Ultra Karşılaştırması: Hangisi Daha İyi?',
      description: 'Nubia Z80 Ultra ve Samsung Galaxy S24 Ultra arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Google Pixel Watch 2','Samsung Galaxy Watch7')]: {
      title: 'Google Pixel Watch 2 mı Samsung Galaxy Watch7 mı? Karşılaştırması',
      description: 'Google Pixel Watch 2 ve Samsung Galaxy Watch7 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('DJI Osmo Pocket 3','Sony A7 IV')]: {
      title: 'DJI Osmo Pocket 3 mi Sony A7 IV mi? Hangisini Almalısınız?',
      description: 'DJI Osmo Pocket 3 ve Sony A7 IV arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Casper VIA X40','Infinix Note 40')]: {
      title: 'Casper VIA X40 mı Infinix Note 40 mü? Fiyat/Performans Kıyaslaması',
      description: 'Casper VIA X40 ve Infinix Note 40 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('General Mobile GM 26 Pro 5G','Samsung Galaxy S22 Ultra')]: {
      title: 'General Mobile GM 26 Pro 5G ile Samsung Galaxy S22 Ultra Karşılaştırması: Hangisi Daha İyi?',
      description: 'General Mobile GM 26 Pro 5G ve Samsung Galaxy S22 Ultra arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Samsung Galaxy Tab A9','Samsung Galaxy Tab S9 FE')]: {
      title: 'Samsung Galaxy Tab A9 mı Samsung Galaxy Tab S9 FE mı? Karşılaştırması',
      description: 'Samsung Galaxy Tab A9 ve Samsung Galaxy Tab S9 FE arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('MacBook Pro 14" (M4)','MSI Modern 14')]: {
      title: 'MacBook Pro 14" (M4) mi MSI Modern 14 mi? Hangisini Almalısınız?',
      description: 'MacBook Pro 14" (M4) ve MSI Modern 14 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('DJI Osmo Pocket 3','Fujifilm X-T5')]: {
      title: 'DJI Osmo Pocket 3 mı Fujifilm X-T5 mü? Fiyat/Performans Kıyaslaması',
      description: 'DJI Osmo Pocket 3 ve Fujifilm X-T5 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Apple iPad Air (4. Nesil)','Samsung Galaxy Tab S11 Ultra')]: {
      title: 'Apple iPad Air (4. Nesil) ile Samsung Galaxy Tab S11 Ultra Karşılaştırması: Hangisi Daha İyi?',
      description: 'Apple iPad Air (4. Nesil) ve Samsung Galaxy Tab S11 Ultra arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Casper VIA X40','Vivo V29')]: {
      title: 'Casper VIA X40 mı Vivo V29 mı? Karşılaştırması',
      description: 'Casper VIA X40 ve Vivo V29 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Apple Watch Series 6','Honor Watch GS 4')]: {
      title: 'Apple Watch Series 6 mi Honor Watch GS 4 mi? Hangisini Almalısınız?',
      description: 'Apple Watch Series 6 ve Honor Watch GS 4 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Honor Magic8 Lite','iPhone 12')]: {
      title: 'Honor Magic8 Lite mı iPhone 12 mü? Fiyat/Performans Kıyaslaması',
      description: 'Honor Magic8 Lite ve iPhone 12 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Apple MacBook Air (M5, 13")','Dell XPS 13 9340')]: {
      title: 'Apple MacBook Air (M5, 13") ile Dell XPS 13 9340 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Apple MacBook Air (M5, 13") ve Dell XPS 13 9340 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Huawei P60 Pro','iPhone 13 Pro')]: {
      title: 'Huawei P60 Pro mı iPhone 13 Pro mı? Karşılaştırması',
      description: 'Huawei P60 Pro ve iPhone 13 Pro arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Hisense 55U7','Vestel 65UA9500')]: {
      title: 'Hisense 55U7 mi Vestel 65UA9500 mi? Hangisini Almalısınız?',
      description: 'Hisense 55U7 ve Vestel 65UA9500 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('iPhone 17','Samsung Galaxy S26 Ultra')]: {
      title: 'iPhone 17 mı Samsung Galaxy S26 Ultra mü? Fiyat/Performans Kıyaslaması',
      description: 'iPhone 17 ve Samsung Galaxy S26 Ultra arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('iPhone 15 Pro','Samsung Galaxy Z Fold6')]: {
      title: 'iPhone 15 Pro ile Samsung Galaxy Z Fold6 Karşılaştırması: Hangisi Daha İyi?',
      description: 'iPhone 15 Pro ve Samsung Galaxy Z Fold6 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Casper VIA M40','Xiaomi Redmi Note 13 Pro')]: {
      title: 'Casper VIA M40 mı Xiaomi Redmi Note 13 Pro mı? Karşılaştırması',
      description: 'Casper VIA M40 ve Xiaomi Redmi Note 13 Pro arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('DJI Osmo Pocket 3','Nikon Z50')]: {
      title: 'DJI Osmo Pocket 3 mi Nikon Z50 mi? Hangisini Almalısınız?',
      description: 'DJI Osmo Pocket 3 ve Nikon Z50 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Apple Watch Ultra','Samsung Galaxy Watch7')]: {
      title: 'Apple Watch Ultra mı Samsung Galaxy Watch7 mü? Fiyat/Performans Kıyaslaması',
      description: 'Apple Watch Ultra ve Samsung Galaxy Watch7 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Casper VIA A40','Infinix Note 40')]: {
      title: 'Casper VIA A40 ile Infinix Note 40 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Casper VIA A40 ve Infinix Note 40 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Casper VIA A40','Realme 12 Pro+')]: {
      title: 'Casper VIA A40 mı Realme 12 Pro+ mı? Karşılaştırması',
      description: 'Casper VIA A40 ve Realme 12 Pro+ arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Casper VIA X40','Reeder P13 Blue Max')]: {
      title: 'Casper VIA X40 mi Reeder P13 Blue Max mi? Hangisini Almalısınız?',
      description: 'Casper VIA X40 ve Reeder P13 Blue Max arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Anker Soundcore R50i NC','Marshall Minor III')]: {
      title: 'Anker Soundcore R50i NC mı Marshall Minor III mü? Fiyat/Performans Kıyaslaması',
      description: 'Anker Soundcore R50i NC ve Marshall Minor III arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Casper VIA M40','POCO X6 Pro')]: {
      title: 'Casper VIA M40 ile POCO X6 Pro Karşılaştırması: Hangisi Daha İyi?',
      description: 'Casper VIA M40 ve POCO X6 Pro arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('General Mobile GM Era 50','Infinix Note 40')]: {
      title: 'General Mobile GM Era 50 mı Infinix Note 40 mı? Karşılaştırması',
      description: 'General Mobile GM Era 50 ve Infinix Note 40 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Lenovo Yoga Tab 11','Xiaomi Redmi Pad 2 Pro')]: {
      title: 'Lenovo Yoga Tab 11 mi Xiaomi Redmi Pad 2 Pro mi? Hangisini Almalısınız?',
      description: 'Lenovo Yoga Tab 11 ve Xiaomi Redmi Pad 2 Pro arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Reeder S19 Max Pro S','Samsung Galaxy A26 5G')]: {
      title: 'Reeder S19 Max Pro S mı Samsung Galaxy A26 5G mü? Fiyat/Performans Kıyaslaması',
      description: 'Reeder S19 Max Pro S ve Samsung Galaxy A26 5G arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Dell XPS 13 9340','MacBook Air (M2, 13")')]: {
      title: 'Dell XPS 13 9340 ile MacBook Air (M2, 13") Karşılaştırması: Hangisi Daha İyi?',
      description: 'Dell XPS 13 9340 ve MacBook Air (M2, 13") arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Huawei MateBook D14','MSI Modern 14')]: {
      title: 'Huawei MateBook D14 mı MSI Modern 14 mı? Karşılaştırması',
      description: 'Huawei MateBook D14 ve MSI Modern 14 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Casper VIA X40','Tecno Camon 30')]: {
      title: 'Casper VIA X40 mi Tecno Camon 30 mi? Hangisini Almalısınız?',
      description: 'Casper VIA X40 ve Tecno Camon 30 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('General Mobile GM Fenix II Pro 5G','Nubia Z80 Ultra')]: {
      title: 'General Mobile GM Fenix II Pro 5G mı Nubia Z80 Ultra mü? Fiyat/Performans Kıyaslaması',
      description: 'General Mobile GM Fenix II Pro 5G ve Nubia Z80 Ultra arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Lenovo ThinkPad E14','MacBook Air (M3, 13")')]: {
      title: 'Lenovo ThinkPad E14 ile MacBook Air (M3, 13") Karşılaştırması: Hangisi Daha İyi?',
      description: 'Lenovo ThinkPad E14 ve MacBook Air (M3, 13") arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Casper Excalibur G870','HP Omen 16')]: {
      title: 'Casper Excalibur G870 mı HP Omen 16 mı? Karşılaştırması',
      description: 'Casper Excalibur G870 ve HP Omen 16 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('iPhone 13 Pro','iPhone 16 Pro')]: {
      title: 'iPhone 13 Pro mi iPhone 16 Pro mi? Hangisini Almalısınız?',
      description: 'iPhone 13 Pro ve iPhone 16 Pro arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('JBL Live Pro 2','Sony WF-C510')]: {
      title: 'JBL Live Pro 2 mı Sony WF-C510 mü? Fiyat/Performans Kıyaslaması',
      description: 'JBL Live Pro 2 ve Sony WF-C510 arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Reeder P13 Blue Max','Tecno Camon 30')]: {
      title: 'Reeder P13 Blue Max ile Tecno Camon 30 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Reeder P13 Blue Max ve Tecno Camon 30 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Acer Nitro Lite 16','Dell Inspiron 15 3520')]: {
      title: 'Acer Nitro Lite 16 mı Dell Inspiron 15 3520 mı? Karşılaştırması',
      description: 'Acer Nitro Lite 16 ve Dell Inspiron 15 3520 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Casper Excalibur G915','MacBook Pro 14" (M3)')]: {
      title: 'Casper Excalibur G915 mi MacBook Pro 14" (M3) mi? Hangisini Almalısınız?',
      description: 'Casper Excalibur G915 ve MacBook Pro 14" (M3) arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('JBL Live Pro 2','Marshall Minor III')]: {
      title: 'JBL Live Pro 2 mı Marshall Minor III mü? Fiyat/Performans Kıyaslaması',
      description: 'JBL Live Pro 2 ve Marshall Minor III arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Honor 200 Pro','Honor Magic8 Lite')]: {
      title: 'Honor 200 Pro ile Honor Magic8 Lite Karşılaştırması: Hangisi Daha İyi?',
      description: 'Honor 200 Pro ve Honor Magic8 Lite arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Canon PowerShot G7X Mark III','Nikon Z50')]: {
      title: 'Canon PowerShot G7X Mark III mı Nikon Z50 mı? Karşılaştırması',
      description: 'Canon PowerShot G7X Mark III ve Nikon Z50 arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Philips 55PUS8118','Samsung 55QN80F')]: {
      title: 'Philips 55PUS8118 mi Samsung 55QN80F mi? Hangisini Almalısınız?',
      description: 'Philips 55PUS8118 ve Samsung 55QN80F arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('DJI Osmo Pocket 3','Fujifilm X100VI')]: {
      title: 'DJI Osmo Pocket 3 mı Fujifilm X100VI mü? Fiyat/Performans Kıyaslaması',
      description: 'DJI Osmo Pocket 3 ve Fujifilm X100VI arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Honor MagicPad 4','Samsung Galaxy Tab A9')]: {
      title: 'Honor MagicPad 4 ile Samsung Galaxy Tab A9 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Honor MagicPad 4 ve Samsung Galaxy Tab A9 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Casper VIA A40','POCO X6 Pro')]: {
      title: 'Casper VIA A40 mı POCO X6 Pro mı? Karşılaştırması',
      description: 'Casper VIA A40 ve POCO X6 Pro arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('Huawei MateBook D14','Samsung Galaxy Book4')]: {
      title: 'Huawei MateBook D14 mi Samsung Galaxy Book4 mi? Hangisini Almalısınız?',
      description: 'Huawei MateBook D14 ve Samsung Galaxy Book4 arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('iPhone 13 Pro','Nubia Z80 Ultra')]: {
      title: 'iPhone 13 Pro mı Nubia Z80 Ultra mü? Fiyat/Performans Kıyaslaması',
      description: 'iPhone 13 Pro ve Nubia Z80 Ultra arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Infinix Note 40','Xiaomi Redmi Note 13 Pro')]: {
      title: 'Infinix Note 40 ile Xiaomi Redmi Note 13 Pro Karşılaştırması: Hangisi Daha İyi?',
      description: 'Infinix Note 40 ve Xiaomi Redmi Note 13 Pro arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('Vivo V29','Xiaomi Redmi Note 13 Pro')]: {
      title: 'Vivo V29 mı Xiaomi Redmi Note 13 Pro mı? Karşılaştırması',
      description: 'Vivo V29 ve Xiaomi Redmi Note 13 Pro arasında kalanlar için fiyat/performans karşılaştırması.'
    },
    [normPair('OnePlus 12','Samsung Galaxy S21 Ultra')]: {
      title: 'OnePlus 12 mi Samsung Galaxy S21 Ultra mi? Hangisini Almalısınız?',
      description: 'OnePlus 12 ve Samsung Galaxy S21 Ultra arasındaki fark neler? Detaylı karşılaştırma.'
    },
    [normPair('Apple MacBook Pro 16" (M3 Pro)','MacBook Pro 14" (M1 Pro)')]: {
      title: 'Apple MacBook Pro 16" (M3 Pro) mı MacBook Pro 14" (M1 Pro) mü? Fiyat/Performans Kıyaslaması',
      description: 'Apple MacBook Pro 16" (M3 Pro) ve MacBook Pro 14" (M1 Pro) arasında kalanlar için performans ve fiyat karşılaştırması.'
    },
    [normPair('Apple Watch Series 10','Garmin Forerunner 165')]: {
      title: 'Apple Watch Series 10 ile Garmin Forerunner 165 Karşılaştırması: Hangisi Daha İyi?',
      description: 'Apple Watch Series 10 ve Garmin Forerunner 165 arasındaki özellik ve fiyat farkı karşılaştırması.'
    },
    [normPair('iFFALCON 65U95A','Toshiba 50UA2263DG')]: {
      title: 'iFFALCON 65U95A mı Toshiba 50UA2263DG mı? Karşılaştırması',
      description: 'iFFALCON 65U95A ve Toshiba 50UA2263DG arasında kalanlar için fiyat/performans karşılaştırması.'
    },
  };

  const outDir = path.join(rootDir, 'karsilastir');
  // Klasörü ÖNCE temizle — eski/geçersiz kombinasyonlardan kalan yetim
  // (orphan) dosyalar birikmesin (ürün verisi değiştikçe eski dosyalar
  // hiç silinmiyordu, bu da canlıda kullanılmayan sayfalara yol açıyordu).
  if(fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const scores = computeScores(products);
  const catalog = products.filter(p => !p.upcoming);
  // AdSense içerik kalitesi: her kategori için skor bazlı yüzdelik dilim
  // haritası — en alt %20'deki ürünlerden oluşan comparison'lar noindex
  // olacak (çok düşük skorlu ürün ikilileri gerçek kullanıcı değeri
  // taşımıyor, Google'ın "low value content" örneklemesini kirletiyor).
  const percentileById = {};
  [...new Set(catalog.map(p => p.cat))].forEach(cat => {
    const catItems = catalog.filter(p => p.cat === cat)
      .map(p => ({ id: p.id, score: scores[p.id] ?? 0 }))
      .sort((a,b) => b.score - a.score);
    catItems.forEach((item, i) => {
      percentileById[item.id] = catItems.length > 1 ? i / (catItems.length - 1) : 0;
    });
  });
  // id -> [{url, otherName}] — Faz 11B: ürün detay sayfalarına comparison linki eklemek için
  const productComparisons = {};

  // --- Akıllı çift üretimi: kategori içinde skora göre sırala, ---
  // --- her ürünü en yakın `neighborCount` komşusuyla eşleştir.  ---
  const pairs = [];
  const seen = new Set();

  function addPair(a, b){
    if(!a || !b || a.id === b.id) return;
    const key = [a.id, b.id].sort().join('|');
    if(seen.has(key)) return;
    seen.add(key);
    pairs.push([a, b]);
  }

  categories.forEach(cat => {
    const list = catalog.filter(p => p.cat === cat && scores[p.id] != null)
      .sort((a,b) => (scores[a.id]||0) - (scores[b.id]||0));

    list.forEach((p, i) => {
      for(let d = 1; d <= neighborCount; d++){
        const j = i + d;
        if(j >= list.length) break;
        addPair(p, list[j]);
      }
    });
  });

  // --- EK KURAL 1: Nesil zincirleri ---
  // Search Console verisi gösterdi ki insanlar skoru yakın ürünleri değil,
  // AYNI SERİNİN ARDIŞIK NESİLLERİNİ arıyor ("S23 Ultra vs S24 Ultra" tek
  // başına 5 farklı sorguda geçmiş). Skor bazlı eşleştirme bunları
  // kaçırıyordu çünkü nesiller arası skor farkı büyük olabiliyor.
  const GENERATION_CHAINS = [
    ['iPhone 12','iPhone 13 Pro','iPhone 14 Pro','iPhone 15 Pro','iPhone 16 Pro','Apple iPhone 17 Pro Max'],
    ['iPhone 11','iPhone 12','iPhone 13','iPhone 14','iPhone 15','iPhone 16','iPhone 17'],
    ['iPhone 13','iPhone 13 Pro'],
    ['iPhone 14','iPhone 14 Pro'],
    ['iPhone 15','iPhone 15 Pro'],
    ['iPhone 16','iPhone 16 Pro'],
    ['TCL 65C6K','iFFALCON 65U95A'],
    ['TCL 65C655','TCL 65C6K'],
    ['Samsung Galaxy S21 Ultra','Samsung Galaxy S22 Ultra','Samsung Galaxy S23 Ultra','Samsung Galaxy S24 Ultra','Samsung Galaxy S25 Ultra','Samsung Galaxy S26 Ultra'],
    ['Samsung Galaxy S24','Samsung Galaxy S24 Ultra'],
    ['MacBook Air (M1, 13")','MacBook Air (M2, 13")','MacBook Air (M3, 13")','Apple MacBook Air (M5, 13")'],
    ['MacBook Pro 14" (M1 Pro)','MacBook Pro 14" (M3)','MacBook Pro 14" (M4)'],
    ['Apple Watch Series 6','Apple Watch Series 7','Apple Watch Series 8','Apple Watch Series 9','Apple Watch Series 10','Apple Watch Series 11 (42mm)'],
    ['Apple Watch SE (2. Nesil)','Apple Watch Series 11 (42mm)'],
    ['Apple Watch SE (2. Nesil)','Apple Watch Series 10'],
    ['Apple iPad Pro (M1, 11")','Apple iPad Pro (M2, 11")','Apple iPad Pro (M4, 11")','Apple iPad Pro (M5, 11")'],
    ['Apple iPad Air (4. Nesil)','Apple iPad Pro (M2, 11")'],
    ['Sony WH-1000XM4','Sony WH-1000XM5'],
    ['AirPods Pro (2. Nesil)','Apple AirPods Pro 3'],
  ];
  const byName = {};
  catalog.forEach(p => { byName[p.name] = p; });
  GENERATION_CHAINS.forEach(chain => {
    for(let i = 0; i < chain.length - 1; i++){
      // Ardışık nesiller + bir atlamalı (S23 vs S25 gibi de aranıyor)
      addPair(byName[chain[i]], byName[chain[i+1]]);
      if(i + 2 < chain.length) addPair(byName[chain[i]], byName[chain[i+2]]);
    }
  });

  // --- EK KURAL 2: Marka rekabeti (aynı kategoride farklı markaların amiral gemileri) ---
  // "iPhone 13 Pro vs Samsung S23 Ultra", "ThinkPad vs MacBook Air" gibi
  // marka karşılaştırmaları da sık aranıyor ama skor bazlı eşleştirme
  // bunları çoğu zaman kaçırıyor.
  const RIVAL_PAIRS = [
    ['iPhone 16','Samsung Galaxy S24'],
    ['iPhone 15','Samsung Galaxy S24'],
    ['iPhone 17','Samsung Galaxy S26 Ultra'],
    ['iPhone 13','Samsung Galaxy S22 Ultra'],
    ['iPhone 11','Apple iPhone SE (2022)'],
    ['iPhone 13 Pro','Samsung Galaxy S23 Ultra'],
    ['iPhone 14 Pro','Samsung Galaxy S24 Ultra'],
    ['iPhone 14 Pro','Samsung Galaxy S26 Ultra'],
    ['iPhone 15 Pro','Samsung Galaxy S24 Ultra'],
    ['iPhone 16 Pro','Samsung Galaxy S25 Ultra'],
    ['Apple iPhone 17 Pro Max','Samsung Galaxy S26 Ultra'],
    ['iPhone 16 Pro','Google Pixel 8'],
    ['Samsung Galaxy Z Flip6','Samsung Galaxy S25 Ultra'],
    ['Samsung Galaxy Z Fold6','Samsung Galaxy S26 Ultra'],
    ['Lenovo ThinkPad E14','Apple MacBook Air (M5, 13")'],
    ['Lenovo ThinkPad E14','MacBook Air (M3, 13")'],
    ['Lenovo Legion 5 Pro','MacBook Pro 14" (M4)'],
    ['Canon EOS R50','Canon PowerShot G7X Mark III'],
    ['Canon EOS R6 Mark II','Sony A7 IV'],
    ['Sony WH-1000XM5','Apple AirPods Pro 3'],
    ['Sony WH-1000XM5','Bose QuietComfort Ultra Earbuds'],
    ['Samsung Galaxy Buds3','Apple AirPods Pro 3'],
    ['Huawei FreeBuds Pro 3','Samsung Galaxy Buds3'],
    ['Google Pixel Watch 2','Samsung Galaxy Watch7'],
    ['Apple Watch Series 11 (42mm)','Samsung Galaxy Watch7'],
    ['Garmin Forerunner 165','Apple Watch Ultra'],
    ['Apple iPad Pro (M4, 11")','Samsung Galaxy Tab S9 FE'],
    ['Apple iPad Pro (M4, 11")','Huawei MatePad Pro 13.2'],
    ['Huawei MatePad 11.5','Xiaomi Pad 6'],
  ];
  RIVAL_PAIRS.forEach(([n1, n2]) => addPair(byName[n1], byName[n2]));

  // --- EK KURAL 3: ESKİ (LEGACY) ÇİFTLER — URL kalıcılığı ---
  // Karşılaştırma çiftleri skor yakınlığına göre seçiliyor. Fiyatlar
  // güncellendiğinde skorlar değişiyor ve TAMAMEN FARKLI çiftler oluşuyor;
  // eski sayfalar siliniyor. Google o URL'leri zaten taramış olduğu için
  // 404 veriyorlar (bir seferinde 84 sayfa birden).
  //
  // Bu liste, daha önce üretilmiş ve dışarıdan linklenmiş/indekslenmiş
  // çiftleri kalıcı kılar. Fiyat güncellemeleri artık URL kırmıyor.
  // Yeni 404'ler çıkarsa buraya eklenmeli.
  const LEGACY_PAIRS = [
    ['iPhone 13','Samsung Galaxy S25 Ultra'],
    ['Samsung Galaxy Buds3','Sony WF-1000XM5'],
    ['Casper Excalibur G915','Huawei MateBook D14'],
    ['Realme 12 Pro+','Vivo V29'],
    ['Apple iPad Air (4. Nesil)','Apple iPad mini (7. Nesil)'],
    ['Apple iPad (10. Nesil)','Xiaomi Pad 6'],
    ['Fujifilm X100VI','Nikon Z6 III'],
    ['Apple iPad Pro (M5, 11")','Samsung Galaxy Tab A9'],
    ['Hisense 55U7','Xiaomi TV A Pro 55'],
    ['iPhone 15 Pro','Samsung Galaxy Z Flip6'],
    ['Apple iPad Air (4. Nesil)','Apple iPad Pro (M1, 11")'],
    ['Apple iPad Air (4. Nesil)','Samsung Galaxy Tab A9'],
    ['Apple iPhone 17 Pro Max','Samsung Galaxy Z Fold6'],
    ['Casper VIA A40','Xiaomi Redmi Note 13 Pro'],
    ['Samsung 43Q60D','Vestel 65UA9500'],
    ['Samsung Galaxy S24 Ultra','Samsung Galaxy Z Flip6'],
    ['Huawei Nova 12','Reeder P13 Blue Max'],
    ['iPhone 15 Pro','Samsung Galaxy S26 Ultra'],
    ['Casper VIA M40','General Mobile GM Era 50'],
    ['Nubia Z80 Ultra','Samsung Galaxy S22 Ultra'],
    ['Infinix Note 40','Tecno Camon 30'],
    ['OnePlus Watch 2','Polar Vantage V3'],
    ['Huawei P60 Pro','Samsung Galaxy S22 Ultra'],
    ['iPhone 12','ZTE Red Magic 11 Air'],
    ['General Mobile GM 26 Pro 5G','Samsung Galaxy A55'],
    ['Casper Nirvana X500','HP Pavilion 15-eg2002nt'],
    ['Casper VIA M40','TCL 50 SE'],
    ['Honor Magic8 Lite','POCO X6 Pro'],
    ['HP EliteBook 840 G10','MacBook Air (M3, 13")'],
    ['Apple MacBook Pro 16" (M3 Pro)','MacBook Pro 14" (M4)'],
    ['Google Pixel 8','Huawei P60 Pro'],
    ['Amazon Fire HD 10','Samsung Galaxy Tab A9'],
    ['Oppo Reno11','Vivo V29'],
    ['MacBook Air (M2, 13")','MacBook Pro 14" (M4)'],
    ['Casper Excalibur G870','Monster Tulpar T5 V22.1'],
    ['Amazfit GTS 4','Garmin Forerunner 165'],
    ['Canon EOS R50','Fujifilm X100VI'],
    ['Lenovo IdeaPad Slim 3','Monster Abra A5 V21'],
    ['LG OLED55B4 (OLED55B46LA)','Samsung 55QN80F'],
    ['Grundig 55 GUA 9200','Hisense 55U7'],
    ['iPhone 16 Pro','Samsung Galaxy Z Fold6'],
    ['Lenovo Legion 5 Pro','LG Gram 16'],
    ['Apple MacBook Pro 16" (M3 Pro)','MacBook Air (M3, 13")'],
    ['TCL 65C655','Toshiba 50UA2263DG'],
    ['Google Pixel 8','Samsung Galaxy S21 Ultra'],
    ['Acer Aspire 5','HP Pavilion 15-eg2002nt'],
    ['Motorola Edge 50 Pro','OnePlus 12'],
    ['Oppo Reno11','Xiaomi Redmi Note 13 Pro'],
    ['Apple MacBook Pro 16" (M3 Pro)','HP EliteBook 840 G10'],
    ['Huawei MatePad Pro 13.2','Lenovo Tab M10 Plus'],
    ['Beats Studio Buds+','Marshall Minor III'],
    ['Apple iPhone SE (2022)','iPhone 16 Pro'],
    ['POCO X6 Pro','Samsung Galaxy S21 Ultra'],
    ['Huawei Nova 12','Realme 12 Pro+'],
    ['Acer Nitro Lite 16','Casper Excalibur G870'],
    ['OnePlus Watch 2','Samsung Galaxy Watch7'],
    ['iPhone 13 Pro','Xiaomi 14'],
    ['LG OLED55B4 (OLED55B46LA)','Vestel 55UA9540'],
    ['Samsung 43Q60D','Vestel 55UA9540'],
    ['Anker Soundcore R50i NC','Xiaomi Redmi Buds 5'],
    ['Hisense 55U7','TCL 65C6K'],
    ['HP EliteBook 840 G10','MacBook Air (M2, 13")'],
    ['iPhone 13 Pro','Samsung Galaxy S24 Ultra'],
    ['Apple iPad (10. Nesil)','Apple iPad mini (7. Nesil)'],
    ['Hisense 55U7','Regal 55R8UB'],
    ['Google Pixel 8','Samsung Galaxy S22 Ultra'],
    ['Huawei MateBook D14','MacBook Pro 14" (M3)'],
    ['OnePlus 12','Samsung Galaxy A55'],
    ['Apple AirPods 4','Skullcandy Indy'],
    ['Realme 12 Pro+','Reeder P13 Blue Max'],
    ['Tecno Camon 30','Xiaomi Redmi 13C'],
    ['Fujifilm X100VI','Panasonic Lumix G100'],
    ['Apple iPad (10. Nesil)','Apple iPad Pro (M4, 11")'],
    ['Lenovo Tab M10 Plus','Samsung Galaxy Tab S9 FE'],
    ['Nothing Phone (2)','Reeder P13 Blue Max'],
    ['Samsung Galaxy S25 Ultra','Xiaomi 14'],
    ['Apple iPad (10. Nesil)','Lenovo Tab M10 Plus'],
    ['Asus Vivobook 15','LG Gram 16'],
    ['Philips 55PUS8118','TCL 65C655'],
    ['TCL 50 SE','Xiaomi Redmi 13C'],
    ['Lenovo Legion 5 Pro','MacBook Pro 14" (M1 Pro)'],
    ['JBL Tune 510BT','Xiaomi Redmi Buds 5'],
    ['Canon PowerShot G7X Mark III','Fujifilm X100VI'],
    ['Samsung Galaxy S22 Ultra','Xiaomi 14']
  ];
  LEGACY_PAIRS.forEach(([n1, n2]) => addPair(byName[n1], byName[n2]));


  let count = 0;
  const comparisonUrls = [];
  const byCategory = {}; // cat -> [{url, title}]

  pairs.forEach(([p1, p2]) => {
    // Faz 8 GÜVENLİK KONTROLÜ: aynı ürün kendisiyle asla karşılaştırılmaz
    // (id bazlı, isim eşleşmesi değil — teorik olarak pairs listesi bunu
    // hiç üretmemeli ama ek bir güvenlik katmanı olarak açıkça engelleniyor).
    if(p1.id === p2.id) return;

    // Alfabetik sıraya göre sabit slug — P1-vs-P2 ve P2-vs-P1 için
    // iki ayrı sayfa üretip birbirini kopyalayan (duplicate content) bir
    // durum yaratmamak için tek yön seçilir.
    const [first, second] = [p1, p2].sort((a,b) => a.name.localeCompare(b.name, 'tr'));
    // Fiziksel HTML filename kısa tutulur. Tam ürün adı URL dosya adına
    // yazılmaz; ürün ID çiftinden deterministik hash ile çakışma önlenir.
    const fileName = comparisonFileName(first, second);
    const canonical = `https://teknoversus.com.tr/karsilastir/${fileName}`;
    const catSlug = SLUG_MAP[first.cat] || slugify(first.cat);
    const color = colorFor(first.cat);

    const s1 = scores[first.id], s2 = scores[second.id];
    const price1 = priceOf(first), price2 = priceOf(second);

    let verdict = 'İkisi de fiyat/performans açısından birbirine yakın konumda.';
    let tldrPlain = `${first.name} ile ${second.name} fiyat/performans açısından birbirine yakın konumda.`;
    let winnerId = null;
    if(s1 != null && s2 != null && s1 !== s2){
      const winner = s1 > s2 ? first : second;
      winnerId = winner.id;
      const diff = Math.abs(s1 - s2);
      verdict = `Fiyat/performans skoruna göre <strong>${esc(winner.name)}</strong> bu ikilide ${diff} puan önde.`;
      tldrPlain = `Fiyat/performans skoruna göre ${winner.name}, ${first.name} ile ${second.name} ikilisinde ${diff} puan önde.`;
    }

    // AdSense içerik kalitesi: 530 comparison sayfasının hepsi aynı tek
    // cümlelik "kısa cevap" kalıbından geçtiği için, id çiftine göre
    // deterministik 8 varyanttan biriyle kısa bir ek yorum ekleniyor —
    // Seçenek B: gerçek yapısal çeşitlilik (uzunluk/ton farklı), sadece
    // kelime değişimi değil.
    const cmpVariant = Math.abs((String(first.id)+String(second.id)).split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % 8;
    let editorialNote = '';
    if(winnerId){
      const winnerName = winnerId === first.id ? first.name : second.name;
      const loserName = winnerId === first.id ? second.name : first.name;
      const diff = s1!=null && s2!=null ? Math.abs(s1-s2) : null;
      if(cmpVariant === 0){
        editorialNote = `Bütçenizde ikisi de varsa, ${winnerName} genel olarak daha dengeli bir seçim; ${loserName} ise belirli bir özelliği önceliklendiren kullanıcılar için hâlâ değerlendirilebilir.`;
      } else if(cmpVariant === 1){
        editorialNote = `${winnerName} ile ${loserName} arasında kararsız kalanlar için özetle: fiyat/performans skoru ${winnerName} lehine, ama ihtiyacınıza göre ${loserName} da makul bir alternatif olabilir.`;
      } else if(cmpVariant === 2){
        editorialNote = `${winnerName} mı, ${loserName} mı? ${diff!=null && diff < 10 ? 'Fark küçük, seçim büyük ölçüde kişisel önceliğinize kalıyor.' : `${winnerName} bu ikilide net bir şekilde öne çıkıyor.`}`;
      } else if(cmpVariant === 3){
        editorialNote = `Kısacası, günlük kullanım için ${winnerName} daha avantajlı görünüyor; ${loserName} ise farklı bir kullanım senaryosuna daha uygun olabilir.`;
      } else if(cmpVariant === 4){
        editorialNote = `${winnerName} öne çıkıyor.`;
      } else if(cmpVariant === 5){
        editorialNote = `Bu ikiliyi karşılaştıranların çoğu için sonuç net: ${winnerName} öne çıkıyor. Yine de ${loserName}'i tercih etmeyi düşünüyorsanız, öncelik verdiğiniz özelliği tekrar gözden geçirmenizi öneririz.`;
      } else if(cmpVariant === 6){
        editorialNote = `${diff!=null ? `${diff} puanlık fark, ` : ''}${winnerName} lehine. ${loserName} yine de belirli kullanıcılar için mantıklı bir seçim olabilir.`;
      } else {
        editorialNote = `Kısaca özetlemek gerekirse: ${winnerName} bu karşılaştırmada daha güçlü, ancak nihai karar sizin önceliklerinize bağlı.`;
      }
    }

    // Ürün detay sayfasında zaten kanıtlanmış prosConsFor mantığı, aynı
    // şekilde comparison sayfasında da kullanılıyor — yeni bir sistem değil,
    // mevcut, doğrulanmış bir bileşenin yeniden kullanımı.
    function prosConsHTML(product){
      if(!prosConsFor) return '';
      const catItems = catalog.filter(p => p.cat === product.cat);
      const { pros: pl, cons: cl } = prosConsFor(product, catItems);
      if(!pl.length && !cl.length) return '';
      const clean = (s) => s.split(':')[0].replace(/\s*\([^)]*\)\s*$/, '').trim();
      return `
      <div class="proscons" style="grid-template-columns:1fr 1fr;margin-top:10px;">
        <div class="col pros"><h3 style="font-size:12.5px;">Artılar</h3><ul style="font-size:12px;">${pl.map(x=>`<li>${esc(clean(x))}</li>`).join('') || '<li>—</li>'}</ul></div>
        <div class="col cons"><h3 style="font-size:12.5px;">Eksiler</h3><ul style="font-size:12px;">${cl.map(x=>`<li>${esc(clean(x))}</li>`).join('') || '<li>—</li>'}</ul></div>
      </div>`;
    }
    const firstProsCons = prosConsHTML(first);
    const secondProsCons = prosConsHTML(second);


    const geoFaq = [
      { q: `${first.name} mi ${second.name} mi daha iyi?`, a: tldrPlain },
      { q: `${first.name} ve ${second.name} arasındaki fiyat farkı ne kadar?`, a: (price1 && price2) ? `${first.name} ${price1} ₺, ${second.name} ${price2} ₺ — aradaki fark ${Math.abs(price1-price2).toLocaleString('tr-TR')} ₺.` : `Güncel fiyatlar için her iki ürünün kendi sayfasına bakabilirsiniz.` },
    ];
    const geoFaqSchema = { "@context":"https://schema.org", "@type":"FAQPage", "mainEntity": geoFaq.map(f => ({ "@type":"Question", "name":f.q, "acceptedAnswer": { "@type":"Answer", "text":f.a } })) };

    // Karşılaştırılan iki ürünü makineye açıkça bildiren ItemList şeması.
    // Not: schema.org'da "ComparisonPage" diye resmi bir tip YOK — yaygın bir
    // yanılgı. Karşılaştırma sayfaları için doğru yapı, sıralı bir ItemList
    // içinde Product nesneleri sunmak. Sıralama fiyat/performans skoruna göre.
    const rankedForList = [first, second].sort((a,b) => (scores[b.id]||0) - (scores[a.id]||0));
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `${first.name} ve ${second.name} karşılaştırması`,
      "description": tldrPlain,
      "numberOfItems": 2,
      "itemListOrder": "https://schema.org/ItemListOrderDescending",
      "itemListElement": rankedForList.map((p, i) => {
        const pPrice = priceOf(p);
        const pScore = scores[p.id];
        const item = {
          "@type": "Product",
          "name": p.name,
          "category": p.cat,
          "description": p.blurb || `${p.cat} kategorisinde ${p.name} modeli`,
          "brand": { "@type": "Brand", "name": p.name.split(' ')[0] },
          "url": `https://teknoversus.com.tr/urun/${slugify(p.name)}-${p.id}.html`
        };
        // NOT: Burada bilerek "offers" EKLENMİYOR. TeknoVersus ürünü kendisi
        // satmıyor — bir karşılaştırma/inceleme sitesi. "offers" bildirmek,
        // Google'ın sayfayı "Satıcı girişi" (Merchant listing) olarak
        // değerlendirmesine ve satıcıya özel alanlar (hasMerchantReturnPolicy,
        // shippingDetails) beklemesine yol açıyor. Bu alanları gerçek satıcı
        // (Amazon) adına doldurmak yanıltıcı olurdu. Doğru sınıflandırma
        // "Ürün snippet'i" ve o da review + brand + description ile sağlanıyor.
        if(pScore != null){
          item.review = {
            "@type": "Review",
            "name": "Fiyat/Performans Skoru",
            "reviewBody": `${p.name} için özelliklerine göre hesaplanan fiyat/performans skoru: ${pScore}/100.${pPrice != null ? ` Referans fiyat: ${pPrice} TL.` : ''}`,
            "author": { "@type": "Person", "name": "Sinan Tanrı", "url": "https://teknoversus.com.tr/hakkimizda.html" },
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": String(pScore),
              "bestRating": "100",
              "worstRating": "0"
            }
          };
        }
        return { "@type": "ListItem", "position": i + 1, "item": item };
      })
    };

    // Tüm spec anahtarlarının birleşimi (iki üründe de olmayan alan boş gösterilir)
    const allKeys = [...new Set([
      ...Object.keys(first.specs || {}),
      ...Object.keys(second.specs || {})
    ])];

    const rows = allKeys.map(k => `<tr>
      <td>${esc(k)}</td>
      <td>${esc((first.specs||{})[k] ?? '—')}</td>
      <td>${esc((second.specs||{})[k] ?? '—')}</td>
    </tr>`).join('');

    const description = `${first.name} ile ${second.name} karşılaştırması: fiyat, teknik özellikler ve fiyat/performans skoruna göre hangisini almalısınız.`.slice(0,160);

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Anasayfa", "item": "https://teknoversus.com.tr/" },
        { "@type": "ListItem", "position": 2, "name": first.cat, "item": `https://teknoversus.com.tr/${catSlug}.html` },
        { "@type": "ListItem", "position": 3, "name": `${first.name} vs ${second.name}`, "item": canonical }
      ]
    };

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${(COMPARISON_OVERRIDES[normPair(first.name,second.name)] && COMPARISON_OVERRIDES[normPair(first.name,second.name)].title) || `${esc(first.name)} vs ${esc(second.name)} Karşılaştırması${(s1!=null && s2!=null) ? ` (${s1} vs ${s2} Puan)` : ''} — TeknoVersus`}</title>
<meta name="description" content="${(COMPARISON_OVERRIDES[normPair(first.name,second.name)] && esc(COMPARISON_OVERRIDES[normPair(first.name,second.name)].description)) || esc(description)}" />
${(!COMPARISON_OVERRIDES[normPair(first.name,second.name)] && (percentileById[first.id] >= 0.8 || percentileById[second.id] >= 0.8)) ? '<meta name="robots" content="noindex, follow" />\n' : ''}<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${esc(first.name)} vs ${esc(second.name)} — TeknoVersus" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:locale" content="tr_TR" />
<meta name="twitter:card" content="summary" />
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
${JSON.stringify(breadcrumbSchema, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(geoFaqSchema, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(itemListSchema, null, 2)}
</script>
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2B6CB0" />
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3653440823878417" crossorigin="anonymous"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Q14VG0SB56"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "G-Q14VG0SB56");
</script>
</head>
<body>

<header class="site">
  <div class="wrap nav">
    <div class="brand"><a href="../index.html"><picture><source srcset="../assets/logo-header.webp" type="image/webp"/><img src="../assets/logo-header.png" class="brand-logo" alt="TeknoVersus logo" width="144" height="60" decoding="async"/></picture><span class="brand-text"><span class="tekno">TEKNO</span><span class="versus">VERSUS</span></span></a></div>
    <nav class="nav-links" id="navLinks">
      <a href="../index.html">Anasayfa</a>
      <a href="../haberler.html">Haberler</a>
      <a href="../yakinda-cikacak.html">Yakında Çıkacak</a>
      <a href="../karsilastirmalar.html">Karşılaştırmalar</a>
      <a href="../index.html#katalog">Tüm Kategoriler</a>
    </nav>
    <button class="burger" id="burgerBtn">☰</button>
  </div>
</header>

<main class="detail-wrap">
  <div class="breadcrumb">
    <a href="../index.html">Anasayfa</a> / <a href="../${catSlug}.html">${esc(first.cat)}</a> / ${esc(first.name)} vs ${esc(second.name)}
  </div>
  <a class="back-link" href="../${catSlug}.html">← ${esc(first.cat)} kategorisine dön</a>

  <h1 class="product-page-h1" style="margin:14px 0 6px;">${esc(first.name)} vs ${esc(second.name)}</h1>

  ${(s1 != null && s2 != null) ? `
  <div class="cmp-score-hero">
    <div class="cmp-score-side${winnerId===first.id ? ' is-winner' : ''}">
      <div class="cmp-score-num" style="color:${winnerId===first.id ? color : 'var(--ink-soft)'};">${s1}</div>
      <div class="cmp-score-name">${esc(first.name)}</div>
    </div>
    <div class="cmp-score-vs">VS</div>
    <div class="cmp-score-side${winnerId===second.id ? ' is-winner' : ''}">
      <div class="cmp-score-num" style="color:${winnerId===second.id ? color : 'var(--ink-soft)'};">${s2}</div>
      <div class="cmp-score-name">${esc(second.name)}</div>
    </div>
  </div>` : ''}

  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin:14px 0;">
    <strong>Kısa cevap:</strong> ${verdict}
  </div>
  ${editorialNote ? `<p style="font-size:13px;line-height:1.7;color:var(--ink-soft);font-style:italic;margin:0 0 14px;">${esc(editorialNote)}</p>` : ''}

  <div class="proscons" style="grid-template-columns:1fr 1fr;">
    <div class="col">
      ${illustrationFor ? `<div class="cmp-visual" style="background:linear-gradient(160deg,${color}14,${color}05);">${productImageFor ? productImageFor(first, first.cat, color, ('a'+first.id).replace(/[^a-z0-9]/g,''), { eager: true, width: 200, height: 200 }) : illustrationFor(first.cat, color, ('a'+first.id).replace(/[^a-z0-9]/g,''))}</div>` : ''}
      <h2 style="font-size:15px;margin:0 0 8px;">${esc(first.name)}</h2>
      ${price1 ? `<p style="font-size:14px;margin:0 0 6px;"><strong>${price1.toLocaleString('tr-TR')} ₺</strong></p>` : ''}
      <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 12px;">${esc(first.blurb||'')}</p>
      <a class="btn btn-dark btn-sm" style="display:inline-block;text-decoration:none;" href="${amazonHref(first)}" target="_blank" rel="noopener noreferrer sponsored">Amazon'da Satın Al →</a>
      <div style="margin-top:8px;"><a href="../urun/${slugify(first.name)}-${first.id}.html" style="font-size:12.5px;color:var(--c1);">Ürün detayına git →</a></div>
      ${firstProsCons}
    </div>
    <div class="col">
      ${illustrationFor ? `<div class="cmp-visual" style="background:linear-gradient(160deg,${color}14,${color}05);">${productImageFor ? productImageFor(second, second.cat, color, ('b'+second.id).replace(/[^a-z0-9]/g,''), { eager: true, width: 200, height: 200 }) : illustrationFor(second.cat, color, ('b'+second.id).replace(/[^a-z0-9]/g,''))}</div>` : ''}
      <h2 style="font-size:15px;margin:0 0 8px;">${esc(second.name)}</h2>
      ${price2 ? `<p style="font-size:14px;margin:0 0 6px;"><strong>${price2.toLocaleString('tr-TR')} ₺</strong></p>` : ''}
      <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 12px;">${esc(second.blurb||'')}</p>
      <a class="btn btn-dark btn-sm" style="display:inline-block;text-decoration:none;" href="${amazonHref(second)}" target="_blank" rel="noopener noreferrer sponsored">Amazon'da Satın Al →</a>
      <div style="margin-top:8px;"><a href="../urun/${slugify(second.name)}-${second.id}.html" style="font-size:12.5px;color:var(--c1);">Ürün detayına git →</a></div>
      ${secondProsCons}
    </div>
  </div>

  <h2 style="font-size:15px;margin:20px 0 8px;">Teknik Özellik Karşılaştırması</h2>
  <table class="detail-specs-table">
    <thead><tr><td><strong>Özellik</strong></td><td><strong>${esc(first.name)}</strong></td><td><strong>${esc(second.name)}</strong></td></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <h2 style="font-size:15px;margin:20px 0 10px;">Sıkça Sorulan Sorular</h2>
${geoFaq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(f.a)}</div>
  </div>`).join('\n')}

  <p class="product-notice">
    Fiyat/performans skoru, kategori içindeki ürünlerin göreli karşılaştırmasıyla otomatik hesaplanır; bağımsız
    bir laboratuvar testi değildir. Fiyatlar bir anlık görüntüdür ve canlı güncellenmez.
  </p>
</main>

<footer>
  <div class="wrap" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:16px;">
    <a class="chip-filter" href="../telefon.html">Telefon</a>
    <a class="chip-filter" href="../dizustu.html">Dizüstü</a>
    <a class="chip-filter" href="../kulaklik.html">Kulaklık</a>
    <a class="chip-filter" href="../kamera.html">Kamera</a>
    <a class="chip-filter" href="../akilli-saat.html">Akıllı Saat</a>
    <a class="chip-filter" href="../tablet.html">Tablet</a>
    <a class="chip-filter" href="../televizyon.html">Televizyon</a>
  </div>
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
  <div style="margin-top:10px;"><a href="../hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="../gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a></div>
</footer>

<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;

    fs.writeFileSync(path.join(outDir, fileName), html);
    const isNoindex = !COMPARISON_OVERRIDES[normPair(first.name,second.name)] && (percentileById[first.id] >= 0.8 || percentileById[second.id] >= 0.8);
    if(!isNoindex) comparisonUrls.push(`karsilastir/${fileName}`);
    (productComparisons[first.id] = productComparisons[first.id] || []).push({ url: `karsilastir/${fileName}`, otherName: second.name });
    (productComparisons[second.id] = productComparisons[second.id] || []).push({ url: `karsilastir/${fileName}`, otherName: first.name });
    (byCategory[first.cat] = byCategory[first.cat] || []).push({
      url: `karsilastir/${fileName}`,
      title: `${first.name} vs ${second.name}`,
      scoreDiff: (s1 != null && s2 != null) ? Math.abs(s1 - s2) : 999,
      a: { id: first.id, name: first.name, img: `assets/products/${slugify(first.name)}-${first.id}.png` },
      b: { id: second.id, name: second.name, img: `assets/products/${slugify(second.name)}-${second.id}.png` }
    });
    count++;
  });

  console.log(`${count} karşılaştırma sayfası oluşturuldu -> karsilastir/`);

  // --- Faz 11B: ürün detay sayfalarına gerçek comparison linkleri ekle ---
  // Ürün sayfaları bu fonksiyondan ÖNCE (generate-site.js'te) üretildiği için
  // comparison URL'leri o an bilinmiyordu. Şimdi, gerçekten üretilmiş
  // dosyaları okuyup içine (varsa) bu bölümü tek seferlik ekliyoruz.
  // Uydurma/tahmini URL yok — sadece yukarıda gerçekten yazılan dosyalar kullanılıyor.
  const urunDir = path.join(rootDir, 'urun');
  let linkedCount = 0;
  for(const p of catalog){
    const items = productComparisons[p.id];
    if(!items || !items.length) continue;
    const productFile = path.join(urunDir, `${slugify(p.name)}-${p.id}.html`);
    if(!fs.existsSync(productFile)) continue;
    let html = fs.readFileSync(productFile, 'utf8');
    if(html.includes('id="cmpLinksBox"')) continue; // idempotent: build tekrar çalışırsa iki kez eklenmesin
    const top = items.slice(0, 5);
    const cmpHTML = `
  <h2 style="font-size:15px;margin:20px 0 8px;" id="cmpLinksBox">Karşılaştırmalar</h2>
  <div class="similar-row">${top.map(it => `<a class="similar-card" href="../${it.url}"><div class="n">vs ${esc(it.otherName)}</div></a>`).join('')}</div>
`;
    const marker = '<div id="ratingsBox"></div>';
    if(html.includes(marker)){
      html = html.replace(marker, cmpHTML + marker);
      fs.writeFileSync(productFile, html);
      linkedCount++;
    }
  }
  console.log(`${linkedCount} ürün sayfasına karşılaştırma linki eklendi.`);

  // --- sitemap.xml'e ekle ---
  // generate-site.js sitemap.xml'i baştan (ürün+statik sayfalarla) üretir;
  // bu fonksiyon HER ZAMAN ondan SONRA çalışmalı. Önceki çalıştırmadan kalan
  // karsilastir/ girdilerini temizleyip güncel listeyle yeniden ekler (idempotent).
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/karsilastir\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
    const today = new Date().toISOString().slice(0,10);
    const entries = comparisonUrls.map(loc => `  <url>
    <loc>https://teknoversus.com.tr/${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n');
    xml = xml.replace('</urlset>', `${entries}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
    console.log(`sitemap.xml güncellendi, +${comparisonUrls.length} karşılaştırma URL'si eklendi.`);
  } else {
    console.warn('UYARI: sitemap.xml bulunamadı — önce generateSite (gen_product_pages.js / build.js) çalıştırılmalı.');
  }

  // --- Kategori sayfalarına "Popüler Karşılaştırmalar" bloğu ekle ---
  // Skor farkı en küçük (en "kafa kafaya") 4 eşleşme seçilir.
  // Marker yorumlarıyla sarılı — yeniden çalıştırmada eski blok temizlenip
  // güncellenir (idempotent), sayfanın geri kalanına dokunulmaz.
  Object.entries(byCategory).forEach(([cat, list]) => {
    const catSlug = SLUG_MAP[cat];
    if(!catSlug) return;
    const catPagePath = path.join(rootDir, `${catSlug}.html`);
    if(!fs.existsSync(catPagePath)) return;

    const top = [...list].sort((a,b) => a.scoreDiff - b.scoreDiff).slice(0, 4);
    const linksHTML = top.map(c =>
      `<a class="chip-filter" href="${c.url.replace('karsilastir/','karsilastir/')}">${esc(c.title)}</a>`
    ).join('\n        ');

    const block = `<!-- POPULER_KARSILASTIRMALAR_START -->
    <div style="margin:6px 0 22px;">
      <h2 style="font-size:15px;margin:0 0 10px;">Bu Kategoride En Çok Hangi Ürünler Karşılaştırılıyor?</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${linksHTML}
        <a class="chip-filter" href="populer-karsilastirmalar.html" style="font-weight:600;">⚡ Amiral Gemisi Karşılaştırmaları →</a>
      </div>
    </div>
    <!-- POPULER_KARSILASTIRMALAR_END -->`;

    let pageHtml = fs.readFileSync(catPagePath, 'utf8');
    const markerRe = /<!-- POPULER_KARSILASTIRMALAR_START -->[\s\S]*?<!-- POPULER_KARSILASTIRMALAR_END -->/;
    if(markerRe.test(pageHtml)){
      pageHtml = pageHtml.replace(markerRe, block);
    } else if(pageHtml.includes('</main>')){
      pageHtml = pageHtml.replace('</main>', `  ${block}\n</main>`);
    }
    fs.writeFileSync(catPagePath, pageHtml);
  });
  console.log(`Kategori sayfalarına "Popüler Karşılaştırmalar" bloğu eklendi (${Object.keys(byCategory).length} kategori).`);

  // --- Anasayfaya da ekle: her kategoriden en "kafa kafaya" 1 eşleşme ---
  const indexPath = path.join(rootDir, 'index.html');
  if(fs.existsSync(indexPath)){
    const homeTop = Object.entries(byCategory).map(([cat, list]) => {
      const best = [...list].sort((a,b) => a.scoreDiff - b.scoreDiff)[0];
      return best ? { ...best, cat } : null;
    }).filter(Boolean).slice(0, 3);
    // Not: anasayfa artik SADECE 3 chip gosteriyor (once 7'ydi). Kalan
    // kategoriler icin linkler KAYBOLMUYOR - bu sayfalar zaten sitemap.xml'de,
    // karsilastirmalar.html'de VE ilgili urun sayfalarinda linklenmis durumda.
    // Sadece anasayfadaki GORSEL yogunluk azaliyor, SEO/erisilebilirlik
    // etkilenmiyor.

    const homeLinksHTML = homeTop.map(c =>
      `<a class="chip-filter" href="${c.url}">${esc(c.title)}</a>`
    ).join('\n      ');

    const homeBlock = `<!-- POPULER_KARSILASTIRMALAR_START -->
  <section class="section" id="karsilastirmalar">
    <div class="section-head">
      <div>
        <div class="section-label">Kafa Kafaya</div>
        <h2 class="section-title">Hangi Ürünler Birbiriyle Karşılaştırılıyor?</h2>
      </div>
    </div>
    <div class="wrap" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
      ${homeLinksHTML}
      <a class="chip-filter" href="populer-karsilastirmalar.html" style="font-weight:600;color:var(--c1);">Tümünü gör →</a>
    </div>
  </section>
  <!-- POPULER_KARSILASTIRMALAR_END -->`;

    let homeHtml = fs.readFileSync(indexPath, 'utf8');
    const markerRe = /<!-- POPULER_KARSILASTIRMALAR_START -->[\s\S]*?<!-- POPULER_KARSILASTIRMALAR_END -->/;
    if(markerRe.test(homeHtml)){
      homeHtml = homeHtml.replace(markerRe, homeBlock);
    } else {
      homeHtml = homeHtml.replace('<section class="section" id="katalog">', `${homeBlock}\n\n  <section class="section" id="katalog">`);
    }
    fs.writeFileSync(indexPath, homeHtml);
    console.log(`Anasayfaya "Popüler Karşılaştırmalar" bölümü eklendi (${homeTop.length} kategori temsil ediliyor).`);
  }

  // --- "Tüm Karşılaştırmalar" statik liste sayfası (SAYFALANMIŞ) ----
  // Anasayfa/kategori sayfalarında sadece en "kafa kafaya" birkaç eşleşme
  // linkleniyor — geri kalan yüzlerce karşılaştırma sayfası sadece sitemap
  // üzerinden bulunabiliyordu. Bu sayfa hepsini kategoriye göre gruplayıp
  // tek bir yerden linkler; hem kullanıcı gezinmesi hem iç link akışı için.
  // Ayrıca: canlı arama kutusu + "iki ürün seç karşılaştır" aracı + her
  // satırda iki ürünün küçük illüstrasyonu (tıklanma oranı için).
  //
  // 28 Eylül 2026 kök neden analizi: hosting'in WAF'ı büyük HTTP yanıtlarını
  // belirsiz bir noktada (gözlemlenen ~90-190KB aralığında) kesiyor ve bu
  // limit esnetilemiyor (Alastyr desteği doğruladı). ~2000 kartlık TEK bir
  // dev sayfa bu eşiği kolayca aşıyordu — Googlebot da dahil hiçbir istemci
  // sayfanın tamamını göremiyordu. Çözüm: sayfayı, her biri eşiğin ÇOK
  // altında kalacak küçük parçalara (karsilastirmalar.html, -2, -3, ...) bölmek.
  {
    const catOrder = Object.keys(byCategory).sort((a,b) => (byCategory[b].length - byCategory[a].length));
    const totalCount = Object.values(byCategory).reduce((s, l) => s + l.length, 0);

    const renderCard = (c) => {
      const searchKey = `${c.a.name} ${c.b.name}`.toLowerCase();
      return `        <a class="kars-card" href="${c.url}" data-search="${esc(searchKey)}">
          <img src="${c.a.img}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
          <span class="kars-vs">vs</span>
          <img src="${c.b.img}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
          <span class="kars-title">${esc(c.a.name)} <em>vs</em> ${esc(c.b.name)}</span>
        </a>`;
    };

    // Kategoriye göre gruplu, düz (sıralı) kart listesi — sayfalara bölerken
    // aynı kategori mümkün olduğunca ardışık kalsın diye.
    const flatItems = [];
    catOrder.forEach(cat => {
      const list = [...byCategory[cat]].sort((a,b) => a.title.localeCompare(b.title, 'tr'));
      list.forEach(item => flatItems.push({ cat, item }));
    });

    const PAGE_SIZE = 100; // sayfa başına kart sayısı — WAF eşiğinin güvenle altında kalacak şekilde seçildi
    const totalPages = Math.max(1, Math.ceil(flatItems.length / PAGE_SIZE));
    const pageFileName = (n) => n === 1 ? 'karsilastirmalar.html' : `karsilastirmalar-${n}.html`;

    const buildSectionsHTMLForPage = (pageFlat) => {
      const sections = [];
      pageFlat.forEach(({ cat, item }) => {
        let last = sections[sections.length - 1];
        if(!last || last.cat !== cat){
          last = { cat, items: [] };
          sections.push(last);
        }
        last.items.push(item);
      });
      return sections.map(sec => {
        const catSlug = SLUG_MAP[sec.cat] || slugify(sec.cat);
        const totalInCat = byCategory[sec.cat].length;
        const items = sec.items.map(renderCard).join('\n');
        return `    <section class="kars-section" style="margin-bottom:28px;">
      <h2 style="font-size:16px;margin:0 0 10px;"><a href="${catSlug}.html" style="color:inherit;">${esc(sec.cat)}</a> <span style="color:var(--ink-soft);font-weight:400;font-size:13px;">(${totalInCat} karşılaştırma)</span></h2>
      <div class="kars-grid">
${items}
      </div>
    </section>`;
      }).join('\n');
    };

    const buildPaginationHTML = (pageNum) => {
      if(totalPages <= 1) return '';
      const parts = [];
      if(pageNum > 1) parts.push(`<a href="${pageFileName(pageNum - 1)}" rel="prev">← Önceki</a>`);
      parts.push(`<span class="kars-page-cur">Sayfa ${pageNum} / ${totalPages}</span>`);
      if(pageNum < totalPages) parts.push(`<a href="${pageFileName(pageNum + 1)}" rel="next">Sonraki →</a>`);
      return `<nav class="kars-pagination" aria-label="Sayfalar" style="display:flex;gap:14px;align-items:center;justify-content:center;margin:24px 0;font-size:14px;">${parts.join('\n      ')}</nav>`;
    };

    // Hızlı karşılaştırma aracı: dropdown'lar için TÜM katalog (kategoriye göre gruplu),
    // ve mevcut çiftlerin URL indeksini (JS'e gömülü) ikisini eşleştirmek için kullanır.
    const compareIndex = [];
    Object.values(byCategory).forEach(list => {
      list.forEach(c => compareIndex.push({ a: c.a.id, b: c.b.id, u: c.url }));
    });
    const catalogByCat = {};
    catalog.forEach(p => { (catalogByCat[p.cat] = catalogByCat[p.cat] || []).push(p); });
    const productOptionsHTML = Object.keys(catalogByCat).sort().map(cat => {
      const opts = [...catalogByCat[cat]].sort((a,b) => a.name.localeCompare(b.name,'tr'))
        .map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
      return `<optgroup label="${esc(cat)}">${opts}</optgroup>`;
    }).join('');

    const buildListHtml = (pageNum, sectionsHTML) => {
    const fileName = pageFileName(pageNum);
    const titlePageSuffix = pageNum > 1 ? ` — Sayfa ${pageNum}` : '';
    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tüm Ürün Karşılaştırmaları${titlePageSuffix} — Hangisini Almalısın? | TeknoVersus</title>
<meta name="description" content="Telefon, dizüstü, kulaklık ve daha fazlasında ${totalCount}+ yan yana ürün karşılaştırması. Fiyat/performans skoruna göre hangisini almalısın, tek bakışta gör." />
<link rel="canonical" href="https://teknoversus.com.tr/${fileName}" />
${pageNum > 1 ? `<link rel="prev" href="https://teknoversus.com.tr/${pageFileName(pageNum - 1)}" />\n` : ''}${pageNum < totalPages ? `<link rel="next" href="https://teknoversus.com.tr/${pageFileName(pageNum + 1)}" />\n` : ''}<link rel="stylesheet" href="styles.css" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2B6CB0" />
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3653440823878417" crossorigin="anonymous"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Q14VG0SB56"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "G-Q14VG0SB56");
</script>
<style>
  .kars-tools{background:var(--bg-soft,#F7F7F5);border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin-bottom:28px;}
  .kars-search{width:100%;box-sizing:border-box;border:1.5px solid var(--line-strong);border-radius:8px;padding:11px 14px;font-size:14.5px;font-family:inherit;margin-bottom:16px;}
  .kars-picker{display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
  .kars-picker select{flex:1;min-width:160px;border:1.5px solid var(--line-strong);border-radius:8px;padding:9px 10px;font-size:14px;font-family:inherit;background:#fff;}
  .kars-picker .kars-x{color:var(--ink-soft);font-size:13px;font-weight:600;}
  .kars-picker button{border:none;border-radius:8px;padding:10px 18px;background:var(--ink,#181818);color:#fff;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;}
  .kars-picker button:hover{opacity:0.9;}
  #karsPickerMsg{margin-top:10px;font-size:13px;color:var(--ink-soft);}
  #karsPickerMsg a{color:var(--c1);font-weight:600;}
  .kars-grid{display:flex;flex-wrap:wrap;gap:10px;}
  .kars-card{display:flex;align-items:center;gap:6px;text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:10px;padding:6px 12px 6px 6px;background:#fff;transition:border-color .15s,transform .15s;}
  .kars-card:hover{border-color:var(--c1);transform:translateY(-1px);}
  .kars-card img{width:28px;height:28px;object-fit:contain;border-radius:6px;background:var(--bg-soft,#F7F7F5);flex-shrink:0;}
  .kars-card .kars-vs{font-size:10px;color:var(--ink-soft);font-weight:700;flex-shrink:0;}
  .kars-card .kars-title{font-size:13px;margin-left:4px;}
  .kars-card .kars-title em{font-style:normal;color:var(--ink-soft);}
  .kars-section[hidden]{display:none;}
  .kars-pagination a{color:var(--c1);font-weight:600;text-decoration:none;}
  .kars-pagination a:hover{text-decoration:underline;}
  .kars-page-cur{color:var(--ink-soft);}
</style>
</head>
<body>

<header class="site">
  <div class="wrap nav">
    <div class="brand"><a href="index.html"><picture><source srcset="assets/logo-header.webp" type="image/webp"/><img src="assets/logo-header.png" class="brand-logo" alt="TeknoVersus logo" width="144" height="60" decoding="async"/></picture><span class="brand-text"><span class="tekno">TEKNO</span><span class="versus">VERSUS</span></span></a></div>
    <nav class="nav-links" id="navLinks">
      <a href="index.html">Anasayfa</a>
      <a href="haberler.html">Haberler</a>
      <a href="yakinda-cikacak.html">Yakında Çıkacak</a>
      <a href="karsilastirmalar.html">Karşılaştırmalar</a>
      <a href="index.html#katalog">Katalog</a>
    </nav>
    <button class="burger" id="burgerBtn">☰</button>
  </div>
</header>

<main class="wrap" style="padding-top:32px;padding-bottom:48px;">
  <h1 class="product-page-h1">Tüm Ürün Karşılaştırmaları${titlePageSuffix}</h1>
  <p style="color:var(--ink-soft);font-size:14px;max-width:640px;margin-bottom:20px;">
    Toplam ${totalCount} karşılaştırma, kategoriye göre gruplandı. Her eşleşme fiyat/performans
    skoruna göre birbirine en yakın ürünler arasından seçildi.${totalPages > 1 ? ` Bu sayfada ${pageNum}/${totalPages}. bölüm gösteriliyor.` : ''}
  </p>
  ${buildPaginationHTML(pageNum)}

  <div class="kars-tools">
    <input type="text" class="kars-search" id="karsSearch" aria-label="Karşılaştırmalarda ara" placeholder="Ürün ara… (örn. iPhone, Galaxy S26, MacBook)" oninput="karsFilter(this.value)" />
    <div class="kars-picker">
      <select id="karsA" aria-label="Birinci ürünü seç"><option value="">Birinci ürünü seç…</option>${productOptionsHTML}</select>
      <span class="kars-x">×</span>
      <select id="karsB" aria-label="İkinci ürünü seç"><option value="">İkinci ürünü seç…</option>${productOptionsHTML}</select>
      <button onclick="karsCompare()">Karşılaştır →</button>
    </div>
    <div id="karsPickerMsg"></div>
  </div>

  <div id="karsResults">
${sectionsHTML}
  </div>
  <p id="karsNoResult" style="display:none;color:var(--ink-soft);font-size:14px;">Aramanla eşleşen bir karşılaştırma bulunamadı.</p>
  ${buildPaginationHTML(pageNum)}
</main>

<!-- Canlı karşılaştırma modalı (statik sayfa olmasa bile herhangi iki ürünü anında kıyaslar) -->
<div class="modal-overlay" id="cmpOverlay">
  <div class="modal" style="max-width:820px;">
    <div class="modal-head">
      <h3>Karşılaştırma</h3>
      <button class="modal-close" onclick="closeCompare()">×</button>
    </div>
    <div class="cmp-winner" id="cmpWinner"></div>
    <div class="cmp-legend" id="cmpLegend"></div>
    <div id="cmpBody"></div>
  </div>
</div>

<footer>
  <div class="wrap" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:16px;">
    <a class="chip-filter" href="telefon.html">Telefon</a>
    <a class="chip-filter" href="dizustu.html">Dizüstü</a>
    <a class="chip-filter" href="kulaklik.html">Kulaklık</a>
    <a class="chip-filter" href="kamera.html">Kamera</a>
    <a class="chip-filter" href="akilli-saat.html">Akıllı Saat</a>
    <a class="chip-filter" href="tablet.html">Tablet</a>
    <a class="chip-filter" href="televizyon.html">Televizyon</a>
  </div>
  <div class="wrap" style="text-align:center;margin-bottom:10px;font-size:12.5px;">
    <a href="hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a>
  </div>
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>

<script src="shared.js"></script>
<script>
document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));

// Arama kutusu: kart isimlerinde canlı filtre
function karsFilter(qRaw){
  const q = qRaw.trim().toLowerCase();
  const cards = document.querySelectorAll('.kars-card');
  let anyVisible = false;
  cards.forEach(c => {
    const match = !q || c.dataset.search.includes(q);
    c.style.display = match ? '' : 'none';
    if(match) anyVisible = true;
  });
  document.querySelectorAll('.kars-section').forEach(sec => {
    const hasVisible = [...sec.querySelectorAll('.kars-card')].some(c => c.style.display !== 'none');
    sec.hidden = q && !hasVisible;
  });
  document.getElementById('karsNoResult').style.display = (q && !anyVisible) ? '' : 'none';
}

// Hızlı karşılaştırma aracı: statik sayfa var mı diye bakmak yerine, anasayfadaki
// gibi seçilen iki ürünü CANLI olarak (yeni sayfa üretmeden) modal içinde kıyaslar.
let karsProducts = null;
let karsScores = null;

async function karsEnsureProductsLoaded(){
  if(karsProducts) return karsProducts;
  const msg = document.getElementById('karsPickerMsg');
  msg.textContent = 'Ürünler yükleniyor…';
  karsProducts = await loadSharedProducts();
  karsScores = computeScores(karsProducts);
  msg.textContent = '';
  return karsProducts;
}
// Sayfa açılır açılmaz arka planda yükle (buton tıklanınca beklemesin)
karsEnsureProductsLoaded();

function karsCompare(){
  const aId = document.getElementById('karsA').value;
  const bId = document.getElementById('karsB').value;
  const msg = document.getElementById('karsPickerMsg');
  if(!aId || !bId){ msg.textContent = 'Lütfen iki ürün de seç.'; return; }
  if(aId === bId){ msg.textContent = 'Aynı ürünü iki kere seçemezsin.'; return; }

  karsEnsureProductsLoaded().then(products => {
    const a = products.find(p => p.id === aId);
    const b = products.find(p => p.id === bId);
    if(!a || !b){ msg.textContent = 'Ürünler yüklenemedi, sayfayı yenileyip tekrar dene.'; return; }
    if(a.cat !== b.cat){
      msg.textContent = 'Farklı kategorideki ürünler karşılaştırılamaz (örn. telefon ile televizyon kıyaslanamaz).';
      return;
    }
    msg.textContent = '';
    karsOpenCompare(a, b, karsScores);
  });
}

// index.html'deki openCompare() ile aynı render mantığı — burada sabit 2 ürün için.
function karsOpenCompare(pA, pB, scores){
  const list = [pA, pB];
  const palette = getPalette();
  const colorMap = { [pA.id]: palette[0], [pB.id]: palette[1 % palette.length] };

  document.getElementById('cmpLegend').innerHTML = list.map(p =>
    \`<span><span class="dot" style="background:\${colorMap[p.id]}"></span>\${p.name}</span>\`
  ).join('');

  const winnerBox = document.getElementById('cmpWinner');
  const scored = list.filter(p => scores[p.id] != null);
  if(scored.length >= 2){
    const winner = scored.reduce((best,p) => (scores[p.id] > scores[best.id] ? p : best), scored[0]);
    const wColor = colorMap[winner.id];
    const sameScore = scored.filter(p => scores[p.id] === scores[winner.id]).length > 1;
    winnerBox.style.background = wColor + '14';
    winnerBox.style.border = \`1px solid \${wColor}40\`;
    winnerBox.innerHTML = sameScore
      ? \`<span class="trophy">🏆</span><div class="txt">Bu karşılaştırmada <b>birden fazla ürün</b> aynı skora sahip — aşağıdaki tabloya göz at.<span class="note">Fiyat/performans skoruna göre</span></div>\`
      : \`<span class="trophy">🏆</span><div class="txt">Bu karşılaştırmada en iyisi: <b>\${winner.name}</b> (Skor: \${scores[winner.id]})<span class="note">Fiyat/performans skoruna göre — kategori içi göreli hesaplamadır, mutlak bir "en iyi ürün" garantisi değildir.</span></div>\`;
    winnerBox.style.display = '';
  } else {
    winnerBox.style.display = 'none';
  }

  const allKeys = [...new Set(list.flatMap(p => Object.keys(p.specs||{})))];
  document.getElementById('cmpBody').innerHTML = allKeys.map(key => {
    const nums = list.map(p => ({id:p.id, v:parseFloat((p.specs[key]||'').toString().replace(',','.'))})).filter(x => !isNaN(x.v));
    const lowerBetter = /fiyat|ağırlık/i.test(key);
    let min=0, max=0;
    if(nums.length){ min = Math.min(...nums.map(n=>n.v)); max = Math.max(...nums.map(n=>n.v)); }
    const segs = list.map(p => {
      const raw = p.specs[key];
      const n = nums.find(x => x.id === p.id);
      let pct = 8;
      if(n){ pct = max===min ? 100 : ((n.v-min)/(max-min))*100; if(lowerBetter) pct = 100-pct; pct = Math.max(pct,6); }
      return \`<div class="cmp-seg" style="flex:\${pct};background:\${colorMap[p.id]};opacity:\${raw?0.35+0.65*pct/100:0.15}"></div>\`;
    }).join('');
    const vals = list.map(p => \`<span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--ink-soft);margin-right:14px;">\${p.specs[key]||'—'}</span>\`).join('');
    return \`<div class="cmp-row"><strong style="font-size:13.5px;">\${key}</strong><div style="margin:4px 0;">\${vals}</div><div class="cmp-track">\${segs}</div></div>\`;
  }).join('');

  document.getElementById('cmpOverlay').classList.add('show');
}
function closeCompare(){ document.getElementById('cmpOverlay').classList.remove('show'); }
</script>
</body>
</html>
`;
    };

    // Önceki çalıştırmadan kalan fazla sayfa dosyalarını temizle — idempotent
    // (toplam karşılaştırma sayısı azalırsa eski fazla "-N" dosyaları öksüz kalmasın).
    fs.readdirSync(rootDir)
      .filter(f => /^karsilastirmalar-\d+\.html$/.test(f))
      .forEach(f => { try{ fs.unlinkSync(path.join(rootDir, f)); }catch(e){} });

    const pageFiles = [];
    for(let pageNum = 1; pageNum <= totalPages; pageNum++){
      const startIdx = (pageNum - 1) * PAGE_SIZE;
      const pageFlat = flatItems.slice(startIdx, startIdx + PAGE_SIZE);
      const sectionsHTML = buildSectionsHTMLForPage(pageFlat);
      const pageHtml = buildListHtml(pageNum, sectionsHTML);
      const fileName = pageFileName(pageNum);
      fs.writeFileSync(path.join(rootDir, fileName), pageHtml);
      pageFiles.push(fileName);
    }
    console.log(`karsilastirmalar.html ${totalPages} sayfaya bölünerek oluşturuldu (sayfa başına en fazla ${PAGE_SIZE} kart — hosting WAF'ının büyük yanıtları kesmesini önlemek için). Toplam ${totalCount} karşılaştırma, ${catOrder.length} kategori, arama + hızlı karşılaştırma aracı her sayfada dahil.`);

    // --- Sayfalama URL'lerini de sitemap.xml'e ekle (karsilastirmalar.html zaten
    // generate-site.js'in statik listesinde var, burada sadece -2, -3, ... eklenir) ---
    if(totalPages > 1){
      const sitemapPathForPagination = path.join(rootDir, 'sitemap.xml');
      if(fs.existsSync(sitemapPathForPagination)){
        let xmlP = fs.readFileSync(sitemapPathForPagination, 'utf8');
        xmlP = xmlP.replace(/\s*<url>\s*<loc>[^<]*\/karsilastirmalar-\d+\.html<\/loc>[\s\S]*?<\/url>/g, '');
        const todayP = new Date().toISOString().slice(0,10);
        const pageEntries = pageFiles.filter(f => f !== 'karsilastirmalar.html').map(f => `  <url>
    <loc>https://teknoversus.com.tr/${f}</loc>
    <lastmod>${todayP}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n');
        xmlP = xmlP.replace('</urlset>', `${pageEntries}\n</urlset>`);
        fs.writeFileSync(sitemapPathForPagination, xmlP);
        console.log(`sitemap.xml güncellendi, +${pageFiles.length - 1} karsilastirmalar sayfası eklendi.`);
      }
    }
  }

  return comparisonUrls;
}

module.exports = { generateComparisons };
