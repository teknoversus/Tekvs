// ============================================================
// TeknoVersus — ortak site üretim mantığı.
// Hem yerel/manuel üretim (gen_product_pages.js, SEED verisiyle) hem de
// otomatik build (build.js, canlı Supabase verisiyle) bu modülü kullanır.
// ============================================================
const fs = require('fs');
const path = require('path');

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};

// Alt kategori adını (örn. "Kamera Telefonları") URL slug'ına çevirir —
// generate-subcategories.js'deki subSlugify ile birebir aynı, tutarlılık için.

// Ürün sayfasında "resmi üretici sayfası" dış bağlantısı için marka haritası.
// Dış otoriteye bağlanmak, iddiaların doğrulanabilirliğini artırır (AI motorları
// birincil kaynağı olan içeriği tercih ediyor). rel="nofollow" ile link gücü
// aktarılmıyor, sadece doğrulama amaçlı.
const BRAND_SITES = {
  'Apple':'https://www.apple.com/tr/', 'iPhone':'https://www.apple.com/tr/', 'MacBook':'https://www.apple.com/tr/',
  'AirPods':'https://www.apple.com/tr/', 'iPad':'https://www.apple.com/tr/',
  'Samsung':'https://www.samsung.com/tr/', 'Xiaomi':'https://www.mi.com/tr/', 'Huawei':'https://consumer.huawei.com/tr/',
  'Honor':'https://www.hihonor.com/tr/', 'Sony':'https://www.sony.com.tr/', 'Google':'https://store.google.com/',
  'Lenovo':'https://www.lenovo.com/tr/', 'Asus':'https://www.asus.com/tr/', 'Acer':'https://www.acer.com/tr-tr/',
  'HP':'https://www.hp.com/tr-tr/', 'Dell':'https://www.dell.com/tr-tr/', 'MSI':'https://tr.msi.com/',
  'Canon':'https://www.canon.com.tr/', 'Nikon':'https://www.nikon.com.tr/', 'Fujifilm':'https://www.fujifilm.com/tr/',
  'Panasonic':'https://www.panasonic.com/tr/', 'GoPro':'https://gopro.com/', 'DJI':'https://www.dji.com/',
  'Garmin':'https://www.garmin.com.tr/', 'Polar':'https://www.polar.com/tr', 'Fitbit':'https://www.fitbit.com/',
  'JBL':'https://tr.jbl.com/', 'Bose':'https://www.bose.com.tr/', 'Beats':'https://www.beatsbydre.com/',
  'LG':'https://www.lg.com/tr/', 'TCL':'https://www.tcl.com/tr/', 'Philips':'https://www.philips.com.tr/',
  'Vestel':'https://www.vestel.com.tr/', 'Casper':'https://www.casper.com.tr/', 'Hisense':'https://www.hisense.com.tr/',
  'Grundig':'https://www.grundig.com.tr/', 'Toshiba':'https://www.toshiba-tv.com/', 'Reeder':'https://www.reeder.com.tr/',
  'Nothing':'https://tr.nothing.tech/', 'OnePlus':'https://www.oneplus.com/tr', 'Oppo':'https://www.oppo.com/tr/',
  'Motorola':'https://www.motorola.com.tr/', 'Realme':'https://www.realme.com/tr/', 'Nubia':'https://www.nubia.com/',
  'ZTE':'https://www.zte.com.tr/', 'Amazfit':'https://www.amazfit.com/', 'Anker':'https://www.anker.com/',
  'Marshall':'https://www.marshallheadphones.com/', 'Edifier':'https://www.edifier.com/', 'Insta360':'https://www.insta360.com/',
};
function officialSiteFor(name){
  const first = name.split(' ')[0];
  return BRAND_SITES[first] || null;
}

