// ============================================================
// TeknoVersus — Haberler (haber/blog) sayfa üretimi.
// generate-site.js / generate-comparisons.js ile aynı tasarım dilini kullanır.
// Ürün sayfaları gibi bu da artık Supabase'deki 'news' tablosundan besleniyor
// (admin panelinden CRUD) — build.js her çalıştığında güncel haber listesiyle
// haberler/*.html + haberler.html'i yeniden üretir.
// ============================================================
const fs = require('fs');
const path = require('path');

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};

function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// WhatsApp / X / Facebook paylaşım linkleri — JS kütüphanesi gerektirmez.
function shareButtonsHTML(url, title){
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);
  return `<div style="display:flex;gap:8px;align-items:center;margin:16px 0;">
    <span style="font-size:12.5px;color:var(--ink-soft);font-weight:600;">Paylaş:</span>
    <a href="https://wa.me/?text=${encTitle}%20${encUrl}" target="_blank" rel="noopener noreferrer" class="chip-filter" style="padding:6px 12px;">WhatsApp</a>
    <a href="https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}" target="_blank" rel="noopener noreferrer" class="chip-filter" style="padding:6px 12px;">X</a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${encUrl}" target="_blank" rel="noopener noreferrer" class="chip-filter" style="padding:6px 12px;">Facebook</a>
  </div>`;
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
    <a href="${root}hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="${root}iletisim.html" style="color:inherit;">İletişim</a> · <a href="${root}gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a>
  </div>
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>`;
}

function generateNews({ news, products, productSlug, rootDir }){
  const outDir = path.join(rootDir, 'haberler');
  // Klasörü ÖNCE temizle — eski/geçersiz kombinasyonlardan kalan yetim
  // (orphan) dosyalar birikmesin (ürün verisi değiştikçe eski dosyalar
  // hiç silinmiyordu, bu da canlıda kullanılmayan sayfalara yol açıyordu).
  if(fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const items = [...news].sort((a,b) => (b.date||'').localeCompare(a.date||''));
  const productById = {};
  (products||[]).forEach(p => { productById[p.id] = p; });

  items.forEach(n => {
    const canonical = `https://teknoversus.com.tr/haberler/${n.id}.html`;
    const schema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": n.title,
      "datePublished": n.date,
      "dateModified": n.date,
      "author": { "@type": "Person", "name": "Sinan Tanrı", "url": "https://teknoversus.com.tr/hakkimizda.html" },
      "publisher": { "@type": "Organization", "name": "TeknoVersus" },
      "mainEntityOfPage": canonical
    };

    const bodyHtml = (n.body||[]).map(p => `      <p style="margin:0 0 16px;line-height:1.7;">${esc(p)}</p>`).join('\n');

    let relatedBox = '';
    const rp = n.relatedProductId ? productById[n.relatedProductId] : null;
    if(rp){
      const rpUrl = `../urun/${productSlug(rp)}.html`;
      relatedBox = `
      <div class="product-notice" style="margin:20px 0;">
        ${rp.upcoming ? 'Bu habere konu olan model şu an "beklenen ürün" statüsünde' : 'Bu habere konu olan ürün'}:
        <a href="${rpUrl}" style="color:var(--c1);font-weight:600;">${esc(rp.name)} sayfasına git →</a>
      </div>`;
    }

    const others = items.filter(x => x.id !== n.id).slice(0, 3);
    const othersHtml = others.map(x =>
      `<a class="chip-filter" href="${x.id}.html">${esc(x.title.length > 60 ? x.title.slice(0,60)+'…' : x.title)}</a>`
    ).join('\n    ');

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(n.title)} | TeknoVersus Haberler</title>
<meta name="description" content="${esc(n.summary||'')}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${esc(n.title)}" />
<meta property="og:description" content="${esc(n.summary||'')}" />
<meta property="og:locale" content="tr_TR" />
<meta name="twitter:card" content="summary" />
<link rel="alternate" type="application/rss+xml" title="TeknoVersus Haberler" href="../haberler.xml" />
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>
${n.faq && n.faq.length ? `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": n.faq.map(f => ({
    "@type": "Question", "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a }
  }))
}, null, 2)}
</script>` : ''}
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2B6CB0" />
<script src="../shared.js"></script>
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

