// ============================================================
// TeknoVersus — Elektrikli Araç bölümü (TASLAK, YAYINDA DEĞİL)
//
// Bu modül build.js'e BAĞLI DEĞİL. Yalnızca `node scripts/ev-preview.js` ile
// çalışır ve çıktıyı repo dışına (varsayılan /tmp/ev-preview) yazar.
//
// YAYIN KORUMASI:
//   - Yayına almak için build.js'e bağlamak VE EV_PUBLISH=1 vermek gerekir.
//   - Modellerden herhangi birinde "sample": true varsa üretici yayın modunda
//     hata verip durur (örnek/doğrulanmamış veri asla canlıya çıkmaz).
//
// ADSENSE KURALLARI (otomatik uygulanır):
//   1. Model sayfası ancak ≥ MIN_SPECS dolu özellik VE ≥ MIN_EDITOR_WORDS
//      kelimelik özgün editör metni varsa indekslenir; aksi halde noindex.
//   2. Karşılaştırma sayfası yalnızca elle seçilmiş (curatedPairs) ve iki
//      tarafı da indekslenebilir çiftler için üretilir. Tüm kombinasyonlar
//      üretilmez.
//   3. Sitemap'e yalnızca indekslenebilir sayfalar girer.
//   4. Her sayfada kaynak/tarih notu ve "özellikler üretici verisidir" uyarısı.
//   5. Sayfaların hepsi araç (hesaplayıcı) veya karşılaştırma gibi gerçek
//      kullanım değeri sunar; boş şablon üretilmez.
// ============================================================
const fs = require('fs');
const path = require('path');

const MIN_SPECS = 8;
const MIN_EDITOR_WORDS = 120;

