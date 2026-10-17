// ============================================================
// Anasayfa: "Son Haberler" + "Popüler Rehberler" blokları ve
// "son güncelleme" satırı. Her build'de index.html içindeki
// işaretçiler arasını yeniden yazar (idempotent).
// ============================================================
const fs = require('fs');
const path = require('path');

const esc = s => (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// Kategori seçim rehberlerinin dışında, en çok aranan konulardan seçilmiş rehberler.
const POPULAR_GUIDES = [
  'telefon-asiri-isinma-nasil-onlenir', 'sarj-olmayan-telefon-nasil-duzeltilir',
  'amoled-vs-lcd-fark', 'ekran-yenileme-hizi-hz-nedir', 'anc-nedir',
  'ssd-vs-hdd-farki', 'ram-ne-kadar-yeterli', 'ip-koruma-sinifi-nedir',
  'yeni-telefona-veri-nasil-aktarilir', 'yavas-laptop-nasil-hizlandirilir'
];

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function istanbulToday(){
  const p = new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Istanbul', day:'numeric', month:'numeric', year:'numeric' })
    .formatToParts(new Date()).reduce((o,x)=>(o[x.type]=x.value,o),{});
  return `${+p.day} ${MONTHS[+p.month-1]} ${p.year}`;
}

function replaceBetween(html, startTag, endTag, inner){
  const re = new RegExp(startTag.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '[\\s\\S]*?' + endTag.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  return re.test(html) ? html.replace(re, () => `${startTag}${inner}${endTag}`) : null;
}

function updateHomeBlocks({ rootDir, news }){
  const indexPath = path.join(rootDir, 'index.html');
  if(!fs.existsSync(indexPath)) return;
  let html = fs.readFileSync(indexPath, 'utf8');

  // --- Son haberler (en yeni 4) ---
  const items = (news||[]).filter(n => n && n.id && n.title)
    .sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0,4);
  const newsCards = items.map(n => `      <a class="card" href="haberler/${esc(n.id)}.html" style="text-decoration:none;color:inherit;">
        <div class="card-cat">${esc(n.cat)}${n.date ? ' · '+esc(n.date) : ''}</div>
        <div class="card-name">${esc(n.title)}</div>
        <div class="card-blurb">${esc(n.summary||'')}</div>
      </a>`).join('\n');
  const newsSection = items.length ? `
  <section class="section" id="son-haberler">
    <div class="section-head">
      <div>
        <div class="section-label">Güncel</div>
        <h2 class="section-title">Son Haberler</h2>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-bottom:12px;">
${newsCards}
    </div>
    <div style="display:flex;margin-bottom:8px;"><a class="chip-filter" href="haberler.html" style="font-weight:600;color:var(--c1);">Tüm haberler →</a></div>
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
  <section class="section" id="populer-rehberler">
    <div class="section-head">
      <div>
        <div class="section-label">Rehberler</div>
        <h2 class="section-title">Popüler Rehberler</h2>
      </div>
    </div>
    <p style="font-size:14px;color:var(--ink-soft);max-width:680px;margin:0 0 12px;">Ekran, işlemci, depolama ve pil gibi terimleri sade bir dille anlatan, kaynaklı rehberler.</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
      ${chips.join('\n      ')}
    </div>
  </section>
` : '';

  const block = newsSection + guideSection;
  const S = '<!-- HOME_HABER_REHBER_START -->', E = '<!-- HOME_HABER_REHBER_END -->';
  const wrapped = `\n${block}  `;
  let next = replaceBetween(html, S, E, wrapped);
  if(next === null){
    const anchor = '<section class="section" id="katalog-ozet">';
    if(!html.includes(anchor)){ console.log('Anasayfa blokları: katalog-ozet bulunamadı, atlandı.'); return; }
    next = html.replace(anchor, () => `${S}${wrapped}${E}\n\n  ${anchor}`);
  }
  html = next;

  // --- Son güncelleme satırı ---
  const upd = `\n<p style="font-size:13px;color:var(--ink-soft);margin:0 0 14px;">Katalog son güncelleme: <strong>${istanbulToday()}</strong></p>\n`;
  const withDate = replaceBetween(html, '<!-- HOME_GUNCELLEME_START -->', '<!-- HOME_GUNCELLEME_END -->', upd);
  if(withDate !== null) html = withDate;

  fs.writeFileSync(indexPath, html);
  console.log(`Anasayfa: ${items.length} haber, ${chips.length} rehber bağlantısı, son güncelleme satırı eklendi.`);
}

module.exports = { updateHomeBlocks };