<main class="detail-wrap" style="max-width:760px;">
  <div class="breadcrumb">
    <a href="../index.html">Anasayfa</a> / <a href="../haberler.html">Haberler</a> / ${esc(n.title.length > 50 ? n.title.slice(0,50)+'…' : n.title)}
  </div>
  <a class="back-link" href="../haberler.html">← Tüm haberlere dön</a>

  <div class="card-cat" style="margin:14px 0 6px;">${esc(n.cat)} · ${n.date||''}</div>
  <h1 class="product-page-h1" style="margin:0 0 8px;">${esc(n.title)}</h1>
  <div style="font-size:12.5px;color:var(--ink-soft);margin:0 0 18px;">
    <span rel="author">Sinan Tanrı</span> · <a href="../hakkimizda.html" style="color:inherit;">TeknoVersus</a>${n.date ? ' · '+n.date : ''}<span id="newsViewSep" style="display:none;"> · </span><span id="newsViewLabel"></span>
  </div>

  ${shareButtonsHTML(canonical, n.title)}

  ${n.tldr ? `<div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin-bottom:20px;">
    <strong>Kısa cevap:</strong> ${esc(n.tldr)}
  </div>` : ''}

${bodyHtml}
${relatedBox}

  ${n.table && n.table.length ? `<h2 style="font-size:15px;margin:24px 0 10px;">Öne Çıkan Rakamlar</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13.5px;margin-bottom:20px;">
    <tbody>
${n.table.map(row => `      <tr style="border-bottom:1px solid var(--line);"><td style="padding:8px 10px 8px 0;color:var(--ink-soft);">${esc(row.k)}</td><td style="padding:8px 0;font-weight:600;font-family:'IBM Plex Mono',monospace;">${esc(row.v)}</td></tr>`).join('\n')}
    </tbody>
  </table>` : ''}

  ${n.faq && n.faq.length ? `<h2 style="font-size:15px;margin:24px 0 10px;">Sıkça Sorulan Sorular</h2>
${n.faq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(f.a)}</div>
  </div>`).join('\n')}` : ''}

  ${n.conclusion ? `<h2 style="font-size:15px;margin:24px 0 10px;">Özet</h2>
  <p style="font-size:13.5px;line-height:1.7;color:var(--ink-soft);">${esc(n.conclusion)}</p>` : ''}

  <p class="product-notice" style="margin-top:24px;">
    Bu haber, birden fazla teknoloji kaynağından derlenen bilgiler TeknoVersus editör ekibi tarafından
    özetlenerek hazırlanmıştır. Resmi tanıtım öncesi paylaşılan bilgiler sızıntı/söylenti niteliğindedir
    ve değişebilir.
  </p>

  <h2 style="font-size:15px;margin:24px 0 10px;">İlgili Bağlantılar</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <a class="chip-filter" href="../${SLUG_MAP[n.cat] || 'index'}.html">${esc(n.cat)} Kategorisi</a>
    <a class="chip-filter" href="../karsilastirmalar.html">${esc(n.cat)} Karşılaştırmaları</a>
    <a class="chip-filter" href="../yakinda-cikacak.html">Yakında Çıkacak Ürünler</a>
    ${othersHtml}
  </div>
</main>

${footerHTML('../')}

<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
<script>
(async () => {
  // Görüntülenme sayacı — ürün sayfalarındaki 'incrementViews' ile aynı
  // mantık, ayrı 'news_views' tablosu üzerinden. Sadece GERÇEK sayı varsa
  // gösterilir; "0 görüntülenme" yazmak ürün sayfalarında da bilerek
  // kaldırılmış bir davranıştı (güvenilirlik algısını zayıflatıyordu).
  const count = await incrementNewsViews('${n.id}');
  const label = document.getElementById('newsViewLabel');
  const sep = document.getElementById('newsViewSep');
  if(label && count != null && count > 0){
    label.textContent = count + ' görüntülenme';
    if(sep) sep.style.display = '';
  }
})();
</script>
</body>
</html>
`;
    fs.writeFileSync(path.join(outDir, `${n.id}.html`), html);
  });

  console.log(`${items.length} haber sayfası oluşturuldu -> haberler/`);

  // ---- haberler.html liste sayfası ----
  const cards = items.map(n => `      <a class="card" href="haberler/${n.id}.html" style="text-decoration:none;color:inherit;">
        <div class="card-cat">${esc(n.cat)} · ${n.date||''}</div>
        <div class="card-name">${esc(n.title)}</div>
        <div class="card-blurb">${esc(n.summary||'')}</div>
      </a>`).join('\n');

  const indexHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Haberler — Yeni Çıkan ve Yakında Gelecek Teknoloji Ürünleri | TeknoVersus</title>
