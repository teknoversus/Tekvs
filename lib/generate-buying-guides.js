// ============================================================
// TeknoVersus — Faz 2 (Programmatic SEO): "X alınır mı" ve
// "X fiyat/performans mı" sayfaları. Şablon izi bırakmamak için
// her sayfa GERÇEK, ürüne özgü veriyle (skor, fiyat konumu, artı/eksi)
// besleniyor — sadece isim değiştirilen kopya metin değil.
// ============================================================
const fs = require('fs');
const path = require('path');

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};

// Her ana kategorinin "nasıl seçilir" konu kümesi (pillar) rehberi —
// alınır-mı/fiyat-performans/inceleme sayfaları buraya link vererek
// TOPICAL_AUTHORITY_RULES.md'deki pillar→cluster bağlantısını kurar.
const TOPICAL_GUIDE_MAP = {
  'Telefon':'telefon-nasil-secilir', 'Dizüstü':'dizustu-bilgisayar-nasil-secilir',
  'Kulaklık':'kulaklik-nasil-secilir', 'Kamera':'kamera-nasil-secilir',
  'Akıllı Saat':'akilli-saat-nasil-secilir', 'Tablet':'tablet-nasil-secilir',
  'Televizyon':'televizyon-nasil-secilir'
};

function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function slugify(name){
  const trMap = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return name.split('').map(ch => trMap[ch] !== undefined ? trMap[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function productSlug(p){ return `${slugify(p.name)}-${p.id}`; }

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

function pageShell({ title, description, canonical, breadcrumbLabel, bodyHtml, faqSchema }){
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<link rel="stylesheet" href="../styles.css" />
${faqSchema ? `<script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n</script>` : ''}
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

<main class="detail-wrap" style="max-width:760px;">
  ${bodyHtml}
</main>

${footerHTML('../')}
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;
}

// Skor yüzdelik dilime göre çeşitlendirilmiş (şablon izi bırakmayan) doğal cümleler.
const VERDICT_PHRASES = {
  high: [
    'kategorisindeki en güçlü fiyat/performans seçeneklerinden biri',
    'aynı fiyat aralığındaki rakiplerine göre belirgin bir avantaj sunuyor',
    'bütçenize göre değerlendirdiğinizde öne çıkan modellerden'
  ],
  mid: [
    'kategori ortalamasına yakın, dengeli bir seçenek',
    'ne çok öne çıkıyor ne de geride kalıyor — orta karar noktası',
    'fiyatına göre makul, ama gözünüzü kamaştıracak bir fark sunmuyor'
  ],
  low: [
    'aynı bütçedeki bazı rakiplerine göre geride kalıyor',
    'fiyat/performans açısından kategori ortalamasının altında kalıyor',
    'bu fiyata alternatiflere de göz atmanızı öneririz'
  ]
};

function pick(arr, seed){ return arr[seed % arr.length]; }

function tierOf(score, allScores){
  const sorted = [...allScores].sort((a,b) => b - a);
  const idx = sorted.indexOf(score);
  const pct = idx / Math.max(sorted.length - 1, 1);
  if(pct <= 0.33) return 'high';
  if(pct <= 0.66) return 'mid';
  return 'low';
}

function generateBuyingGuides({ products, prosConsFor, computeScores, targetIds, rootDir }){
  const outDir = path.join(rootDir, 'rehber');
  // Klasörü ÖNCE temizle — eski/geçersiz kombinasyonlardan kalan yetim
  // (orphan) dosyalar birikmesin (ürün verisi değiştikçe eski dosyalar
  // hiç silinmiyordu, bu da canlıda kullanılmayan sayfalara yol açıyordu).
  if(fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const catalog = products.filter(p => !p.upcoming);
  const scores = computeScores(catalog);
  const pages = [];

  targetIds.forEach((id, seed) => {
    const p = catalog.find(x => x.id === id);
    if(!p) return;
    const catProducts = catalog.filter(c => c.cat === p.cat);
    const { pros, cons } = prosConsFor(p, catProducts);
    const score = scores[p.id];
    const catScores = catProducts.map(c => scores[c.id]).filter(s => s != null);
    const tier = score != null ? tierOf(score, catScores) : 'mid';
    const rank = catScores.length ? [...catScores].sort((a,b)=>b-a).indexOf(score) + 1 : null;
    const priceKey = Object.keys(p.specs||{}).find(k => /fiyat/i.test(k));
    const price = priceKey ? p.specs[priceKey] : null;
    const mainSlug = SLUG_MAP[p.cat] || 'index';
    const pUrl = `../urun/${productSlug(p)}.html`;

    // ---- Sayfa 1: "{ürün} alınır mı" ----
    {
      const slug = `${slugify(p.name)}-${p.id}-alinir-mi`;
      const verdict = pick(VERDICT_PHRASES[tier], seed);
      const tldr = `${p.name}, ${p.cat.toLowerCase()} kategorisinde ${verdict}. ${price ? `Fiyatı ${price} ₺` : 'Fiyat bilgisi güncel tutuluyor'}${rank ? `, kategorideki ${catScores.length} model arasında fiyat/performans skoruna göre ${rank}. sırada` : ''}.`;
      const kimlerAlmali = pros.length
        ? `${pros.slice(0,2).join(', ')} önceliğiniz varsa ${p.name} makul bir seçim.`
        : `${p.name}, kategori ortalamasına yakın dengeli özellikleriyle genel kullanım için uygun.`;
      const kimlerAlmamali = cons.length
        ? `${cons.slice(0,2).join(', ')} sizin için önemliyse, bu fiyat aralığındaki alternatifleri de karşılaştırmanızı öneririz.`
        : `Belirgin bir zayıf noktası öne çıkmıyor, ama her bütçe kararı gibi ihtiyacınıza göre değerlendirin.`;

      const faq = [
        { q: `${p.name} alınır mı?`, a: tldr },
        { q: `${p.name}'in artıları neler?`, a: pros.length ? pros.join('; ') + '.' : 'Kategori ortalamasına yakın, dengeli bir profil sunuyor.' },
        { q: `${p.name}'in eksileri neler?`, a: cons.length ? cons.join('; ') + '.' : 'Belirgin bir zayıf nokta tespit edilmedi.' },
      ];

      const bodyHtml = `
  <div class="breadcrumb">
    <a href="../index.html">Anasayfa</a> / <a href="../${mainSlug}.html">${esc(p.cat)}</a> / ${esc(p.name)} Alınır mı?
  </div>
  <h1 class="product-page-h1" style="margin:12px 0 18px;">${esc(p.name)} Alınır mı? ${new Date().getFullYear()} Değerlendirmesi</h1>

  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin-bottom:20px;">
    <strong>Kısa cevap:</strong> ${esc(tldr)}
  </div>

  <h2 style="font-size:15px;margin:20px 0 8px;">Kimler Almalı</h2>
  <p style="font-size:13.5px;line-height:1.7;">${esc(kimlerAlmali)}</p>

  <h2 style="font-size:15px;margin:20px 0 8px;">Kimler Almamalı</h2>
  <p style="font-size:13.5px;line-height:1.7;">${esc(kimlerAlmamali)}</p>

  ${pros.length || cons.length ? `<h2 style="font-size:15px;margin:20px 0 10px;">Artılar ve Eksiler</h2>
  <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px;">
    <div style="flex:1;min-width:220px;">
      <div style="font-weight:600;font-size:13px;color:#1D9E75;margin-bottom:6px;">Artılar</div>
      <ul style="font-size:13px;padding-left:18px;line-height:1.8;">${pros.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    <div style="flex:1;min-width:220px;">
      <div style="font-weight:600;font-size:13px;color:#C0392B;margin-bottom:6px;">Eksiler</div>
      <ul style="font-size:13px;padding-left:18px;line-height:1.8;">${cons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    </div>
  </div>` : ''}

  <h2 style="font-size:15px;margin:20px 0 10px;">Sıkça Sorulan Sorular</h2>
${faq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(f.a)}</div>
  </div>`).join('\n')}

  <p class="product-notice" style="margin-top:24px;">
    Bu değerlendirme, ürünün teknik özelliklerinin kategori ortalamasıyla karşılaştırılmasına dayanan
    veri odaklı bir analizdir; elle inceleme/test sonucu değildir.
  </p>

  <h2 style="font-size:15px;margin:24px 0 10px;">İlgili Bağlantılar</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <a class="chip-filter" href="${pUrl}">${esc(p.name)} Tam Özellikleri</a>
    <a class="chip-filter" href="${slugify(p.name)}-${p.id}-fiyat-performans.html">${esc(p.name)} Fiyat/Performans</a>
    <a class="chip-filter" href="../${mainSlug}.html">${esc(p.cat)} Kataloğu</a>
    <a class="chip-filter" href="../karsilastirmalar.html">Karşılaştırmalar</a>
    ${TOPICAL_GUIDE_MAP[p.cat] ? `<a class="chip-filter" href="${TOPICAL_GUIDE_MAP[p.cat]}.html">${esc(p.cat)} Nasıl Seçilir?</a>` : ''}
  </div>`;

      const html = pageShell({
        title: `${p.name} Alınır mı? ${new Date().getFullYear()} Değerlendirmesi | TeknoVersus`,
        description: tldr,
        canonical: `https://teknoversus.com.tr/rehber/${slug}.html`,
        bodyHtml,
        faqSchema: { "@context":"https://schema.org", "@type":"FAQPage", "mainEntity": faq.map(f => ({ "@type":"Question", "name":f.q, "acceptedAnswer": { "@type":"Answer", "text":f.a } })) }
      });
      fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
      pages.push(`rehber/${slug}.html`);
    }

    // ---- Sayfa 2: "{ürün} fiyat/performans mı" ----
    {
      const slug = `${slugify(p.name)}-${p.id}-fiyat-performans`;
      const neighbors = catProducts
        .filter(c => c.id !== p.id && scores[c.id] != null)
        .sort((a,b) => Math.abs(scores[a.id]-score) - Math.abs(scores[b.id]-score))
        .slice(0,3);

      const tldr = `${p.name}, ${p.cat.toLowerCase()} kategorisinde fiyat/performans skoruna göre ${tier === 'high' ? 'üst dilimde' : tier === 'mid' ? 'orta dilimde' : 'alt dilimde'} yer alıyor${rank ? ` (${catScores.length} model arasında ${rank}. sıra)` : ''}.`;

      const neighborRows = neighbors.map(n => {
        const nPriceKey = Object.keys(n.specs||{}).find(k => /fiyat/i.test(k));
        return `      <tr style="border-bottom:1px solid var(--line);"><td style="padding:8px 10px 8px 0;"><a href="../urun/${productSlug(n)}.html" style="color:inherit;">${esc(n.name)}</a></td><td style="padding:8px 10px;font-family:'IBM Plex Mono',monospace;">${nPriceKey ? esc(n.specs[nPriceKey])+' ₺' : '—'}</td><td style="padding:8px 0;font-family:'IBM Plex Mono',monospace;">${scores[n.id]}</td></tr>`;
      }).join('\n');

      const faq = [
        { q: `${p.name}'in fiyat/performans skoru nedir?`, a: tldr },
        { q: `${p.name} yerine hangi ürünlere bakılabilir?`, a: neighbors.length ? `Benzer fiyat/performans profiline sahip alternatifler: ${neighbors.map(n=>n.name).join(', ')}.` : 'Kategoride yakın skorlu doğrudan bir alternatif bulunmuyor.' },
      ];

      const bodyHtml = `
  <div class="breadcrumb">
    <a href="../index.html">Anasayfa</a> / <a href="../${mainSlug}.html">${esc(p.cat)}</a> / ${esc(p.name)} Fiyat/Performans
  </div>
  <h1 class="product-page-h1" style="margin:12px 0 18px;">${esc(p.name)} Fiyat/Performans Değerlendirmesi</h1>

  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin-bottom:20px;">
    <strong>Kısa cevap:</strong> ${esc(tldr)}
  </div>

  <h2 style="font-size:15px;margin:20px 0 10px;">Öne Çıkan Rakamlar</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13.5px;margin-bottom:20px;">
    <tbody>
      <tr style="border-bottom:1px solid var(--line);"><td style="padding:8px 10px 8px 0;color:var(--ink-soft);">Fiyat</td><td style="padding:8px 0;font-weight:600;font-family:'IBM Plex Mono',monospace;">${price ? esc(price)+' ₺' : '—'}</td></tr>
      <tr style="border-bottom:1px solid var(--line);"><td style="padding:8px 10px 8px 0;color:var(--ink-soft);">Fiyat/Performans Skoru</td><td style="padding:8px 0;font-weight:600;font-family:'IBM Plex Mono',monospace;">${score != null ? score : '—'}</td></tr>
      ${rank ? `<tr><td style="padding:8px 10px 8px 0;color:var(--ink-soft);">Kategori Sıralaması</td><td style="padding:8px 0;font-weight:600;font-family:'IBM Plex Mono',monospace;">${rank} / ${catScores.length}</td></tr>` : ''}
    </tbody>
  </table>

  ${neighbors.length ? `<h2 style="font-size:15px;margin:20px 0 10px;">Yakın Skorlu Alternatifler</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
    <thead><tr style="border-bottom:2px solid var(--line);"><th style="text-align:left;padding:6px 10px 6px 0;">Ürün</th><th style="text-align:left;padding:6px 10px;">Fiyat</th><th style="text-align:left;padding:6px 0;">Skor</th></tr></thead>
    <tbody>
${neighborRows}
    </tbody>
  </table>` : ''}

  <h2 style="font-size:15px;margin:20px 0 10px;">Sıkça Sorulan Sorular</h2>
${faq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(f.a)}</div>
  </div>`).join('\n')}

  <p class="product-notice" style="margin-top:24px;">
    Fiyat/performans skoru, ürünün teknik özelliklerinin fiyatına oranlanmasıyla hesaplanan
    göreli bir kategori-içi karşılaştırmadır; mutlak bir kalite garantisi değildir.
  </p>

  <h2 style="font-size:15px;margin:24px 0 10px;">İlgili Bağlantılar</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <a class="chip-filter" href="${pUrl}">${esc(p.name)} Tam Özellikleri</a>
    <a class="chip-filter" href="${slugify(p.name)}-${p.id}-alinir-mi.html">${esc(p.name)} Alınır mı?</a>
    <a class="chip-filter" href="../${mainSlug}.html">${esc(p.cat)} Kataloğu</a>
    <a class="chip-filter" href="../karsilastirmalar.html">Karşılaştırmalar</a>
    ${TOPICAL_GUIDE_MAP[p.cat] ? `<a class="chip-filter" href="${TOPICAL_GUIDE_MAP[p.cat]}.html">${esc(p.cat)} Nasıl Seçilir?</a>` : ''}
  </div>`;

      const html = pageShell({
        title: `${p.name} Fiyat/Performans Değerlendirmesi | TeknoVersus`,
        description: tldr,
        canonical: `https://teknoversus.com.tr/rehber/${slug}.html`,
        bodyHtml,
        faqSchema: { "@context":"https://schema.org", "@type":"FAQPage", "mainEntity": faq.map(f => ({ "@type":"Question", "name":f.q, "acceptedAnswer": { "@type":"Answer", "text":f.a } })) }
      });
      fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
      pages.push(`rehber/${slug}.html`);
    }
  });

  console.log(`${pages.length} rehber sayfası oluşturuldu (${targetIds.length} ürün × 2 sayfa) -> rehber/`);

  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/rehber\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
    const today = new Date().toISOString().slice(0,10);
    const entries = pages.map(p => `  <url>
    <loc>https://teknoversus.com.tr/${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');
    xml = xml.replace('</urlset>', `${entries}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
    console.log(`sitemap.xml güncellendi, +${pages.length} rehber URL'si eklendi.`);
  }

  return pages;
}

module.exports = { generateBuyingGuides };
