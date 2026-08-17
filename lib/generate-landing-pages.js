// ============================================================
// TeknoVersus — Özellik ve Fiyat landing sayfaları (Programmatic SEO).
//
// Türkçe pazarda arama niyeti en net sorgular bunlar:
//   "20.000 TL altı telefonlar", "120Hz telefonlar", "5000 mAh üstü telefon"
// Marka kombinasyonlarından farklı olarak bu sorgular satın alma niyeti
// taşıyor ve kataloğumuzda karşılığı var.
//
// Sayfa üretim kararı lib/pseo-rules.js'e devrediliyor: ince içerik üretilmez,
// 2-3 ürünlü sayfalar noindex kalır, sadece 4+ ürünlü olanlar sitemap'e girer.
// ============================================================
const fs = require('fs');
const path = require('path');
const RULES = require('./pseo-rules');

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};

// ---- Özellik tanımları ----
// Her biri: ürünün gerçek spec'inden hesaplanan bir test + sayfa metni.
const FEATURES = [
  { id:'120hz', ad:'120Hz Ekran', baslik:'120Hz ve Üzeri Ekranlı',
    test:p => num(p,'Yenileme Hızı (Hz)') >= 120,
    aciklama:'Yüksek yenileme hızı, kaydırma ve oyunlarda gözle görülür akıcılık sağlar. 120Hz bir ekran saniyede 120 kez tazelenir; 60Hz\'e göre hareket çok daha yumuşak görünür. Bunun bedeli daha fazla pil tüketimidir, bu yüzden çoğu cihaz içeriğe göre hızı otomatik düşüren adaptif yenileme kullanır.' },
  { id:'uzun-pil', ad:'5000 mAh+ Batarya', baslik:'5000 mAh ve Üzeri Bataryalı',
    test:p => num(p,'Pil (mAh)') >= 5000,
    aciklama:'5000 mAh ve üzeri batarya, yoğun kullanıcıların gün sonuna şarj aramadan ulaşmasını kolaylaştırır. Ancak gerçek pil ömrü sadece kapasiteye bağlı değildir: ekran boyutu, yenileme hızı ve işlemcinin verimliliği de belirleyicidir. Aynı kapasitede iki cihazdan daha verimli işlemciye sahip olan belirgin şekilde uzun dayanabilir.' },
  { id:'yuksek-mp', ad:'100MP+ Kamera', baslik:'100MP ve Üzeri Kameralı',
    test:p => num(p,'Kamera (MP)') >= 100,
    aciklama:'Yüksek megapiksel, daha fazla detay yakalama ve kırpma esnekliği sunar. Ancak megapiksel tek başına kamera kalitesini belirlemez; sensör boyutu, diyafram açıklığı ve görüntü işleme yazılımı en az onun kadar önemlidir. Küçük sensörlü 200MP bir kamera, büyük sensörlü 50MP bir kameranın gerisinde kalabilir.' },
  { id:'su-gecirmez', ad:'IP68 Su Direnci', baslik:'IP68 ve Üzeri Su Dirençli',
    test:p => /IP6[89]/i.test(p.specs['Su Geçirmezlik']||''),
    aciklama:'IP68, cihazın toza tamamen dayanıklı ve üreticinin belirttiği derinlik/süre koşullarında suya dirençli olduğunu gösterir. Bu bir "su geçirmez" garantisi değildir: tuzlu su, basınçlı su ve uzun süreli daldırma genellikle kapsam dışıdır ve çoğu üretici sıvı temasını garanti dışı sayar.' },
  { id:'12gb-ram', ad:'12GB+ RAM', baslik:'12GB ve Üzeri RAM\'li',
    test:p => num(p,'RAM (GB)') >= 12,
    aciklama:'12GB ve üzeri bellek, çok sayıda uygulamayı arka planda açık tutmayı ve ağır oyunlarda takılma yaşamamayı kolaylaştırır. Günlük kullanım için 8GB çoğu kullanıcıya yeterken, yoğun çoklu görev ve uzun vadeli kullanım düşünülüyorsa 12GB anlamlı bir fark yaratır.' },
  { id:'oled', ad:'OLED Ekran', baslik:'OLED / AMOLED Ekranlı',
    test:p => /OLED|AMOLED/i.test(p.specs['Ekran Türü']||''),
    aciklama:'OLED panellerde her piksel kendi ışığını üretir; siyah gösterilirken piksel tamamen kapanır. Bu, LCD\'de elde edilemeyen gerçek siyah ve çok yüksek kontrast anlamına gelir. Koyu temalarda pil tasarrufu da sağlar. Karşılığında uzun süre sabit görüntü kalırsa kalıcı iz (burn-in) riski taşır.' },
  { id:'5g', ad:'5G Desteği', baslik:'5G Destekleyen',
    test:p => /5G/i.test(p.specs['Hücresel Teknoloji']||''),
    aciklama:'5G, uygun kapsama alanında 4G\'ye göre belirgin şekilde yüksek indirme hızı ve düşük gecikme sunar. Türkiye\'de 5G altyapısı yaygınlaşma sürecinde olduğundan, cihazın 5G desteklemesi bugünden çok yakın gelecek için bir yatırımdır.' },
  { id:'kalem', ad:'Kalem Desteği', baslik:'Kalem (Stylus) Destekleyen',
    test:p => /Var/i.test(p.specs['Kalem Desteği']||''),
    aciklama:'Aktif kalem desteği, not alma ve dijital çizim için gereklidir. Kalemin basınç hassasiyeti ve ekranın gecikme süresi (latency) deneyimi doğrudan etkiler. Bazı modellerde kalem kutudan çıkar, bazılarında ayrı satılır — toplam maliyeti hesaplarken bu farkı gözetmek gerekir.' },
  { id:'anc', ad:'Aktif Gürültü Engelleme', baslik:'ANC (Gürültü Engelleyici)',
    test:p => /Var/i.test(p.specs['Aktif Gürültü Engelleme (ANC)']||''),
    aciklama:'Aktif gürültü engelleme, mikrofonla algılanan ortam sesinin tersini üreterek gürültüyü sessizleştirir. Uçak, otobüs ve klima gibi sabit düşük frekanslı seslerde çok etkilidir; ani ve yüksek frekanslı sesleri ise tamamen değil kısmen azaltır. ANC açıkken pil tüketimi artar.' },
];

