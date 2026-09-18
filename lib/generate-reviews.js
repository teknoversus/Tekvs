// ============================================================
// TeknoVersus — Faz 3: "İnceleme" sayfaları (PRODUCT_REVIEW_SYSTEM.md).
// 12 bölümlü format: Kısa cevap, Kimler almalı, Kimler almamalı,
// Teknik tablo, Tasarım, Ekran, Performans, Kamera, Pil, Artılar,
// Eksiler, Son karar.
//
// DÜRÜSTLÜK NOTU: Bu incelemeler elle/laboratuvar testine dayanmaz —
// üreticinin resmi teknik özelliklerinin kategori ortalamasıyla veri
// odaklı karşılaştırılmasına dayanır. Her sayfada bu açıkça belirtilir.
// Sponsor dili kullanılmaz, eksiler mutlaka yazılır.
// ============================================================
const fs = require('fs');
const path = require('path');

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};

const TOPICAL_GUIDE_MAP = {
  'Telefon':'telefon-nasil-secilir', 'Dizüstü':'dizustu-bilgisayar-nasil-secilir',
  'Kulaklık':'kulaklik-nasil-secilir', 'Kamera':'kamera-nasil-secilir',
  'Akıllı Saat':'akilli-saat-nasil-secilir', 'Tablet':'tablet-nasil-secilir',
  'Televizyon':'televizyon-nasil-secilir'
};

