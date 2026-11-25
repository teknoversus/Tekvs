// ============================================================
// Katalog verisinden sayfaya özgü özet blokları.
//
// Marka, marka-karşılaştırma ve haber sayfaları şablon metin ağırlıklı
// olduğu için denetimde "ince içerik" çıkıyordu. Buradaki bloklar metin
// uydurmaz: yalnızca kataloğumuzdaki gerçek değerleri (fiyat bandı,
// en büyük batarya, en hafif model vb.) okunur bir biçimde gösterir.
// Değer yoksa ya da anlamsızsa (0, "Belirtilmemiş") satır hiç basılmaz.
// ============================================================

const esc = s => (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const tl = n => Math.round(n).toLocaleString('tr-TR');

function priceOf(p){
  const key = Object.keys(p.specs||{}).find(k => /fiyat/i.test(k));
  if(!key) return null;
  const n = parseFloat(String(p.specs[key]).replace(/[^\d.,]/g,'').replace(',','.'));
  // 999.999 gibi yer tutucu fiyatlar gerçek değer değil, hesaba katılmaz.
  return isNaN(n) || n <= 0 || n >= 999999 ? null : n;
}

const BANDS = [
  { ad:'10.000 TL altı',     min:0,     max:10000 },
  { ad:'10.000 - 30.000 TL', min:10000, max:30000 },
  { ad:'30.000 - 60.000 TL', min:30000, max:60000 },
  { ad:'60.000 TL üzeri',    min:60000, max:Infinity },
];

// Kategoriye göre "öne çıkanlar": hangi değerin en büyüğü/en küçüğü anlamlı.
// lo/hi: bu aralığın dışındaki değerler veri hatası sayılır ve atlanır.
const HIGHLIGHTS = {
  'Telefon': [
    { key:'Pil (mAh)', ad:'En büyük batarya', birim:' mAh', lo:1000, hi:12000 },
    { key:'Ekran (inç)', ad:'En büyük ekran', birim:' inç', lo:4, hi:9 },
    { key:'RAM (GB)', ad:'En yüksek RAM', birim:' GB', lo:1, hi:32 },
    { key:'Kamera (MP)', ad:'En yüksek ana kamera çözünürlüğü', birim:' MP', lo:5, hi:250 },
    { key:'Ürünün Ağırlığı (g)', ad:'En hafif model', birim:' g', lo:90, hi:400, min:true },
  ],
  'Tablet': [
    { key:'Ekran (inç)', ad:'En büyük ekran', birim:' inç', lo:7, hi:16 },
    { key:'Pil (mAh)', ad:'En büyük batarya', birim:' mAh', lo:3000, hi:20000 },
    { key:'RAM (GB)', ad:'En yüksek RAM', birim:' GB', lo:1, hi:32 },
    { key:'Yenileme Hızı (Hz)', ad:'En yüksek yenileme hızı', birim:' Hz', lo:50, hi:240 },
    { key:'Ürünün Ağırlığı (g)', ad:'En hafif model', birim:' g', lo:200, hi:1200, min:true },
  ],
  'Dizüstü': [
    { key:'RAM (GB)', ad:'En yüksek RAM', birim:' GB', lo:4, hi:256 },
    { key:'Depolama (GB)', ad:'En büyük depolama', birim:' GB', lo:64, hi:16384 },
    { key:'Yenileme Hızı (Hz)', ad:'En yüksek ekran yenileme hızı', birim:' Hz', lo:50, hi:500 },
    { key:'Pil Kapasitesi (Wh)', ad:'En büyük batarya', birim:' Wh', lo:20, hi:120 },
    { key:'Ürünün Ağırlığı (g)', ad:'En hafif model', birim:' g', lo:700, hi:5000, min:true },
  ],
  'Akıllı Saat': [
    { key:'Pil Süresi (Gün)', ad:'En uzun pil süresi', birim:' gün', lo:0.5, hi:120 },
    { key:'Ürünün Ağırlığı (g)', ad:'En hafif model', birim:' g', lo:10, hi:150, min:true },
    { key:'Kalınlık (mm)', ad:'En ince kasa', birim:' mm', lo:5, hi:25, min:true },
  ],
  'Kulaklık': [
    { key:'Pil Ömrü (Kutu ile Toplam)', ad:'En uzun toplam pil ömrü', birim:' saat', lo:3, hi:200 },
    { key:'Pil Ömrü (Kulaklık)', ad:'Tek şarjla en uzun kullanım', birim:' saat', lo:2, hi:120 },
    { key:'Ürünün Ağırlığı (g)', ad:'En hafif model', birim:' g', lo:3, hi:600, min:true },
  ],
  'Televizyon': [
    { key:'Ekran (inç)', ad:'En büyük ekran', birim:' inç', lo:20, hi:120 },
    { key:'Ses Çıkış Gücü (W)', ad:'En yüksek ses çıkış gücü', birim:' W', lo:5, hi:200 },
    { key:'Yenileme Hızı (Hz)', ad:'En yüksek yenileme hızı', birim:' Hz', lo:50, hi:300 },
  ],
  'Kamera': [
    { key:'Çözünürlük (MP)', ad:'En yüksek çözünürlük', birim:' MP', lo:5, hi:120 },
    { key:'Ürünün Ağırlığı (g)', ad:'En hafif model', birim:' g', lo:30, hi:3000, min:true },
  ],
};

// Kategoriye göre "kaç modelde var" sayımları.
const yes = v => /^(var|evet|true)/i.test(String(v||'').trim());
const FLAGS = {
  'Telefon': [
    { ad:'5G destekli', test:p => /5G/i.test(p.specs['Hücresel Teknoloji']||'') },
    { ad:'IP68/IP69 sertifikalı', test:p => /IP6[89]/i.test(p.specs['Su Geçirmezlik']||'') },
    { ad:'120 Hz ve üzeri ekranlı', test:p => parseFloat(p.specs['Yenileme Hızı (Hz)']) >= 120 },
  ],
  'Tablet': [
    { ad:'kalem destekli', test:p => yes(p.specs['Kalem Desteği']) },
    { ad:'hücresel bağlantı (4G/5G) seçenekli', test:p => /[45]G/i.test(p.specs['Hücresel Teknoloji']||'') },
    { ad:'OLED/AMOLED ekranlı', test:p => /OLED/i.test(p.specs['Ekran Türü']||'') },
  ],
  'Dizüstü': [
    { ad:'harici ekran kartlı (RTX/RX)', test:p => /RTX|GTX|Radeon RX|\bRX\s?\d/i.test(p.specs['Ekran Kartı']||'') },
    { ad:'OLED ekranlı', test:p => /OLED/i.test(p.specs['Ekran Türü']||'') },
    { ad:'16 GB ve üzeri RAM\'li', test:p => parseFloat(p.specs['RAM (GB)']) >= 16 },
  ],
  'Akıllı Saat': [
    { ad:'GPS\'li', test:p => yes(p.specs['GPS']) },
    { ad:'temassız ödeme (NFC) destekli', test:p => yes(p.specs['NFC/Temassız Ödeme']) },
    { ad:'SIM kart / eSIM destekli', test:p => yes(p.specs['SIM Kart Desteği']) || yes(p.specs['LTE/eSIM']) },
  ],
  'Kulaklık': [
    { ad:'aktif gürültü engellemeli (ANC)', test:p => yes(p.specs['Aktif Gürültü Engelleme (ANC)']) },
    { ad:'kablosuz şarj destekli', test:p => yes(p.specs['Kablosuz Şarj']) },
  ],
  'Televizyon': [
    { ad:'OLED ekranlı', test:p => /OLED/i.test(p.specs['Ekran Türü']||'') },
    { ad:'QLED / Mini LED ekranlı', test:p => /QLED|Mini ?LED|QD/i.test(p.specs['Ekran Türü']||'') },
    { ad:'120 Hz ve üzeri', test:p => parseFloat(p.specs['Yenileme Hızı (Hz)']) >= 120 },
  ],
  'Kamera': [
    { ad:'değişebilir objektifli', test:p => /Sony E|Canon RF|Nikon Z|Fujifilm X|Micro Four|L-Mount|EF|RF-S/i.test(p.specs['Lens Mount']||'') },
    { ad:'su geçirmez gövdeli', test:p => /IP6|IPX|m\b|metre/i.test(p.specs['Su Geçirmezlik']||'') && !/yok|belirtil/i.test(p.specs['Su Geçirmezlik']||'') },
  ],
};

function numSpec(p, h){
  const raw = p.specs && p.specs[h.key];
  if(raw == null) return null;
  const n = parseFloat(String(raw).replace(',', '.'));
  if(isNaN(n) || n < h.lo || n > h.hi) return null;
  return n;
}
const fmtNum = n => (Math.round(n * 10) / 10).toLocaleString('tr-TR');

// Bir ürün grubunun özeti.
function profile(items, cat){
  const priced = items.map(p => ({ p, v: priceOf(p) })).filter(x => x.v != null).sort((a,b) => a.v - b.v);
  const prices = priced.map(x => x.v);
  const median = prices.length ? prices[Math.floor(prices.length / 2)] : null;
  const bands = BANDS.map(b => ({ ...b, items: priced.filter(x => x.v >= b.min && x.v < b.max).map(x => x.p) }));
  const highlights = (HIGHLIGHTS[cat] || []).map(h => {
    const vals = items.map(p => ({ p, v: numSpec(p, h) })).filter(x => x.v != null);
    if(vals.length < 2) return null;
    vals.sort((a,b) => h.min ? a.v - b.v : b.v - a.v);
    return { ad: h.ad, p: vals[0].p, v: vals[0].v, birim: h.birim, n: vals.length };
  }).filter(Boolean);
  const flags = (FLAGS[cat] || []).map(f => ({ ad: f.ad, n: items.filter(f.test).length })).filter(f => f.n > 0);
  return { n: items.length, priced: priced.length, min: prices[0] ?? null, max: prices[prices.length-1] ?? null, median, bands, highlights, flags };
}

const link = (p, productSlug) => `<a href="../urun/${productSlug(p)}.html">${esc(p.name)}</a>`;

// Marka sayfası: "Rakamlarla {marka} {kategori}" bölümü.
function renderBrandInsights({ brand, cat, plural, items, productSlug }){
  const pr = profile(items, cat);
  if(pr.n < 2) return '';
  const parts = [];
  if(pr.min != null){
    const dolu = pr.bands.filter(b => b.items.length);
    const dagilim = dolu.map(b => `${b.items.length} model ${b.ad}`).join(', ');
    parts.push(`  <p style="font-size:14px;line-height:1.7;">Kataloğumuzda fiyatı belli olan ${pr.priced} ${esc(brand)} ${esc(cat.toLowerCase())} modelinin en ucuzu ${tl(pr.min)} TL, en pahalısı ${tl(pr.max)} TL; ortanca fiyat ${tl(pr.median)} TL. Fiyat bantlarına göre dağılım: ${esc(dagilim)}.</p>`);
    const rows = dolu.map(b => `      <tr style="border-bottom:1px solid var(--line);"><td style="padding:7px 10px 7px 0;white-space:nowrap;">${esc(b.ad)}</td><td style="padding:7px 10px;">${b.items.length}</td><td style="padding:7px 0;">${b.items.slice(-3).reverse().map(p => link(p, productSlug)).join(', ')}</td></tr>`).join('\n');
    parts.push(`  <table style="width:100%;border-collapse:collapse;font-size:13.5px;margin:8px 0 16px;">
    <thead><tr style="border-bottom:2px solid var(--line);"><th style="text-align:left;padding:6px 10px 6px 0;">Fiyat bandı</th><th style="text-align:left;padding:6px 10px;">Model</th><th style="text-align:left;padding:6px 0;">Bu banttaki örnekler</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>`);
  }
  if(pr.highlights.length){
    parts.push(`  <ul style="font-size:14px;line-height:1.7;margin:0 0 12px;padding-left:20px;">
${pr.highlights.map(h => `    <li>${esc(h.ad)}: ${link(h.p, productSlug)} (${fmtNum(h.v)}${esc(h.birim)})</li>`).join('\n')}
  </ul>`);
  }
  if(pr.flags.length){
    parts.push(`  <p style="font-size:14px;line-height:1.7;">Özellik dağılımı: ${pr.flags.map(f => `${pr.n} modelin ${f.n} tanesi ${esc(f.ad)}`).join('; ')}.</p>`);
  }
  if(!parts.length) return '';
  return `
  <section style="margin:24px 0;">
  <h2 style="font-size:16px;margin:0 0 10px;">Rakamlarla ${esc(brand)} ${esc(plural)}</h2>
${parts.join('\n')}
  </section>`;
}

// Marka karşılaştırma: iki markanın aynı ölçütlerle yan yana tablosu.
function renderBrandVsInsights({ b1, b2, cat, items1, items2, productSlug }){
  const p1 = profile(items1, cat), p2 = profile(items2, cat);
  const rows = [];
  const cell = s => `<td style="padding:7px 10px;vertical-align:top;">${s}</td>`;
  const row = (ad, a, b) => rows.push(`      <tr style="border-bottom:1px solid var(--line);"><td style="padding:7px 10px 7px 0;color:var(--ink-soft);vertical-align:top;">${esc(ad)}</td>${cell(a)}${cell(b)}</tr>`);
  if(p1.median != null && p2.median != null){
    row('Ortanca fiyat', `${tl(p1.median)} ₺`, `${tl(p2.median)} ₺`);
    const c1 = items1.map(p => ({p, v:priceOf(p)})).filter(x=>x.v!=null).sort((a,b)=>a.v-b.v)[0];
    const c2 = items2.map(p => ({p, v:priceOf(p)})).filter(x=>x.v!=null).sort((a,b)=>a.v-b.v)[0];
    if(c1 && c2) row('En uygun model', `${link(c1.p, productSlug)} (${tl(c1.v)} ₺)`, `${link(c2.p, productSlug)} (${tl(c2.v)} ₺)`);
    BANDS.forEach(b => {
      const n1 = p1.bands.find(x => x.ad === b.ad).items.length, n2 = p2.bands.find(x => x.ad === b.ad).items.length;
      if(n1 || n2) row(`${b.ad} model sayısı`, String(n1), String(n2));
    });
  }
  (HIGHLIGHTS[cat] || []).forEach(h => {
    const a = p1.highlights.find(x => x.ad === h.ad), b = p2.highlights.find(x => x.ad === h.ad);
    if(!a || !b) return;
    row(h.ad, `${link(a.p, productSlug)} (${fmtNum(a.v)}${esc(h.birim)})`, `${link(b.p, productSlug)} (${fmtNum(b.v)}${esc(h.birim)})`);
  });
  (FLAGS[cat] || []).forEach(f => {
    const n1 = items1.filter(f.test).length, n2 = items2.filter(f.test).length;
    if(!n1 && !n2) return;
    row(`${f.ad.charAt(0).toUpperCase() + f.ad.slice(1)} model`, `${n1} / ${items1.length}`, `${n2} / ${items2.length}`);
  });
  if(rows.length < 3) return '';
  return `
  <section style="margin:24px 0;">
  <h2 style="font-size:16px;margin:0 0 10px;">${esc(b1)} ve ${esc(b2)} yan yana: kataloğumuzdaki rakamlar</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13.5px;">
    <thead><tr style="border-bottom:2px solid var(--line);"><th style="text-align:left;padding:6px 10px 6px 0;">Ölçüt</th><th style="text-align:left;padding:6px 10px;">${esc(b1)}</th><th style="text-align:left;padding:6px 10px;">${esc(b2)}</th></tr></thead>
    <tbody>
${rows.join('\n')}
    </tbody>
  </table>
  <p style="font-size:12.5px;color:var(--ink-soft);margin:8px 0 0;">Tablo yalnızca kataloğumuzda değeri kayıtlı modelleri kapsar; bir markanın tüm ürün gamını değil, bizim listelediğimiz modelleri yansıtır.</p>
  </section>`;
}

// Haber sayfası: haberde adı geçen katalog ürünlerinin kısa özellik kartı.
const NEWS_SPECS = {
  'Telefon': ['İşlemci','Ekran (inç)','Pil (mAh)','Kamera (MP)','RAM (GB)'],
  'Tablet': ['İşlemci','Ekran (inç)','Pil (mAh)','RAM (GB)','Kalem Desteği'],
  'Dizüstü': ['İşlemci','Ekran Kartı','RAM (GB)','Ekran (inç)','Ürünün Ağırlığı (g)'],
  'Akıllı Saat': ['İşletim Sistemi','Pil Süresi (Gün)','GPS','Su Geçirmezlik','Ekran Türü'],
  'Kulaklık': ['Aktif Gürültü Engelleme (ANC)','Pil Ömrü (Kulaklık)','Pil Ömrü (Kutu ile Toplam)','Bluetooth Versiyonu','Su Geçirmezlik'],
  'Televizyon': ['Ekran (inç)','Ekran Türü','Çözünürlük','Yenileme Hızı (Hz)','İşletim Sistemi'],
  'Kamera': ['Sensör Boyutu','Çözünürlük (MP)','Video','Lens Mount','Ürünün Ağırlığı (g)'],
};
const BAD = /^(belirtilmemi|none|nan|null|undefined|-|—|)$/i;
function cleanVal(k, v){
  let s = String(v == null ? '' : v).trim();
  if(BAD.test(s)) return null;
  if(/^\d+\.0$/.test(s)) s = s.slice(0, -2);
  if(s === 'True') s = 'Var'; if(s === 'False') s = 'Yok';
  return s.length > 60 ? s.slice(0, 57) + '…' : s;
}

// Haberin başlığında/metninde adı geçen ürünler + related_product_id.
function findNewsProducts(n, products){
  const text = ` ${n.title} ${(n.body||[]).join(' ')} `.toLocaleLowerCase('tr-TR');
  const out = [];
  const seen = new Set();
  const add = p => { if(p && !p.upcoming && !seen.has(p.id)){ seen.add(p.id); out.push(p); } };
  if(n.relatedProductId) add(products.find(p => p.id === n.relatedProductId));
  // Uzun adlar önce: "iPhone 17 Pro Max" eşleşirse "iPhone 17 Pro" ayrıca eklenmesin.
  const cands = products.filter(p => !p.upcoming && p.name && p.name.length >= 6 && /\d/.test(p.name) && p.name.split(' ').length >= 2)
    .sort((a,b) => b.name.length - a.name.length);
  const used = [];
  for(const p of cands){
    if(out.length >= 4) break;
    const nm = p.name.toLocaleLowerCase('tr-TR');
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'u');
    if(!re.test(text)) continue;
    if(used.some(u => u.includes(nm))) continue;
    used.push(nm);
    add(p);
  }
  return out.slice(0, 4);
}

