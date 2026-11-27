// ============================================================
// Anasayfa blokları — sade tasarım (21 Kasım 2026).
// Her build'de index.html içindeki işaretçiler arasını yeniden yazar
// (idempotent, deterministik: aynı veri → aynı HTML). JS kapalıyken de
// bütün içerik HTML'de durur; JS sadece kartı döndürür ve sekmeleri açar.
//
//   HOME_CHIPS      arama kutusunun altındaki "Popüler:" bağlantıları
//   HOME_VS         dönen "Popüler karşılaştırmalar" kartı (editör ikilileri)
//   HOME_KATEGORI   7 kategori hücresi (çizim + model sayısı)
//   HOME_URUNLER    sekmeli ürün kartları (yeni / editör incelemesi / çok bakılan)
//   HOME_HABER      son 4 haber kartı
//   HOME_REHBER     satın alma rehberleri listesi
//   HOME_GUNCELLEME "Katalog son güncelleme" satırı
//   HOME_DIZIN      sayfa sonu: popüler markalar şeridi + marka/ürün/liste bağlantı sütunları
//
// Önceki tasarım (A, 21 Ekim 2026): lib/yedek/anasayfa-a-21-ekim/
// ============================================================
const fs = require('fs');
const path = require('path');
const { comparisonFileName } = require('./generate-comparisons');
const { turkiyePopulerCiftler } = require('./generate-turkiye-populer');
const { brandOf, slugify, SLUG_MAP } = require('./generate-brand-pages');
const { brandCanonicalizer } = require('./spec-utils');
const { editorialPairKeys, editorialForPair, editorialForProduct } = require('./editorial');

