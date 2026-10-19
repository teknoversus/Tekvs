// ============================================================
// TeknoVersus — Haberler (haber/blog) sayfa üretimi.
// generate-site.js / generate-comparisons.js ile aynı tasarım dilini kullanır.
// Ürün sayfaları gibi bu da artık Supabase'deki 'news' tablosundan besleniyor
// (admin panelinden CRUD) — build.js her çalıştığında güncel haber listesiyle
// haberler/*.html + haberler.html'i yeniden üretir.
// ============================================================
const fs = require('fs');
const path = require('path');
const { buildNewsImages } = require('./news-images');

const SITE = 'https://teknoversus.com.tr';
const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

// Türkiye 2016'dan beri sabit UTC+3 (yaz saati yok).
function istParts(d){
  const t = new Date(d.getTime() + 3 * 3600 * 1000);
  const p2 = x => String(x).padStart(2, '0');
  return { y: t.getUTCFullYear(), mo: p2(t.getUTCMonth() + 1), d: p2(t.getUTCDate()), h: p2(t.getUTCHours()), mi: p2(t.getUTCMinutes()), s: p2(t.getUTCSeconds()) };
}
function isoIst(d){ const p = istParts(d); return `${p.y}-${p.mo}-${p.d}T${p.h}:${p.mi}:${p.s}+03:00`; }
function validDate(v){ if(!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d; }

// Yayın zamanı: published_at varsa ve haberin "Tarih" alanıyla aynı güne
// düşüyorsa gerçek saat kullanılır. Tarih elle farklı bir güne ayarlanmışsa
// (ya da published_at yoksa — migration öncesi eski kayıtlar) o günün 09:00'u.
function publishedIso(n){
  const pa = validDate(n.publishedAt);
  if(pa){
    const p = istParts(pa);
    if(!n.date || `${p.y}-${p.mo}-${p.d}` === String(n.date).slice(0, 10)) return isoIst(pa);
  }
  if(n.date) return `${String(n.date).slice(0, 10)}T09:00:00+03:00`;
  return pa ? isoIst(pa) : null;
}
// Güncellenme: updated_at yayından en az 10 dk sonraysa (gerçek bir düzenleme).
function modifiedIso(n){
  const pub = publishedIso(n);
  const ua = validDate(n.updatedAt);
  if(pub && ua && ua.getTime() - new Date(pub).getTime() > 10 * 60 * 1000) return isoIst(ua);
  return pub;
}
function trDateTime(iso, withTime){
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
  if(!m) return '';
  const date = `${+m[3]} ${MONTHS_TR[+m[2] - 1]} ${m[1]}`;
  return withTime && !(m[4] === '09' && m[5] === '00') ? `${date}, ${m[4]}:${m[5]}` : date;
}

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
    <a href="${root}hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="${root}iletisim.html" style="color:inherit;">İletişim</a> · <a href="${root}gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a> · <a href="${root}kullanim-kosullari.html" style="color:inherit;">Kullanım Koşulları</a> · <a href="${root}cerez-politikasi.html" style="color:inherit;">Çerez Politikası</a>
  </div>
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>`;
}

async function generateNews({ news, products, productSlug, rootDir }){
  const outDir = path.join(rootDir, 'haberler');
  // Klasörü ÖNCE temizle — eski/geçersiz kombinasyonlardan kalan yetim
  // (orphan) dosyalar birikmesin (ürün verisi değiştikçe eski dosyalar
  // hiç silinmiyordu, bu da canlıda kullanılmayan sayfalara yol açıyordu).
  if(fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // En yeni üstte: yayın zamanına göre (aynı gün eklenen haberler de doğru sıralanır).
  news.forEach(n => { n.publishedIso = publishedIso(n); n.modifiedIso = modifiedIso(n); });
  const items = [...news].sort((a,b) => (b.publishedIso||'').localeCompare(a.publishedIso||'') || (a.id||'').localeCompare(b.id||''));

  // Kapak görselleri (Discover / Önemli haberler için zorunlu) — her habere n.cover yazar.
  await buildNewsImages({ items, outDir });
  const productById = {};
  (products||[]).forEach(p => { productById[p.id] = p; });

  items.forEach(n => {
    const canonical = `https://teknoversus.com.tr/haberler/${n.id}.html`;
    const cover = n.cover || null;
    const schema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": n.title.length > 110 ? n.title.slice(0, 109) + '…' : n.title,
      "description": n.summary || undefined,
      ...(cover ? { "image": ['16x9', '4x3', '1x1'].map(k => ({ "@type": "ImageObject", "url": cover[k].url, "width": cover[k].w, "height": cover[k].h })) } : {}),
      "datePublished": n.publishedIso || undefined,
      "dateModified": n.modifiedIso || n.publishedIso || undefined,
      "author": [{ "@type": "Person", "name": "Sinan Tanrı", "url": `${SITE}/hakkimizda.html` }],
      "publisher": {
        "@type": "Organization", "name": "TeknoVersus", "url": `${SITE}/`,
        "logo": { "@type": "ImageObject", "url": `${SITE}/assets/logo.png`, "width": 1801, "height": 752 }
      },
      "articleSection": n.cat,
      "inLanguage": "tr-TR",
      "isAccessibleForFree": true,
      "mainEntityOfPage": { "@type": "WebPage", "@id": canonical }
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Anasayfa", "item": `${SITE}/` },
        { "@type": "ListItem", "position": 2, "name": "Haberler", "item": `${SITE}/haberler.html` },
        { "@type": "ListItem", "position": 3, "name": n.title, "item": canonical }
      ]
    };
    const pubText = trDateTime(n.publishedIso, true);
    const modText = (n.modifiedIso && n.modifiedIso !== n.publishedIso) ? trDateTime(n.modifiedIso, true) : '';
    const heroHtml = cover ? `
  <figure style="margin:0 0 20px;">
    <img src="../${cover['16x9'].path}" alt="${esc(cover.alt)}" width="${cover['16x9'].w}" height="${cover['16x9'].h}" fetchpriority="high" decoding="async" style="width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:var(--radius);display:block;background:#0F1622;" />
    ${cover.credit ? `<figcaption style="font-size:11.5px;color:var(--ink-soft);margin-top:6px;">Görsel: ${esc(cover.credit)}</figcaption>` : ''}
  </figure>` : '';

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
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="TeknoVersus" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${esc(n.title)}" />
<meta property="og:description" content="${esc(n.summary||'')}" />
<meta property="og:locale" content="tr_TR" />
${cover ? `<meta property="og:image" content="${cover['16x9'].url}" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="${cover['16x9'].w}" />
<meta property="og:image:height" content="${cover['16x9'].h}" />
<meta property="og:image:alt" content="${esc(cover.alt)}" />
` : ''}${n.publishedIso ? `<meta property="article:published_time" content="${n.publishedIso}" />
` : ''}${n.modifiedIso ? `<meta property="article:modified_time" content="${n.modifiedIso}" />
` : ''}<meta property="article:section" content="${esc(n.cat)}" />
<meta property="article:author" content="${SITE}/hakkimizda.html" />
<meta name="author" content="Sinan Tanrı" />
<meta name="twitter:card" content="${cover ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${esc(n.title)}" />
<meta name="twitter:description" content="${esc(n.summary||'')}" />
${cover ? `<meta name="twitter:image" content="${cover['16x9'].url}" />
<meta name="twitter:image:alt" content="${esc(cover.alt)}" />
` : ''}<link rel="alternate" type="application/rss+xml" title="TeknoVersus Haberler" href="../haberler.xml" />
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(breadcrumb, null, 2)}
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

  <div class="card-cat" style="margin:14px 0 6px;">${esc(n.cat)}${n.publishedIso ? ` · <time datetime="${n.publishedIso}">${trDateTime(n.publishedIso, false)}</time>` : ''}</div>
  <h1 class="product-page-h1" style="margin:0 0 8px;">${esc(n.title)}</h1>
  <div style="font-size:12.5px;color:var(--ink-soft);margin:0 0 18px;">
    <a href="../hakkimizda.html" rel="author" style="color:inherit;">Sinan Tanrı</a> · TeknoVersus${pubText ? ` · <time datetime="${n.publishedIso}">${pubText}</time>` : ''}${modText ? ` · Güncellendi: <time datetime="${n.modifiedIso}">${modText}</time>` : ''}<span id="newsViewSep" style="display:none;"> · </span><span id="newsViewLabel"></span>
  </div>