// ---- Fiyat dilimleri ----
const TIERS = [
  { id:'10000-alti',  ad:'10.000 TL Altı',      min:0,      max:10000 },
  { id:'10000-30000', ad:'10.000 - 30.000 TL',  min:10000,  max:30000 },
  { id:'30000-60000', ad:'30.000 - 60.000 TL',  min:30000,  max:60000 },
  { id:'60000-ustu',  ad:'60.000 TL Üzeri',     min:60000,  max:Infinity },
];

function num(p, key){ return parseFloat(String(p.specs[key]||'').replace(',','.')) || 0; }
function priceOf(p){ return parseFloat(String(p.specs['Fiyat (₺)']||0).replace(/[^\d]/g,'')) || 0; }
function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function slugify(name){
  const tr = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return name.split('').map(ch => tr[ch] !== undefined ? tr[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function productSlug(p){ return `${slugify(p.name)}-${p.id}`; }
function tl(n){ return n.toLocaleString('tr-TR'); }

const GA = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3653440823878417" crossorigin="anonymous"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Q14VG0SB56"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "G-Q14VG0SB56");
</script>`;

function nav(root){
  return `    <nav class="nav-links" id="navLinks">
      <a href="${root}index.html">Anasayfa</a>
      <a href="${root}haberler.html">Haberler</a>
      <a href="${root}yakinda-cikacak.html">Yakında Çıkacak</a>
      <a href="${root}karsilastirmalar.html">Karşılaştırmalar</a>
      <a href="${root}index.html#katalog">Katalog</a>
    </nav>`;
}
function footer(root){
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

function generateLandingPages({ products, computeScores, rootDir }){
  const outDir = path.join(rootDir, 'liste');
  if(fs.existsSync(outDir)) fs.rmSync(outDir, { recursive:true, force:true });
  fs.mkdirSync(outDir, { recursive:true });

  const catalog = products.filter(p => !p.upcoming);
  const scores = computeScores(catalog);
  const cats = [...new Set(catalog.map(p => p.cat))];
  const pages = [];       // sitemap'e girecekler
  let uretilen = 0;

  // ---- ortak sayfa şablonu ----
  function buildPage({ slug, cat, h1, title, desc, intro, items, faq, ilgili }){
    const mainSlug = SLUG_MAP[cat];
    const sorted = [...items].sort((a,b) => (scores[b.id]||0) - (scores[a.id]||0));
    const selfUrl = `https://teknoversus.com.tr/liste/${slug}.html`;
    const dir = RULES.headDirectives(items.length, selfUrl, `https://teknoversus.com.tr/${mainSlug}.html`);

    const prices = sorted.map(priceOf).filter(x => x > 0);
    const enUcuz = prices.length ? Math.min(...prices) : null;
    const enPahali = prices.length ? Math.max(...prices) : null;
    const enIyi = sorted[0];

    // Kısa cevap (AI Summary) — sayfanın özünü tek paragrafta verir
    const tldr = `${cat} kategorisinde ${h1.toLowerCase()} ${items.length} model listelendi.` +
      (enUcuz ? ` Fiyatlar ${tl(enUcuz)} TL ile ${tl(enPahali)} TL arasında değişiyor.` : '') +
      (enIyi && scores[enIyi.id] != null ? ` Fiyat/performans skoruna göre en önde: ${enIyi.name} (${scores[enIyi.id]} puan).` : '');

    const tablo = sorted.map((p,i) => `      <tr style="border-bottom:1px solid var(--line);">
        <td style="padding:8px 10px 8px 0;">${i+1}</td>
        <td style="padding:8px 10px 8px 0;"><a href="../urun/${productSlug(p)}.html">${esc(p.name)}</a></td>
        <td style="padding:8px 10px;font-family:'IBM Plex Mono',monospace;">${priceOf(p) ? tl(priceOf(p))+' ₺' : '—'}</td>
        <td style="padding:8px 0;font-family:'IBM Plex Mono',monospace;">${scores[p.id] ?? '—'}</td>
      </tr>`).join('\n');

    const faqSchema = { "@context":"https://schema.org", "@type":"FAQPage",
      "mainEntity": faq.map(f => ({ "@type":"Question", "name":f.q,
        "acceptedAnswer":{ "@type":"Answer", "text":f.a } })) };

    const itemListSchema = { "@context":"https://schema.org", "@type":"ItemList",
      "name": h1, "description": tldr, "numberOfItems": items.length,
      "itemListOrder":"https://schema.org/ItemListOrderDescending",
      "itemListElement": sorted.slice(0,10).map((p,i) => ({
        "@type":"ListItem", "position":i+1,
        "item":{ "@type":"Product", "name":p.name, "category":p.cat,
          "description": p.blurb || `${p.cat} kategorisinde ${p.name}`,
          "brand":{ "@type":"Brand", "name":p.name.split(' ')[0] },
          "url":`https://teknoversus.com.tr/urun/${productSlug(p)}.html` } })) };

    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
${dir.robots}
${dir.canonical}
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
${JSON.stringify(faqSchema, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(itemListSchema, null, 2)}
</script>
<link rel="icon" type="image/png" href="../assets/logo.png" />
${GA}
</head>
<body>

<header class="site">
  <div class="wrap nav">
    <div class="brand"><a href="../index.html"><picture><source srcset="../assets/logo-header.webp" type="image/webp"/><img src="../assets/logo-header.png" class="brand-logo" alt="TeknoVersus logo" width="144" height="60" decoding="async"/></picture><span class="brand-text"><span class="tekno">TEKNO</span><span class="versus">VERSUS</span></span></a></div>
${nav('../')}
    <button class="burger" id="burgerBtn">☰</button>
  </div>
</header>

<main class="detail-wrap" style="max-width:820px;">
  <div class="breadcrumb">
    <a href="../index.html">Anasayfa</a> / <a href="../${mainSlug}.html">${esc(cat)}</a> / ${esc(h1)}
  </div>
  <h1 class="product-page-h1" style="margin:12px 0 18px;">${esc(h1)}</h1>

  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin-bottom:20px;">
    <strong>Kısa cevap:</strong> ${esc(tldr)}
  </div>

${intro}

  <h2 style="font-size:15px;margin:24px 0 10px;">Fiyat/Performans Sıralaması</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13.5px;margin-bottom:20px;">
    <thead><tr style="border-bottom:2px solid var(--line);">
      <th style="text-align:left;padding:6px 10px 6px 0;">#</th>
      <th style="text-align:left;padding:6px 10px 6px 0;">Ürün</th>
      <th style="text-align:left;padding:6px 10px;">Fiyat</th>
      <th style="text-align:left;padding:6px 0;">Skor</th>
    </tr></thead>
    <tbody>
${tablo}
    </tbody>
  </table>

  <h2 style="font-size:15px;margin:24px 0 10px;">Sıkça Sorulan Sorular</h2>
${faq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(f.a)}</div>
  </div>`).join('\n')}

  <p class="product-notice" style="margin-top:24px;">
    Bu liste, kataloğumuzdaki ürünlerin teknik verilerinden otomatik oluşturulur ve her güncellemede
    yeniden hesaplanır. Fiyat/performans skoru kategori içi göreli bir karşılaştırmadır;
    hesaplama yöntemini <a href="../hakkimizda.html">Hakkımızda</a> sayfasında açıkladık.
  </p>

  <h2 style="font-size:15px;margin:24px 0 10px;">İlgili Listeler</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <a class="chip-filter" href="../${mainSlug}.html">Tüm ${esc(cat)} Kataloğu</a>
    <a class="chip-filter" href="../karsilastirmalar.html">Karşılaştırmalar</a>
    ${ilgili}
  </div>
</main>

${footer('../')}
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;
  }

  // ---- 1) ÖZELLİK landing sayfaları ----
  cats.forEach(cat => {
    const catItems = catalog.filter(p => p.cat === cat);
    FEATURES.forEach(f => {
      const items = catItems.filter(f.test);
      if(!RULES.shouldGenerate(items.length)) return;

      const slug = `${f.id}-${SLUG_MAP[cat]}`;
      const h1 = `${f.baslik} ${cat}lar`;
      const prices = items.map(priceOf).filter(x=>x>0);
      const ort = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : null;
      const oran = Math.round(items.length / catItems.length * 100);

      const intro = `  <p style="font-size:14px;line-height:1.7;">${esc(f.aciklama)}</p>
  <p style="font-size:14px;line-height:1.7;">Kataloğumuzdaki ${catItems.length} ${cat.toLowerCase()} modelinden ${items.length} tanesi bu özelliği taşıyor (yaklaşık %${oran}).${ort ? ` Bu modellerin ortalama fiyatı ${tl(ort)} TL.` : ''} Aşağıdaki liste fiyat/performans skoruna göre sıralanmıştır: skor, ürünün teknik özelliklerinin fiyatına oranını kategori içinde göreli olarak ölçer, yani üstteki modeller "paranın karşılığını en iyi veren" seçeneklerdir.</p>
  <p style="font-size:14px;line-height:1.7;">Listedeki her ürünün kendi sayfasında tam teknik özellik tablosu, alım rehberi ve incelemesi bulunuyor. İki modeli doğrudan yan yana kıyaslamak isterseniz karşılaştırma aracını kullanabilirsiniz.</p>`;

      const faq = [
        { q:`${cat} kategorisinde kaç model ${f.ad.toLowerCase()} sunuyor?`,
          a:`Kataloğumuzdaki ${catItems.length} ${cat.toLowerCase()} modelinden ${items.length} tanesi ${f.ad.toLowerCase()} özelliğine sahip.` },
        { q:`${f.ad} olan en iyi fiyat/performanslı ${cat.toLowerCase()} hangisi?`,
          a: items.length ? `Fiyat/performans skoruna göre ${[...items].sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0))[0].name} bu listenin başında yer alıyor.` : 'Bu kategoride uygun model bulunamadı.' },
        { q:`${f.ad} neden önemli?`, a: f.aciklama.split('.')[0] + '.' },
      ];

      const ilgili = FEATURES.filter(x => x.id !== f.id)
        .filter(x => RULES.shouldGenerate(catItems.filter(x.test).length))
        .slice(0,3)
        .map(x => `<a class="chip-filter" href="${x.id}-${SLUG_MAP[cat]}.html">${esc(x.baslik)} ${esc(cat)}lar</a>`).join('\n    ');

      const html = buildPage({ slug, cat, h1,
        title:`${h1} — Fiyat ve Karşılaştırma ${new Date().getFullYear()} | TeknoVersus`,
        desc:`${cat} kategorisinde ${f.ad.toLowerCase()} sunan ${items.length} model. Fiyat/performans skoruna göre sıralı liste, güncel fiyatlar ve karşılaştırma.`,
        intro, items, faq, ilgili });

      fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
      uretilen++;
      if(RULES.shouldIndex(items.length)) pages.push({ url:`liste/${slug}.html`, priority:RULES.sitemapPriority(items.length) });
    });
  });

  // ---- 2) FİYAT landing sayfaları ----
  cats.forEach(cat => {
    const catItems = catalog.filter(p => p.cat === cat);
    TIERS.forEach(t => {
      const items = catItems.filter(p => { const v = priceOf(p); return v > 0 && v >= t.min && v < t.max; });
      if(!RULES.shouldGenerate(items.length)) return;

      const slug = `${t.id}-${SLUG_MAP[cat]}`;
      const h1 = `${t.ad} ${cat}lar`;
      const prices = items.map(priceOf);
      const enUcuz = Math.min(...prices), enPahali = Math.max(...prices);
      const enIyi = [...items].sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0))[0];

      const intro = `  <p style="font-size:14px;line-height:1.7;">${t.ad} fiyat aralığındaki ${cat.toLowerCase()} modellerini bir arada listeledik. Bu aralıkta kataloğumuzda ${items.length} model bulunuyor; fiyatlar ${tl(enUcuz)} TL ile ${tl(enPahali)} TL arasında değişiyor.</p>
  <p style="font-size:14px;line-height:1.7;">Liste, fiyat/performans skoruna göre sıralanmıştır. Bu skor, ürünün teknik özelliklerini kategori içindeki en düşük ve en yüksek değerlere göre normalize edip fiyatına oranlayarak hesaplanır. Yani listenin üst sıraları "en pahalı" ya da "en güçlü" modeller değil, <strong>ödediğiniz paranın karşılığını en iyi veren</strong> modellerdir. Bu aralıkta öne çıkan model ${enIyi ? esc(enIyi.name) : '—'}.</p>
  <p style="font-size:14px;line-height:1.7;">Bütçe belirlerken şunu göz önünde bulundurmakta fayda var: aynı fiyat aralığındaki iki ürün çok farklı önceliklere hitap edebilir. Biri kameraya, diğeri pil ömrüne ağırlık vermiş olabilir. Aşağıdaki listeden ilgilendiğiniz modele girip tam özellik tablosunu incelemenizi, gerekirse iki modeli yan yana karşılaştırmanızı öneririz.</p>`;

      const faq = [
        { q:`${t.ad} bütçeyle hangi ${cat.toLowerCase()} alınır?`,
          a:`Bu aralıkta kataloğumuzda ${items.length} model var. Fiyat/performans skoruna göre en önde ${enIyi ? enIyi.name : '—'} yer alıyor.` },
        { q:`${t.ad} ${cat.toLowerCase()} fiyatları ne kadar?`,
          a:`Bu listedeki modellerin fiyatları ${tl(enUcuz)} TL ile ${tl(enPahali)} TL arasında değişiyor. Fiyatlar düzenli olarak güncellenir ancak anlık piyasa değişimlerini yansıtmayabilir.` },
        { q:`Fiyat/performans skoru nasıl hesaplanıyor?`,
          a:`Ürünün sayısal teknik özellikleri kategori içinde normalize edilir, ortalaması alınır ve kategorinin en ucuz ürününün fiyatına oranlanarak ağırlıklandırılır. Detaylı yöntem Hakkımızda sayfasında açıklanmıştır.` },
      ];

      const ilgili = TIERS.filter(x => x.id !== t.id)
        .filter(x => RULES.shouldGenerate(catItems.filter(p => { const v=priceOf(p); return v>0 && v>=x.min && v<x.max; }).length))
        .map(x => `<a class="chip-filter" href="${x.id}-${SLUG_MAP[cat]}.html">${esc(x.ad)} ${esc(cat)}lar</a>`).join('\n    ');

      const html = buildPage({ slug, cat, h1,
        title:`${h1} — En İyi Modeller ve Fiyatları ${new Date().getFullYear()} | TeknoVersus`,
        desc:`${t.ad} ${cat.toLowerCase()} modelleri: ${items.length} seçenek, fiyat/performans skoruna göre sıralı. Güncel fiyatlar ve karşılaştırma.`,
        intro, items, faq, ilgili });

      fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
      uretilen++;
      if(RULES.shouldIndex(items.length)) pages.push({ url:`liste/${slug}.html`, priority:RULES.sitemapPriority(items.length) });
    });
  });

  // ---- HUB: kategori sayfalarına "Popüler Listeler" bloğu (idempotent) ----
  // Bu blok olmadan landing sayfaları yetim (orphan) kalır: kullanıcı
  // ulaşamaz, arama motoru iç link sinyali göremez. 8+ ürünlü (yüksek
  // öncelikli) sayfalar önce, sonra 4-7 ürünlüler listelenir; noindex olan
  // ince sayfalara HUB'dan link verilmez.
  const MS = '<!-- LISTELER_START -->', ME = '<!-- LISTELER_END -->';
  cats.forEach(cat => {
    const catItems = catalog.filter(p => p.cat === cat);
    const mainSlug = SLUG_MAP[cat];
    const file = path.join(rootDir, `${mainSlug}.html`);
    if(!fs.existsSync(file)) return;

    const linkler = [];
    TIERS.forEach(t => {
      const n = catItems.filter(p => { const v = priceOf(p); return v>0 && v>=t.min && v<t.max; }).length;
      if(RULES.shouldIndex(n)) linkler.push({ n, href:`liste/${t.id}-${mainSlug}.html`, ad:`${t.ad} ${cat}lar` });
    });
    FEATURES.forEach(f => {
      const n = catItems.filter(f.test).length;
      if(RULES.shouldIndex(n)) linkler.push({ n, href:`liste/${f.id}-${mainSlug}.html`, ad:`${f.baslik} ${cat}lar` });
    });
    if(!linkler.length) return;

    linkler.sort((a,b) => b.n - a.n); // en çok ürünlü (en güçlü) sayfa önce
    const chips = linkler.map(l => `<a class="chip-filter" href="${l.href}">${esc(l.ad)} (${l.n})</a>`).join('\n      ');
    const blok = `${MS}
    <section style="margin:20px 0;">
      <h2 style="font-size:15px;margin:0 0 10px;">Bütçene ve İhtiyacına Göre ${esc(cat)} Listeleri</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${chips}
      </div>
    </section>
    ${ME}`;

    let html = fs.readFileSync(file, 'utf8');
    const rx = new RegExp(MS + '[\\s\\S]*?' + ME);
    html = rx.test(html) ? html.replace(rx, blok) : html.replace('</main>', `  ${blok}\n</main>`);
    fs.writeFileSync(file, html);
  });
  console.log('Kategori sayfalarına "Popüler Listeler" hub bloğu eklendi.');

  console.log(`${uretilen} özellik/fiyat landing sayfası oluşturuldu (${pages.length} tanesi indekslenebilir) -> liste/`);

  // ---- sitemap: SADECE indekslenebilir olanlar ----
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/liste\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
    const today = new Date().toISOString().slice(0,10);
    const entries = pages.map(p => `  <url>
    <loc>https://teknoversus.com.tr/${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');
    if(entries) xml = xml.replace('</urlset>', `${entries}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
    console.log(`sitemap.xml güncellendi, +${pages.length} landing URL'si eklendi (ince sayfalar hariç).`);
  }

  return { pages, FEATURES, TIERS };
}

module.exports = { generateLandingPages, FEATURES, TIERS, SLUG_MAP };
