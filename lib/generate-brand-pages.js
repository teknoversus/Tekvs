// ============================================================
// TeknoVersus — "{Marka} {Kategori}ları" sayfaları
// (PROGRAMMATIC_SEO.md: "{marka} telefonları" şablonu — örn. "Samsung Telefonları")
// ============================================================
const fs = require('fs');
const path = require('path');
const RULES = require('./pseo-rules');
const { brandCanonicalizer } = require('./spec-utils');

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};
// Kategori adının çoğul/tam hali ("Samsung " + bu = "Samsung Telefonları")
const CAT_PLURAL = {
  'Telefon':'Telefonları', 'Dizüstü':'Dizüstü Bilgisayarları', 'Kulaklık':'Kulaklıkları',
  'Kamera':'Kameraları', 'Akıllı Saat':'Akıllı Saatleri', 'Tablet':'Tabletleri',
  'Televizyon':'Televizyonları'
};

// Ürün adının ilk kelimesi her zaman gerçek marka değil (MacBook/iPhone/AirPods
// aslında Apple'ın alt ürün hatları) — bu haritayla normalize ediyoruz.
const BRAND_FOLD = {
  'MacBook': 'Apple', 'iPhone': 'Apple', 'AirPods': 'Apple', 'iPad': 'Apple',
  'General': 'General Mobile',
};