<meta name="description" content="Telefon, tablet ve daha fazlasında en güncel lansman haberleri, sızıntılar ve yakında çıkacak ürünlere dair özetler — TeknoVersus editör ekibinden." />
<link rel="canonical" href="https://teknoversus.com.tr/haberler.html" />
<link rel="alternate" type="application/rss+xml" title="TeknoVersus Haberler" href="haberler.xml" />
<link rel="stylesheet" href="styles.css" />
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
    <div class="brand"><a href="index.html"><picture><source srcset="assets/logo-header.webp" type="image/webp"/><img src="assets/logo-header.png" class="brand-logo" alt="TeknoVersus logo" width="144" height="60" decoding="async"/></picture><span class="brand-text"><span class="tekno">TEKNO</span><span class="versus">VERSUS</span></span></a></div>
${navHTML('')}
    <button class="burger" id="burgerBtn">☰</button>
  </div>
</header>

<main class="wrap" style="padding-top:32px;padding-bottom:48px;">
  <h1 class="product-page-h1">Haberler</h1>
  <p style="color:var(--ink-soft);font-size:14px;max-width:640px;margin-bottom:28px;">
    Yeni çıkan ve yakında gelecek telefon, tablet ve teknoloji ürünlerine dair güncel özetler.
    Sızıntı/söylenti içeren haberler bunu açıkça belirtir; hiçbir içerik başka bir kaynaktan
    birebir çevrilmez, TeknoVersus editör ekibi tarafından derlenip özetlenir.
  </p>
  <div class="grid">
${items.length ? cards : '  <p style="color:var(--ink-soft);">Henüz haber eklenmedi.</p>'}
  </div>
</main>

${footerHTML('')}

<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(rootDir, 'haberler.html'), indexHtml);
  console.log('haberler.html (liste sayfası) oluşturuldu.');

  // ---- RSS feed (haberler.xml) ----
  const rssItems = items.map(n => {
    const link = `https://teknoversus.com.tr/haberler/${n.id}.html`;
    const pubDate = n.date ? new Date(n.date + 'T09:00:00+03:00').toUTCString() : new Date().toUTCString();
    return `    <item>
      <title>${esc(n.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${esc(n.cat)}</category>
      <description>${esc(n.summary || '')}</description>
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TeknoVersus Haberler</title>
    <link>https://teknoversus.com.tr/haberler.html</link>
    <description>TeknoVersus'tan güncel teknoloji haberleri — telefon, dizüstü, kulaklık, kamera, akıllı saat, tablet ve televizyon.</description>
    <language>tr-TR</language>
    <atom:link href="https://teknoversus.com.tr/haberler.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(rootDir, 'haberler.xml'), rss);
  console.log('haberler.xml (RSS feed) oluşturuldu.');

  // ---- sitemap.xml'e ekle (idempotent) ----
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/haberler\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/haberler\.html<\/loc>[\s\S]*?<\/url>/g, '');
    const today = new Date().toISOString().slice(0,10);
    const entries = [`  <url>
    <loc>https://teknoversus.com.tr/haberler.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`, ...items.map(n => `  <url>
    <loc>https://teknoversus.com.tr/haberler/${n.id}.html</loc>
    <lastmod>${n.date || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`)].join('\n');
    xml = xml.replace('</urlset>', `${entries}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
    console.log(`sitemap.xml güncellendi, +${items.length + 1} haber URL'si eklendi.`);
  } else {
    console.warn('UYARI: sitemap.xml bulunamadı — önce generateSite çalıştırılmalı.');
  }

  return items.map(n => `haberler/${n.id}.html`);
}

module.exports = { generateNews };
