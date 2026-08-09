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

function generateComparisons({ products, colorFor, computeScores, categories, neighborCount = 2, rootDir }){
  const outDir = path.join(rootDir, 'karsilastir');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const scores = computeScores(products);
  const catalog = products.filter(p => !p.upcoming);

  // --- Akıllı çift üretimi: kategori içinde skora göre sırala, ---
  // --- her ürünü en yakın `neighborCount` komşusuyla eşleştir.  ---
  const pairs = [];
  const seen = new Set();

  categories.forEach(cat => {
    const list = catalog.filter(p => p.cat === cat && scores[p.id] != null)
      .sort((a,b) => (scores[a.id]||0) - (scores[b.id]||0));

    list.forEach((p, i) => {
      for(let d = 1; d <= neighborCount; d++){
        const j = i + d;
        if(j >= list.length) break;
        const a = p, b = list[j];
        const key = [a.id, b.id].sort().join('|');
        if(seen.has(key)) continue;
        seen.add(key);
        pairs.push([a, b]);
      }
    });
  });

  let count = 0;
  const comparisonUrls = [];
  const byCategory = {}; // cat -> [{url, title}]

  pairs.forEach(([p1, p2]) => {
    // Alfabetik sıraya göre sabit slug — P1-vs-P2 ve P2-vs-P1 için
    // iki ayrı sayfa üretip birbirini kopyalayan (duplicate content) bir
    // durum yaratmamak için tek yön seçilir.
    const [first, second] = [p1, p2].sort((a,b) => a.name.localeCompare(b.name, 'tr'));
    const slug1 = slugify(first.name), slug2 = slugify(second.name);
    const fileName = `${slug1}-vs-${slug2}.html`;
    const canonical = `https://teknoversus.com.tr/karsilastir/${fileName}`;
    const catSlug = SLUG_MAP[first.cat] || slugify(first.cat);
    const color = colorFor(first.cat);

    const s1 = scores[first.id], s2 = scores[second.id];
    const price1 = priceOf(first), price2 = priceOf(second);

    let verdict = 'İkisi de fiyat/performans açısından birbirine yakın konumda.';
    if(s1 != null && s2 != null && s1 !== s2){
      const winner = s1 > s2 ? first : second;
      const diff = Math.abs(s1 - s2);
      verdict = `Fiyat/performans skoruna göre <strong>${esc(winner.name)}</strong> bu ikilide ${diff} puan önde.`;
    }

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
<title>${esc(first.name)} vs ${esc(second.name)} Karşılaştırması — TeknoVersus</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
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
<link rel="icon" type="image/png" href="../assets/logo.png" />
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
  <p style="color:var(--ink-soft);font-size:14.5px;margin:0 0 16px;">${verdict}</p>

  <div class="proscons" style="grid-template-columns:1fr 1fr;">
    <div class="col">
      <h2 style="font-size:15px;margin:0 0 8px;">${esc(first.name)}</h2>
      ${price1 ? `<p style="font-size:14px;margin:0 0 6px;"><strong>${price1.toLocaleString('tr-TR')} ₺</strong></p>` : ''}
      <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 12px;">${esc(first.blurb||'')}</p>
      <a class="btn btn-dark btn-sm" style="display:inline-block;text-decoration:none;" href="${amazonHref(first)}" target="_blank" rel="noopener noreferrer sponsored">Amazon'da Satın Al →</a>
      <div style="margin-top:8px;"><a href="../urun/${slugify(first.name)}-${first.id}.html" style="font-size:12.5px;color:var(--c1);">Ürün detayına git →</a></div>
    </div>
    <div class="col">
      <h2 style="font-size:15px;margin:0 0 8px;">${esc(second.name)}</h2>
      ${price2 ? `<p style="font-size:14px;margin:0 0 6px;"><strong>${price2.toLocaleString('tr-TR')} ₺</strong></p>` : ''}
      <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 12px;">${esc(second.blurb||'')}</p>
      <a class="btn btn-dark btn-sm" style="display:inline-block;text-decoration:none;" href="${amazonHref(second)}" target="_blank" rel="noopener noreferrer sponsored">Amazon'da Satın Al →</a>
      <div style="margin-top:8px;"><a href="../urun/${slugify(second.name)}-${second.id}.html" style="font-size:12.5px;color:var(--c1);">Ürün detayına git →</a></div>
    </div>
  </div>

  <h2 style="font-size:15px;margin:20px 0 8px;">Teknik Özellik Karşılaştırması</h2>
  <table class="detail-specs-table">
    <thead><tr><td><strong>Özellik</strong></td><td><strong>${esc(first.name)}</strong></td><td><strong>${esc(second.name)}</strong></td></tr></thead>
    <tbody>${rows}</tbody>
  </table>

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
  <div style="margin-top:10px;"><a href="../gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a></div>
</footer>

<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;

    fs.writeFileSync(path.join(outDir, fileName), html);
    comparisonUrls.push(`karsilastir/${fileName}`);
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
      <h2 style="font-size:15px;margin:0 0 10px;">Popüler Karşılaştırmalar</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${linksHTML}
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
    }).filter(Boolean);

    const homeLinksHTML = homeTop.map(c =>
      `<a class="chip-filter" href="${c.url}">${esc(c.title)}</a>`
    ).join('\n      ');

    const homeBlock = `<!-- POPULER_KARSILASTIRMALAR_START -->
  <section class="section" id="karsilastirmalar">
    <div class="section-head">
      <div>
        <div class="section-label">Kafa Kafaya</div>
        <h2 class="section-title">Popüler Karşılaştırmalar</h2>
      </div>
    </div>
    <div class="wrap" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
      ${homeLinksHTML}
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
    <input type="text" class="kars-search" id="karsSearch" placeholder="Ürün ara… (örn. iPhone, Galaxy S26, MacBook)" oninput="karsFilter(this.value)" />
    <div class="kars-picker">
      <select id="karsA"><option value="">Birinci ürünü seç…</option>${productOptionsHTML}</select>
      <span class="kars-x">×</span>
      <select id="karsB"><option value="">İkinci ürünü seç…</option>${productOptionsHTML}</select>
      <button onclick="karsCompare()">Karşılaştır →</button>
    </div>
    <div id="karsPickerMsg"></div>
  </div>

  <div id="karsResults">
${sectionsHTML}
  </div>
  <p id="karsNoResult" style="display:none;color:var(--ink-soft);font-size:14px;">Aramanla eşleşen bir karşılaştırma bulunamadı.</p>
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
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>

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

// Hızlı karşılaştırma aracı: seçilen iki ürün için hazır sayfa varsa oraya git,
// yoksa ürün sayfalarına yönlendiren bir mesaj göster.
const KARS_INDEX = ${JSON.stringify(compareIndex)};
function karsCompare(){
  const a = document.getElementById('karsA').value;
  const b = document.getElementById('karsB').value;
  const msg = document.getElementById('karsPickerMsg');
  if(!a || !b){ msg.textContent = 'Lütfen iki ürün de seç.'; return; }
  if(a === b){ msg.textContent = 'Aynı ürünü iki kere seçemezsin.'; return; }
  const hit = KARS_INDEX.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  if(hit){ window.location.href = hit.u; return; }
  msg.innerHTML = 'Bu ikisi için hazır bir karşılaştırma sayfamız henüz yok. ' +
    'Ama her iki ürünün kendi sayfasına ayrı ayrı bakabilirsin — ' +
    'sol menüden veya arama kutusundan ürün adını yazarak bulabilirsin.';
}
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
