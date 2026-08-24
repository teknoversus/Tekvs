// ============================================================
// TeknoVersus — "Popüler Karşılaştırmalar" vitrin sayfası.
//
// Anasayfadaki hero'ya eklenen "Anlık Karşılaştırma" kartı ("iPhone vs
// Galaxy" tarzı) çok olumlu bulundu ama anasayfayı görsel olarak
// yoğunlaştırdığı için oradan kaldırıldı. Bunun yerine, AYNI kompakt
// kart tasarımıyla, HER KATEGORİDEKİ amiral gemisi çekişmelerini
// gösteren ayrı bir vitrin sayfası kuruldu.
//
// Mevcut karsilastirmalar.html'den FARKLI bir amaca hizmet ediyor:
// o sayfa TÜM karşılaştırmaları arayıp listeleyen bir araç, bu sayfa
// ise sadece EN ÇARPICI (marka rekabeti + amiral gemisi fiyat)
// çiftleri öne çıkaran görsel bir vitrin.
//
// Her build'de katalogdan YENİDEN hesaplanır — yeni ürün eklendiğinde
// (örn. yeni bir amiral gemisi çıkınca) elle güncelleme gerekmez.
// ============================================================
const fs = require('fs');
const path = require('path');

function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function slugify(name){
  const tr = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return name.split('').map(ch => tr[ch] !== undefined ? tr[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
// Alt marka adlarını (MacBook, iPhone, AirPods, iPad -> Apple) doğru
// gruplamak için — aksi halde "MacBook Pro" ve "Apple Watch" farklı
// "marka" sayılıp aynı üreticinin ürünleri birbiriyle "rakip" gibi
// eşleştirilebilirdi.
const ALT_MARKA = {
  'MacBook':'Apple', 'iPhone':'Apple', 'AirPods':'Apple', 'iPad':'Apple',
  'General':'General Mobile',
};
function markaOf(name){
  const ilk = name.split(' ')[0];
  return ALT_MARKA[ilk] || ilk;
}
// "Amiral gemisi çekişmesi" hissi vermesi için sadece geniş kitlece
// tanınan büyük markalar arasında eşleştirme yapılır. Nubia, General
// Mobile, Reeder gibi daha niş markalar teknik olarak doğru eşleşmeler
// üretse de (kategorisinde en pahalı model + gerçek karşılaştırma sayfası
// var) "amiral gemisi" beklentisini karşılamıyordu.
const BUYUK_MARKALAR = new Set([
  'Apple','Samsung','Xiaomi','Sony','Asus','HP','Lenovo','Dell','Huawei',
  'Google','LG','Microsoft','MSI','Acer','Bose','JBL','Garmin','GoPro',
  'Canon','Nikon','Fujifilm','Panasonic','OnePlus','Motorola','Oppo'
]);

const GA_BLOCK = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3653440823878417" crossorigin="anonymous"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Q14VG0SB56"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "G-Q14VG0SB56");
</script>`;

function fiyat(p){ return parseFloat(String(p.specs['Fiyat (₺)']||0).replace(/[^\d.]/g,'')) || 0; }

function vsCardHTML(cat, a, b, url, scores){
  const rozet = s => s>=70 ? 'var(--good)' : s>=40 ? 'var(--mid)' : 'var(--bad)';
  const yan = p => `
      <div style="flex:1;min-width:140px;text-align:center;">
        <div style="font-size:12px;color:var(--ink-soft);margin-bottom:4px;">${esc(p.name.split(' ')[0])}</div>
        <div style="font-weight:600;font-size:14px;margin-bottom:6px;">${esc(p.name)}</div>
        <span style="display:inline-block;font-size:12px;font-weight:700;padding:3px 10px;border-radius:12px;background:${rozet(scores[p.id])}22;color:${rozet(scores[p.id])};">Skor: ${scores[p.id]}</span>
        <div style="font-size:13px;color:var(--ink-soft);margin-top:6px;">${fiyat(p) ? fiyat(p).toLocaleString('tr-TR')+' ₺' : ''}</div>
      </div>`;
  return `<a href="${url}" onclick="if(window.gtag) gtag('event','populer_kars_click',{event_category:'engagement',event_label:'${esc(a.name)}_vs_${esc(b.name)}'});"
     style="display:block;text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:14px;padding:16px 18px;background:var(--bg-soft,#F7F7F5);">
    <div style="font-size:11.5px;font-weight:600;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.03em;margin-bottom:10px;">${esc(cat)}</div>
    <div style="display:flex;align-items:center;gap:10px;">${yan(a)}
      <div style="font-size:13px;font-weight:700;color:var(--ink-soft);">VS</div>${yan(b)}
    </div>
    <div style="text-align:center;margin-top:12px;font-size:13px;font-weight:600;color:var(--c1);">Detaylı Karşılaştır →</div>
  </a>`;
}

// Bir kategori için en fazla `limit` adet gerçek/var-olan amiral gemisi
// çifti bulur. En pahalı markalar öncelikli denenir; her markadan sadece
// bir kez kart üretilir (aynı marka birden fazla kartta tekrar etmesin).
function kategoriIcinCiftler(catalog, cat, karsDir, mainSlug, limit){
  const urunler = catalog.filter(p => p.cat === cat && BUYUK_MARKALAR.has(markaOf(p.name)));
  const markaEnPahali = {};
  urunler.forEach(p => {
    const m = markaOf(p.name);
    if(!markaEnPahali[m] || fiyat(p) > fiyat(markaEnPahali[m])) markaEnPahali[m] = p;
  });
  const markalar = Object.values(markaEnPahali).sort((a,b) => fiyat(b) - fiyat(a));

  const sonuc = [];
  const kullanildi = new Set();
  for(let i = 0; i < markalar.length && sonuc.length < limit; i++){
    if(kullanildi.has(markaOf(markalar[i].name))) continue;
    for(let j = i+1; j < markalar.length; j++){
      if(kullanildi.has(markaOf(markalar[j].name))) continue;
      const a = markalar[i], b = markalar[j];
      const [ilk, ikinci] = [a, b].sort((x,y) => x.name.localeCompare(y.name, 'tr'));
      const fileName = `${slugify(ilk.name)}-vs-${slugify(ikinci.name)}.html`;
      if(fs.existsSync(path.join(karsDir, fileName))){
        sonuc.push({ cat, a, b, url: `karsilastir/${fileName}` });
        kullanildi.add(markaOf(a.name)); kullanildi.add(markaOf(b.name));
        break;
      }
    }
  }
  return sonuc;
}

function generatePopulerKarsilastirmalar({ products, computeScores, rootDir }){
  const catalog = products.filter(p => !p.upcoming);
  const scores = computeScores(catalog);
  const karsDir = path.join(rootDir, 'karsilastir');

  const CAT_MAIN = {
    'Telefon':'telefon', 'Dizüstü':'dizustu', 'Tablet':'tablet',
    'Kulaklık':'kulaklik', 'Akıllı Saat':'akilli-saat',
    'Televizyon':'televizyon', 'Kamera':'kamera'
  };

  let tumCiftler = [];
  Object.keys(CAT_MAIN).forEach(cat => {
    tumCiftler = tumCiftler.concat(kategoriIcinCiftler(catalog, cat, karsDir, CAT_MAIN[cat], 3));
  });

  if(!tumCiftler.length){
    console.log('Popüler Karşılaştırmalar: hiç uygun çift bulunamadı, sayfa üretilmedi.');
    return;
  }

  const kartlar = tumCiftler.map(c => vsCardHTML(c.cat, c.a, c.b, c.url, scores)).join('\n    ');

  const faqSchema = {
    "@context":"https://schema.org", "@type":"FAQPage",
    "mainEntity": [
      { "@type":"Question", "name":"Bu liste nasıl seçiliyor?",
        "acceptedAnswer": { "@type":"Answer", "text":"Her kategoride farklı markaların en yüksek fiyatlı (amiral gemisi) modelleri otomatik olarak eşleştirilir. Liste her katalog güncellemesinde yeniden hesaplanır." } },
      { "@type":"Question", "name":"Skor ne anlama geliyor?",
        "acceptedAnswer": { "@type":"Answer", "text":"Fiyat/performans skoru, ürünün teknik özelliklerinin kategori içi normalizasyonu ve fiyatına oranlanmasıyla otomatik hesaplanır. Yöntem Hakkımızda sayfasında açıklanmıştır." } }
    ]
  };

  const itemListSchema = {
    "@context":"https://schema.org", "@type":"ItemList",
    "name":"Popüler Amiral Gemisi Karşılaştırmaları",
    "numberOfItems": tumCiftler.length,
    "itemListElement": tumCiftler.map((c,i) => ({
      "@type":"ListItem", "position": i+1,
      "url": `https://teknoversus.com.tr/${c.url}`
    }))
  };

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Popüler Karşılaştırmalar — Amiral Gemisi Modelleri | TeknoVersus</title>
<meta name="description" content="Telefon, dizüstü, tablet ve daha fazla kategoride en pahalı amiral gemisi modellerin fiyat/performans karşılaştırması." />
<link rel="canonical" href="https://teknoversus.com.tr/populer-karsilastirmalar.html" />
<link rel="stylesheet" href="styles.css" />
<link rel="icon" type="image/png" href="assets/logo.png" />
<script type="application/ld+json">
${JSON.stringify(faqSchema, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(itemListSchema, null, 2)}
</script>
${GA_BLOCK}
</head>
<body>

<header class="site">
  <div class="wrap nav">
    <div class="brand"><a href="index.html"><picture><source srcset="assets/logo-header.webp" type="image/webp"/><img src="assets/logo-header.png" class="brand-logo" alt="TeknoVersus logo" width="144" height="60" decoding="async"/></picture><span class="brand-text"><span class="tekno">TEKNO</span><span class="versus">VERSUS</span></span></a></div>
    <nav class="nav-links" id="navLinks">
      <a href="index.html">Anasayfa</a>
      <a href="haberler.html">Haberler</a>
      <a href="yakinda-cikacak.html">Yakında Çıkacak</a>
      <a href="karsilastirmalar.html">Tüm Karşılaştırmalar</a>
      <a href="index.html#katalog">Katalog</a>
    </nav>
    <button class="burger" id="burgerBtn">☰</button>
  </div>
</header>

<main class="detail-wrap" style="max-width:820px;">
  <div class="breadcrumb"><a href="index.html">Anasayfa</a> / Popüler Karşılaştırmalar</div>
  <h1 class="product-page-h1" style="margin:12px 0 8px;">Popüler Karşılaştırmalar</h1>
  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin-bottom:20px;">
    <strong>Kısa cevap:</strong> ${tumCiftler.length} kategori çekişmesi — her kategoride farklı markaların
    en pahalı (amiral gemisi) modelleri fiyat/performans skoruna göre karşılaştırılıyor. Liste her
    katalog güncellemesinde otomatik yenilenir.
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-bottom:24px;">
    ${kartlar}
  </div>

  <h2 style="font-size:15px;margin:24px 0 8px;">Bu Liste Nasıl Oluşuyor?</h2>
  <p style="font-size:13.5px;line-height:1.7;color:var(--ink-soft);">
    Her kategoride, farklı markaların en yüksek fiyatlı modelleri (amiral gemisi olarak kabul edilir)
    otomatik tespit edilip aralarında gerçek bir karşılaştırma sayfası olan çiftler burada listelenir.
    Yeni bir amiral gemisi model eklendiğinde ya da fiyatlar güncellendiğinde bu sayfa bir sonraki
    yayında otomatik yenilenir — elle bakım gerekmez.
  </p>

  <h2 style="font-size:15px;margin:24px 0 10px;">İlgili Bağlantılar</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <a class="chip-filter" href="karsilastirmalar.html">Tüm Karşılaştırmalar</a>
    <a class="chip-filter" href="index.html#katalog">Katalog</a>
  </div>
</main>

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
    <a href="hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="iletisim.html" style="color:inherit;">İletişim</a> · <a href="gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a>
  </div>
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;

  fs.writeFileSync(path.join(rootDir, 'populer-karsilastirmalar.html'), html);
  console.log(`Popüler Karşılaştırmalar sayfası üretildi: ${tumCiftler.length} çift.`);

  // Sitemap'e ekle
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*populer-karsilastirmalar\.html<\/loc>[\s\S]*?<\/url>/g, '');
    const today = new Date().toISOString().slice(0,10);
    const entry = `  <url>
    <loc>https://teknoversus.com.tr/populer-karsilastirmalar.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    xml = xml.replace('</urlset>', `${entry}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
  }
}

module.exports = { generatePopulerKarsilastirmalar };