function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function slugify(name){
  const trMap = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return name.split('').map(ch => trMap[ch] !== undefined ? trMap[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function productSlug(p){ return `${slugify(p.name)}-${p.id}`; }

function brandOf(p){
  const first = p.name.split(' ')[0];
  return BRAND_FOLD[first] || first;
}

const GA_BLOCK = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-Q14VG0SB56"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "G-Q14VG0SB56");
</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3653440823878417" crossorigin="anonymous"></script>`;

function navHTML(root){
  return `    <nav class="nav-links" id="navLinks">
      <a href="${root}index.html">Anasayfa</a>
      <a href="${root}haberler.html">Haberler</a>
      <a href="${root}yakinda-cikacak.html">Yakında Çıkacak</a>
      <a href="${root}karsilastirmalar.html">Karşılaştırmalar</a>
      <a href="${root}index.html#katalog">Katalog</a>
    </nav>`;
}
function footerHTML(root){
  return `<footer>
  <div class="wrap" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:16px;">
    <a class="chip-filter" href="${root}telefon.html">Telefon</a>
    <a class="chip-filter" href="${root}dizustu.html">Dizüstü</a>
    <a class="chip-filter" href="${root}kulaklik.html">Kulaklık</a>
    <a class="chip-filter" href="${root}kamera.html">Kamera</a>
    <a class="chip-filter" href="${root}akilli-saat.html">Akıllı Saat</a>
    <a class="chip-filter" href="${root}tablet.html">Tablet</a>
    <a class="chip-filter" href="${root}televizyon.html">Televizyon</a>
  </div>
  <div class="wrap" style="text-align:center;margin-bottom:10px;font-size:12.5px;">
    <a href="${root}hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="${root}iletisim.html" style="color:inherit;">İletişim</a> · <a href="${root}gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a> · <a href="${root}kullanim-kosullari.html" style="color:inherit;">Kullanım Koşulları</a> · <a href="${root}cerez-politikasi.html" style="color:inherit;">Çerez Politikası</a>
  </div>
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>`;
}

function generateBrandPages({ products, computeScores, rootDir }){
  const outDir = path.join(rootDir, 'marka');
  // Klasörü ÖNCE temizle — eski/geçersiz kombinasyonlardan kalan yetim
  // (orphan) dosyalar birikmesin (ürün verisi değiştikçe eski dosyalar
  // hiç silinmiyordu, bu da canlıda kullanılmayan sayfalara yol açıyordu).
  if(fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const catalog = products.filter(p => !p.upcoming);
  const scores = computeScores(catalog);

  // (kategori, marka) -> [ürünler]
  const groups = {};
  const canonBrand = brandCanonicalizer(catalog, brandOf); // "ASUS" / "Asus" tek marka
  catalog.forEach(p => {
    const brand = canonBrand(brandOf(p));
    const key = `${p.cat}|||${brand}`;
    (groups[key] = groups[key] || []).push(p);
  });

  const pages = [];
  Object.entries(groups).forEach(([key, items]) => {
    // Kademeli kural motoru (bkz. lib/pseo-rules.js):
    //   0 ürün -> üretme | 1 -> canonical ürüne | 2-3 -> noindex,follow
    //   4-7 -> index | 8+ -> yüksek öncelik
    if(!RULES.shouldGenerate(items.length)) return;
    const [cat, brand] = key.split('|||');
    const mainSlug = SLUG_MAP[cat];
    const plural = CAT_PLURAL[cat] || cat;
    const slug = `${slugify(brand)}-${mainSlug}`;
    const sorted = [...items].sort((a,b) => (scores[b.id]||0) - (scores[a.id]||0));
    const selfUrl = `https://teknoversus.com.tr/marka/${slug}.html`;
    // 1 ürünlük sayfada canonical ÜRÜNÜN KENDİ sayfasına gider — asıl içerik orada.
    const fallbackUrl = items.length === 1
      ? `https://teknoversus.com.tr/urun/${productSlug(sorted[0])}.html`
      : `https://teknoversus.com.tr/${mainSlug}.html`;
    const dir = RULES.headDirectives(items.length, selfUrl, fallbackUrl);
    const avgScore = Math.round(sorted.reduce((s,p)=>s+(scores[p.id]||0),0) / sorted.length);

    const priceKey = k => Object.keys(k.specs||{}).find(x => /fiyat/i.test(x));
    const cards = sorted.map(p => {
      const pk = priceKey(p);
      return `      <a class="card" href="../urun/${productSlug(p)}.html" style="text-decoration:none;color:inherit;">
        <div class="card-cat">${scores[p.id]!=null ? 'Skor: '+scores[p.id] : ''}</div>
        <div class="card-name">${esc(p.name)}</div>
        <div class="card-blurb">${pk ? esc(p.specs[pk])+' ₺' : esc(p.blurb||'')}</div>
      </a>`;
    }).join('\n');

    const priceKeyFn = k => Object.keys(k.specs||{}).find(x => /fiyat/i.test(x));
    const pricesNum = sorted.map(p => {
      const pk = priceKeyFn(p);
      return pk ? Number(p.specs[pk]) : null;
    }).filter(n => n != null && !isNaN(n));
    const minPrice = pricesNum.length ? Math.min(...pricesNum) : null;
    const maxPrice = pricesNum.length ? Math.max(...pricesNum) : null;
    const fmtPrice = n => Math.round(n).toLocaleString('tr-TR') + ' ₺';
    const cheapest = pricesNum.length
      ? sorted.reduce((min, p) => {
          const pk = priceKeyFn(p);
          const val = pk ? Number(p.specs[pk]) : null;
          if(val == null || isNaN(val)) return min;
          const minPk = min ? priceKeyFn(min) : null;
          const minVal = min && minPk ? Number(min.specs[minPk]) : Infinity;
          return val < minVal ? p : min;
        }, null)
      : null;

    const tldr = `${brand}, ${cat.toLowerCase()} kategorisinde kataloğumuzda ${items.length} modelle yer alıyor, ortalama fiyat/performans skoru ${avgScore}. En yüksek skorlu model ${sorted[0].name}${scores[sorted[0].id]!=null ? ` (${scores[sorted[0].id]} puan)` : ''}.${minPrice!=null && maxPrice!=null ? ` Fiyatlar ${fmtPrice(minPrice)} ile ${fmtPrice(maxPrice)} arasında değişiyor.` : ''}`;

    const faq = [
      { q: `${brand} kaç ${cat.toLowerCase()} modeli var?`, a: `Kataloğumuzda ${brand} markasına ait ${items.length} ${cat.toLowerCase()} modeli bulunuyor.` },
      { q: `En yüksek skorlu ${brand} ${cat.toLowerCase()} hangisi?`, a: `${sorted[0].name}, ${scores[sorted[0].id]!=null ? scores[sorted[0].id]+' skorla' : ''} bu markanın kataloğumuzdaki en yüksek fiyat/performans skoruna sahip modeli.` },
    ];
    if(cheapest){
      const pk = priceKeyFn(cheapest);
      faq.push({ q: `En uygun fiyatlı ${brand} ${cat.toLowerCase()} hangisi?`, a: `${cheapest.name}, ${fmtPrice(Number(cheapest.specs[pk]))} ile bu markanın kataloğumuzdaki en uygun fiyatlı modeli.` });
    }
    if(minPrice!=null && maxPrice!=null){
      faq.push({ q: `${brand} ${cat.toLowerCase()} fiyatları ne kadar?`, a: `${brand} ${cat.toLowerCase()} fiyatları kataloğumuzda ${fmtPrice(minPrice)} ile ${fmtPrice(maxPrice)} arasında değişiyor, model sayısı ve donanıma göre farklılık gösteriyor.` });
    }

    const faqSchema = { "@context":"https://schema.org", "@type":"FAQPage", "mainEntity": faq.map(f => ({ "@type":"Question", "name":f.q, "acceptedAnswer": { "@type":"Answer", "text":f.a } })) };

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(brand)} ${esc(plural)} — Fiyatları ve Karşılaştırması ${new Date().getFullYear()} | TeknoVersus</title>
<meta name="description" content="${esc(tldr)}" />
${dir.robots}\n${dir.canonical}
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
${JSON.stringify(faqSchema, null, 2)}
</script>
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2B6CB0" />
${GA_BLOCK}
</head>
<body>

<header class="site">
  <div class="wrap nav">
    <div class="brand"><a href="../index.html"><picture><source srcset="../assets/logo-header.webp" type="image/webp"/><img src="../assets/logo-header.png" class="brand-logo" alt="TeknoVersus logo" width="144" height="60" decoding="async"/></picture><span class="brand-text"><span class="tekno">TEKNO</span><span class="versus">VERSUS</span></span></a></div>
${navHTML('../')}
    <button class="burger" id="burgerBtn">☰</button>
  </div>
</header>

<main class="wrap" style="padding-top:32px;padding-bottom:48px;">
  <div class="breadcrumb">
    <a href="../index.html">Anasayfa</a> / <a href="../${mainSlug}.html">${esc(cat)}</a> / ${esc(brand)} ${esc(plural)}
  </div>
  <h1 class="product-page-h1" style="margin-top:12px;">${esc(brand)} ${esc(plural)}</h1>

  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin:16px 0 24px;">
    <strong>Kısa cevap:</strong> ${esc(tldr)}
  </div>

  <div class="grid">
${cards}
  </div>

  <h2 style="font-size:15px;margin:24px 0 10px;">Sıkça Sorulan Sorular</h2>
${faq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(f.a)}</div>
  </div>`).join('\n')}

  <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
    <a class="chip-filter" href="../${mainSlug}.html">Tüm ${esc(plural)}</a>
    <a class="chip-filter" href="../karsilastirmalar.html">Karşılaştırmalar</a>
  </div>
</main>

${footerHTML('../')}
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;
    fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
    if(RULES.shouldIndex(items.length)) pages.push({ url: `marka/${slug}.html`, priority: RULES.sitemapPriority(items.length) });
  });

  const uretilen = fs.readdirSync(outDir).filter(f => f.endsWith('.html')).length;
  console.log(`${uretilen} marka sayfası oluşturuldu (${pages.length} tanesi indekslenebilir) -> marka/`);

  // ---- Ana kategori sayfalarına "Markalar" bloğu ekle (idempotent) ----
  const MARK_START = '<!-- MARKALAR_START -->';
  const MARK_END = '<!-- MARKALAR_END -->';
  Object.keys(SLUG_MAP).forEach(cat => {
    const mainSlug = SLUG_MAP[cat];
    const pagePath = path.join(rootDir, `${mainSlug}.html`);
    if(!fs.existsSync(pagePath)) return;
    const catBrandEntries = Object.entries(groups)
      .filter(([key, items]) => key.startsWith(cat+'|||') && items.length >= 2)
      .map(([key]) => key.split('|||')[1])
      .sort((a,b) => a.localeCompare(b,'tr'));
    if(!catBrandEntries.length) return;

    let html = fs.readFileSync(pagePath, 'utf8');
    const chips = catBrandEntries.map(b => `<a class="chip-filter" href="marka/${slugify(b)}-${mainSlug}.html">${esc(b)}</a>`).join('\n      ');
    const block = `${MARK_START}
    <section style="margin:20px 0;">
      <h2 style="font-size:15px;margin:0 0 10px;">Markalar</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${chips}
      </div>
    </section>
    ${MARK_END}`;

    const regex = new RegExp(MARK_START + '[\\s\\S]*?' + MARK_END);
    if(regex.test(html)){
      html = html.replace(regex, block);
    } else {
      html = html.replace('</main>', `  ${block}\n</main>`);
    }
    fs.writeFileSync(pagePath, html);
  });
  console.log('Ana kategori sayfalarına "Markalar" bloğu eklendi.');

  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/marka\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
    const today = new Date().toISOString().slice(0,10);
    const entries = pages.map(p => `  <url>
    <loc>https://teknoversus.com.tr/${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');
    xml = xml.replace('</urlset>', `${entries}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
    console.log(`sitemap.xml güncellendi, +${pages.length} marka URL'si eklendi.`);
  }

  return pages;
}

module.exports = { generateBrandPages, brandOf };