const esc = s => (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TR = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
const slugify = n => String(n).split('').map(c => TR[c] || c).join('').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const fmt = (n, d = 0) => Number(n).toLocaleString('tr-TR', { maximumFractionDigits: d });

const BRAND_COLORS = { Togg: '#c2410c', Tesla: '#b91c1c', BYD: '#0f766e', Renault: '#b45309', Hyundai: '#1d4ed8', Kia: '#7c2d12' };
const colorOf = m => BRAND_COLORS[m.brand] || '#ea580c';

// Ölçülebilir her özellikte kimin kazandığı (true: büyük iyi, false: küçük iyi)
const BETTER_HIGH = {
  'Batarya (kWh)': true, 'WLTP menzil (km)': true, 'Güç (kW)': true, '0-100 km/s (sn)': false,
  'DC şarj (kW)': true, 'AC şarj (kW)': true, 'Bagaj (litre)': true,
};
const SPEC_GROUPS = [
  ['Batarya ve menzil', ['Batarya (kWh)', 'WLTP menzil (km)']],
  ['Performans', ['Güç (kW)', '0-100 km/s (sn)', 'Çekiş']],
  ['Şarj', ['DC şarj (kW)', 'AC şarj (kW)']],
  ['Boyut', ['Bagaj (litre)', 'Uzunluk (mm)']],
];

// Gerçek tüketim yaklaşık: kWh/100 km = batarya / menzil * 100 (WLTP'ye göre, kayıpsız alt sınır)
function consumption(m){
  const b = m.spec['Batarya (kWh)'], r = m.spec['WLTP menzil (km)'];
  return b && r ? (b / r) * 100 : null;
}
const specCount = m => Object.values(m.spec || {}).filter(v => v !== null && v !== '' && v !== undefined).length;
const words = s => (s || '').trim().split(/\s+/).filter(Boolean).length;
const isIndexable = m => !m.sample && specCount(m) >= MIN_SPECS && words(m.editor) >= MIN_EDITOR_WORDS;

// Basit, jenerik elektrikli araç çizimi (gerçek fotoğraf yerine; telif sorunu yok)
function carSvg(color, uid){
  return `<svg viewBox="0 0 320 120" width="100%" role="img" aria-label="Elektrikli araç çizimi">
    <defs><linearGradient id="cg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".72"/></linearGradient></defs>
    <path d="M18 82 C20 64 36 56 58 52 L96 30 C108 24 120 22 136 22 L196 22 C214 22 228 28 240 40 L270 54 C290 58 302 66 304 82 L304 90 L18 90 Z" fill="url(#cg${uid})"/>
    <path d="M104 36 L134 28 L188 28 C200 28 210 32 220 42 L232 52 L96 52 Z" fill="#fff" opacity=".78"/>
    <path d="M140 28 V52" stroke="${color}" stroke-width="3" opacity=".6"/>
    <circle cx="82" cy="90" r="19" fill="#1c1917"/><circle cx="82" cy="90" r="8" fill="#d6d3d1"/>
    <circle cx="244" cy="90" r="19" fill="#1c1917"/><circle cx="244" cy="90" r="8" fill="#d6d3d1"/>
    <path d="M284 66 h14 v8 h-14 z" fill="#fde68a"/>
    <path d="M258 6 l-10 16 h9 l-5 14 14-19 h-9 l7-11z" fill="#fde68a" stroke="#d97706" stroke-width="1"/>
  </svg>`;
}

const CSS = `
.ev{--ev:#0f766e;--ev-dark:#115e59;--ev-soft:#f0fdfa;}
.ev-hero{background:linear-gradient(135deg,#0f172a 0%,#134e4a 100%);color:#fff;border-radius:var(--radius-lg);padding:36px 32px;margin:24px 0;display:grid;grid-template-columns:1.2fr .8fr;gap:24px;align-items:center;}
.ev-hero h1{font-size:clamp(26px,4vw,40px);line-height:1.12;margin-bottom:10px;}
.ev-hero p{color:#cbd5e1;max-width:520px;font-size:15.5px;}
.ev-hero .stats{display:flex;gap:22px;margin-top:20px;flex-wrap:wrap;}
.ev-hero .stats b{display:block;font-size:26px;color:#5eead4;}
.ev-hero .stats span{font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;}
.ev-draft{background:#fef3c7;border:1px solid #f59e0b;color:#78350f;padding:10px 14px;border-radius:8px;font-size:13.5px;margin:14px 0;font-weight:600;}
.ev-chips{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 18px;}
.ev-chips button{font:inherit;font-size:13px;font-weight:600;border:1px solid var(--line-strong);background:#fff;border-radius:999px;padding:7px 14px;cursor:pointer;}
.ev-chips button.on{background:var(--ev);border-color:var(--ev);color:#fff;}
.ev-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;}
.ev-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:transform .2s var(--ease),box-shadow .2s var(--ease);}
.ev-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-md);}
.ev-card .art{background:var(--ev-soft);padding:18px 18px 4px;}
.ev-card .bd{padding:14px 16px 16px;}
.ev-card .tag{font-size:11.5px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.06em;font-weight:600;}
.ev-card h3{font-size:16.5px;margin:3px 0 10px;}
.ev-card .kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;border-top:1px solid var(--line);padding-top:10px;}
.ev-card .kpi b{display:block;font-size:15px;color:var(--ev-dark);white-space:nowrap;}
.ev-card .kpi span{font-size:11px;color:var(--ink-soft);}
.ev-sec{margin:34px 0;}
.ev-sec>h2{font-size:22px;margin-bottom:12px;}
.ev-calc{background:#fff;border:1px solid var(--line);border-radius:var(--radius-lg);padding:22px;display:grid;grid-template-columns:1fr 1fr;gap:22px;}
.ev-calc label{display:block;font-size:12.5px;font-weight:600;color:var(--ink-soft);margin:10px 0 4px;}
.ev-calc input,.ev-calc select{width:100%;font:inherit;padding:9px 11px;border:1px solid var(--line-strong);border-radius:8px;background:#fff;}
.ev-calc .out{background:var(--ev-soft);border-radius:12px;padding:18px;display:flex;flex-direction:column;justify-content:center;gap:6px;}
.ev-calc .out b{font-size:30px;color:var(--ev-dark);}
.ev-calc .out small{color:var(--ink-soft);}
table.ev-t{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:14.5px;}
table.ev-t th,table.ev-t td{padding:10px 14px;border-bottom:1px solid var(--line);text-align:left;}
table.ev-t th{background:#f5f5f4;font-size:12.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft);}
table.ev-t td.w{font-weight:700;color:var(--ev-dark);background:var(--ev-soft);}
.ev-two{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.ev-box{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;}
.ev-box h3{font-size:15px;margin-bottom:8px;}
.ev-box ul{padding-left:18px;font-size:14.5px;color:var(--ink-soft);}
.ev-note{font-size:12.5px;color:var(--ink-soft);margin-top:10px;}
.ev-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;}
.ev-vs .vsb{background:var(--ev);color:#fff;border-radius:50%;width:44px;height:44px;display:grid;place-items:center;font-weight:800;}
.ev-vs h2{font-size:18px;text-align:center;}
.ev-faq details{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin-bottom:8px;}
.ev-faq summary{font-weight:600;cursor:pointer;}
.ev-faq p{margin-top:8px;color:var(--ink-soft);font-size:14.5px;}
.crumb{font-size:13px;color:var(--ink-soft);margin-top:18px;}
@media(max-width:760px){.ev-hero{grid-template-columns:1fr;padding:26px 20px;}.ev-calc,.ev-two{grid-template-columns:1fr;}.ev-vs{grid-template-columns:1fr;}.ev-vs .vsb{margin:0 auto;}}
`;

const CALC_JS = (m) => `
(function(){
  var cons=${m ? (consumption(m) || 0).toFixed(2) : 0};
  var el=function(i){return document.getElementById(i)};
  function run(){
    var km=+el('evKm').value||0, tl=+el('evTl').value||0, c=+el('evC').value||0, fuelL=+el('evFuelL').value||0, fuelP=+el('evFuelP').value||0;
    var ev=km*(c/100)*tl, ice=km*(fuelL/100)*fuelP, fark=ice-ev;
    el('evOut').textContent=Math.round(ev).toLocaleString('tr-TR')+' ₺';
    el('evCmp').textContent='Benzinli karşılığı yaklaşık '+Math.round(ice).toLocaleString('tr-TR')+' ₺; aylık fark '+Math.round(fark).toLocaleString('tr-TR')+' ₺.';
  }
  var c0=el('evC'); if(c0&&!c0.value) c0.value=cons?cons.toFixed(1):'17';
  ['evKm','evTl','evC','evFuelL','evFuelP'].forEach(function(i){el(i).addEventListener('input',run)}); run();
})();`;

const calcHtml = (m) => `
<section class="ev-sec" id="sarj-maliyeti"><h2>Aylık şarj maliyeti hesaplayıcı</h2>
<div class="ev-calc"><div>
  <label for="evKm">Aylık yol (km)</label><input id="evKm" type="number" value="1500" min="0">
  <label for="evTl">Elektrik birim fiyatı (₺/kWh)</label><input id="evTl" type="number" value="4.5" step="0.1" min="0">
  <label for="evC">Tüketim (kWh/100 km)${m ? ' — WLTP verisinden alt sınır' : ''}</label><input id="evC" type="number" step="0.1" min="0" ${m ? `value="${(consumption(m) || 17).toFixed(1)}"` : 'value="17"'}>
  <label for="evFuelL">Karşılaştırılacak benzinli araç (L/100 km)</label><input id="evFuelL" type="number" value="7" step="0.1" min="0">
  <label for="evFuelP">Benzin fiyatı (₺/L)</label><input id="evFuelP" type="number" value="45" step="0.5" min="0">
</div><div class="out"><small>Tahmini aylık şarj maliyeti</small><b id="evOut">—</b><small id="evCmp"></small>
<small>Fiyatlar örnek değerlerdir; kendi tarifenizi girin. Kayıplar (şarj verimi, soğuk hava) gerçek tüketimi %10–25 artırabilir.</small></div></div></section>
<script>${CALC_JS(m)}</script>`;

function shell({ title, desc, canonical, robots, body, root, draft }){
  return `<!DOCTYPE html>
<html lang="tr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${robots}">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
<link rel="stylesheet" href="${root}styles.css"><style>${CSS}</style>
</head><body class="ev">
<header class="site"><div class="wrap nav">
  <div class="brand"><a href="${root}index.html"><span class="brand-text"><span class="tekno">TEKNO</span><span class="versus">VERSUS</span></span></a></div>
  <nav class="nav-links" id="navLinks"><a href="${root}index.html">Anasayfa</a><a href="${root}elektrikli-araclar/index.html">Elektrikli Araçlar</a><a href="${root}haberler.html">Haberler</a><a href="${root}karsilastirmalar.html">Karşılaştırmalar</a></nav>
</div></header>
<main class="wrap">
${draft ? '<div class="ev-draft">TASLAK ÖNİZLEME — örnek veri, doğrulanmamıştır. Bu sayfa yayında değildir ve noindex işaretlidir.</div>' : ''}
${body}
</main>
<footer><div class="wrap" style="text-align:center;font-size:12.5px;">TeknoVersus — elektrikli araç verileri üretici açıklamalarına dayanır; Türkiye fiyat ve donanımı farklılık gösterebilir.</div></footer>
</body></html>`;
}

function generateEv({ rootDir, outDir, publish = false }){
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'models.json'), 'utf8'));
  const models = data.models;
  if(publish && models.some(m => m.sample)) throw new Error('EV: sample:true kayıtlar var, yayın modu reddedildi. Önce verileri doğrula.');
  const draft = !publish;
  const out = (rel, html) => { const f = path.join(outDir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
  fs.mkdirSync(outDir, { recursive: true });
  // Önizleme için site CSS'ini kopyala
  const cssSrc = path.join(rootDir, 'styles.css'); if(fs.existsSync(cssSrc)) fs.copyFileSync(cssSrc, path.join(outDir, 'styles.css'));

  const url = m => `${slugify(m.name)}.html`;
  const robotsFor = m => (publish && isIndexable(m)) ? 'index, follow' : 'noindex, follow';
  const brands = [...new Set(models.map(m => m.brand))];
  const bodies = [...new Set(models.map(m => m.body))];

  // ---------- Liste sayfası ----------
  const cards = models.map(m => `<a class="ev-card" href="${url(m)}" data-brand="${esc(m.brand)}" data-body="${esc(m.body)}">
    <div class="art">${carSvg(colorOf(m), 'c' + slugify(m.name))}</div>
    <div class="bd"><div class="tag">${esc(m.brand)} · ${esc(m.body)} · ${m.year}</div><h3>${esc(m.name)}</h3>
    <div class="kpi"><div><b>${m.spec['WLTP menzil (km)']} km</b><span>WLTP menzil</span></div><div><b>${m.spec['Batarya (kWh)']} kWh</b><span>Batarya</span></div><div><b>${m.spec['DC şarj (kW)']} kW</b><span>DC şarj</span></div></div></div></a>`).join('\n');
  const pairs = data.curatedPairs.map(([a, b]) => [models.find(x => x.id === a), models.find(x => x.id === b)]).filter(([a, b]) => a && b);
  const pairCards = pairs.map(([a, b]) => `<a class="ev-card" href="karsilastir/${slugify(a.name)}-vs-${slugify(b.name)}.html"><div class="bd"><div class="tag">Karşılaştırma</div><h3>${esc(a.name)} <span style="color:var(--ev)">vs</span> ${esc(b.name)}</h3>
    <div class="kpi" style="grid-template-columns:1fr 1fr"><div><b>${a.spec['WLTP menzil (km)']} km</b><span>${esc(a.brand)}</span></div><div><b>${b.spec['WLTP menzil (km)']} km</b><span>${esc(b.brand)}</span></div></div></div></a>`).join('\n');
  const best = (key, hi) => models.slice().sort((x, y) => hi ? y.spec[key] - x.spec[key] : x.spec[key] - y.spec[key])[0];
  const listJs = `(function(){var b=document.querySelectorAll('#evFilters button'),c=document.querySelectorAll('.ev-card[data-brand]');b.forEach(function(x){x.addEventListener('click',function(){b.forEach(function(y){y.classList.remove('on')});x.classList.add('on');var f=x.dataset.f,k=x.dataset.k;c.forEach(function(e){e.style.display=(f==='*'||e.dataset[k]===f)?'':'none'})})})})();`;
  const listBody = `
<nav class="crumb"><a href="../index.html">Anasayfa</a> / Elektrikli Araçlar</nav>
<section class="ev-hero"><div><h1>Elektrikli araçları menzil, şarj ve maliyete göre karşılaştır</h1>
<p>Türkiye'de satılan elektrikli modellerin batarya, WLTP menzil ve şarj hızı verileri tek yerde. Kendi kullanımına göre aylık şarj maliyetini hesapla.</p>
<div class="stats"><div><b>${models.length}</b><span>Model</span></div><div><b>${brands.length}</b><span>Marka</span></div><div><b>${best('WLTP menzil (km)', true).spec['WLTP menzil (km)']} km</b><span>En uzun menzil</span></div></div></div>
<div>${carSvg('#14b8a6', 'hero')}</div></section>
<div class="ev-chips" id="evFilters"><button class="on" data-f="*" data-k="brand">Tümü</button>${brands.map(b => `<button data-f="${esc(b)}" data-k="brand">${esc(b)}</button>`).join('')}${bodies.map(b => `<button data-f="${esc(b)}" data-k="body">${esc(b)}</button>`).join('')}</div>
<div class="ev-grid">${cards}</div>
${calcHtml(null)}
<section class="ev-sec"><h2>Öne çıkan karşılaştırmalar</h2><div class="ev-grid">${pairCards}</div></section>
<section class="ev-sec"><h2>Kısa rehberler</h2><div class="ev-two">
<div class="ev-box"><h3>Evde şarj için ne gerekir?</h3><ul><li>Wallbox ve kablo kesiti</li><li>Sayaç/abonelik gücü</li><li>Topraklama ve koruma şalteri</li></ul><p class="ev-note">Rehber yazısı eklenecek (elektrik tesisatı uzmanlığına dayalı özgün içerik).</p></div>
<div class="ev-box"><h3>AC mi DC mi şarj?</h3><ul><li>Günlük kullanım için AC yeterli</li><li>Yolculukta DC hızlı şarj</li><li>Batarya ömrü için %20–80 aralığı</li></ul><p class="ev-note">Rehber yazısı eklenecek.</p></div></div></section>
<script>${listJs}</script>`;
  out('elektrikli-araclar/index.html', shell({ title: 'Elektrikli Araçlar — Menzil, Şarj ve Fiyat Karşılaştırması | TeknoVersus', desc: 'Türkiye\'de satılan elektrikli araçların batarya, WLTP menzil ve şarj verileri. Aylık şarj maliyetini hesapla, modelleri karşılaştır.', canonical: publish ? 'https://teknoversus.com.tr/elektrikli-araclar/' : null, robots: publish ? 'index, follow' : 'noindex, follow', body: listBody, root: '../', draft }));

  // ---------- Model sayfaları ----------
  const sitemap = [];
  models.forEach(m => {
    const c = consumption(m);
    const rows = SPEC_GROUPS.map(([g, keys]) => `<tr><th colspan="2">${g}</th></tr>` + keys.filter(k => m.spec[k] != null).map(k => `<tr><td>${esc(k)}</td><td>${esc(m.spec[k])}</td></tr>`).join('')).join('');
    const similar = models.filter(x => x.id !== m.id && (x.body === m.body || x.brand === m.brand)).slice(0, 3);
    const faq = [
      [`${m.name} menzili ne kadar?`, `Üretici WLTP verisine göre ${m.spec['WLTP menzil (km)']} km. Gerçek menzil hız, sıcaklık ve yüke göre değişir.`],
      [`${m.name} kaç kWh batarya kullanıyor?`, `${m.spec['Batarya (kWh)']} kWh batarya paketi.`],
      [`${m.name} ne kadar sürede şarj olur?`, `${m.spec['DC şarj (kW)']} kW'a kadar DC hızlı şarj ve ${m.spec['AC şarj (kW)']} kW AC şarj destekler.`],
    ];
    const body = `
<nav class="crumb"><a href="../index.html">Anasayfa</a> / <a href="index.html">Elektrikli Araçlar</a> / ${esc(m.name)}</nav>
<section class="ev-hero"><div><div class="stats" style="margin:0 0 8px"><span>${esc(m.brand)} · ${esc(m.body)} · ${m.year}</span></div><h1>${esc(m.name)}</h1>
<p>${m.spec['WLTP menzil (km)']} km WLTP menzil, ${m.spec['Batarya (kWh)']} kWh batarya ve ${m.spec['DC şarj (kW)']} kW DC şarj hızı.</p>
<div class="stats"><div><b>${m.spec['WLTP menzil (km)']} km</b><span>Menzil</span></div><div><b>${m.spec['0-100 km/s (sn)']} sn</b><span>0-100</span></div><div><b>${c ? c.toFixed(1) : '—'}</b><span>kWh/100 km*</span></div></div></div>
<div>${carSvg(colorOf(m), 'm' + slugify(m.name))}</div></section>
<section class="ev-sec"><h2>Teknik özellikler</h2><table class="ev-t">${rows}</table>
<p class="ev-note">* Batarya kapasitesi ve WLTP menzilden hesaplanan alt sınır tüketimdir; gerçek tüketim daha yüksektir. Özellikler üretici verisidir ve Türkiye donanımına göre değişebilir.</p></section>
<section class="ev-sec"><h2>Artılar ve eksiler</h2><div class="ev-two"><div class="ev-box"><h3>Artılar</h3><ul>${m.pros.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div><div class="ev-box"><h3>Eksiler</h3><ul>${m.cons.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div></div></section>
<section class="ev-sec"><h2>Editör değerlendirmesi</h2><div class="ev-box"><p style="font-size:15px;color:var(--ink-soft)">${m.editor ? esc(m.editor) : 'Bu model için özgün editör değerlendirmesi henüz yazılmadı. Değerlendirme olmadan sayfa indekslenmez.'}</p></div></section>
${calcHtml(m)}
<section class="ev-sec ev-faq"><h2>Sık sorulan sorular</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
<section class="ev-sec"><h2>Benzer modeller</h2><div class="ev-grid">${similar.map(s => `<a class="ev-card" href="${url(s)}"><div class="art">${carSvg(colorOf(s), 's' + slugify(s.name))}</div><div class="bd"><div class="tag">${esc(s.brand)}</div><h3>${esc(s.name)}</h3></div></a>`).join('')}</div></section>`;
    out('elektrikli-araclar/' + url(m), shell({ title: `${m.name} — Menzil, Batarya ve Şarj Özellikleri | TeknoVersus`, desc: `${m.name}: ${m.spec['WLTP menzil (km)']} km WLTP menzil, ${m.spec['Batarya (kWh)']} kWh batarya, ${m.spec['DC şarj (kW)']} kW DC şarj. Özellikler ve şarj maliyeti.`.slice(0, 160), canonical: publish ? `https://teknoversus.com.tr/elektrikli-araclar/${url(m)}` : null, robots: robotsFor(m), body, root: '../', draft }));
    if(robotsFor(m).startsWith('index')) sitemap.push(`elektrikli-araclar/${url(m)}`);
  });

  // ---------- Karşılaştırma sayfaları (yalnızca elle seçilmiş çiftler) ----------
  pairs.forEach(([a, b]) => {
    const keys = ['WLTP menzil (km)', 'Batarya (kWh)', 'Güç (kW)', '0-100 km/s (sn)', 'DC şarj (kW)', 'AC şarj (kW)', 'Bagaj (litre)'];
    let aw = 0, bw = 0;
    const rows = keys.map(k => {
      const x = a.spec[k], y = b.spec[k]; let wa = false, wb = false;
      if(x != null && y != null && x !== y){ const hi = BETTER_HIGH[k]; wa = hi ? x > y : x < y; wb = !wa; }
      if(wa) aw++; if(wb) bw++;
      return `<tr><td>${k}</td><td class="${wa ? 'w' : ''}">${x ?? '—'}</td><td class="${wb ? 'w' : ''}">${y ?? '—'}</td></tr>`;
    }).join('');
    const ca = consumption(a), cb = consumption(b);
    const verdict = aw === bw ? 'İki model ölçülen özelliklerde başa baş.' : `Ölçülen ${keys.length} özelliğin ${Math.max(aw, bw)} tanesinde ${aw > bw ? a.name : b.name} önde.`;
    const body = `
<nav class="crumb"><a href="../../index.html">Anasayfa</a> / <a href="../index.html">Elektrikli Araçlar</a> / Karşılaştırma</nav>
<section class="ev-vs" style="margin-top:18px"><div>${carSvg(colorOf(a), 'a' + slugify(a.name))}<h2>${esc(a.name)}</h2></div><div class="vsb">VS</div><div>${carSvg(colorOf(b), 'b' + slugify(b.name))}<h2>${esc(b.name)}</h2></div></section>
<section class="ev-sec"><h2>Kısa sonuç</h2><div class="ev-box"><p style="font-size:15.5px">${esc(verdict)} Menzil farkı ${Math.abs(a.spec['WLTP menzil (km)'] - b.spec['WLTP menzil (km)'])} km; ${ca && cb ? `hesaplanan alt sınır tüketim ${ca.toFixed(1)} ve ${cb.toFixed(1)} kWh/100 km.` : ''}</p></div></section>
<section class="ev-sec"><h2>Özellik karşılaştırması</h2><table class="ev-t"><tr><th>Özellik</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr>${rows}</table>
<p class="ev-note">Üstü renkli hücre, o satırda daha iyi değeri gösterir. Veriler üretici açıklamalarına dayanır.</p></section>
<section class="ev-sec"><h2>Hangisi kimler için?</h2><div class="ev-two"><div class="ev-box"><h3>${esc(a.name)}</h3><ul>${a.pros.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div><div class="ev-box"><h3>${esc(b.name)}</h3><ul>${b.pros.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div></div></section>`;
    const idx = publish && isIndexable(a) && isIndexable(b);
    const rel = `elektrikli-araclar/karsilastir/${slugify(a.name)}-vs-${slugify(b.name)}.html`;
    out(rel, shell({ title: `${a.name} vs ${b.name} — Menzil ve Şarj Karşılaştırması | TeknoVersus`, desc: `${a.name} ile ${b.name}: menzil, batarya, güç ve şarj hızı karşılaştırması.`.slice(0, 160), canonical: publish ? `https://teknoversus.com.tr/${rel}` : null, robots: idx ? 'index, follow' : 'noindex, follow', body, root: '../../', draft }));
    if(idx) sitemap.push(rel);
  });

  console.log(`EV: ${models.length} model, ${pairs.length} karşılaştırma üretildi → ${outDir} (${draft ? 'TASLAK' : 'YAYIN'}; sitemap'e giren: ${sitemap.length})`);
  return { sitemap };
}

module.exports = { generateEv, isIndexable };