function renderNewsProducts({ n, products, productSlug }){
  const ps = findNewsProducts(n, products);
  if(!ps.length) return '';
  const cards = ps.map(p => {
    const keys = NEWS_SPECS[p.cat] || [];
    const specs = keys.map(k => [k, cleanVal(k, p.specs && p.specs[k])]).filter(x => x[1]);
    const price = priceOf(p);
    if(specs.length < 2 && !price) return '';
    return `    <div style="border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:0 0 10px;">
      <div style="font-weight:600;font-size:14.5px;margin:0 0 6px;"><a href="../urun/${productSlug(p)}.html">${esc(p.name)}</a>${price ? ` <span style="font-weight:400;color:var(--ink-soft);font-size:13px;">· ${tl(price)} ₺</span>` : ''}</div>
      <div style="font-size:13px;line-height:1.6;color:var(--ink-soft);">${specs.map(([k,v]) => `${esc(k)}: <b style="color:var(--ink);font-weight:600;">${esc(v)}</b>`).join(' · ')}</div>
    </div>`;
  }).filter(Boolean);
  if(!cards.length) return '';
  return `
  <section style="margin:24px 0;">
  <h2 style="font-size:15px;margin:0 0 10px;">Haberde geçen modeller kataloğumuzda</h2>
${cards.join('\n')}
  <p style="font-size:12.5px;color:var(--ink-soft);margin:4px 0 0;">Fiyatlar kataloğumuzdaki son kayıtlı değerdir; satıcıya göre değişebilir.</p>
  </section>`;
}