function subSlugify(s){
  const trMap = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return s.split('').map(ch => trMap[ch] !== undefined ? trMap[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function generateSite({ products, CATS, ICONS, colorFor, fmtDate, computeScores, productSlug, prosConsFor, rootDir, reviewedIds = new Set(), guidedIds = new Set(), subcatMap = {}, ratingsSummary = {} }){
  const outDir = path.join(rootDir, 'urun');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const scores = computeScores(products);

function scoreColor(s){
  if(s>=70) return 'var(--good)';
  if(s>=40) return 'var(--mid)';
  return 'var(--bad)';
}

function esc(s){
  return (s||'').toString().replace(/"/g,'&quot;');
}

// ---- Renk yardımcıları (illüstrasyon gradyanları için) ----
function shade(hex, percent){
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + Math.round(255 * percent);
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent);
  let b = (num & 0x0000FF) + Math.round(255 * percent);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + (0x1000000 + r*0x10000 + g*0x100 + b).toString(16).slice(1);
}

// ---- Kategoriye göre orijinal, telifsiz illüstrasyon (gerçek ürün fotoğrafı değildir) ----
function illustrationFor(cat, color, uid){
  const dark = shade(color, -0.35);
  const light = shade(color, 0.25);

  if(cat === 'Telefon' || cat === 'Tablet'){
    const wide = cat === 'Tablet';
    const w = wide ? 125 : 110, h = wide ? 205 : 181; // 140:230 oranı korunur
    return `<svg width="${w}" height="${h}" viewBox="0 0 140 230">
      <defs>
        <linearGradient id="body${uid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3a3f47"/><stop offset="55%" stop-color="#181b20"/><stop offset="100%" stop-color="#2a2e35"/>
        </linearGradient>
        <linearGradient id="scr${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="${dark}"/>
        </linearGradient>
        <radialGradient id="glow${uid}" cx="30%" cy="20%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity=".35"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect x="4" y="4" width="132" height="222" rx="22" fill="url(#body${uid})"/>
      <rect x="9" y="9" width="122" height="212" rx="17" fill="url(#scr${uid})"/>
      <rect x="9" y="9" width="122" height="212" rx="17" fill="url(#glow${uid})"/>
      <circle cx="70" cy="20" r="2.2" fill="#0a1420"/>
      <rect x="30" y="150" width="80" height="6" rx="3" fill="#ffffff" opacity=".85"/>
      <rect x="30" y="163" width="55" height="5" rx="2.5" fill="#ffffff" opacity=".5"/>
      <g opacity=".9">
        <rect x="30" y="40" width="30" height="30" rx="8" fill="#ffffff" opacity=".18"/>
        <rect x="66" y="40" width="30" height="30" rx="8" fill="#ffffff" opacity=".28"/>
        <rect x="30" y="76" width="30" height="30" rx="8" fill="#ffffff" opacity=".22"/>
        <rect x="66" y="76" width="30" height="30" rx="8" fill="#ffffff" opacity=".15"/>
      </g>
      <rect x="60" y="226" width="20" height="3" rx="1.5" fill="#0a1420" opacity=".4"/>
    </svg>`;
  }

  if(cat === 'Dizüstü'){
    return `<svg width="230" height="160" viewBox="0 0 260 180">
      <defs>
        <linearGradient id="lid${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8a8f96"/><stop offset="100%" stop-color="#5c6067"/></linearGradient>
        <linearGradient id="scr${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="${dark}"/></linearGradient>
        <linearGradient id="base${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c7ccd1"/><stop offset="100%" stop-color="#9aa0a6"/></linearGradient>
      </defs>
      <rect x="40" y="10" width="180" height="120" rx="8" fill="url(#lid${uid})"/>
      <rect x="48" y="17" width="164" height="106" rx="4" fill="url(#scr${uid})"/>
      <rect x="48" y="17" width="164" height="40" fill="#ffffff" opacity=".08"/>
      <rect x="60" y="90" width="60" height="5" rx="2.5" fill="#ffffff" opacity=".8"/>
      <rect x="60" y="100" width="40" height="4" rx="2" fill="#ffffff" opacity=".45"/>
      <path d="M20 130 L240 130 L225 160 L35 160 Z" fill="url(#base${uid})"/>
      <rect x="110" y="132" width="40" height="4" rx="2" fill="#70757b"/>
    </svg>`;
  }

  if(cat === 'Akıllı Saat'){
    return `<svg width="130" height="173" viewBox="0 0 150 200">
      <defs>
        <linearGradient id="band${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/></linearGradient>
        <linearGradient id="wscr${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="${dark}"/></linearGradient>
      </defs>
      <rect x="55" y="0" width="40" height="55" rx="10" fill="url(#band${uid})"/>
      <rect x="55" y="145" width="40" height="55" rx="10" fill="url(#band${uid})"/>
      <rect x="35" y="50" width="80" height="100" rx="24" fill="#222"/>
      <rect x="42" y="57" width="66" height="86" rx="18" fill="url(#wscr${uid})"/>
      <circle cx="75" cy="100" r="26" fill="none" stroke="#ffffff" stroke-width="3" opacity=".85"/>
      <circle cx="75" cy="100" r="26" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="80 200" opacity=".9" transform="rotate(-90 75 100)"/>
      <rect x="60" y="130" width="30" height="5" rx="2.5" fill="#ffffff" opacity=".7"/>
    </svg>`;
  }

  if(cat === 'Kulaklık'){
    return `<svg width="200" height="170" viewBox="0 0 200 170">
      <defs>
        <linearGradient id="band${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="${dark}"/></linearGradient>
        <radialGradient id="cup${uid}" cx="35%" cy="30%" r="80%"><stop offset="0%" stop-color="${light}"/><stop offset="100%" stop-color="${dark}"/></radialGradient>
      </defs>
      <path d="M30 95 Q30 20 100 20 Q170 20 170 95" fill="none" stroke="url(#band${uid})" stroke-width="14" stroke-linecap="round"/>
      <ellipse cx="30" cy="112" rx="26" ry="34" fill="url(#cup${uid})"/>
      <ellipse cx="170" cy="112" rx="26" ry="34" fill="url(#cup${uid})"/>
      <ellipse cx="30" cy="112" rx="15" ry="22" fill="#000000" opacity=".2"/>
      <ellipse cx="170" cy="112" rx="15" ry="22" fill="#000000" opacity=".2"/>
    </svg>`;
  }

  if(cat === 'Televizyon'){
    return `<svg width="230" height="155" viewBox="0 0 260 175">
      <defs>
        <linearGradient id="tvbody${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c2f34"/><stop offset="100%" stop-color="#111214"/></linearGradient>
        <linearGradient id="tvscr${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${light}"/><stop offset="55%" stop-color="${color}"/><stop offset="100%" stop-color="${dark}"/></linearGradient>
        <linearGradient id="tvstand${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8a8f96"/><stop offset="100%" stop-color="#5c6067"/></linearGradient>
      </defs>
      <rect x="10" y="10" width="240" height="130" rx="10" fill="url(#tvbody${uid})"/>
      <rect x="20" y="19" width="220" height="112" rx="4" fill="url(#tvscr${uid})"/>
      <rect x="20" y="19" width="220" height="40" fill="#ffffff" opacity=".08"/>
      <rect x="118" y="140" width="24" height="16" fill="url(#tvstand${uid})"/>
      <path d="M90 163 L170 163 L155 156 L105 156 Z" fill="url(#tvstand${uid})"/>
    </svg>`;
  }

  if(cat === 'Kamera'){
    return `<svg width="210" height="153" viewBox="0 0 220 160">
      <defs>
        <linearGradient id="body${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3a3f47"/><stop offset="100%" stop-color="#1c1f24"/></linearGradient>
        <radialGradient id="lens${uid}" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="${light}"/><stop offset="45%" stop-color="${color}"/><stop offset="100%" stop-color="#0a0a0a"/></radialGradient>
      </defs>
      <rect x="20" y="40" width="160" height="90" rx="14" fill="url(#body${uid})"/>
      <rect x="70" y="18" width="50" height="26" rx="6" fill="url(#body${uid})"/>
      <circle cx="80" cy="85" r="38" fill="url(#lens${uid})"/>
      <circle cx="80" cy="85" r="38" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="2"/>
      <circle cx="80" cy="85" r="14" fill="#0a0a0a" opacity=".6"/>
      <circle cx="150" cy="55" r="7" fill="#e6e6e6" opacity=".8"/>
      <rect x="150" y="100" width="26" height="14" rx="4" fill="#000" opacity=".25"/>
    </svg>`;
  }

  // varsayılan (bilinmeyen kategori) — Kamera ile aynı stil
  return `<svg width="210" height="153" viewBox="0 0 220 160">
    <defs>
      <linearGradient id="body${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3a3f47"/><stop offset="100%" stop-color="#1c1f24"/></linearGradient>
      <radialGradient id="lens${uid}" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="${light}"/><stop offset="45%" stop-color="${color}"/><stop offset="100%" stop-color="#0a0a0a"/></radialGradient>
    </defs>
    <rect x="20" y="40" width="160" height="90" rx="14" fill="url(#body${uid})"/>
    <rect x="70" y="18" width="50" height="26" rx="6" fill="url(#body${uid})"/>
    <circle cx="80" cy="85" r="38" fill="url(#lens${uid})"/>
    <circle cx="80" cy="85" r="38" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="2"/>
    <circle cx="80" cy="85" r="14" fill="#0a0a0a" opacity=".6"/>
    <circle cx="150" cy="55" r="7" fill="#e6e6e6" opacity=".8"/>
    <rect x="150" y="100" width="26" height="14" rx="4" fill="#000" opacity=".25"/>
  </svg>`;
}

const catalog = products.filter(p => !p.upcoming);

products.forEach(p => {
  const slug = productSlug(p);
  const url = `urun/${slug}.html`;
  const canonical = `https://teknoversus.com.tr/${url}`;
  const catSlug = SLUG_MAP[p.cat];
  const s = scores[p.id];

  const specEntries = Object.entries(p.specs || {});
  const priceKey = specEntries.find(([k]) => /fiyat/i.test(k));
  // Fiyatı specs'ten doğrudan sayıya çevir — önceki mantık hiçbir zaman
  // tanımlanmayan bir p.__price alanını kontrol ediyordu ve sadece 's'
  // önekli 6 üründe çalışıyordu (aslında hiç çalışmıyordu). Artık geçerli
  // bir fiyatı olan HER üründe gerçek Offer verisi üretiliyor.
  const priceNum = priceKey ? parseFloat(priceKey[1].toString().replace(/[^\d.,]/g,'').replace(',','.')) : null;

  const specRows = specEntries.map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');

  const similar = catalog
    .filter(x => x.cat === p.cat && x.id !== p.id)
    .sort((a,b) => Math.abs((scores[a.id]||0)-(s||0)) - Math.abs((scores[b.id]||0)-(s||0)))
    .slice(0,3);

  // ---- GEO alanları: Kısa Cevap + SSS (FAQPage) ----
  const catProductsForRank = catalog.filter(x => x.cat === p.cat);
  const catScoresForRank = catProductsForRank.map(x => scores[x.id]).filter(x => x != null);
  const rank = (s != null && catScoresForRank.length) ? [...catScoresForRank].sort((a,b)=>b-a).indexOf(s) + 1 : null;
  const priceVal = priceKey ? priceKey[1] : null;

  const tldr = p.upcoming
    ? `${p.name}, henüz resmi olarak piyasaya çıkmamış, beklenen bir model. Kesin fiyat ve özellikler resmi tanıtımla netleşecek.`
    : `${p.name}${priceVal ? `, ${priceVal} ₺ fiyatıyla` : ''} ${p.cat.toLowerCase()} kategorisinde${rank ? ` ${catScoresForRank.length} model arasında fiyat/performans skoruna göre ${rank}. sırada` : ' yer alıyor'}.`;

  const geoFaq = p.upcoming ? [] : [
    { q: `${p.name} fiyatı ne kadar?`, a: priceVal ? `${p.name}'in fiyatı ${priceVal} ₺.` : `Güncel fiyat için sayfadaki satın alma linkine bakabilirsiniz.` },
    { q: `${p.name}'in fiyat/performans skoru nedir?`, a: s != null ? `${p.name}, ${s} fiyat/performans skoruna sahip${rank ? `, kategorisinde ${catScoresForRank.length} model arasında ${rank}. sırada` : ''}.` : `Bu ürün için henüz yeterli karşılaştırma verisi bulunmuyor.` },
  ];
  const geoFaqSchema = geoFaq.length ? { "@context":"https://schema.org", "@type":"FAQPage", "mainEntity": geoFaq.map(f => ({ "@type":"Question", "name":f.q, "acceptedAnswer": { "@type":"Answer", "text":f.a } })) } : null;

  // ---- "Kim İçin Uygun / Sonuç" bölümü ----
  // AI motorlarının doğrudan alıntılayabileceği net bir yargı cümlesi üretir.
  // İnceleme sayfalarındaki mantığın aynısı, ama ürün sayfasının kendisinde.
  let verdictBlock = '';
  if(!p.upcoming && typeof prosConsFor === 'function'){
    const catProducts = catalog.filter(x => x.cat === p.cat);
    const { pros, cons } = prosConsFor(p, catProducts);
    const tierWord = rank == null ? 'kategori ortalamasında'
      : (rank <= Math.ceil(catScoresForRank.length*0.33) ? 'kategorisinin üst diliminde'
      : rank <= Math.ceil(catScoresForRank.length*0.66) ? 'kategori ortalamasında' : 'kategori ortalamasının altında');
    const forWho = pros.length
      ? `${pros.slice(0,2).join(', ')} önceliğiniz varsa ${p.name} makul bir seçim.`
      : `${p.name}, dengeli özellikleriyle genel kullanım için uygun.`;
    const notForWho = cons.length
      ? `${cons.slice(0,2).join(', ')} sizin için kritikse alternatiflere de bakın.`
      : `Belirgin bir zayıf noktası öne çıkmıyor.`;
    const verdict = `${p.name}, fiyat/performans skoruna göre ${tierWord} yer alıyor.`;

    verdictBlock = `
  <h2 style="font-size:15px;margin:24px 0 10px;">Kim İçin Uygun?</h2>
  <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:14px;">
    <div style="flex:1;min-width:220px;">
      <div style="font-weight:600;font-size:13px;color:#1D9E75;margin-bottom:4px;">Uygun</div>
      <p style="font-size:13.5px;line-height:1.6;margin:0;">${esc(forWho)}</p>
    </div>
    <div style="flex:1;min-width:220px;">
      <div style="font-weight:600;font-size:13px;color:#C0392B;margin-bottom:4px;">Uygun Değil</div>
      <p style="font-size:13.5px;line-height:1.6;margin:0;">${esc(notForWho)}</p>
    </div>
  </div>
  <h2 style="font-size:15px;margin:20px 0 8px;">Sonuç</h2>
  <p style="font-size:13.5px;line-height:1.7;font-weight:500;">${esc(verdict)}${reviewedIds.has(p.id) ? ` Detaylı değerlendirme için <a href="../inceleme/${slug}-inceleme.html" style="color:var(--c1);">tam incelemeye</a> bakabilirsiniz.` : ''}</p>`;
  }

  const similarHTML = similar.length
    ? similar.map(x => `<a class="similar-card" href="${productSlug(x)}.html" data-id="${x.id}"><div class="n">${x.name}</div><div class="s">Skor: ${scores[x.id] ?? '—'}</div><div class="v" style="font-size:11px;color:var(--ink-soft);"></div></a>`).join('')
    : '<p style="font-size:12.5px;color:var(--ink-soft);">Bu kategoride başka ürün yok.</p>';

  const description = `${p.name} ${p.upcoming ? '— beklenen özellikler, ' : 'fiyatı, '}${p.blurb || ''}`.trim().slice(0,160);
  const color = colorFor(p.cat);

  // Marka çıkarımı — schema.org "brand" alanı için. Ürün adının ilk
  // kelimesi çoğunlukla marka adı (ör. "Samsung Galaxy..."); Apple'ın bazı
  // ürün ailelerinde (iPhone/MacBook/AirPods) istisna var, elle eşleniyor.
  const BRAND_EXCEPTIONS = { 'iphone':'Apple', 'macbook':'Apple', 'airpods':'Apple' };
  const firstWord = (p.name.split(' ')[0] || '').toLowerCase();
  const brandName = BRAND_EXCEPTIONS[firstWord] || p.name.split(' ')[0];

  const hasImage = !p.upcoming; // beklenen/piyasaya çıkmamış ürünler için görsel üretilmiyor

  const buildDate = new Date().toISOString().slice(0,10); // AI motorlari icin tazelik sinyali
  // "Yakında çıkacak" ürünler henüz satın alınamıyor: fiyatı, stok durumu ve
  // fiyat/performans skoru yok. Bunları Product olarak işaretlemek, Google'ın
  // ticari alanları (offers/review/aggregateRating) beklemesine yol açıyor ve
  // Search Console'da "alan eksik" uyarısı üretiyor. Sahte puan/fiyat eklemek
  // politika ihlali olacağı için, şemayı gerçeğe uygun hale getiriyoruz:
  // bu sayfalar bir ürün teklifi değil, beklenen model hakkında bilgi sayfası.
  const productSchema = p.upcoming ? {
    "dateModified": buildDate,
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${p.name} — Beklenen Özellikler`,
    "description": p.blurb || '',
    "url": canonical,
    "about": {
      "@type": "Thing",
      "name": p.name,
      "description": `${brandName} markasının ${p.cat.toLowerCase()} kategorisinde beklenen modeli`
    }
  } : {
    "dateModified": buildDate,
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "category": p.cat,
    "description": p.blurb || '',
    "url": canonical,
    "brand": { "@type": "Brand", "name": brandName }
  };
  if(hasImage){
    productSchema.image = `https://teknoversus.com.tr/assets/products/${slug}.png`;
  }
  // NOT: "offers" bilerek EKLENMİYOR.
  //
  // TeknoVersus ürünü kendisi satmıyor/kargolamıyor — bir karşılaştırma ve
  // affiliate yönlendirme sitesi. Yapılandırılmış veride "offers" bildirmek,
  // Google'ın sayfayı "Satıcı girişi" (Merchant listing) olarak
  // sınıflandırmasına ve satıcıya özel alanları beklemesine yol açıyordu:
  //   - hasMerchantReturnPolicy (iade politikası)
  //   - shippingDetails (kargo koşulları)
  // Bu alanlar GERÇEK satıcıya (Amazon) ait, ürüne göre değişiyor ve biz
  // bunları canlı doğrulayamıyoruz. Uydurmak yanıltıcı yapılandırılmış veri
  // olur; kendimize iade politikası atfetmek ise düpedüz yanlış olur çünkü
  // hiçbir şey satmıyoruz.
  //
  // Doğru sınıflandırma "Ürün snippet'i" (Product snippet) — inceleme ve
  // karşılaştırma içeriği için olan tür. Bu, review + brand + description
  // ile sağlanıyor ve satıcı alanları gerektirmiyor.
  //
  // Fiyat bilgisi kullanıcıya sayfada normal şekilde gösterilmeye devam
  // ediyor; sadece ticari bir teklif olarak İDDİA EDİLMİYOR.
  if(s != null){
  // Not: Bu, kullanıcı yorumlarından oluşan bir "AggregateRating" DEĞİL —
  // sitenin şeffaf şekilde gösterdiği, spesifik verilerden hesaplanan
  // Fiyat/Performans Skoru'nun editöryel Review işaretlemesi.
    productSchema.review = {
      "@type": "Review",
      "name": "Fiyat/Performans Skoru",
      "reviewBody": `${p.name} için özelliklerine göre hesaplanan fiyat/performans skoru: ${s}/100.`,
      "author": { "@type": "Organization", "name": "TeknoVersus" },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": String(s),
        "bestRating": "100",
        "worstRating": "0"
      }    };
  }

  // Gerçek AggregateRating: SADECE en az 1 onaylanmış kullanıcı yorumu
  // varsa eklenir. Veri yoksa hiç eklenmez — sahte/varsayılan bir puan
  // uydurmak Google'ın yapılandırılmış veri kurallarını ihlal eder.
  const ratingInfo = ratingsSummary[p.id];
  if(ratingInfo && ratingInfo.count > 0){
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": String(ratingInfo.average),
      "reviewCount": String(ratingInfo.count),
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type":"ListItem","position":1,"name":"Anasayfa","item":"https://teknoversus.com.tr/"},
      {"@type":"ListItem","position":2,"name":p.cat,"item":`https://teknoversus.com.tr/${catSlug}.html`},
      {"@type":"ListItem","position":3,"name":p.name,"item":canonical}
    ]
  };

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(p.name)} — Fiyat, Özellikler ve Karşılaştırma | TeknoVersus</title>
<meta name="description" content="${esc(description)}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${canonical}" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2B6CB0" />
<meta property="og:type" content="product" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${esc(p.name)} — TeknoVersus" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:locale" content="tr_TR" />
<meta name="twitter:card" content="summary" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
${JSON.stringify(productSchema, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(breadcrumbSchema, null, 2)}
</script>
${geoFaqSchema ? `<script type="application/ld+json">\n${JSON.stringify(geoFaqSchema, null, 2)}\n</script>` : ''}
<link rel="icon" type="image/png" href="../assets/logo.png" />
<!-- Google Analytics -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3653440823878417" crossorigin="anonymous"></script>
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
    <a href="../index.html">Anasayfa</a> / <a href="../${catSlug}.html">${p.cat}</a> / ${esc(p.name)}
  </div>
  <a class="back-link" href="../${catSlug}.html">← ${p.cat} kategorisine dön</a>

  <div class="detail-head">
    <div class="detail-icon" style="background:${color}22;color:${color};">
      <svg width="30" height="30" viewBox="0 0 24 24">${ICONS[p.cat]||''}</svg>
    </div>
    <div>
      <div class="detail-meta">${p.cat} · ${p.upcoming ? 'Bekleniyor' : 'Çıkış: '+fmtDate(p.addedAt)} · <span id="viewCountLabel">0 görüntülenme</span></div>
      <h1 class="product-page-h1">${p.name}</h1>
      ${s!=null ? `<span class="score-pill" id="scorePill" style="background:${scoreColor(s)}22;color:${scoreColor(s)};">Fiyat/Performans Skoru: ${s}</span>` : '<span class="score-pill" id="scorePill" style="display:none;"></span>'}
      <span id="heroRatingSummary" style="font-size:13px;color:var(--ink-soft);margin-left:8px;"></span>
      ${(reviewedIds.has(p.id) || guidedIds.has(p.id)) ? `<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
        ${reviewedIds.has(p.id) ? `<a class="chip-filter" href="../inceleme/${slug}-inceleme.html">Tam İnceleme</a>` : ''}
        ${guidedIds.has(p.id) ? `<a class="chip-filter" href="../rehber/${slug}-alinir-mi.html">Alınır mı?</a><a class="chip-filter" href="../rehber/${slug}-fiyat-performans.html">Fiyat/Performans</a>` : ''}
      </div>` : ''}
      ${(subcatMap[p.id] || []).length ? `<div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;">
        ${(subcatMap[p.id]||[]).map(sub => `<a class="chip-filter" href="../kategori/${subSlugify(sub)}.html">${sub}</a>`).join('')}
      </div>` : ''}
    </div>
  </div>

  <div class="hero-visual" style="background:linear-gradient(160deg,${color}14,${color}05);">
    ${illustrationFor(p.cat, color, slug.replace(/[^a-z0-9]/g,''))}
  </div>
  <div style="font-size:11px;color:var(--ink-soft);margin:-10px 0 14px;text-align:center;">Orijinal illüstrasyon — gerçek ürün fotoğrafı değildir.</div>

  <p style="color:var(--ink-soft);font-size:14.5px;margin:14px 0;">${p.blurb || ''}</p>

  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin:14px 0;">
    <strong>Kısa cevap:</strong> ${esc(tldr)}
  </div>

  <table class="detail-specs-table">${specRows}</table>

  <div style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 4px;">
    <a class="btn btn-dark" style="display:inline-block;text-decoration:none;" href="${p.link ? p.link + (p.link.includes('?') ? '&' : '?') + 'tag=teknoversus-21' : 'https://www.amazon.com.tr/s?k=' + encodeURIComponent(p.name) + '&tag=teknoversus-21'}" target="_blank" rel="noopener noreferrer sponsored">Amazon'da Satın Al →</a>
    <button class="btn btn-outline" id="favBtn">Favorilere Ekle</button>
  </div>

  <div id="prosConsBox"></div>

  ${p.upcoming ? '' : `
  <div class="chart-wrap">
    <canvas id="priceChart"></canvas>
    <div class="chart-note" id="chartNote">Fiyat geçmişi temsilidir (simüle edilmiştir); gerçek bir tarihsel fiyat veri kaynağına dayanmaz.</div>
  </div>`}

  ${verdictBlock}
  ${officialSiteFor(p.name) ? `<p style="font-size:12.5px;color:var(--ink-soft);margin:14px 0;">Teknik özellikler üreticinin resmi verilerine dayanır: <a href="${officialSiteFor(p.name)}" target="_blank" rel="noopener noreferrer nofollow">${esc(p.name.split(' ')[0])} resmi sitesi</a></p>` : ''}

  ${geoFaq.length ? `<h2 style="font-size:15px;margin:20px 0 10px;">Sıkça Sorulan Sorular</h2>
${geoFaq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(f.a)}</div>
  </div>`).join('\n')}` : ''}

  <h2 style="font-size:15px;margin:20px 0 8px;">Bunlara da bak</h2>
  <div class="similar-row">${similarHTML}</div>

  <div id="ratingsBox"></div>

  <div id="recentlyViewedStrip"></div>

  <p class="product-notice">
    Bu sayfadaki fiyat/performans skoru, kategori içindeki ürünlerin göreli karşılaştırmasıyla otomatik hesaplanır;
    bağımsız bir laboratuvar testi değildir. Fiyatlar bir anlık görüntüdür ve canlı güncellenmez. Kullanıcı
    yorumları ziyaretçiler tarafından yazılır, TeknoVersus editoryal içeriği değildir.
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
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu. Fiyatlar Ağustos 2026 itibarıyla fiyat karşılaştırma
  sitelerinde bulunan en düşük değerlerin bir anlık görüntüsüdür, canlı güncellenmez. Artık satışta olmayan eski modellerin fiyatı, güncel Türkiye piyasasındaki (yenilenmiş/ikinci el dahil) karşılaştırılabilir satış fiyatlarına dayalı bir tahmindir; gerçek zamanlı değildir. Skorlar otomatik hesaplanır
  ve bağımsız bir benchmark değildir.
  <div style="margin-top:10px;"><a href="../hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="../gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a></div>
</footer>

<script src="../shared.js"></script>
<script>const PRODUCT_ID = '${p.id}';</script>
<script src="../product.js"></script>
<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;

  fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
});

console.log(`${products.length} ürün sayfası oluşturuldu -> urun/`);

// ---- "Yakında Çıkacak Ürünler" statik sayfası ----
// Piyasaya henüz çıkmamış ürünleri tek bir SEO'lu sayfada toplar. Ürün eklendiği
// anda Google zaten bu sayfayı biliyor olur; ürün piyasaya çıktığında hızlı
// sıralanma şansı için (rakipler henüz yazmamışken).
{
  const upcoming = products.filter(p => p.upcoming).sort((a,b) => new Date(a.addedAt) - new Date(b.addedAt));
  const upcomingCards = upcoming.map(p => {
    const color = colorFor(p.cat);
    return `      <a class="card" href="urun/${productSlug(p)}.html" style="text-decoration:none;color:inherit;">
        <div class="card-icon" style="background:${color}22;color:${color};">
          <svg width="24" height="24" viewBox="0 0 24 24">${ICONS[p.cat] || ''}</svg>
        </div>
        <div class="card-cat">${esc(p.cat)} · Beklenen: ${fmtDate(p.addedAt)}</div>
        <div class="card-name">${esc(p.name)}</div>
        <div class="card-blurb">${esc(p.blurb || '')}</div>
      </a>`;
  }).join('\n');

  const upcomingHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Yakında Çıkacak Ürünler — Beklenen Telefon, Laptop ve Daha Fazlası | TeknoVersus</title>
<meta name="description" content="Henüz piyasaya çıkmamış, resmi olarak duyurulan veya beklenen telefon, dizüstü bilgisayar ve teknoloji ürünlerini takip et. Çıkar çıkmaz karşılaştırmaya hazır." />
<link rel="canonical" href="https://teknoversus.com.tr/yakinda-cikacak.html" />
<link rel="stylesheet" href="styles.css" />
<link rel="icon" type="image/png" href="assets/logo.png" />
<!-- Google Analytics -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3653440823878417" crossorigin="anonymous"></script>
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
  <h1 class="product-page-h1">Yakında Çıkacak Ürünler</h1>
  <p style="color:var(--ink-soft);font-size:14px;max-width:640px;margin-bottom:28px;">
    Resmi olarak duyurulmuş ama henüz Türkiye'de satışa çıkmamış modeller. Beklenen özellikler
    söylentilere ve sızıntılara dayanır, resmi tanıtımla değişebilir. Ürün piyasaya çıktığında bu
    sayfa otomatik güncellenir ve ürün kendi tam karşılaştırma sayfasına kavuşur.
  </p>
  ${upcoming.length ? `<div class="grid">\n${upcomingCards}\n    </div>` : '<p style="color:var(--ink-soft);">Şu an beklenen ürün yok — yakında tekrar kontrol et.</p>'}
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
  <div class="wrap" style="text-align:center;margin-bottom:10px;font-size:12.5px;">
    <a href="hakkimizda.html" style="color:inherit;">Hakkımızda</a> · <a href="gizlilik-politikasi.html" style="color:inherit;">Gizlilik Politikası</a>
  </div>
  TeknoVersus — gerçek ürünlerle çalışan karşılaştırma kataloğu.
</footer>

<script>document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(rootDir, 'yakinda-cikacak.html'), upcomingHtml);
  console.log(`yakinda-cikacak.html oluşturuldu (${upcoming.length} beklenen ürün).`);
}

// sitemap.xml'i baştan, tüm URL'lerle yeniden üret
const today = new Date().toISOString().slice(0,10);
const staticPages = [
  { loc: '', priority: '1.0' },
  { loc: 'yakinda-cikacak.html', priority: '0.7' },
  { loc: 'karsilastirmalar.html', priority: '0.7' },
  { loc: 'telefon.html', priority: '0.8' },
  { loc: 'dizustu.html', priority: '0.8' },
  { loc: 'kulaklik.html', priority: '0.8' },
  { loc: 'kamera.html', priority: '0.8' },
  { loc: 'akilli-saat.html', priority: '0.8' },
  { loc: 'tablet.html', priority: '0.8' },
  { loc: 'televizyon.html', priority: '0.8' },
  { loc: 'hakkimizda.html', priority: '0.6' },
  // Not: haberler.html ve haberler/*.html buraya SABİT eklenmiyor artık —
  // artık Supabase'deki 'news' tablosundan (admin panelinden) besleniyor ve
  // generate-news.js tarafından build sırasında dinamik olarak sitemap'e ekleniyor.
];
const productUrls = products.map(p => ({ loc: `urun/${productSlug(p)}.html`, priority: '0.6' }));
const allUrls = [...staticPages, ...productUrls];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>https://teknoversus.com.tr/${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.loc.startsWith('urun/') ? 'monthly' : 'weekly'}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemapXml);
console.log('sitemap.xml güncellendi, toplam URL:', allUrls.length);

}

module.exports = { generateSite };
