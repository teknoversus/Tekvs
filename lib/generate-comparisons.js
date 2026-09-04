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

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};

function esc(s){ return (s||'').toString().replace(/"/g,'&quot;'); }

function slugify(text){
  return text.toString().toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
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

function generateComparisons({ products, colorFor, computeScores, categories, neighborCount = 2, rootDir, illustrationFor, prosConsFor }){
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
    // Faz 8 DÜZELTMESİ: Dosya adına ürün ID'si eklendi (ürün sayfası
    // URL'leriyle aynı desen: {slug}-{id}). Önceki hâlde sadece isimden
    // türetilen slug kullanılıyordu; "Redmi Note 13 Pro" / "Redmi Note 13
    // Pro+" gibi "+" farkı olan isimler slugify sürecinde (a-z0-9 dışı
    // karakterler tireye çevrilip kırpıldığı için) AYNI slug'a düşüp
    // birbirinin dosyasını sessizce eziyordu (overwrite). ID eklenmesi bu
    // çakışmayı kategorik olarak imkânsız hale getirir — her ürünün ID'si
    // zaten benzersiz olduğu için, iki ürün ne kadar benzer isimli olursa
    // olsun artık asla aynı dosya adına düşemezler.
    const slug1 = `${slugify(first.name)}-${first.id}`, slug2 = `${slugify(second.name)}-${second.id}`;
    const fileName = `${slug1}-vs-${slug2}.html`;
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
    // deterministik 4 varyanttan biriyle kısa bir ek yorum ekleniyor.
    const cmpVariant = Math.abs((String(first.id)+String(second.id)).split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % 4;
    let editorialNote = '';
    if(winnerId){
      const winnerName = winnerId === first.id ? first.name : second.name;
      const loserName = winnerId === first.id ? second.name : first.name;
      if(cmpVariant === 0){
        editorialNote = `Bütçenizde ikisi de varsa, ${winnerName} genel olarak daha dengeli bir seçim; ${loserName} ise belirli bir özelliği önceliklendiren kullanıcılar için hâlâ değerlendirilebilir.`;
      } else if(cmpVariant === 1){
        editorialNote = `${winnerName} ile ${loserName} arasında kararsız kalanlar için özetle: fiyat/performans skoru ${winnerName} lehine, ama ihtiyacınıza göre ${loserName} da makul bir alternatif olabilir.`;
      } else if(cmpVariant === 2){
        editorialNote = `Bu ikiliyi karşılaştıranların çoğu için sonuç net: ${winnerName} öne çıkıyor. Yine de ${loserName}'i tercih etmeyi düşünüyorsanız, öncelik verdiğiniz özelliği tekrar gözden geçirmenizi öneririz.`;
      } else {
        editorialNote = `Kısacası, günlük kullanım için ${winnerName} daha avantajlı görünüyor; ${loserName} ise farklı bir kullanım senaryosuna daha uygun olabilir.`;
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
<link rel="icon" type="image/png" href="../assets/logo.png" />
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
      ${illustrationFor ? `<div class="cmp-visual" style="background:linear-gradient(160deg,${color}14,${color}05);">${illustrationFor(first.cat, color, ('a'+first.id).replace(/[^a-z0-9]/g,''))}</div>` : ''}
      <h2 style="font-size:15px;margin:0 0 8px;">${esc(first.name)}</h2>
      ${price1 ? `<p style="font-size:14px;margin:0 0 6px;"><strong>${price1.toLocaleString('tr-TR')} ₺</strong></p>` : ''}
      <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 12px;">${esc(first.blurb||'')}</p>
      <a class="btn btn-dark btn-sm" style="display:inline-block;text-decoration:none;" href="${amazonHref(first)}" target="_blank" rel="noopener noreferrer sponsored">Amazon'da Satın Al →</a>
      <div style="margin-top:8px;"><a href="../urun/${slugify(first.name)}-${first.id}.html" style="font-size:12.5px;color:var(--c1);">Ürün detayına git →</a></div>
      ${firstProsCons}
    </div>
    <div class="col">
      ${illustrationFor ? `<div class="cmp-visual" style="background:linear-gradient(160deg,${color}14,${color}05);">${illustrationFor(second.cat, color, ('b'+second.id).replace(/[^a-z0-9]/g,''))}</div>` : ''}
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

  // --- "Tüm Karşılaştırmalar" statik liste sayfası ----
  // Anasayfa/kategori sayfalarında sadece en "kafa kafaya" birkaç eşleşme
  // linkleniyor — geri kalan yüzlerce karşılaştırma sayfası sadece sitemap
  // üzerinden bulunabiliyordu. Bu sayfa hepsini kategoriye göre gruplayıp
  // tek bir yerden linkler; hem kullanıcı gezinmesi hem iç link akışı için.
  // Ayrıca: canlı arama kutusu + "iki ürün seç karşılaştır" aracı + her
  // satırda iki ürünün küçük illüstrasyonu (tıklanma oranı için).
  {
    const catOrder = Object.keys(byCategory).sort((a,b) => (byCategory[b].length - byCategory[a].length));
    const sectionsHTML = catOrder.map(cat => {
      const catSlug = SLUG_MAP[cat] || slugify(cat);
      const list = [...byCategory[cat]].sort((a,b) => a.title.localeCompare(b.title, 'tr'));
      const items = list.map(c => {
        const searchKey = `${c.a.name} ${c.b.name}`.toLowerCase();
        return `        <a class="kars-card" href="${c.url}" data-search="${esc(searchKey)}">
          <img src="${c.a.img}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
          <span class="kars-vs">vs</span>
          <img src="${c.b.img}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
          <span class="kars-title">${esc(c.a.name)} <em>vs</em> ${esc(c.b.name)}</span>
        </a>`;
      }).join('\n');
      return `    <section class="kars-section" style="margin-bottom:28px;">
      <h2 style="font-size:16px;margin:0 0 10px;"><a href="${catSlug}.html" style="color:inherit;">${esc(cat)}</a> <span style="color:var(--ink-soft);font-weight:400;font-size:13px;">(${list.length} karşılaştırma)</span></h2>
      <div class="kars-grid">
${items}
      </div>
    </section>`;
    }).join('\n');

    const totalCount = Object.values(byCategory).reduce((s, l) => s + l.length, 0);

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

    const listHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tüm Ürün Karşılaştırmaları — Hangisini Almalısın? | TeknoVersus</title>
<meta name="description" content="Telefon, dizüstü, kulaklık ve daha fazlasında ${totalCount}+ yan yana ürün karşılaştırması. Fiyat/performans skoruna göre hangisini almalısın, tek bakışta gör." />
<link rel="canonical" href="https://teknoversus.com.tr/karsilastirmalar.html" />
<link rel="stylesheet" href="styles.css" />
<link rel="icon" type="image/png" href="assets/logo.png" />
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
  <h1 class="product-page-h1">Tüm Ürün Karşılaştırmaları</h1>
  <p style="color:var(--ink-soft);font-size:14px;max-width:640px;margin-bottom:20px;">
    Toplam ${totalCount} karşılaştırma, kategoriye göre gruplandı. Her eşleşme fiyat/performans
    skoruna göre birbirine en yakın ürünler arasından seçildi.
  </p>

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
    fs.writeFileSync(path.join(rootDir, 'karsilastirmalar.html'), listHtml);
    console.log(`karsilastirmalar.html oluşturuldu (${totalCount} karşılaştırma, ${catOrder.length} kategori, arama + hızlı karşılaştırma aracı dahil).`);
  }

  return comparisonUrls;
}

module.exports = { generateComparisons };