const esc = s => (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const CATS = [
  { name:'Telefon', slug:'telefon' }, { name:'Televizyon', slug:'televizyon' },
  { name:'Dizüstü', slug:'dizustu' }, { name:'Tablet', slug:'tablet' },
  { name:'Kulaklık', slug:'kulaklik' }, { name:'Akıllı Saat', slug:'akilli-saat' },
  { name:'Kamera', slug:'kamera' },
];

// Kartlarda gösterilecek iki kısa özellik satırı. Değeri olmayan satır atlanır.
const SPEC_LINES = {
  'Telefon':     [['Ekran (inç)','Ekran Türü'], ['Pil (mAh)']],
  'Tablet':      [['Ekran (inç)','Ekran Türü'], ['Pil (mAh)']],
  'Televizyon':  [['Ekran (inç)','Ekran Türü'], ['Yenileme Hızı (Hz)','İşletim Sistemi']],
  'Dizüstü':     [['Ekran (inç)','RAM (GB)'], ['Ekran Kartı']],
  'Kulaklık':    [['Aktif Gürültü Engelleme (ANC)'], ['Pil Ömrü (Kutu ile Toplam)']],
  'Akıllı Saat': [['Ekran Türü'], ['Pil Süresi (Gün)']],
  'Kamera':      [['Sensör Boyutu'], ['Çözünürlük (MP)']],
};

// Kategori seçim rehberlerinin yanında en çok aranan konulardan seçilmiş rehberler.
const POPULAR_GUIDES = [
  'tv-ekran-boyutu-nasil-secilir', 'oled-qled-mini-led-tv-farki', 'oyun-laptopu-nasil-secilir-tgp-mux',
  'tablet-mi-laptop-mu', 'kulak-ici-mi-kulak-ustu-mu', 'telefon-asiri-isinma-nasil-onlenir',
  'amoled-vs-lcd-fark', 'anc-nedir', 'ram-ne-kadar-yeterli', 'ip-koruma-sinifi-nedir',
];

// "Popüler:" bağlantıları — liste sayfası gerçekten üretildiyse gösterilir.
const CHIP_CANDIDATES = [
  ['liste/10000-30000-telefon.html', '10–30 bin TL telefonlar'],
  ['liste/anc-kulaklik.html', 'ANC’li kulaklıklar'],
  ['liste/120hz-televizyon.html', '120 Hz televizyonlar'],
  ['liste/kalem-tablet.html', 'Kalem destekli tabletler'],
  ['liste/rtx-5060-dizustu.html', 'RTX 5060’lı laptoplar'],
];

function istanbulToday(){
  const p = new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Istanbul', day:'numeric', month:'numeric', year:'numeric' })
    .formatToParts(new Date()).reduce((o,x)=>(o[x.type]=x.value,o),{});
  return `${+p.day} ${MONTHS[+p.month-1]} ${p.year}`;
}

function replaceBetween(html, startTag, endTag, inner){
  const q = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re = new RegExp(q(startTag) + '[\\s\\S]*?' + q(endTag));
  return re.test(html) ? html.replace(re, () => `${startTag}${inner}${endTag}`) : null;
}

const priceOf = p => {
  const raw = (p && p.specs) ? p.specs['Fiyat (₺)'] : null;
  const n = parseFloat(String(raw == null ? '' : raw).replace(/[^\d.,]/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.'));
  return isFinite(n) && n > 0 ? n : 0;
};
const tl = n => Math.round(n).toLocaleString('tr-TR') + ' TL';
const fmtNum = v => {
  const n = parseFloat(String(v).replace(',', '.'));
  if(!isFinite(n)) return String(v).trim();
  return (Math.round(n * 100) / 100).toLocaleString('tr-TR');
};

function specVal(p, key){
  const v = p.specs && p.specs[key];
  if(v == null || String(v).trim() === '' || /belirtilmemiş|bilinmiyor/i.test(String(v))) return '';
  const s = String(v).trim();
  if(key === 'Ekran (inç)') return fmtNum(s) + ' inç';
  if(key === 'Pil (mAh)') return fmtNum(s).replace(/\.0+$/,'') + ' mAh';
  if(key === 'RAM (GB)') return fmtNum(s) + ' GB RAM';
  if(key === 'Yenileme Hızı (Hz)') return fmtNum(s) + ' Hz';
  if(key === 'Aktif Gürültü Engelleme (ANC)') return /^(var|evet|yes)/i.test(s) ? 'ANC var' : /^(yok|hayır|no)/i.test(s) ? 'ANC yok' : '';
  if(key === 'Pil Ömrü (Kutu ile Toplam)') return /saat/i.test(s) ? s + ' (kutuyla)' : s + ' saat (kutuyla)';
  if(key === 'Pil Süresi (Gün)'){
    const d = parseFloat(s.replace(',', '.'));
    if(!isFinite(d) || d <= 0) return '';
    return d < 2 ? `${Math.round(d * 24)} saat pil` : `${fmtNum(d)} gün pil`;
  }
  if(key === 'Çözünürlük (MP)') return fmtNum(s) + ' MP';
  if(key === 'Sensör Boyutu') return s.length > 28 ? '' : s;
  return s.length > 32 ? '' : s;
}
function specLines(p){
  return (SPEC_LINES[p.cat] || []).map(keys => keys.map(k => specVal(p, k)).filter(Boolean).join(' · ')).filter(Boolean);
}

function readTrafficList(rootDir){
  const f = path.join(rootDir, 'lib', 'gsc-trafik-sayfalar.txt');
  if(!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
}

function updateHomeBlocks({ rootDir, news, products, computeScores, productSlug, colorFor, productImageFor }){
  const indexPath = path.join(rootDir, 'index.html');
  if(!fs.existsSync(indexPath)) return;
  let html = fs.readFileSync(indexPath, 'utf8');
  const prods = (products || []).filter(p => p && p.id && p.name);
  let scores = {};
  try{ scores = computeScores ? computeScores(prods) : {}; }catch(e){ console.warn('Anasayfa: skor hesaplanamadı:', e.message); }
  const scored = p => scores[p.id] != null && isFinite(scores[p.id]);
  const exists = rel => fs.existsSync(path.join(rootDir, rel));
  const byId = {}; prods.forEach(p => { byId[p.id] = p; });
  const urunUrl = p => `urun/${productSlug(p)}.html`;
  let uidN = 0;
  const img = p => {
    try{ return productImageFor(p, p.cat, colorFor ? colorFor(p.cat) : '#4A5568', 'h' + (++uidN)); }catch(e){ return ''; }
  };
  const traffic = readTrafficList(rootDir);
  const trafficRank = {}; traffic.forEach((u, i) => { if(trafficRank[u] == null) trafficRank[u] = i; });
  const complete = p => p && !p.upcoming && scored(p) && priceOf(p) && specLines(p).length;

  // --- Dönen kart: editör yorumu yazılmış, sayfası üretilmiş, verisi eksiksiz ikililer ---
  const pairs = [];
  editorialPairKeys().forEach(key => {
    const [ia, ib] = key.split('|');
    const a = byId[ia], b = byId[ib];
    if(!complete(a) || !complete(b)) return;
    const file = comparisonFileName(a, b);
    const url = `karsilastir/${file}`;
    if(!exists(url)) return;
    const sa = Math.round(scores[a.id]), sb = Math.round(scores[b.id]);
    // Yüksek puanlı ürün solda.
    const [L, R, sl, sr] = sa >= sb ? [a, b, sa, sb] : [b, a, sb, sa];
    pairs.push({ L, R, sl, sr, url, cat: a.cat, rank: trafficRank[url] != null ? trafficRank[url] : 1e9 });
  });
  pairs.sort((x, y) => x.rank - y.rank || x.url.localeCompare(y.url));
  // Türkiye'de en çok aranan listesi (lib/turkiye-populer.json) önceliklidir: kategori başına ilk uygun çift.
  const trPairs = [];
  try{
    turkiyePopulerCiftler({ products: prods, rootDir }).forEach(c => {
      if(!complete(c.a) || !complete(c.b)) return;
      const sa = Math.round(scores[c.a.id]), sb = Math.round(scores[c.b.id]);
      const [L, R, sl, sr] = sa >= sb ? [c.a, c.b, sa, sb] : [c.b, c.a, sb, sa];
      trPairs.push({ L, R, sl, sr, url: c.url, cat: c.a.cat, rank: 0 });
    });
  }catch(e){ console.warn('Anasayfa: Türkiye listesi okunamadı:', e.message); }
  const slides = [];
  const usedCats = new Set();
  trPairs.forEach(d => { if(slides.length < 4 && !usedCats.has(d.cat)){ slides.push(d); usedCats.add(d.cat); } });
  pairs.forEach(d => { if(slides.length < 4 && !usedCats.has(d.cat) && !slides.some(z => z.url === d.url)){ slides.push(d); usedCats.add(d.cat); } });
  pairs.forEach(d => { if(slides.length < 4 && !slides.some(z => z.url === d.url)) slides.push(d); });
  const vsTitle = trPairs.length ? 'Türkiye\'de en çok aranan karşılaştırmalar' : 'Popüler karşılaştırmalar';

  const note = d => {
    const pl = priceOf(d.L), pr = priceOf(d.R), diff = Math.abs(pl - pr);
    const sd = d.sl - d.sr;
    const s = x => `<strong>${x}</strong>`;
    if(sd === 0 && diff < 500) return 'Puanlar ve fiyatlar başa baş; kararı kullanım şekli belirliyor.';
    if(pl <= pr) return `${esc(d.L.name)} ${s((diff < 500 ? 'aynı fiyata' : tl(diff) + ' daha ucuz'))} ve puanı ${sd} puan yüksek.`;
    if(sd === 0) return `Puanlar eşit; ${esc(d.R.name)} ${s(tl(diff) + ' daha ucuz')}.`;
    return `${esc(d.L.name)} ${sd} puan önde, ${esc(d.R.name)} ise ${s(tl(diff) + ' daha ucuz')}.`;
  };
  const side = (p, sc, win, cls) => {
    const lines = specLines(p);
    return `<div class="tvh-side ${cls}">
            <span class="img" aria-hidden="true">${img(p)}</span>
            <span class="cat">${esc(p.cat)}</span>
            <span class="nm">${esc(p.name)}</span>
            <span class="sk${win ? ' win' : ''}">${sc}<small>/100</small></span>
            <span class="pr">${tl(priceOf(p))}</span>
            <span class="sp">${lines.map(esc).join('<br>')}</span>
          </div>`;
  };
  const vsHtml = slides.length ? `
    <div class="tvh-vs" aria-roledescription="carousel" aria-label="${esc(vsTitle)}">
      <div class="tvh-vs-top"><span>${esc(vsTitle)}</span>${slides.length > 1 ? `<span class="tvh-dots">${slides.map((d, i) => `<button type="button" aria-label="${i+1}. karşılaştırma: ${esc(d.L.name)} ile ${esc(d.R.name)}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</span>` : ''}</div>
      <div class="tvh-slides">
${slides.map((d, i) => `      <div class="tvh-slide${i === 0 ? ' on' : ''}" aria-roledescription="slide" aria-label="${i+1} / ${slides.length}">
        <div class="tvh-duo">
          ${side(d.L, d.sl, d.sl > d.sr, 'l')}
          ${side(d.R, d.sr, d.sr > d.sl, 'r')}
          <span class="tvh-vsb" aria-hidden="true">VS</span>
        </div>
        <p class="tvh-note">${note(d)}</p>
        <a class="tvh-open" href="${esc(d.url)}">Karşılaştırmayı aç →</a>
      </div>`).join('\n')}
      </div>
    </div>
` : '';

  // --- "Popüler:" bağlantıları ---
  const chips = CHIP_CANDIDATES.filter(([u]) => exists(u)).slice(0, 3);
  const chipsHtml = chips.length ? `
      <div class="tvh-chips"><span>Popüler:</span>${chips.map(([u, t]) => `<a href="${u}">${esc(t)}</a>`).join('')}</div>
` : '';

  // --- Kategoriler ---
  const catalog = prods.filter(p => !p.upcoming);
  const catHtmlInner = CATS.map(c => {
    const list = catalog.filter(p => p.cat === c.name);
    if(!list.length || !exists(c.slug + '.html')) return '';
    const rep = { id: 'kategori-' + c.slug, cat: c.name, name: c.name, specs: {} };
    return `      <a class="tvh-cat" href="${c.slug}.html"><span class="ic" aria-hidden="true">${img(rep)}</span>${esc(c.name)}<small>${list.length} model</small></a>`;
  }).filter(Boolean);
  const catHtml = catHtmlInner.length ? `
  <section class="tvh-blk" id="kategoriler" aria-labelledby="catTitle">
    <div class="tvh-bh"><h2 id="catTitle">Kategoriler</h2></div>
    <div class="tvh-cats">
${catHtmlInner.join('\n')}
    </div>
  </section>
` : '';

  // --- Sekmeli ürünler ---
  const card = (p, href) => {
    const lines = specLines(p);
    return `      <a class="tvh-k" href="${esc(href || urunUrl(p))}">
        <span class="kimg" aria-hidden="true">${img(p)}</span>
        <span class="kb"><span class="br">${esc(p.cat)}</span><span class="nm">${esc(p.name)}</span><span class="sp">${esc(lines[0] || '')}</span><span class="pr">${tl(priceOf(p))}</span></span>
      </a>`;
  };
  const sortNew = (a, b) => String(b.addedAt || b.added_at || '').localeCompare(String(a.addedAt || a.added_at || '')) || String(b.created_at || '').localeCompare(String(a.created_at || '')) || a.id.localeCompare(b.id);
  const withData = catalog.filter(p => priceOf(p) && specLines(p).length && exists(urunUrl(p)));
  const yeni = [...withData].sort(sortNew).slice(0, 4);
  const incelemeUrl = p => `inceleme/${productSlug(p)}-inceleme.html`;
  const editor = withData.filter(p => editorialForProduct(p.id) && exists(incelemeUrl(p)))
    .sort((a, b) => String((editorialForProduct(b.id) || {}).tarih || '').localeCompare(String((editorialForProduct(a.id) || {}).tarih || '')) || a.id.localeCompare(b.id))
    .slice(0, 4);
  const popRank = p => {
    const r = [trafficRank[urunUrl(p)], trafficRank[incelemeUrl(p)]].filter(x => x != null);
    return r.length ? Math.min(...r) : 1e9;
  };
  const cok = withData.filter(p => popRank(p) < 1e9).sort((a, b) => popRank(a) - popRank(b)).slice(0, 4);
  const tabs = [
    ['yeni', 'Yeni eklenenler', yeni.map(p => card(p))],
    ['editor', 'Editör incelemeleri', editor.map(p => card(p, incelemeUrl(p)))],
    ['cok', 'En çok bakılanlar', cok.map(p => card(p))],
  ].filter(t => t[2].length >= 2);
  const urunHtml = tabs.length ? `
  <section class="tvh-blk" aria-labelledby="urunTitle">
    <div class="tvh-bh"><h2 id="urunTitle">Öne çıkan ürünler</h2><a class="tvh-more" href="karsilastirmalar.html">Tüm karşılaştırmalar</a></div>
    <div class="tvh-tabs" role="tablist" aria-label="Ürün listeleri">
${tabs.map((t, i) => `      <button type="button" role="tab" id="tab-${t[0]}" aria-controls="pane-${t[0]}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${t[1]}</button>`).join('\n')}
    </div>
${tabs.map((t, i) => `    <div class="tvh-pane tvh-pgrid" role="tabpanel" id="pane-${t[0]}" aria-labelledby="tab-${t[0]}"${i === 0 ? '' : ' hidden'}>
${t[2].join('\n')}
    </div>`).join('\n')}
  </section>
` : '';

  // --- Son haberler ---
  const items = (news||[]).filter(n => n && n.id && n.title)
    .sort((a,b) => (b.publishedIso||b.date||'').localeCompare(a.publishedIso||a.date||'') || (a.id||'').localeCompare(b.id||'')).slice(0,4);
  const dayText = n => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(n.publishedIso || n.date || '');
    return m ? `${+m[3]} ${MONTHS[+m[2]-1]}` : '';
  };
  const newsImg = n => {
    const c = n.cover && (n.cover['4x3'] || n.cover['16x9'] || n.cover.thumb);
    if(c && c.path) return `<img src="${esc(c.path)}" alt="${esc(n.cover.alt || '')}" width="${c.w || ''}" height="${c.h || ''}" loading="lazy" decoding="async" />`;
    const rel = n.relatedProductId && byId[n.relatedProductId];
    return `<span aria-hidden="true" style="display:contents">${img(rel || { id: 'haber-' + n.id, cat: CATS.some(c => c.name === n.cat) ? n.cat : 'Telefon', name: n.title, specs: {} })}</span>`;
  };
  const newsHtml = items.length ? `
  <section class="tvh-blk" id="son-haberler" aria-labelledby="haberTitle">
    <div class="tvh-bh"><h2 id="haberTitle">Son haberler</h2><a class="tvh-more" href="haberler.html">Tüm haberler</a></div>
    <div class="tvh-pgrid news">
${items.map(n => `      <a class="tvh-n" href="haberler/${esc(n.id)}.html">
        <span class="nimg">${newsImg(n)}</span>
        <span class="nc">${esc(n.cat || 'Haber')}${dayText(n) ? ' · ' + dayText(n) : ''}</span>
        <span class="nt">${esc(n.title)}</span>
        ${n.summary ? `<span class="ns">${esc(n.summary.length > 120 ? n.summary.slice(0, 117).replace(/\s+\S*$/, '') + '…' : n.summary)}</span>` : ''}
      </a>`).join('\n')}
    </div>
  </section>
` : '';

  // --- Rehberler ---
  const guides = [];
  POPULAR_GUIDES.forEach(slug => {
    const jf = path.join(rootDir, 'lib', 'rehber-icerik', slug + '.json');
    if(guides.length >= 6 || !fs.existsSync(jf) || !exists(`rehber/${slug}.html`)) return;
    try{ const d = JSON.parse(fs.readFileSync(jf,'utf8')); guides.push({ slug, title: d.title }); }catch(e){}
  });
  const rehberHtml = guides.length >= 4 ? `
  <section class="tvh-blk" id="rehberler" aria-labelledby="rehberTitle">
    <div class="tvh-bh"><h2 id="rehberTitle">Satın alma rehberleri</h2></div>
    <ul class="tvh-rl">
${guides.map(g => `      <li><a href="rehber/${g.slug}.html">${esc(g.title)}</a></li>`).join('\n')}
    </ul>
  </section>
` : '';


  // --- Sayfa sonu dizini: popüler markalar + marka başına en iyi modeller + en iyi listeler ---
  const catalogAll = prods.filter(p => !p.upcoming);
  const canonBrand = brandCanonicalizer(catalogAll, brandOf);
  const brandGroups = {};
  catalogAll.forEach(p => { const b = canonBrand(brandOf(p)); (brandGroups[p.cat + '|||' + b] = brandGroups[p.cat + '|||' + b] || []).push(p); });
  const brandPage = (cat, brand) => { const rel = `marka/${slugify(brand)}-${SLUG_MAP[cat]}.html`; return exists(rel) ? rel : null; };
  const chipsAll = Object.entries(brandGroups).map(([k, arr]) => { const [cat, brand] = k.split('|||'); return { cat, brand, n: arr.length, href: brandPage(cat, brand) }; })
    .filter(x => x.href && x.n >= 4).sort((a, b) => b.n - a.n || a.brand.localeCompare(b.brand, 'tr'));
  const chipBrands = chipsAll.slice(0, 18);
  const phoneCols = chipsAll.filter(x => x.cat === 'Telefon').slice(0, 6).map(x => {
    const list = brandGroups['Telefon|||' + x.brand].filter(p => scored(p) && exists(urunUrl(p)))
      .sort((a, b) => scores[b.id] - scores[a.id] || a.name.localeCompare(b.name, 'tr')).slice(0, 10);
    return { brand: x.brand, href: x.href, list };
  }).filter(c => c.list.length >= 5);
  const bestLinks = [];
  CHIP_CANDIDATES.forEach(([href, label]) => { if(exists(href)) bestLinks.push([href, label]); });
  POPULAR_GUIDES.forEach(slug => { const jf = path.join(rootDir, 'lib', 'rehber-icerik', slug + '.json');
    if(bestLinks.length >= 10 || !fs.existsSync(jf) || !exists(`rehber/${slug}.html`)) return;
    try{ bestLinks.push([`rehber/${slug}.html`, JSON.parse(fs.readFileSync(jf, 'utf8')).title]); }catch(e){} });
  const dizinHtml = chipBrands.length >= 6 ? `
  <section class="tvh-blk tvh-dz" id="markalar" aria-labelledby="markaTitle">
    <div class="tvh-bh"><h2 id="markaTitle">Popüler markalar</h2>
      <div class="tvh-arrows"><button type="button" id="dzPrev" aria-label="Önceki markalar">‹</button><button type="button" id="dzNext" aria-label="Sonraki markalar">›</button></div></div>
    <div class="tvh-dz-track" id="dzTrack">
${chipBrands.map(x => `      <a href="${esc(x.href)}"><b>${esc(x.brand)}</b><span>${esc(x.cat)}</span></a>`).join('\n')}
    </div>
${phoneCols.length >= 3 ? `    <div class="tvh-dz-cols">
${phoneCols.map(c => `      <div><h3><a href="${esc(c.href)}">${esc(c.brand)}</a></h3><ul>
${c.list.map(p => `        <li><a href="${esc(urunUrl(p))}">${esc(p.name)}</a></li>`).join('\n')}
      </ul></div>`).join('\n')}
${bestLinks.length >= 4 ? `      <div><h3>En iyi listeler</h3><ul>
${bestLinks.map(([h, t]) => `        <li><a href="${esc(h)}">${esc(t)}</a></li>`).join('\n')}
      </ul></div>` : ''}
    </div>` : ''}
  </section>
` : '';

  const put = (name, inner) => {
    const next = replaceBetween(html, `<!-- ${name}_START -->`, `<!-- ${name}_END -->`, inner);
    if(next === null){ console.log(`Anasayfa: ${name} işaretçisi yok, atlandı.`); return; }
    html = next;
  };
  put('HOME_CHIPS', chipsHtml);
  put('HOME_VS', vsHtml);
  put('HOME_KATEGORI', catHtml);
  put('HOME_URUNLER', urunHtml);
  put('HOME_HABER', newsHtml);
  put('HOME_REHBER', rehberHtml);
  put('HOME_DIZIN', dizinHtml);
  put('HOME_GUNCELLEME', `\n    <p class="tvh-upd">Katalog son güncelleme: <strong>${istanbulToday()}</strong></p>\n`);

  fs.writeFileSync(indexPath, html);
  console.log(`Anasayfa: ${slides.length} dönen karşılaştırma, ${catHtmlInner.length} kategori, sekmeler ${tabs.map(t => t[0] + ':' + t[2].length).join(' ')}, ${items.length} haber, ${guides.length} rehber, ${chips.length} popüler bağlantı.`);
}

module.exports = { updateHomeBlocks };
