// ============================================================
// TeknoVersus — Faz 4: Alt Kategori Taksonomisi (Category Authority Map).
// Her ana kategoriyi CATEGORY_AUTHORITY_MAP.md'deki alt kümelere böler,
// ürünleri isim/özellik bazlı otomatik sınıflandırır, her alt küme için
// bir açılış (landing) sayfası üretir.
// ============================================================
const fs = require('fs');
const path = require('path');

const SUBCATS = {
  'Telefon': ['Android Telefonlar', 'iPhone', 'Kamera Telefonları', 'Oyuncu Telefonları', 'Katlanabilir Telefonlar', 'Bütçe Dostu Telefonlar'],
  'Dizüstü': ['Oyun Laptopları', 'İş Laptopları', 'Öğrenci Laptopları', 'Ultrabook', 'MacBook'],
  'Kulaklık': ['TWS', 'Oyuncu Kulaklığı', 'ANC Kulaklık', 'Bluetooth Kulaklık'],
  'Kamera': ['Aynasız Kamera', 'DSLR', 'Aksiyon Kamerası', 'Vlog Kamerası'],
  'Akıllı Saat': ['Android Saat', 'Apple Watch', 'Spor Saatleri', 'Çocuk Saatleri'],
};

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};

function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function subSlugify(s){
  const trMap = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return s.split('').map(ch => trMap[ch] !== undefined ? trMap[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

// Ürünü isim + fiyat + işletim sistemi gibi ipuçlarına bakarak 1+ alt kümeye ata.
function classify(p){
  const name = p.name.toLowerCase();
  const specs = p.specs || {};
  const price = parseFloat(String(specs['Fiyat (₺)']||'0').replace(/[^\d.]/g,'')) || 0;
  const os = String(specs['İşletim Sistemi']||'').toLowerCase();
  const result = [];

  if(p.cat === 'Telefon'){
    if(name.includes('iphone')) result.push('iPhone');
    else result.push('Android Telefonlar');
    if(name.includes('fold') || name.includes('flip')) result.push('Katlanabilir Telefonlar');
    if(/red magic|rog phone|legion|robot phone|gaming/i.test(p.name)) result.push('Oyuncu Telefonları');
    const camMP = parseFloat(specs['Kamera (MP)']) || 0;
    if(camMP >= 108 || /pro|ultra|periskop/i.test(p.name)) result.push('Kamera Telefonları');
    if(price > 0 && price <= 13000) result.push('Bütçe Dostu Telefonlar');
  }
  if(p.cat === 'Dizüstü'){
    if(name.includes('macbook')) result.push('MacBook');
    if(/rog|legion|omen|katana|nitro|excalibur|tulpar|predator|gaming/i.test(p.name)) result.push('Oyun Laptopları');
    if(/thinkpad|elitebook|probook|latitude/i.test(p.name)) result.push('İş Laptopları');
    if(/ideapad|vivobook|inspiron|aspire|nirvana/i.test(p.name)) result.push('Öğrenci Laptopları');
    if(/air|gram|xps|ultrabook/i.test(p.name)) result.push('Ultrabook');
  }
  if(p.cat === 'Kulaklık'){
    if(/airpods|buds|earbuds|wf-|tws/i.test(p.name)) result.push('TWS');
    if(/anc|1000xm|quietcomfort|noise cancel/i.test(p.name) || /anc/i.test(JSON.stringify(specs))) result.push('ANC Kulaklık');
    if(!/airpods|buds|wf-/i.test(p.name)) result.push('Bluetooth Kulaklık');
  }
  if(p.cat === 'Kamera'){
    if(/dslr|eos.*mark|d\d{3,4}/i.test(p.name)) result.push('DSLR');
    else if(/gopro|hero|osmo|insta360/i.test(p.name)) result.push('Aksiyon Kamerası');
    else if(/zv-|vlog|powershot/i.test(p.name)) result.push('Vlog Kamerası');
    else result.push('Aynasız Kamera');
  }
  if(p.cat === 'Akıllı Saat'){
    if(name.includes('apple watch')) result.push('Apple Watch');
    else result.push('Android Saat');
    if(/forerunner|vantage|polar|garmin/i.test(p.name)) result.push('Spor Saatleri');
  }
  return result;
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
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>`;
}

function generateSubcategories({ products, productSlug, rootDir }){
  const outDir = path.join(rootDir, 'kategori');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Her ürünü sınıflandır
  const catalog = products.filter(p => !p.upcoming);
  const bySubcat = {}; // subcat name -> [{product, mainCat}]
  catalog.forEach(p => {
    const subs = classify(p);
    subs.forEach(s => { (bySubcat[s] = bySubcat[s] || []).push(p); });
  });

  const pages = [];
  Object.entries(SUBCATS).forEach(([mainCat, subList]) => {
    subList.forEach(subName => {
      const items = bySubcat[subName] || [];
      if(items.length < 2) return; // çok az ürün varsa sayfa üretme (ince/boş içerik olmasın)
      const slug = subSlugify(subName);
      const mainSlug = SLUG_MAP[mainCat];

      const cards = items.map(p => `      <a class="card" href="../urun/${productSlug(p)}.html" style="text-decoration:none;color:inherit;">
        <div class="card-cat">${esc(p.cat)}</div>
        <div class="card-name">${esc(p.name)}</div>
        <div class="card-blurb">${esc(p.blurb||'')}</div>
      </a>`).join('\n');

      const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(subName)} — En İyi ${esc(subName)} ${new Date().getFullYear()} | TeknoVersus</title>
<meta name="description" content="${esc(subName)} kategorisinde ${items.length} model karşılaştırması: fiyat, özellikler ve fiyat/performans skoruna göre en iyi seçenekler." />
<link rel="canonical" href="https://teknoversus.com.tr/kategori/${slug}.html" />
<link rel="stylesheet" href="../styles.css" />
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

<main class="wrap" style="padding-top:32px;padding-bottom:48px;">
  <div class="breadcrumb">
    <a href="../index.html">Anasayfa</a> / <a href="../${mainSlug}.html">${esc(mainCat)}</a> / ${esc(subName)}
  </div>
  <h1 class="product-page-h1" style="margin-top:12px;">${esc(subName)}</h1>
  <p style="color:var(--ink-soft);font-size:14px;max-width:640px;margin-bottom:24px;">
    ${esc(subName)} kategorisinde kataloğumuzdaki ${items.length} modeli listeledik. Her birinin tam
    özellik tablosuna ve fiyat/performans karşılaştırmasına ürün sayfasından ulaşabilirsin.
  </p>
  <div class="grid">
${cards}
  </div>
  <div style="margin-top:32px;">
    <a class="chip-filter" href="../${mainSlug}.html">Tüm ${esc(mainCat)} Kataloğu</a>
    <a class="chip-filter" href="../karsilastirmalar.html">Karşılaştırmalar</a>
  </div>
</main>

${footerHTML('../')}
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;
      fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
      pages.push(`kategori/${slug}.html`);
    });
  });

  console.log(`${pages.length} alt kategori sayfası oluşturuldu -> kategori/`);

  // ---- Ana kategori sayfalarına "Alt Kategoriler" bloğu ekle (idempotent) ----
  const MARK_START = '<!-- ALT_KATEGORILER_START -->';
  const MARK_END = '<!-- ALT_KATEGORILER_END -->';
  Object.entries(SUBCATS).forEach(([mainCat, subList]) => {
    const mainSlug = SLUG_MAP[mainCat];
    const pagePath = path.join(rootDir, `${mainSlug}.html`);
    if(!fs.existsSync(pagePath)) return;
    const validSubs = subList.filter(s => (bySubcat[s]||[]).length >= 2);
    if(!validSubs.length) return;

    let html = fs.readFileSync(pagePath, 'utf8');
    const chips = validSubs.map(s => `<a class="chip-filter" href="kategori/${subSlugify(s)}.html">${esc(s)}</a>`).join('\n      ');
    const block = `${MARK_START}
    <section style="margin:20px 0;">
      <h2 style="font-size:15px;margin:0 0 10px;">${esc(mainCat)} Alt Kategorileri</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${chips}
      </div>
    </section>
    ${MARK_END}`;

    const regex = new RegExp(MARK_START + '[\\s\\S]*?' + MARK_END);
    if(regex.test(html)){
      html = html.replace(regex, block);
    } else {
      // İlk kez ekleniyor: kapanış </main> etiketinden hemen önce yerleştir.
      html = html.replace('</main>', `  ${block}\n</main>`);
    }
    fs.writeFileSync(pagePath, html);
  });
  console.log('Ana kategori sayfalarına "Alt Kategoriler" bloğu eklendi.');

  // sitemap.xml'e ekle
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/kategori\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
    const today = new Date().toISOString().slice(0,10);
    const entries = pages.map(p => `  <url>
    <loc>https://teknoversus.com.tr/${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');
    xml = xml.replace('</urlset>', `${entries}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
    console.log(`sitemap.xml güncellendi, +${pages.length} alt kategori URL'si eklendi.`);
  }

  return { pages, bySubcat, classify };
}

// Ürün sayfalarının (generate-site.js) hangi alt kategorilere link vereceğini
// önceden hesaplamak için: sadece GERÇEKTEN sayfası üretilecek (>=2 ürünlü)
// alt kategorileri döndürür — kırık link oluşmasın diye.
function buildSubcatMap(products){
  const catalog = products.filter(p => !p.upcoming);
  const bySubcat = {};
  catalog.forEach(p => {
    classify(p).forEach(s => { (bySubcat[s] = bySubcat[s] || []).push(p); });
  });
  const validSubcats = new Set(Object.keys(bySubcat).filter(s => bySubcat[s].length >= 2));
  const map = {};
  catalog.forEach(p => {
    const subs = classify(p).filter(s => validSubcats.has(s));
    if(subs.length) map[p.id] = subs;
  });
  return map;
}

module.exports = { generateSubcategories, classify, SUBCATS, buildSubcatMap };
