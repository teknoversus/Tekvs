const { editorialForProduct, renderProductEditorial } = require('./editorial');
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
const { specValueMissing, productIndexable } = require('./spec-utils');
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
// Metindeki İLK sayıyı döndürür ("5000 mAh" → 5000, "15,6" → 15.6). Eski sürüm
// tüm rakam dışı karakterleri silip birleştiriyordu ("1920 x 1080" → 19201080).
function num(v){
  const m = String(v == null ? '' : v).match(/\d+(?:[.,]\d+)?/);
  if(!m) return null;
  const n = parseFloat(m[0].replace(',', '.'));
  return isNaN(n) ? null : n;
}
function maxNum(v){
  const all = (String(v == null ? '' : v).match(/\d+(?:[.,]\d+)?/g) || []).map(x => parseFloat(x.replace(',', '.'))).filter(x => !isNaN(x));
  return all.length ? Math.max(...all) : null;
}
// Büyük sayılarda (ağırlık, mAh) ondalık gösterilmez: 2172,3 g → 2.172 g.
function fmtNum(n){ return Number(n).toLocaleString('tr-TR', { maximumFractionDigits: Math.abs(Number(n)) >= 100 ? 0 : 1 }); }

// Gerçek değeri olan ilk eşleşen özelliği bulur (yoksa null). Yer tutucu
// ("Belirtilmemiş") değerler burada elenir — eski sürüm anahtarın VARLIĞINA
// bakıyor, "BelirtilmemişMP çözünürlük" gibi cümleler üretiyordu.
function findSpec(specs, re){
  const key = Object.keys(specs || {}).find(k => re.test(k) && !specValueMissing(specs[k]));
  return key ? { key, raw: String(specs[key]).trim(), n: num(specs[key]) } : null;
}
// Kategori ortalaması: en az 3 üründe sayısal değer varsa (yoksa kıyas yapılmaz).
function catAvg(catProducts, re){
  const vals = catProducts.map(c => { const sp = findSpec(c.specs || {}, re); return sp ? sp.n : null; }).filter(x => x != null);
  return vals.length >= 3 ? vals.reduce((a,b) => a+b, 0) / vals.length : null;
}
// Değerin kategori ortalamasına göre konumu. level: 'üstün' | 'zayıf' | 'ortalama'
function compare(val, avgVal, unit, lowerBetter = false){
  if(val == null || avgVal == null || avgVal === 0) return null;
  const diffPct = ((val - avgVal) / avgVal) * 100;
  const ref = `${fmtNum(avgVal)}${unit ? ' ' + unit : ''}`;
  if(Math.abs(diffPct) < 8) return { level: 'ortalama', phrase: `kategori ortalamasına (${ref}) yakın` };
  const above = diffPct > 0;
  return {
    level: (lowerBetter ? !above : above) ? 'üstün' : 'zayıf',
    phrase: `kategori ortalamasının (${ref}) ${above ? 'üzerinde' : 'altında'}`
  };
}
// Cümle ortasında kullanılacak madde: baş harfi küçültür ("Kategori…" → "kategori…"),
// kısaltmayla başlayanlara ("RAM …") dokunmaz.
function lcFirst(t){
  const str = String(t || '');
  return /^[A-ZÇĞİÖŞÜ][a-zçğıöşü]/.test(str) ? str.charAt(0).toLocaleLowerCase('tr-TR') + str.slice(1) : str;
}
function storageText(raw){
  const n = num(raw);
  if(n == null || !/^[\d.,]+$/.test(String(raw).trim())) return String(raw);
  return (n >= 1024 && n % 1024 === 0) ? `${n / 1024} TB` : `${fmtNum(n)} GB`;
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

function generateReviews({ products, prosConsFor, computeScores, targetIds, rootDir }){
  const outDir = path.join(rootDir, 'inceleme');
  // Klasörü ÖNCE temizle — eski/geçersiz kombinasyonlardan kalan yetim
  // (orphan) dosyalar birikmesin (ürün verisi değiştikçe eski dosyalar
  // hiç silinmiyordu, bu da canlıda kullanılmayan sayfalara yol açıyordu).
  if(fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const catalog = products.filter(p => !p.upcoming);
  const scores = computeScores(catalog);
  const pages = []; // yalnızca indekslenebilir olanlar (sitemap'e girecekler)
  let generated = 0;

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

    // ---- Veriye dayalı bölümler ----
    // 7 Ekim 2026: Eski sürüm her üründe aynı 5 başlığı (Tasarım, Ekran,
    // Performans, Kamera, Pil) basıyor; veri yoksa "tasarımı kategorisindeki
    // tipik gövde standartlarını takip ediyor" gibi HİÇBİR VERİYE dayanmayan
    // dolgu cümleleri yazıyordu (dizüstü ve TV incelemelerinde "Kamera"
    // başlığı dahil). Artık bir bölüm YALNIZCA ürünün kayıtlı özelliklerinden
    // en az bir cümle kurulabiliyorsa yer alır; dolgu cümlesi yoktur.
    const sp = re => findSpec(specs, re);
    const sections = [];
    const addSection = (title, sentences) => { const list = sentences.filter(Boolean); if(list.length) sections.push({ title, text: list.join(' ') }); };

    // Tasarım
    {
      const out = [];
      const w = sp(/ağırlı[kğ]/i);
      if(w && w.n != null){
        const unit = /\(kg\)/i.test(w.key) ? 'kg' : 'g';
        // Televizyonda ağırlık ekran boyutuna bağlı olduğu için ortalamayla kıyaslanmaz.
        const c = p.cat === 'Televizyon' ? null : compare(w.n, catAvg(catProducts, /ağırlı[kğ]/i), unit, true);
        out.push(`${p.name} ${fmtNum(w.n)} ${unit} ağırlığında${c ? (c.level === 'üstün' ? `; kategori ortalaması ${c.phrase.match(/\(([^)]+)\)/)[1]} olduğu için ortalamadan hafif bir model.` : c.level === 'zayıf' ? `; kategori ortalaması ${c.phrase.match(/\(([^)]+)\)/)[1]} olduğu için ortalamadan ağır bir model.` : `; bu, ${c.phrase}.`) : '.'}`);
      }
      const th = sp(/kalınlık/i);
      if(th && th.n != null) out.push(`Gövde kalınlığı ${fmtNum(th.n)} mm.`);
      const mat = sp(/kasa malzemesi/i);
      if(mat) out.push(`Kasa malzemesi: ${mat.raw}.`);
      const water = sp(/su geçirmezlik|su\/toz|su\/ter/i);
      if(water && !/^(yok|hayır)/i.test(water.raw)) out.push(`Su ve toza karşı dayanıklılık: ${water.raw}.`);
      addSection('Tasarım', out);
    }

    // Ekran (kulaklıkta ekran yok)
    if(p.cat !== 'Kulaklık'){
      const out = [];
      const size = sp(/^ekran \(inç\)/i), type = sp(/^ekran türü/i), res = sp(/^çözünürlük$/i);
      const hz = sp(/yenileme hızı/i), nit = sp(/parlaklı/i);
      if(size || type || res){
        const head = [size ? `${size.raw} inç` : '', type ? type.raw : ''].filter(Boolean).join(' ');
        out.push(`${p.name}${head ? `, ${head} ekrana sahip` : ' ekranı'}${res ? `${head ? ';' : ''} çözünürlük ${res.raw}` : ''}.`);
      }
      if(hz){
        const top = maxNum(hz.raw);
        out.push(`Yenileme hızı ${hz.raw} Hz${top != null && top >= 120 ? '; bu, kaydırmada ve oyunlarda daha akıcı bir görüntü anlamına geliyor.' : top != null && top <= 60 ? '; günlük kullanım için standart seviye.' : '.'}`);
      }
      if(nit && nit.n != null){
        const c = compare(nit.n, catAvg(catProducts, /parlaklı/i), 'nit');
        out.push(`Ekran parlaklığı ${fmtNum(nit.n)} nit${c ? `; ${c.phrase}.` : '.'}`);
      }
      addSection('Ekran', out);
    }

    // Performans
    {
      const out = [];
      const cpu = sp(/^[iİ]şlemci/i), ram = sp(/^ram \(gb\)/i), sto = sp(/^depolama/i), gpu = sp(/^ekran kartı/i), tgp = sp(/gpu tgp/i);
      if(cpu) out.push(`${p.name}, ${cpu.raw} işlemciyle geliyor.`);
      if(ram && ram.n != null){
        const c = compare(ram.n, catAvg(catProducts, /^ram \(gb\)/i), 'GB');
        out.push(`${fmtNum(ram.n)} GB RAM${c ? `, ${c.phrase}${c.level === 'üstün' ? '; çoklu görevde ve ağır uygulamalarda rahatlık sağlar.' : c.level === 'zayıf' ? '; yoğun çoklu görev kullanımında sınırlayıcı olabilir.' : '.'}` : ' bulunuyor.'}`);
      }
      if(sto) out.push(`Depolama alanı ${storageText(sto.raw)}.`);
      if(gpu) out.push(`Grafik tarafında ${gpu.raw} bulunuyor${tgp && tgp.n != null ? ` (${fmtNum(tgp.n)} W güç sınırı)` : ''}.`);
      addSection('Performans', out);
    }

    // Kamera — yalnızca kameranın ürünün asıl işlevlerinden olduğu kategorilerde
    if(p.cat === 'Telefon' || p.cat === 'Tablet'){
      const out = [];
      const main = sp(/^(arka )?kamera \(mp\)/i), front = sp(/^ön kamera \(mp\)/i);
      if(main){
        const c = main.n != null ? compare(main.n, catAvg(catProducts, /^(arka )?kamera \(mp\)/i), 'MP') : null;
        out.push(`Ana kamera ${main.raw} MP${c ? `; ${c.phrase}.` : '.'}`);
      }
      if(front) out.push(`Ön kamera ${front.raw} MP.`);
      if(out.length) out.push('Megapiksel tek başına fotoğraf kalitesini belirlemez; sensör boyutu ve görüntü işleme de sonucu etkiler.');
      addSection('Kamera', out);
    } else if(p.cat === 'Kamera'){
      const out = [];
      const sensor = sp(/sensör boyutu/i), mp = sp(/^çözünürlük \(mp\)/i), video = sp(/^video/i), iso = sp(/^iso/i), mount = sp(/lens mount/i);
      if(sensor || mp) out.push(`${p.name}${sensor ? `, ${sensor.raw} sensör` : ''}${sensor && mp ? ' ve' : mp ? ',' : ''}${mp ? ` ${mp.raw} MP çözünürlük` : ''} sunuyor.`);
      if(video) out.push(`Video kaydı: ${video.raw}.`);
      if(iso) out.push(`ISO aralığı: ${iso.raw}.`);
      if(mount) out.push(`Lens bağlantısı: ${mount.raw}.`);
      addSection('Sensör ve Görüntü', out);
    }

    // Pil ve şarj
    {
      const out = [];
      const mah = sp(/^pil \(mah\)/i), hours = sp(/^pil \(saat\)/i), wh = sp(/pil kapasitesi \(wh\)/i);
      const life = sp(/^pil ömrü/i), fast = sp(/hızlı şarj/i), wireless = sp(/kablosuz şarj/i);
      if(mah && mah.n != null){
        const c = compare(mah.n, catAvg(catProducts, /^pil \(mah\)/i), 'mAh');
        out.push(`Pil kapasitesi ${fmtNum(mah.n)} mAh${c ? `; ${c.phrase}.` : '.'}`);
      }
      if(wh && wh.n != null){
        const c = compare(wh.n, catAvg(catProducts, /pil kapasitesi \(wh\)/i), 'Wh');
        out.push(`Pil kapasitesi ${fmtNum(wh.n)} Wh${c ? `; ${c.phrase}.` : '.'}`);
      }
      if(hours && hours.n != null){
        const c = compare(hours.n, catAvg(catProducts, /^pil \(saat\)/i), 'saat');
        out.push(`Üretici verisine göre pil ömrü ${fmtNum(hours.n)} saat${c ? `; ${c.phrase}.` : '.'}`);
      } else if(life){
        out.push(`Üretici verisine göre pil ömrü: ${life.raw}.`);
      }
      if(fast && !/^(yok|hayır)/i.test(fast.raw)) out.push(`Hızlı şarj: ${fast.raw}.`);
      if(wireless && /^(var|evet)/i.test(wireless.raw)) out.push('Kablosuz şarj destekliyor.');
      addSection('Pil ve Şarj', out);
    }

    // Bağlantı ve ek özellikler
    {
      const parts = [];
      const add = (re, fmt) => { const x = sp(re); if(x && !/^(yok|hayır)/i.test(x.raw)) parts.push(fmt(x.raw)); };
      add(/^wi-?fi/i, v => /wi-?fi/i.test(v) ? v : `Wi-Fi ${v}`);
      add(/^bluetooth/i, v => /bluetooth/i.test(v) ? v : `Bluetooth ${v}`);
      add(/hücresel teknoloji/i, v => v);
      add(/thunderbolt/i, v => /^(var|evet)$/i.test(v) ? 'Thunderbolt / USB4' : v);
      add(/^gps/i, v => /^(var|evet)$/i.test(v) ? 'GPS' : `GPS (${v})`);
      add(/gürültü engelleme|anc/i, v => /^(var|evet)$/i.test(v) ? 'aktif gürültü engelleme' : `aktif gürültü engelleme (${v})`);
      add(/^hdr/i, v => `HDR desteği (${v})`);
      add(/[iİ]şletim sistemi/i, v => `${v} işletim sistemi`);
      if(parts.length >= 2) addSection('Bağlantı ve Ek Özellikler', [`Öne çıkan bağlantı ve yazılım özellikleri: ${parts.join(', ')}.`]);
    }

    const tier = score != null && catScores.length ? (rank <= Math.ceil(catScores.length*0.33) ? 'high' : rank <= Math.ceil(catScores.length*0.66) ? 'mid' : 'low') : 'mid';

    const rankPhrase = rank ? `${catScores.length} model arasında ${rank}. sırada yer alıyor` : 'kategorisinde değerlendirildi';
    const openings = {
      high: `${p.name}, ${p.cat.toLowerCase()} kategorisinde fiyat/performans skoruna göre ${rankPhrase} — bu, kategorideki en güçlü seçeneklerden biri olduğu anlamına geliyor.`,
      mid: `${p.name}, ${p.cat.toLowerCase()} kategorisinde fiyat/performans skoruna göre ${rankPhrase}, yani kategori ortalamasına yakın, dengeli bir konumda.`,
      low: `${p.name}, ${p.cat.toLowerCase()} kategorisinde fiyat/performans skoruna göre ${rankPhrase}; bu sıralama tek başına ürünü değersiz yapmaz, bütçe veya öncelik farklı olduğunda hâlâ mantıklı bir seçim olabilir.`,
    };
    const strengthsPart = pros.length ? ` Öne çıkan ${pros.length > 1 ? 'yönleri' : 'yönü'}: ${pros.slice(0,2).map(lcFirst).join('; ')}.` : '';
    const weaknessPart = cons.length ? ` Satın almadan önce dikkat edilmesi ${cons.length > 1 ? 'gerekenler' : 'gereken nokta'}: ${cons.slice(0,2).map(lcFirst).join('; ')}.` : '';
    let tldr = `${openings[tier]}${strengthsPart}${weaknessPart}`.replace(/\s+/g,' ').trim();

    let kimlerAlmali = pros.length
      ? `Şu özellikler sizin için öncelikliyse ${p.name} makul bir seçenek: ${pros.map(lcFirst).join('; ')}.${tier === 'high' ? ' Kategorisindeki fiyat/performans sıralamasında üst dilimde yer alması, bütçe bilinciyle karar verenler için ek bir avantaj.' : ''}`
      : `${p.name}, kategori ortalamasına yakın özellikleriyle genel kullanım için makul bir seçenek.`;

    let kimlerAlmamali = cons.length
      ? `Şu noktalar sizin için kritikse bu fiyat aralığındaki alternatifleri de incelemenizi öneririz: ${cons.map(lcFirst).join('; ')}.`
      : `Kategori ortalamasına göre belirgin bir zayıf nokta öne çıkmıyor; yine de ihtiyacınıza özel karşılaştırma yapmanız faydalı olur.`;

    let sonKarar = `${p.name}, ${tier === 'high' ? 'fiyat/performans açısından kategorisinin güçlü modellerinden biri' : tier === 'mid' ? 'fiyat/performans açısından kategori ortalamasında dengeli bir seçenek' : 'fiyat/performans açısından kategori ortalamasının gerisinde kalan bir model'}.${pros[0] ? ` En güçlü yanı: ${lcFirst(pros[0])}.` : ''}${cons[0] ? ` En zayıf yanı: ${lcFirst(cons[0])}.` : ''}`.replace(/\s+/g,' ').trim();

    // İndekslenebilirlik: ürün sayfası kalite eşiğini geçmeli, en az 3 veriye
    // dayalı bölüm ve toplam en az 2 artı/eksi maddesi olmalı. Geçemeyen
    // inceleme yine üretilir ve linklenir, ama "noindex, follow" alır ve
    // sitemap'e girmez (bkz. lib/spec-utils.js "SAYFA KALİTE EŞİĞİ").
    const ed = editorialForProduct(p.id);
    if(ed){
      if(ed.kisa) tldr = ed.kisa;
      if(ed.kimlerAlmali) kimlerAlmali = ed.kimlerAlmali;
      if(ed.kimlerAlmamali) kimlerAlmamali = ed.kimlerAlmamali;
      if(ed.sonKarar) sonKarar = ed.sonKarar;
    }
    // Elle yazılmış editör değerlendirmesi varsa (ürün sayfası kalite eşiğini
    // geçtiği sürece) inceleme indekslenir.
    const indexable = (ed && productIndexable(p)) || productIndexable(p) && sections.length >= 3 && (pros.length + cons.length) >= 2;

    const teknikTablo = Object.entries(specs).filter(([, v]) => !specValueMissing(v)).slice(0, 12);

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
${ed ? renderProductEditorial(ed) : ''}

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

${sections.map(sec => `  <h2 style="font-size:15px;margin:20px 0 8px;">${esc(sec.title)}</h2>
  <p style="font-size:13.5px;line-height:1.7;">${esc(sec.text)}</p>`).join('\n\n')}

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

  <h2 style="font-size:15px;margin:20px 0 8px;">Son Karar: ${esc(p.name)} Alınır mı?</h2>
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
<title>${esc(p.name)} İncelemesi: Alınır mı? Artılar ve Eksiler | TeknoVersus</title>
<meta name="description" content="${esc(tldr.length > 300 ? tldr.slice(0, 297) + '…' : tldr)}" />
<meta name="robots" content="${indexable ? 'index, follow' : 'noindex, follow'}" />
<link rel="canonical" href="https://teknoversus.com.tr/inceleme/${slug}.html" />
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
${JSON.stringify(faqSchema, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(productSchema, null, 2)}
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

<main class="detail-wrap" style="max-width:760px;">
  ${bodyHtml}
</main>

${footerHTML('../')}
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;
    fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
    generated++;
    if(indexable) pages.push(`inceleme/${slug}.html`);
  });

  console.log(`${generated} inceleme sayfası oluşturuldu (${pages.length} indekslenebilir, ${generated - pages.length} noindex) -> inceleme/`);

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