${heroHtml}

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
    ${SLUG_MAP[n.cat] ? `<a class="chip-filter" href="../${SLUG_MAP[n.cat]}.html">${esc(n.cat)} Kategorisi</a>
    <a class="chip-filter" href="../karsilastirmalar.html">${esc(n.cat)} Karşılaştırmaları</a>` : `<a class="chip-filter" href="../haberler.html">Tüm Haberler</a>`}
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
  const cards = items.map((n, i) => `      <a class="card" href="haberler/${n.id}.html" style="text-decoration:none;color:inherit;">
${n.cover ? `        <img src="${n.cover.thumb.path}" alt="${esc(n.cover.alt)}" width="${n.cover.thumb.w}" height="${n.cover.thumb.h}" ${i < 3 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" style="width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:var(--radius-sm);display:block;margin-bottom:10px;background:#0F1622;" />
` : ''}        <div class="card-cat">${esc(n.cat)}${n.publishedIso ? ` · <time datetime="${n.publishedIso}">${trDateTime(n.publishedIso, false)}</time>` : ''}</div>
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
<meta name="robots" content="index, follow, max-image-preview:large" />
<link rel="canonical" href="https://teknoversus.com.tr/haberler.html" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="TeknoVersus" />
<meta property="og:url" content="https://teknoversus.com.tr/haberler.html" />
<meta property="og:title" content="Haberler | TeknoVersus" />
<meta property="og:locale" content="tr_TR" />
<meta property="og:image" content="${items[0] && items[0].cover ? items[0].cover['16x9'].url : SITE + '/assets/og-image.png'}" />
<meta name="twitter:card" content="summary_large_image" />
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
    const pubDate = n.publishedIso ? new Date(n.publishedIso).toUTCString() : new Date().toUTCString();
    const img = n.cover ? n.cover['16x9'] : null;
    return `    <item>
      <title>${esc(n.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${esc(n.cat)}</category>
      <description>${esc(n.summary || '')}</description>
      <dc:creator>Sinan Tanrı</dc:creator>${img ? `
      <enclosure url="${img.url}" length="${img.bytes}" type="image/jpeg" />
      <media:content url="${img.url}" medium="image" type="image/jpeg" width="${img.w}" height="${img.h}" />` : ''}
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>TeknoVersus Haberler</title>
    <link>https://teknoversus.com.tr/haberler.html</link>
    <description>TeknoVersus'tan güncel teknoloji haberleri — telefon, dizüstü, kulaklık, kamera, akıllı saat, tablet ve televizyon.</description>
    <language>tr-TR</language>
${items[0] && items[0].publishedIso ? `    <lastBuildDate>${new Date(items.reduce((m, x) => (x.modifiedIso || '') > m ? x.modifiedIso : m, '')).toUTCString()}</lastBuildDate>
` : ''}    <atom:link href="https://teknoversus.com.tr/haberler.xml" rel="self" type="application/rss+xml" />
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
    // Liste sayfasının lastmod'u = en son eklenen/güncellenen haber (her build'de değişmesin).
    const latestMod = items.reduce((m, x) => (x.modifiedIso || '') > m ? x.modifiedIso : m, '') || today;
    const entries = [`  <url>
    <loc>https://teknoversus.com.tr/haberler.html</loc>
    <lastmod>${latestMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`, ...items.map(n => `  <url>
    <loc>https://teknoversus.com.tr/haberler/${n.id}.html</loc>
    <lastmod>${n.modifiedIso || n.date || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>${n.cover ? `
    <image:image><image:loc>${n.cover['16x9'].url}</image:loc></image:image>` : ''}
  </url>`)].join('\n');
    xml = xml.replace('</urlset>', `${entries}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
    console.log(`sitemap.xml güncellendi, +${items.length + 1} haber URL'si eklendi.`);
  } else {
    console.warn('UYARI: sitemap.xml bulunamadı — önce generateSite çalıştırılmalı.');
  }

  writeNewsSitemap({ rootDir, items });

  return items.map(n => `haberler/${n.id}.html`);
}

// Google News sitemap'i: yalnızca son 2 günde yayımlanan haberler (Google'ın
// kuralı). Haber yoksa da geçerli, boş bir urlset yazılır. robots.txt'te ayrıca
// listelenir; split-sitemap.js bu dosyaya dokunmaz (sadece sitemap-N.xml'leri böler).
function writeNewsSitemap({ rootDir, items }){
  const cutoff = Date.now() - 2 * 24 * 3600 * 1000;
  const recent = items.filter(n => n.publishedIso && new Date(n.publishedIso).getTime() >= cutoff).slice(0, 1000);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${recent.map(n => `  <url>
    <loc>${SITE}/haberler/${n.id}.html</loc>
    <news:news>
      <news:publication><news:name>TeknoVersus</news:name><news:language>tr</news:language></news:publication>
      <news:publication_date>${n.publishedIso}</news:publication_date>
      <news:title>${esc(n.title)}</news:title>
    </news:news>${n.cover ? `
    <image:image><image:loc>${n.cover['16x9'].url}</image:loc></image:image>` : ''}
  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(rootDir, 'sitemap-news.xml'), xml);
  console.log(`sitemap-news.xml: son 48 saatte ${recent.length} haber.`);
}

module.exports = { generateNews };
