// ============================================================
// TeknoVersus — "Türkiye'de En Çok Aranan Ürünler" sayfası (27 Kasım 2026).
//
// Veri: lib/turkiye-populer.json. Kaynak, Türkiye'deki fiyat karşılaştırma
// sitesi Akakçe'nin kategori sayfalarındaki varsayılan ürün sıralamasıdır;
// "en çok aranan" olarak değil "fiyat karşılaştırma sitelerinde en çok ilgi
// gören" olarak sunulur. Liste aylık elle güncellenir.
//
// Her kategoride: (1) sıralı ürün listesi (katalogdaki sayfaya bağlanır),
// (2) rakip çiftleri (karşılaştırma sayfası üretilmişse bağlanır).
// Katalogda bulunamayan ürün/çift sessizce atlanır.
// ============================================================
const fs = require('fs');
const path = require('path');
const { comparisonFileName } = require('./generate-comparisons');

const esc = s => (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fiyat = p => parseFloat(String((p.specs||{})['Fiyat (₺)']||0).replace(/[^\d.]/g,'')) || 0;
const tl = n => Math.round(n).toLocaleString('tr-TR');
const CAT_SLUG = { 'Telefon':'telefon','Dizüstü':'dizustu','Tablet':'tablet','Kulaklık':'kulaklik','Akıllı Saat':'akilli-saat','Televizyon':'televizyon','Kamera':'kamera' };

function readList(){
  try{ return JSON.parse(fs.readFileSync(path.join(__dirname, 'turkiye-populer.json'), 'utf8')); }
  catch(e){ console.warn('UYARI: turkiye-populer.json okunamadı:', e.message); return null; }
}

// Anasayfa kartı için: sıralı, karşılaştırma sayfası olan, verisi tam çiftler (kategori başına liste).
function turkiyePopulerCiftler({ products, rootDir }){
  const tp = readList();
  if(!tp) return [];
  const byName = {}; products.forEach(p => { byName[p.name] = p; });
  const out = [];
  (tp.kategoriler || []).forEach(k => {
    (k.ciftler || []).forEach(([n1, n2]) => {
      const a = byName[n1], b = byName[n2];
      if(!a || !b || a.upcoming || b.upcoming) return;
      const url = `karsilastir/${comparisonFileName(a, b)}`;
      if(!fs.existsSync(path.join(rootDir, url))) return;
      out.push({ cat: k.cat, a, b, url });
    });
  });
  return out;
}

function generateTurkiyePopuler({ products, computeScores, productSlug, rootDir, productPhotoFor }){
  const tp = readList();
  if(!tp || !(tp.kategoriler || []).length) return;
  const catalog = products.filter(p => !p.upcoming);
  const scores = computeScores(catalog);
  const byName = {}; catalog.forEach(p => { byName[p.name] = p; });
  const rozet = s => s >= 70 ? 'var(--good)' : s >= 40 ? 'var(--mid)' : 'var(--bad)';

  const foto = (p, h) => {
    const ph = productPhotoFor ? productPhotoFor(p) : null;
    if(!ph) return '';
    return `<div style="height:${h}px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:10px;padding:4px;"><img src="${ph.thumb}" alt="${esc(p.name)}" width="${ph.tw||600}" height="${ph.th||600}" loading="lazy" decoding="async" style="max-height:100%;max-width:100%;width:auto;height:auto;object-fit:contain;" /></div>`;
  };

  const urunKarti = (p, i) => `
      <a href="urun/${productSlug(p)}.html" style="display:flex;gap:12px;align-items:center;text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--bg-soft,#F7F7F5);">
        <span style="flex:0 0 26px;font-weight:800;font-size:16px;color:var(--ink-soft);text-align:center;">${i+1}</span>
        <span style="flex:0 0 64px;">${foto(p, 56)}</span>
        <span style="flex:1;min-width:0;">
          <span style="display:block;font-weight:600;font-size:14px;line-height:1.3;">${esc(p.name)}</span>
          <span style="display:block;font-size:12.5px;color:var(--ink-soft);margin-top:3px;">${fiyat(p) ? tl(fiyat(p)) + ' ₺' : 'Fiyat yok'}${scores[p.id] != null ? ` · Skor <strong style="color:${rozet(scores[p.id])}">${scores[p.id]}</strong>` : ''}</span>
        </span>
      </a>`;

  const ciftKarti = (c) => {
    const yan = p => `<div style="flex:1;min-width:110px;text-align:center;">
        ${foto(p, 90)}
        <div style="font-weight:600;font-size:13px;margin:6px 0 4px;">${esc(p.name)}</div>
        <div style="font-size:12px;color:var(--ink-soft);">${fiyat(p) ? tl(fiyat(p)) + ' ₺' : ''}${scores[p.id] != null ? ` · ${scores[p.id]}/100` : ''}</div>
      </div>`;
    return `<a href="${c.url}" onclick="if(window.gtag) gtag('event','tr_populer_click',{event_category:'engagement',event_label:'${esc(c.a.name)}_vs_${esc(c.b.name)}'});"
       style="display:block;text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:14px;padding:14px 16px;background:var(--bg-soft,#F7F7F5);">
      <div style="display:flex;align-items:center;gap:8px;">${yan(c.a)}<div style="font-size:12px;font-weight:700;color:var(--ink-soft);">VS</div>${yan(c.b)}</div>
      <div style="text-align:center;margin-top:10px;font-size:13px;font-weight:600;color:var(--c1);">Detaylı Karşılaştır →</div>
    </a>`;
  };

  const sections = [];
  const itemList = [];
  let toplamUrun = 0, toplamCift = 0;
  tp.kategoriler.forEach(k => {
    const urunler = (k.urunler || []).map(n => byName[n]).filter(Boolean);
    const ciftler = (k.ciftler || []).map(([n1, n2]) => {
      const a = byName[n1], b = byName[n2];
      if(!a || !b) return null;
      const url = `karsilastir/${comparisonFileName(a, b)}`;
      return fs.existsSync(path.join(rootDir, url)) ? { a, b, url } : null;
    }).filter(Boolean);
    if(!urunler.length) return;
    toplamUrun += urunler.length; toplamCift += ciftler.length;
    urunler.forEach(p => itemList.push(`https://teknoversus.com.tr/urun/${productSlug(p)}.html`));
    const slug = CAT_SLUG[k.cat];
    sections.push(`
  <section id="${slug || ''}" style="margin-top:30px;">
    <h2 style="font-size:19px;margin:0 0 6px;">${esc(k.cat)}: Türkiye'de ilgi gören modeller</h2>
    <p style="font-size:13px;color:var(--ink-soft);margin:0 0 12px;">Sıralama, ${esc(k.cat.toLowerCase())} kategorisinde fiyat karşılaştırma sitelerindeki ilgiye göredir. Üst sıradaki ${esc(urunler[0].name)}${urunler[1] ? ' ve ' + esc(urunler[1].name) : ''} listenin başında yer alıyor.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">${urunler.map(urunKarti).join('')}
    </div>${ciftler.length ? `
    <h3 style="font-size:15px;margin:20px 0 10px;">${esc(k.cat)}: en çok merak edilen karşılaştırmalar</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
      ${ciftler.map(ciftKarti).join('\n      ')}
    </div>` : ''}
  </section>`);
  });
  if(!sections.length) return;

  const faq = {
    "@context":"https://schema.org","@type":"FAQPage",
    "mainEntity":[
      { "@type":"Question","name":"Bu liste nasıl hazırlanıyor?",
        "acceptedAnswer":{ "@type":"Answer","text":"Liste, Türkiye'nin fiyat karşılaştırma sitelerinden Akakçe'nin kategori sayfalarındaki ürün sıralamasından alınır; renk ve hafıza varyantları tek modele indirilir. Resmi bir arama hacmi verisi değildir, ilgi gören modellerin bir göstergesidir. Liste ayda bir güncellenir ("+tp.tarih+" itibarıyla)." } },
      { "@type":"Question","name":"Listedeki ürünlerin fiyatları güncel mi?",
        "acceptedAnswer":{ "@type":"Answer","text":"Fiyatlar kataloğumuzdaki son doğrulanmış fiyatlardır ve kampanya dönemlerinde değişebilir. Satın almadan önce mağazadaki güncel fiyatı kontrol edin." } }
    ]
  };
  const itemListSchema = {
    "@context":"https://schema.org","@type":"ItemList",
    "name":"Türkiye'de En Çok İlgi Gören Teknoloji Ürünleri",
    "numberOfItems": itemList.length,
    "itemListElement": itemList.map((u, i) => ({ "@type":"ListItem","position":i+1,"url":u }))
  };

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Türkiye'de En Çok Aranan Ürünler ve Karşılaştırmalar | TeknoVersus</title>
<meta name="description" content="Türkiye'de en çok ilgi gören telefon, televizyon, akıllı saat, kulaklık, tablet ve dizüstü modelleri; en çok merak edilen rakip karşılaştırmalarıyla birlikte. ${esc(tp.tarih)} itibarıyla." />
<link rel="canonical" href="https://teknoversus.com.tr/turkiye-populer.html" />
<link rel="stylesheet" href="styles.css" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2B6CB0" />
<script type="application/ld+json">
${JSON.stringify(faq, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(itemListSchema, null, 2)}
</script>
<script src="/consent.js"></script>
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
    <div class="brand"><a href="index.html"><picture><source srcset="assets/logo-header.webp" type="image/webp"/><img src="assets/logo-header.png" class="brand-logo" alt="TeknoVersus logo" width="144" height="60" decoding="async"/></picture><span class="brand-text"><span class="tekno">TEKNO</span><span class="versus">VERSUS</span></span></a></div>
    <nav class="nav-links" id="navLinks">
      <a href="index.html">Anasayfa</a>
      <a href="haberler.html">Haberler</a>
      <a href="yakinda-cikacak.html">Yakında Çıkacak</a>
      <a href="karsilastirmalar.html">Tüm Karşılaştırmalar</a>
      <a href="index.html#kategoriler">Katalog</a>
    </nav>
    <button class="burger" id="burgerBtn">☰</button>
  </div>
</header>

<main class="detail-wrap" style="max-width:900px;">
  <div class="breadcrumb"><a href="index.html">Anasayfa</a> / Türkiye'de En Çok Aranan Ürünler</div>
  <h1 class="product-page-h1" style="margin:12px 0 8px;">Türkiye'de En Çok Aranan Ürünler ve Karşılaştırmalar</h1>
  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin-bottom:8px;">
    <strong>Kısa cevap:</strong> ${sections.length} kategoride ${toplamUrun} model ve ${toplamCift} karşılaştırma. Liste,
    Türkiye'deki fiyat karşılaştırma sitelerinde en çok ilgi gören modellere dayanır (${esc(tp.tarih)} itibarıyla).
  </div>
  <p style="font-size:12.5px;color:var(--ink-soft);margin:0 0 6px;line-height:1.6;">
    Bu sayfa resmi bir arama hacmi raporu değildir; kaynak olarak Akakçe'nin kategori sayfalarındaki ürün sıralaması kullanılır,
    renk ve hafıza seçenekleri tek model olarak sayılır. Liste ayda bir elle güncellenir. Skorlar yalnızca teknik özelliklerin
    fiyata oranını gösterir; kamera, yazılım desteği ve ekosistem gibi konuları kapsamaz.
  </p>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 0;">
    ${tp.kategoriler.filter(k => CAT_SLUG[k.cat] && sections.some(s => s.includes(`id="${CAT_SLUG[k.cat]}"`))).map(k => `<a class="chip-filter" href="#${CAT_SLUG[k.cat]}">${esc(k.cat)}</a>`).join('\n    ')}
  </div>
${sections.join('\n')}

  <h2 style="font-size:15px;margin:32px 0 10px;">İlgili Bağlantılar</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <a class="chip-filter" href="populer-karsilastirmalar.html">Popüler Karşılaştırmalar</a>
    <a class="chip-filter" href="karsilastirmalar.html">Tüm Karşılaştırmalar</a>
    <a class="chip-filter" href="index.html#kategoriler">Katalog</a>
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
    <a href="hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="iletisim.html" style="color:inherit;">İletişim</a> · <a href="gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a> · <a href="cerez-politikasi.html" style="color:inherit;">Çerez Politikası</a>
  </div>
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;

  fs.writeFileSync(path.join(rootDir, 'turkiye-populer.html'), html);
  console.log(`Türkiye'de en çok aranan sayfası üretildi: ${toplamUrun} ürün, ${toplamCift} çift.`);

  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*turkiye-populer\.html<\/loc>[\s\S]*?<\/url>/g, '');
    const today = new Date().toISOString().slice(0,10);
    const entry = `  <url>
    <loc>https://teknoversus.com.tr/turkiye-populer.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    xml = xml.replace('</urlset>', `${entry}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
  }
}

module.exports = { generateTurkiyePopuler, turkiyePopulerCiftler };
