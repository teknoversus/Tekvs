// ============================================================
// TeknoVersus — "{Marka} vs {Marka}" sayfaları
// (PROGRAMMATIC_SEO.md: "{marka} vs {marka}" şablonu — örn. "Samsung vs Xiaomi")
// Aynı kategoride en az 2 modeli olan marka çiftleri için üretilir.
// ============================================================
const fs = require('fs');
const path = require('path');

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};
const CAT_PLURAL = {
  'Telefon':'Telefonları', 'Dizüstü':'Dizüstü Bilgisayarları', 'Kulaklık':'Kulaklıkları',
  'Kamera':'Kameraları', 'Akıllı Saat':'Akıllı Saatleri', 'Tablet':'Tabletleri',
  'Televizyon':'Televizyonları'
};
const BRAND_FOLD = { 'MacBook': 'Apple', 'iPhone': 'Apple', 'AirPods': 'Apple', 'iPad': 'Apple', 'General': 'General Mobile' };

function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function slugify(name){
  const trMap = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return name.split('').map(ch => trMap[ch] !== undefined ? trMap[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function productSlug(p){ return `${slugify(p.name)}-${p.id}`; }
function brandOf(p){ const first = p.name.split(' ')[0]; return BRAND_FOLD[first] || first; }
function priceOf(p){
  const key = Object.keys(p.specs||{}).find(k => /fiyat/i.test(k));
  if(!key) return null;
  const n = parseFloat(String(p.specs[key]).replace(/[^\d.,]/g,'').replace(',','.'));
  return isNaN(n) ? null : n;
}

const GA_BLOCK = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-Q14VG0SB56"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "G-Q14VG0SB56");
</script>`;
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
    <a href="${root}hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="${root}gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a>
  </div>
  <div class="wrap" style="text-align:center;margin-bottom:10px;font-size:12.5px;">
    <a href="${root}hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="${root}gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a>
  </div>
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>`;
}

function generateBrandVsBrandPages({ products, computeScores, rootDir }){
  const outDir = path.join(rootDir, 'marka-karsilastir');
  if(fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const catalog = products.filter(p => !p.upcoming);
  const scores = computeScores(catalog);

  // (kategori, marka) -> ürünler
  const groups = {};
  catalog.forEach(p => {
    const key = `${p.cat}|||${brandOf(p)}`;
    (groups[key] = groups[key] || []).push(p);
  });
  // kategori -> [marka, marka, ...] (>=2 ürünlü)
  const catBrands = {};
  Object.entries(groups).forEach(([key, items]) => {
    if(items.length < 2) return;
    const [cat, brand] = key.split('|||');
    (catBrands[cat] = catBrands[cat] || []).push(brand);
  });

  const pages = [];
  Object.entries(catBrands).forEach(([cat, brands]) => {
    const mainSlug = SLUG_MAP[cat];
    for(let i = 0; i < brands.length; i++){
      for(let j = i+1; j < brands.length; j++){
        const b1 = brands[i], b2 = brands[j];
        const items1 = groups[`${cat}|||${b1}`];
        const items2 = groups[`${cat}|||${b2}`];
        const slug = `${slugify(b1)}-vs-${slugify(b2)}-${mainSlug}`;

        const avg = items => items.reduce((s,p) => s + (scores[p.id]||0), 0) / items.length;
        const avg1 = Math.round(avg(items1)), avg2 = Math.round(avg(items2));
        const prices1 = items1.map(priceOf).filter(x=>x!=null);
        const prices2 = items2.map(priceOf).filter(x=>x!=null);
        const winner = avg1 === avg2 ? null : (avg1 > avg2 ? b1 : b2);

        const tldr = winner
          ? `${cat} kategorisinde ${b1} (ortalama skor ${avg1}) ve ${b2} (ortalama skor ${avg2}) karşılaştırıldığında, kataloğumuzdaki modellere göre ${winner} ortalama fiyat/performans skorunda önde.`
          : `${cat} kategorisinde ${b1} ve ${b2}, kataloğumuzdaki modellere göre birbirine çok yakın ortalama fiyat/performans skoruna sahip.`;

        const rows1 = [...items1].sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0))
          .map(p => `      <tr><td><a href="../urun/${productSlug(p)}.html">${esc(p.name)}</a></td><td>${scores[p.id]??'—'}</td><td>${priceOf(p)?priceOf(p).toLocaleString('tr-TR')+' ₺':'—'}</td></tr>`).join('\n');
        const rows2 = [...items2].sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0))
          .map(p => `      <tr><td><a href="../urun/${productSlug(p)}.html">${esc(p.name)}</a></td><td>${scores[p.id]??'—'}</td><td>${priceOf(p)?priceOf(p).toLocaleString('tr-TR')+' ₺':'—'}</td></tr>`).join('\n');

        const faq = [
          { q: `${b1} mi ${b2} mi daha iyi?`, a: tldr },
          { q: `${cat} kategorisinde ${b1}'in kaç modeli var?`, a: `Kataloğumuzda ${b1} markasının ${cat.toLowerCase()} kategorisinde ${items1.length} modeli bulunuyor.` },
          { q: `${cat} kategorisinde ${b2}'nin kaç modeli var?`, a: `Kataloğumuzda ${b2} markasının ${cat.toLowerCase()} kategorisinde ${items2.length} modeli bulunuyor.` },
        ];
        const faqSchema = { "@context":"https://schema.org", "@type":"FAQPage", "mainEntity": faq.map(f => ({ "@type":"Question", "name":f.q, "acceptedAnswer": { "@type":"Answer", "text":f.a } })) };

        const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(b1)} vs ${esc(b2)} — ${esc(cat)} Karşılaştırması | TeknoVersus</title>
<meta name="description" content="${esc(tldr)}" />
<link rel="canonical" href="https://teknoversus.com.tr/marka-karsilastir/${slug}.html" />
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
${JSON.stringify(faqSchema, null, 2)}
</script>
<link rel="icon" type="image/png" href="../assets/logo.png" />
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

<main class="wrap" style="padding-top:32px;padding-bottom:48px;max-width:760px;">
  <div class="breadcrumb">
    <a href="../index.html">Anasayfa</a> / <a href="../${mainSlug}.html">${esc(cat)}</a> / ${esc(b1)} vs ${esc(b2)}
  </div>
  <h1 class="product-page-h1" style="margin-top:12px;">${esc(b1)} vs ${esc(b2)}: ${esc(cat)} Karşılaştırması</h1>

  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin:14px 0 24px;">
    <strong>Kısa cevap:</strong> ${esc(tldr)}
  </div>

  <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:24px;">
    <div style="flex:1;min-width:200px;background:var(--bg-soft,#F7F7F5);border-radius:10px;padding:14px 16px;">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${esc(b1)}</div>
      <div style="font-size:13px;color:var(--ink-soft);">Ortalama skor: <b>${avg1}</b></div>
      <div style="font-size:13px;color:var(--ink-soft);">Model sayısı: ${items1.length}</div>
      ${prices1.length ? `<div style="font-size:13px;color:var(--ink-soft);">Fiyat aralığı: ${Math.min(...prices1).toLocaleString('tr-TR')} – ${Math.max(...prices1).toLocaleString('tr-TR')} ₺</div>` : ''}
    </div>
    <div style="flex:1;min-width:200px;background:var(--bg-soft,#F7F7F5);border-radius:10px;padding:14px 16px;">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${esc(b2)}</div>
      <div style="font-size:13px;color:var(--ink-soft);">Ortalama skor: <b>${avg2}</b></div>
      <div style="font-size:13px;color:var(--ink-soft);">Model sayısı: ${items2.length}</div>
      ${prices2.length ? `<div style="font-size:13px;color:var(--ink-soft);">Fiyat aralığı: ${Math.min(...prices2).toLocaleString('tr-TR')} – ${Math.max(...prices2).toLocaleString('tr-TR')} ₺</div>` : ''}
    </div>
  </div>

  <h2 style="font-size:15px;margin:20px 0 10px;">${esc(b1)} Modelleri</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
    <thead><tr style="border-bottom:2px solid var(--line);"><th style="text-align:left;padding:6px 10px 6px 0;">Model</th><th style="text-align:left;padding:6px 10px;">Skor</th><th style="text-align:left;padding:6px 0;">Fiyat</th></tr></thead>
    <tbody>
${rows1}
    </tbody>
  </table>

  <h2 style="font-size:15px;margin:20px 0 10px;">${esc(b2)} Modelleri</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
    <thead><tr style="border-bottom:2px solid var(--line);"><th style="text-align:left;padding:6px 10px 6px 0;">Model</th><th style="text-align:left;padding:6px 10px;">Skor</th><th style="text-align:left;padding:6px 0;">Fiyat</th></tr></thead>
    <tbody>
${rows2}
    </tbody>
  </table>

  <h2 style="font-size:15px;margin:24px 0 10px;">Sıkça Sorulan Sorular</h2>
${faq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(f.a)}</div>
  </div>`).join('\n')}

  <p class="product-notice" style="margin-top:24px;">
    Bu karşılaştırma, her iki markanın kataloğumuzdaki ${esc(cat.toLowerCase())} modellerinin ortalama
    fiyat/performans skoruna dayanır — markanın genel/global ürün yelpazesinin tam bir temsili değildir.
  </p>

  <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
    <a class="chip-filter" href="../marka/${slugify(b1)}-${mainSlug}.html">${esc(b1)} ${esc(CAT_PLURAL[cat]||cat)}</a>
    <a class="chip-filter" href="../marka/${slugify(b2)}-${mainSlug}.html">${esc(b2)} ${esc(CAT_PLURAL[cat]||cat)}</a>
    <a class="chip-filter" href="../${mainSlug}.html">Tüm ${esc(cat)} Kataloğu</a>
    <a class="chip-filter" href="../karsilastirmalar.html">Karşılaştırmalar</a>
  </div>
</main>

${footerHTML('../')}
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;
        fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
        pages.push(`marka-karsilastir/${slug}.html`);
      }
    }
  });

  console.log(`${pages.length} marka vs marka sayfası oluşturuldu -> marka-karsilastir/`);

  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/marka-karsilastir\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
    const today = new Date().toISOString().slice(0,10);
    const entries = pages.map(p => `  <url>
    <loc>https://teknoversus.com.tr/${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');
    xml = xml.replace('</urlset>', `${entries}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
    console.log(`sitemap.xml güncellendi, +${pages.length} marka-karşılaştırma URL'si eklendi.`);
  }

  return pages;
}

module.exports = { generateBrandVsBrandPages };