// Konuyla ilgili diğer haberler: başlıktaki marka/model kelimelerinin örtüşmesine göre.
const STOP = new Set('ve ile için bir yeni the of ile da de mi mu ne nasıl neden geliyor tanıtıldı tanitildi tanıttı oldu ortaya çıktı cikti yarın bugün türkiye türkiye\'de fiyat fiyatı fiyatları özellikleri ozellikler seri serisi serisinin model modeli modelleri ilk daha çok en kadar ama pro max ultra plus lite mah kamera kameralar pil batarya ekran ekranlı arka gövde iddiası iddia hangi belli başlıyor başlayan tarih tarihi kat'.split(' '));
const words = t => (t||'').toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N} ]/gu,' ').split(/\s+/).filter(w => w.length >= 3 && !STOP.has(w));
function relatedNews(n, items, max = 4){
  const mine = new Set(words(n.title));
  const first = words(n.title)[0];
  const scored = items.filter(x => x.id !== n.id).map(x => {
    const w = words(x.title);
    let sc = 0; w.forEach(t => { if(!mine.has(t) || /^\d+$/.test(t)) return; sc += /\d/.test(t) ? 2 : 1; });
    if(first && w[0] === first) sc += 1;
    return { x, sc };
  }).filter(o => o.sc >= 2).sort((a,b) => b.sc - a.sc || (b.x.publishedIso||'').localeCompare(a.x.publishedIso||''));
  return scored.slice(0, max).map(o => o.x);
}
function renderRelatedNews({ n, items, trDate }){
  const rel = relatedNews(n, items);
  if(!rel.length) return '';
  return `
  <section style="margin:24px 0;">
  <h2 style="font-size:15px;margin:0 0 10px;">Konuyla ilgili diğer haberlerimiz</h2>
  <ul style="font-size:14px;line-height:1.7;margin:0;padding-left:20px;">
${rel.map(x => `    <li><a href="${x.id}.html">${esc(x.title)}</a>${x.publishedIso && trDate ? ` <span style="color:var(--ink-soft);font-size:12.5px;">· ${trDate(x.publishedIso)}</span>` : ''}</li>`).join('\n')}
  </ul>
  </section>`;
}

module.exports = { relatedNews, renderRelatedNews, profile, renderBrandInsights, renderBrandVsInsights, renderNewsProducts, findNewsProducts, priceOf };
