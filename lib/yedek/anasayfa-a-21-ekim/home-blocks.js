// ============================================================
// Anasayfa blokları — A tasarımı (21 Ekim 2026).
// Her build'de index.html içindeki işaretçiler arasını yeniden yazar
// (idempotent, deterministik: aynı veri → aynı HTML).
//
//   HOME_A_POP        üstteki araçtaki "Sık bakılanlar" bağlantıları
//   HOME_A_DUELLO     "Öne çıkan karşılaştırmalar" (3 kart, canlı puan/fiyat)
//   HOME_A_KATEGORI   7 kategori kutusu (model sayısı + fiyat aralığı)
//   HOME_HABER_REHBER son haberler (görselli) + editör değerlendirmeleri + rehberler
//   HOME_GUNCELLEME   "Katalog son güncelleme" satırı
//
// Eski tasarımın yedeği: lib/yedek/anasayfa-eski/ (OKU-BENI.md).
// ============================================================
const fs = require('fs');
const path = require('path');
const { comparisonFileName } = require('./generate-comparisons');
const { editorialPairKeys, editorialForPair } = require('./editorial');

const esc = s => (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// Kategori seçim rehberlerinin dışında, en çok aranan konulardan seçilmiş rehberler.
const POPULAR_GUIDES = [
  'telefon-asiri-isinma-nasil-onlenir', 'sarj-olmayan-telefon-nasil-duzeltilir',
  'amoled-vs-lcd-fark', 'ekran-yenileme-hizi-hz-nedir', 'anc-nedir',
  'ssd-vs-hdd-farki', 'ram-ne-kadar-yeterli', 'ip-koruma-sinifi-nedir',
  'yeni-telefona-veri-nasil-aktarilir', 'yavas-laptop-nasil-hizlandirilir'
];

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const CATS = [
  { name:'Telefon', slug:'telefon', color:'#2B6CB0', icon:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>' },
  { name:'Dizüstü', slug:'dizustu', color:'#B23A5C', icon:'<rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 19h20"/>' },
  { name:'Tablet', slug:'tablet', color:'#4A5568', icon:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 18h2"/>' },
  { name:'Kulaklık', slug:'kulaklik', color:'#8A5A06', icon:'<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/>' },
  { name:'Akıllı Saat', slug:'akilli-saat', color:'#6B4C9A', icon:'<rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9 6V2h6v4M9 18v4h6v-4"/>' },
  { name:'Televizyon', slug:'televizyon', color:'#9A4B2F', icon:'<rect x="2" y="5" width="20" height="13" rx="2"/><path d="M8 22h8"/>' },
  { name:'Kamera', slug:'kamera', color:'#1F7A6C', icon:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13" r="3.5"/>' },
];

function istanbulToday(){
  const p = new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Istanbul', day:'numeric', month:'numeric', year:'numeric' })
    .formatToParts(new Date()).reduce((o,x)=>(o[x.type]=x.value,o),{});
  return `${+p.day} ${MONTHS[+p.month-1]} ${p.year}`;
}

function replaceBetween(html, startTag, endTag, inner){
  const re = new RegExp(startTag.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '[\\s\\S]*?' + endTag.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  return re.test(html) ? html.replace(re, () => `${startTag}${inner}${endTag}`) : null;
}

const priceOf = p => {
  const raw = (p && p.specs) ? p.specs['Fiyat (₺)'] : null;
  const n = parseFloat(String(raw == null ? '' : raw).replace(/[^\d.,]/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.'));
  return isFinite(n) && n > 0 ? n : 0;
};
const tl = n => Math.round(n).toLocaleString('tr-TR') + ' TL';
const scoreColor = s => s >= 80 ? '#1F7A6C' : s >= 50 ? '#8A5A06' : '#B23A5C';
const shortTitle = t => String(t || '').replace(/^Editör Değerlendirmesi:\s*/i, '');

// Editör değerlendirmesi yazılmış ikililer (sayfası gerçekten üretilmiş olanlar).
function editorialPairs({ rootDir, products, scores }){
  const byId = {};
  products.forEach(p => { byId[p.id] = p; });
  const out = [];
  editorialPairKeys().forEach(key => {
    const [ia, ib] = key.split('|');
    const a = byId[ia], b = byId[ib];
    if(!a || !b || a.upcoming || b.upcoming) return;
    const file = comparisonFileName(a, b);
    if(!fs.existsSync(path.join(rootDir, 'karsilastir', file))) return;
    const ed = editorialForPair(a.id, b.id) || {};
    out.push({ key, a, b, url: `karsilastir/${file}`, title: shortTitle(ed.baslik) || `${a.name} mı, ${b.name} mı?`,
      cat: a.cat, sa: scores[a.id], sb: scores[b.id], pa: priceOf(a), pb: priceOf(b) });
  });
  return out;
}

function duelNote(d){
  const sa = Math.round(d.sa), sb = Math.round(d.sb);
  const sd = Math.abs(sa - sb), pd = Math.abs(d.pa - d.pb);
  const hi = sa > sb ? d.a : sb > sa ? d.b : null;
  const cheap = d.pa < d.pb ? d.a : d.pb < d.pa ? d.b : null;
  let t;
  if(hi && cheap && hi === cheap) t = `${cheap.name} hem ${tl(pd)} daha ucuz hem puanı ${sd} puan yüksek.`;
  else if(hi && cheap) t = `${hi.name} puanı ${sd} puan yüksek ama ${tl(pd)} daha pahalı.`;
  else if(hi) t = `Fiyatlar aynı; ${hi.name} puanı ${sd} puan yüksek.`;
  else if(cheap) t = `Puanlar aynı; ${cheap.name} ${tl(pd)} daha ucuz.`;
  else t = 'Puanlar ve fiyatlar başa baş; kararı kullanım şekli belirliyor.';
  return t + ' Editörün yorumu sayfada.';
}

function duelCard(d){
  const side = (p, s, price, right) => `<div${right ? ' class="ha-duel-r"' : ''}>
          <div class="ha-duel-name">${esc(p.name)}</div>
          <div class="ha-duel-score" style="color:${scoreColor(s)};">${Math.round(s)}<small>/100</small></div>
          <div class="ha-duel-price">${price ? tl(price) : '—'}</div>
        </div>`;
  return `      <a class="ha-duel" href="${esc(d.url)}">
        <div class="ha-duel-cat">${esc(d.cat.toLocaleUpperCase('tr-TR'))} · EDİTÖR DEĞERLENDİRMESİ</div>
        <div class="ha-duel-row">
        ${side(d.a, d.sa, d.pa, false)}
          <div class="ha-duel-vs">VS</div>
        ${side(d.b, d.sb, d.pb, true)}
        </div>
        <div class="ha-duel-note">${esc(duelNote(d))}</div>
        <div class="ha-duel-cta">Karşılaştırmayı aç</div>
      </a>`;
}

function updateHomeBlocks({ rootDir, news, products, computeScores }){
  const indexPath = path.join(rootDir, 'index.html');
  if(!fs.existsSync(indexPath)) return;
  let html = fs.readFileSync(indexPath, 'utf8');
  const prods = (products || []).filter(p => p && p.id && p.name);
  let scores = {};
  try{ scores = computeScores ? computeScores(prods) : {}; }catch(e){ console.warn('Anasayfa: skor hesaplanamadı:', e.message); }
  const scored = p => scores[p.id] != null && isFinite(scores[p.id]);

  const eds = prods.length ? editorialPairs({ rootDir, products: prods, scores }).filter(d => scored(d.a) && scored(d.b)) : [];

  // --- Öne çıkan karşılaştırmalar: farklı kategorilerden 3 editör ikilisi ---
  const duels = [];
  const usedCats = new Set();
  eds.forEach(d => { if(duels.length < 3 && !usedCats.has(d.cat) && d.pa && d.pb){ duels.push(d); usedCats.add(d.cat); } });
  eds.forEach(d => { if(duels.length < 3 && !duels.includes(d) && d.pa && d.pb) duels.push(d); });
  const duelHtml = duels.length ? `
  <section class="ha-sec" aria-labelledby="haDuelTitle">
    <div class="ha-head">
      <div>
        <div class="section-label">Kafa kafaya</div>
        <h2 id="haDuelTitle">Öne çıkan karşılaştırmalar</h2>
      </div>
      <a href="karsilastirmalar.html">Tüm karşılaştırmalar</a>
    </div>
    <div class="ha-duels">
${duels.map(duelCard).join('\n')}
    </div>
  </section>
` : '';

  // --- Araçtaki "Sık bakılanlar" ---
  const pop = eds.filter(d => !duels.includes(d)).slice(0, 3);
  const popHtml = pop.length ? `
      <div class="ha-pop"><span>Editörün karşılaştırdıkları:</span>${pop.map(d => `<a href="${esc(d.url)}">${esc(d.a.name)} vs ${esc(d.b.name)}</a>`).join('')}</div>
` : '';

  // --- Kategoriler ---
  const catalog = prods.filter(p => !p.upcoming);
  const catTiles = CATS.map(c => {
    const list = catalog.filter(p => p.cat === c.name);
    if(!list.length || !fs.existsSync(path.join(rootDir, c.slug + '.html'))) return '';
    const prices = list.map(priceOf).filter(Boolean);
    const range = prices.length ? `${Math.round(Math.min(...prices)).toLocaleString('tr-TR')} – ${Math.round(Math.max(...prices)).toLocaleString('tr-TR')} ₺` : '';
    return `      <a class="ha-cat" href="${c.slug}.html">
        <span class="ha-cat-ic" style="background:${c.color}1A;color:${c.color};"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${c.icon}</svg></span>
        <span class="ha-cat-name">${esc(c.name)}</span>
        <span class="ha-cat-meta">${list.length} model${range ? ' · ' + range : ''}</span>
      </a>`;
  }).filter(Boolean);
  const catHtml = catTiles.length ? `
  <section class="ha-sec" id="kategoriler" aria-labelledby="haCatTitle">
    <div class="ha-head"><h2 id="haCatTitle">Kategoriler</h2><a href="#katalog">Tüm ürünler</a></div>
    <div class="ha-cats">
${catTiles.join('\n')}
    </div>
  </section>
` : '';

  // --- Son haberler (görselli) + editör değerlendirmeleri ---
  const items = (news||[]).filter(n => n && n.id && n.title)
    .sort((a,b) => (b.publishedIso||b.date||'').localeCompare(a.publishedIso||a.date||'') || (a.id||'').localeCompare(b.id||'')).slice(0,4);
  const dayText = n => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(n.publishedIso || n.date || '');
    return m ? `${+m[3]} ${MONTHS[+m[2]-1]} ${m[1]}` : '';
  };
  const meta = n => `${esc((n.cat||'').toLocaleUpperCase('tr-TR'))}${dayText(n) ? ' · ' + dayText(n).toLocaleUpperCase('tr-TR') : ''}`;
  const lead = items[0];
  const leadHtml = lead ? `      <a class="ha-lead" href="haberler/${esc(lead.id)}.html">
        ${lead.cover ? `<img src="${lead.cover['16x9'].path}" alt="${esc(lead.cover.alt)}" width="${lead.cover['16x9'].w}" height="${lead.cover['16x9'].h}" loading="lazy" decoding="async" />` : '<span class="ha-noimg" aria-hidden="true"></span>'}
        <span class="ha-lead-txt">
          <span class="ha-meta">${meta(lead)}</span>
          <span class="ha-lead-title">${esc(lead.title)}</span>
          <span class="ha-lead-sum">${esc(lead.summary||'')}</span>
        </span>
      </a>` : '';
  const restHtml = items.slice(1).map(n => `        <a href="haberler/${esc(n.id)}.html">
          ${n.cover ? `<img src="${n.cover.thumb.path}" alt="${esc(n.cover.alt)}" width="${n.cover.thumb.w}" height="${n.cover.thumb.h}" loading="lazy" decoding="async" />` : ''}
          <span class="ha-meta">${meta(n)}</span>
          <span class="ha-news-title">${esc(n.title)}</span>
        </a>`).join('\n');
  const asideList = eds.filter(d => !duels.includes(d)).slice(0, 5);
  const asideHtml = asideList.length ? `    <aside class="ha-aside" aria-labelledby="haEdTitle">
      <div class="section-label">Editör değerlendirmesi</div>
      <h2 id="haEdTitle">Hangisini almalı?</h2>
      <div class="ha-aside-sub">Sinan Tanrı'nın elle yazdığı karşılaştırmalar</div>
${asideList.map(d => `      <a class="ha-ed" href="${esc(d.url)}">${esc(d.title)}</a>`).join('\n')}
      <a href="karsilastirmalar.html" style="display:inline-block;margin-top:8px;font-weight:600;font-size:14px;">Tüm karşılaştırmalar</a>
    </aside>` : '';
  const newsHtml = (lead || asideHtml) ? `
  <section class="ha-sec ha-split" id="son-haberler">
    <div class="ha-main">
      <div class="ha-head"><h2>Son haberler</h2><a href="haberler.html">Tüm haberler</a></div>
${leadHtml}
${restHtml ? `      <div class="ha-news">\n${restHtml}\n      </div>` : ''}
    </div>
${asideHtml}
  </section>
` : '';

  // --- Popüler rehberler ---
  const chips = [];
  POPULAR_GUIDES.forEach(slug => {
    const jf = path.join(rootDir, 'lib', 'rehber-icerik', slug + '.json');
    if(!fs.existsSync(jf) || !fs.existsSync(path.join(rootDir, 'rehber', slug + '.html'))) return;
    try{
      const d = JSON.parse(fs.readFileSync(jf,'utf8'));
      chips.push(`<a class="chip-filter" href="rehber/${slug}.html" title="${esc(d.title)}">${esc(d.title)}</a>`);
    }catch(e){}
  });
  const guideSection = chips.length >= 4 ? `
  <section class="ha-sec" id="populer-rehberler">
    <div class="ha-head"><h2>Satın alma rehberleri</h2></div>
    <p style="font-size:14px;color:var(--ink-soft);max-width:680px;margin:0 0 12px;">Ekran, işlemci, depolama ve pil gibi terimleri sade bir dille anlatan, kaynaklı rehberler.</p>
    <div class="ha-guides">
      ${chips.join('\n      ')}
    </div>
  </section>
` : '';

  const put = (S, E, inner, label) => {
    const next = replaceBetween(html, S, E, inner);
    if(next === null){ console.log(`Anasayfa: ${label} işaretçisi yok, atlandı.`); return; }
    html = next;
  };
  put('<!-- HOME_A_POP_START -->', '<!-- HOME_A_POP_END -->', popHtml, 'HOME_A_POP');
  put('<!-- HOME_A_DUELLO_START -->', '<!-- HOME_A_DUELLO_END -->', duelHtml, 'HOME_A_DUELLO');
  put('<!-- HOME_A_KATEGORI_START -->', '<!-- HOME_A_KATEGORI_END -->', catHtml, 'HOME_A_KATEGORI');
  put('<!-- HOME_HABER_REHBER_START -->', '<!-- HOME_HABER_REHBER_END -->', `${newsHtml}${guideSection}  `, 'HOME_HABER_REHBER');

  const upd = `\n<p style="font-size:13px;color:var(--ink-soft);margin:0 0 14px;">Katalog son güncelleme: <strong>${istanbulToday()}</strong></p>\n`;
  const withDate = replaceBetween(html, '<!-- HOME_GUNCELLEME_START -->', '<!-- HOME_GUNCELLEME_END -->', upd);
  if(withDate !== null) html = withDate;

  fs.writeFileSync(indexPath, html);
  console.log(`Anasayfa (A): ${duels.length} öne çıkan karşılaştırma, ${catTiles.length} kategori, ${items.length} haber, ${asideList.length} editör bağlantısı, ${chips.length} rehber.`);
}

module.exports = { updateHomeBlocks };