function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

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
function slugify(name){
  const trMap = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return name.split('').map(ch => trMap[ch] !== undefined ? trMap[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function productSlug(p){ return `${slugify(p.name)}-${p.id}`; }
function num(v){ const n = parseFloat(String(v||'').replace(',','.').replace(/[^\d.-]/g,'')); return isNaN(n) ? null : n; }
function avg(arr){ const nums = arr.filter(x => x != null); return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null; }

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

function rel(val, catAvg, unit, higherBetter=true){
  if(val == null || catAvg == null) return null;
  const diffPct = ((val - catAvg) / catAvg) * 100;
  if(Math.abs(diffPct) < 8) return { level:'ortalama', text: `kategori ortalamasına (${catAvg.toFixed(1)}${unit}) yakın` };
  const better = higherBetter ? diffPct > 0 : diffPct < 0;
  return {
    level: better ? 'üstün' : 'zayıf',
    text: `kategori ortalamasının ${better ? 'üzerinde' : 'altında'} (ortalama: ${catAvg.toFixed(1)}${unit})`
  };
}

function generateReviews({ products, prosConsFor, computeScores, targetIds, rootDir }){
  const outDir = path.join(rootDir, 'inceleme');
  // Klasörü ÖNCE temizle — eski/geçersiz kombinasyonlardan kalan yetim
  // (orphan) dosyalar birikmesin (ürün verisi değiştikçe eski dosyalar
  // hiç silinmiyordu, bu da canlıda kullanılmayan sayfalara yol açıyordu).
  if(fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const catalog = products.filter(p => !p.upcoming);
  const scores = computeScores(catalog);
  const pages = [];

  targetIds.forEach(id => {
    const p = catalog.find(x => x.id === id);
    if(!p) return;
    const catProducts = catalog.filter(c => c.cat === p.cat);
    const { pros, cons } = prosConsFor(p, catProducts);
    const score = scores[p.id];
    const catScores = catProducts.map(c => scores[c.id]).filter(s => s != null);
    const rank = catScores.length ? [...catScores].sort((a,b)=>b-a).indexOf(score) + 1 : null;
    const specs = p.specs || {};
    const priceKey = Object.keys(specs).find(k => /fiyat/i.test(k));
    const price = priceKey ? specs[priceKey] : null;
    const mainSlug = SLUG_MAP[p.cat] || 'index';
    const pUrl = `../urun/${productSlug(p)}.html`;
    const slug = `${slugify(p.name)}-${p.id}-inceleme`;

    // Kategori ortalamaları (bulunan alanlar için)
    const screenKey = Object.keys(specs).find(k => /ekran \(inç\)/i.test(k));
    const batteryKey = Object.keys(specs).find(k => /pil \(mah\)/i.test(k));
    const ramKey = Object.keys(specs).find(k => /ram/i.test(k));
    const camKey = Object.keys(specs).find(k => /kamera \(mp\)/i.test(k));
    const weightKey = Object.keys(specs).find(k => /ağırlığı/i.test(k));
    const refreshKey = Object.keys(specs).find(k => /yenileme/i.test(k));

    const catAvgScreen = avg(catProducts.map(c => screenKey ? num(c.specs[screenKey]) : null));
    const catAvgBattery = avg(catProducts.map(c => batteryKey ? num(c.specs[batteryKey]) : null));
    const catAvgRam = avg(catProducts.map(c => ramKey ? num(c.specs[ramKey]) : null));
    const catAvgCam = avg(catProducts.map(c => camKey ? num(c.specs[camKey]) : null));
    const catAvgWeight = avg(catProducts.map(c => weightKey ? num(c.specs[weightKey]) : null));

    const screenRel = rel(screenKey ? num(specs[screenKey]) : null, catAvgScreen, '"');
    const batteryRel = rel(batteryKey ? num(specs[batteryKey]) : null, catAvgBattery, 'mAh');
    const ramRel = rel(ramKey ? num(specs[ramKey]) : null, catAvgRam, 'GB');
    const camRel = rel(camKey ? num(specs[camKey]) : null, catAvgCam, 'MP');
    const weightRel = rel(weightKey ? num(specs[weightKey]) : null, catAvgWeight, 'g', false);

    const tier = score != null && catScores.length ? (rank <= Math.ceil(catScores.length*0.33) ? 'high' : rank <= Math.ceil(catScores.length*0.66) ? 'mid' : 'low') : 'mid';

    // ---- Bölüm metinleri ----
    // Tier'e göre değişen açılış cümleleri + birden fazla pros/cons +
    // kategori-göreli spec karşılaştırması — 671 sayfanın hepsinin aynı
    // tek şablonu tekrarlamasını önlemek için (hiçbir veri uydurulmuyor,
    // sadece zaten hesaplanmış olan pros/cons/rel değerleri daha zengin
    // bir cümle yapısında birleştiriliyor).
    const rankPhrase = rank ? `${catScores.length} model arasında ${rank}. sırada yer alıyor` : 'kategorisinde değerlendirildi';
    const openings = {
      high: `${p.name}, ${p.cat.toLowerCase()} kategorisinde fiyat/performans skoruna göre ${rankPhrase} — bu, kategorideki en güçlü seçeneklerden biri olduğu anlamına geliyor.`,
      mid: `${p.name}, ${p.cat.toLowerCase()} kategorisinde fiyat/performans skoruna göre ${rankPhrase}, yani kategori ortalamasına yakın, dengeli bir konumda.`,
      low: `${p.name}, ${p.cat.toLowerCase()} kategorisinde fiyat/performans skoruna göre ${rankPhrase}; bu sıralama tek başına ürünü değersiz yapmaz, bütçe veya öncelik farklı olduğunda hâlâ mantıklı bir seçim olabilir.`,
    };
    const relFacts = [
      screenRel && `Ekran ${screenRel.text}`,
      batteryRel && `Pil ${batteryRel.text}`,
      ramRel && `RAM ${ramRel.text}`,
      camRel && `Kamera ${camRel.text}`,
      weightRel && `Ağırlık ${weightRel.text}`,
    ].filter(Boolean);
    const strengthsPart = pros.length
      ? ` ${pros.slice(0,2).join(' ve ')} ${pros.length > 1 ? 'öne çıkan yönleri' : 'öne çıkan yönü'}.`
      : '';
    const weaknessPart = cons.length
      ? ` ${cons.slice(0,2).map(c => c.toLowerCase()).join(', ')} ise satın almadan önce göz önünde bulundurulması gereken noktalar.`
      : '';
    const relPart = relFacts.length ? ` ${relFacts[0]}.` : '';
    const tldr = `${openings[tier]}${strengthsPart}${weaknessPart}${relPart}`.replace(/\s+/g,' ').trim();

    const kimlerAlmali = pros.length
      ? `${pros.join(', ')} sizin için öncelikliyse ${p.name} makul bir seçenek. ${tier === 'high' ? 'Kategorisindeki fiyat/performans sıralamasında üst dilimde yer alması, bütçe bilinciyle karar verenler için ek bir avantaj.' : ''}`
      : `${p.name}, kategori ortalamasına yakın dengeli özellikleriyle genel kullanım için makul bir seçenek.`;

    const kimlerAlmamali = cons.length
      ? `${cons.join(', ')} sizin için kritikse, bu fiyat aralığındaki alternatifleri de incelemenizi öneririz.`
      : `Belirgin bir zayıf nokta öne çıkmıyor; yine de ihtiyacınıza özel karşılaştırma yapmanız faydalı olur.`;

    const tasarim = weightRel
      ? `${p.name}, ${weightKey ? esc(specs[weightKey])+'g ağırlığıyla' : 'gövde ağırlığı bakımından'} ${weightRel.text}. ${weightRel.level === 'üstün' ? 'Bu, günlük taşınabilirlik açısından bir avantaj sağlıyor.' : weightRel.level === 'zayıf' ? 'Bu, uzun süreli taşınabilirlik açısından bir dezavantaj olabilir.' : 'Gövde ağırlığı bu kategoride tipik bir seviyede.'}`
      : `${p.name}'in tasarımı, kategorisindeki tipik gövde standartlarını takip ediyor.`;

    const ekran = screenKey
      ? `${esc(specs[screenKey])}" ekranıyla ${p.name}, ${screenRel ? screenRel.text : 'kategori standardında bir ekran boyutuna sahip'}. ${refreshKey ? `${esc(specs[refreshKey])}Hz yenileme hızı, ${num(specs[refreshKey]) >= 120 ? 'akıcı bir kaydırma/oyun deneyimi sunuyor.' : 'standart bir kullanım deneyimi sunuyor.'}` : ''}`
      : `${p.name}'in ekran özellikleri, kategori standartlarına uygun.`;

    const performans = ramRel
      ? `${ramKey ? esc(specs[ramKey])+'GB RAM ile' : ''} ${p.name}, bellek tarafında ${ramRel.text}. ${ramRel.level === 'üstün' ? 'Bu, çoklu görev ve ağır uygulama kullanımında rahatlık sağlıyor.' : ramRel.level === 'zayıf' ? 'Yoğun çoklu görev kullanımında bu sınırlayıcı olabilir.' : 'Günlük kullanım için yeterli bir seviyede.'}`
      : `${p.name}'in performans donanımı, fiyat segmentine uygun bir seviyede konumlanıyor.`;

    const kamera = camKey
      ? `Ana kamera ${esc(specs[camKey])}MP çözünürlüğe sahip, bu da kategori ${camRel ? camRel.text : 'ortalamasında'}. Ancak çözünürlük tek başına kamera kalitesini belirlemiyor; sensör boyutu ve görüntü işleme yazılımı da sonucu doğrudan etkiliyor.`
      : `${p.name}'in kamera özellikleri hakkında detaylı veri için tam özellik sayfasına bakılabilir.`;

    const pil = batteryKey
      ? `${esc(specs[batteryKey])} mAh batarya, kategori ${batteryRel ? batteryRel.text : 'ortalamasında bir kapasiteye sahip'}. ${batteryRel && batteryRel.level === 'üstün' ? 'Bu, yoğun kullanıcılar için gün sonuna daha rahat ulaşmayı kolaylaştırıyor.' : batteryRel && batteryRel.level === 'zayıf' ? 'Yoğun kullanımda gün içinde şarj ihtiyacı doğabilir.' : ''}`
      : `${p.name}'in pil kapasitesi, kategorisindeki tipik seviyede.`;

    const sonKarar = `${p.name}, ${tier === 'high' ? 'fiyat/performans açısından kategorisinin güçlü modellerinden biri' : tier === 'mid' ? 'fiyat/performans açısından kategori ortalamasında dengeli bir seçenek' : 'fiyat/performans açısından kategori ortalamasının gerisinde kalan bir model'}. ${pros[0] || ''} ${cons.length ? 'Ancak ' + cons[0].toLowerCase() + ' göz önünde bulundurulmalı.' : ''}`.replace(/\s+/g,' ').trim();

    const teknikTablo = Object.entries(specs).slice(0, 12);

    const faq = [
      { q: `${p.name} incelemesi ne diyor?`, a: tldr },
      { q: `${p.name}'in en büyük artısı ne?`, a: pros[0] || 'Kategori ortalamasına yakın dengeli bir profil sunuyor.' },
      { q: `${p.name}'in en büyük eksisi ne?`, a: cons[0] || 'Belirgin bir zayıf nokta tespit edilmedi.' },
    ];

    const bodyHtml = `
  <div class="breadcrumb">
    <a href="../index.html">Anasayfa</a> / <a href="../${mainSlug}.html">${esc(p.cat)}</a> / ${esc(p.name)} İncelemesi
  </div>
  <h1 class="product-page-h1" style="margin:12px 0 8px;">${esc(p.name)} İncelemesi</h1>
  <div style="font-size:12.5px;color:var(--ink-soft);margin:0 0 18px;">
    <span rel="author">Sinan Tanrı</span> · <a href="../hakkimizda.html" style="color:inherit;">TeknoVersus editör ekibi</a>
  </div>

  ${shareButtonsHTML(`https://teknoversus.com.tr/inceleme/${slug}.html`, `${p.name} İncelemesi`)}

  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin-bottom:20px;">
    <strong>Kısa cevap:</strong> ${esc(tldr)}
  </div>

  <h2 style="font-size:15px;margin:20px 0 8px;">Kimler Almalı</h2>
  <p style="font-size:13.5px;line-height:1.7;">${esc(kimlerAlmali)}</p>

  <h2 style="font-size:15px;margin:20px 0 8px;">Kimler Almamalı</h2>
  <p style="font-size:13.5px;line-height:1.7;">${esc(kimlerAlmamali)}</p>

  <h2 style="font-size:15px;margin:20px 0 10px;">Teknik Özellikler</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
    <tbody>
${teknikTablo.map(([k,v]) => `      <tr style="border-bottom:1px solid var(--line);"><td style="padding:7px 10px 7px 0;color:var(--ink-soft);">${esc(k)}</td><td style="padding:7px 0;font-weight:600;font-family:'IBM Plex Mono',monospace;">${esc(v)}</td></tr>`).join('\n')}
    </tbody>
  </table>

  <h2 style="font-size:15px;margin:20px 0 8px;">Tasarım</h2>
  <p style="font-size:13.5px;line-height:1.7;">${esc(tasarim)}</p>

  <h2 style="font-size:15px;margin:20px 0 8px;">Ekran</h2>
  <p style="font-size:13.5px;line-height:1.7;">${esc(ekran)}</p>

  <h2 style="font-size:15px;margin:20px 0 8px;">Performans</h2>
  <p style="font-size:13.5px;line-height:1.7;">${esc(performans)}</p>

  <h2 style="font-size:15px;margin:20px 0 8px;">Kamera</h2>
  <p style="font-size:13.5px;line-height:1.7;">${esc(kamera)}</p>

  <h2 style="font-size:15px;margin:20px 0 8px;">Pil</h2>
  <p style="font-size:13.5px;line-height:1.7;">${esc(pil)}</p>

  <h2 style="font-size:15px;margin:20px 0 10px;">Artılar ve Eksiler</h2>
  <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px;">
    <div style="flex:1;min-width:220px;">
      <div style="font-weight:600;font-size:13px;color:#1D9E75;margin-bottom:6px;">Artılar</div>
      <ul style="font-size:13px;padding-left:18px;line-height:1.8;">${pros.length ? pros.map(x=>`<li>${esc(x)}</li>`).join('') : '<li>Kategori ortalamasına yakın, dengeli bir profil</li>'}</ul>
    </div>
    <div style="flex:1;min-width:220px;">
      <div style="font-weight:600;font-size:13px;color:#C0392B;margin-bottom:6px;">Eksiler</div>
      <ul style="font-size:13px;padding-left:18px;line-height:1.8;">${cons.length ? cons.map(x=>`<li>${esc(x)}</li>`).join('') : '<li>Belirgin bir zayıf nokta tespit edilmedi</li>'}</ul>
    </div>
  </div>

  <h2 style="font-size:15px;margin:20px 0 8px;">Son Karar</h2>
  <p style="font-size:13.5px;line-height:1.7;font-weight:500;">${esc(sonKarar)}</p>

  <h2 style="font-size:15px;margin:24px 0 10px;">Sıkça Sorulan Sorular</h2>
${faq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(f.a)}</div>
  </div>`).join('\n')}

  <p class="product-notice" style="margin-top:24px;">
    Bu inceleme, üreticinin resmi teknik özelliklerinin kategori ortalamasıyla veri odaklı
    karşılaştırılmasına dayanır — elle/laboratuvar testi sonucu değildir. Sponsorlu içerik değildir.
  </p>

  <h2 style="font-size:15px;margin:24px 0 10px;">İlgili Bağlantılar</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <a class="chip-filter" href="${pUrl}">${esc(p.name)} Tam Özellikleri</a>
    <a class="chip-filter" href="../rehber/${slugify(p.name)}-${p.id}-alinir-mi.html">${esc(p.name)} Alınır mı?</a>
    <a class="chip-filter" href="../${mainSlug}.html">${esc(p.cat)} Kataloğu</a>
    <a class="chip-filter" href="../karsilastirmalar.html">Karşılaştırmalar</a>
    ${TOPICAL_GUIDE_MAP[p.cat] ? `<a class="chip-filter" href="../rehber/${TOPICAL_GUIDE_MAP[p.cat]}.html">${esc(p.cat)} Nasıl Seçilir?</a>` : ''}
  </div>`;

    const faqSchema = { "@context":"https://schema.org", "@type":"FAQPage", "mainEntity": faq.map(f => ({ "@type":"Question", "name":f.q, "acceptedAnswer": { "@type":"Answer", "text":f.a } })) };
    // Google'ın "Product snippet" kuralı, Product'ın KENDİSİNİN (dıştaki
    // tipin) offers/review/aggregateRating içermesini bekliyor — Review'i
    // dışta, Product'ı onun itemReviewed'i olarak içte kurmak bu kuralı
    // karşılamıyor (Google, iç içeki Product'ı bağımsız değerlendiriyor).
    // Bu yüzden Product dışta, Review onun "review" özelliği olarak içeride.
    const productSchema = {
      "@context": "https://schema.org", "@type": "Product",
      "name": p.name, "category": p.cat,
    };
    // Fiyat/Performans Skoru üzerinden editöryel bir Review puanlaması.
    // Skor hesaplanamayan (score null) ürünlerde sahte bir puan
    // uydurmamak için review hiç eklenmiyor.
    if(score != null){
      productSchema.review = {
        "@type": "Review",
        "reviewBody": tldr,
        "author": { "@type": "Person", "name": "Sinan Tanrı", "url": "https://teknoversus.com.tr/hakkimizda.html" },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": String(score),
          "bestRating": "100",
          "worstRating": "0"
        }
      };
    }

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(p.name)} İncelemesi — Artılar, Eksiler, Son Karar | TeknoVersus</title>
<meta name="description" content="${esc(tldr)}" />
<link rel="canonical" href="https://teknoversus.com.tr/inceleme/${slug}.html" />
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
${JSON.stringify(faqSchema, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(productSchema, null, 2)}
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

<main class="detail-wrap" style="max-width:760px;">
  ${bodyHtml}
</main>

${footerHTML('../')}
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;
    fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
    pages.push(`inceleme/${slug}.html`);
  });

  console.log(`${pages.length} inceleme sayfası oluşturuldu -> inceleme/`);

  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if(fs.existsSync(sitemapPath)){
    let xml = fs.readFileSync(sitemapPath, 'utf8');
    xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/inceleme\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
    const today = new Date().toISOString().slice(0,10);
    const entries = pages.map(p => `  <url>
    <loc>https://teknoversus.com.tr/${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');
    xml = xml.replace('</urlset>', `${entries}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
    console.log(`sitemap.xml güncellendi, +${pages.length} inceleme URL'si eklendi.`);
  }

  return pages;
}

module.exports = { generateReviews };
