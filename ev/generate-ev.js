// ============================================================
// TeknoVersus — Elektrikli Araç bölümü
//
// DURUM: Hazır ama YAYINDA DEĞİL. Bu dosya ev-taslak dalında durur.
//   - Önizleme: `node scripts/ev-preview.js /tmp/ev-preview` (repo dışına yazar).
//   - Yayın: build.js'teki EV bloğu yalnızca EV_PUBLISH=1 ortam değişkeniyle
//     çalışır. Değişken verilmezse build hiçbir EV sayfası üretmez.
//
// VERİ: ev/data/models.json (EV Database / evkx.net, 22 Kasım 2026) ve
//       ev/data/guides.json (özgün rehberler). "sample": true olan kayıt
//       varsa yayın modu hata verip durur.
//
// ADSENSE KURALLARI (kodda zorunlu):
//   1. Model sayfası ≥ MIN_SPECS dolu özellik VE ≥ MIN_EDITOR_WORDS kelimelik
//      özgün editör metni yoksa noindex olur, sitemap'e girmez.
//   2. Karşılaştırma yalnızca elle seçilmiş curatedPairs için üretilir; tüm
//      kombinasyonlar üretilmez. İki model de indekslenebilir değilse noindex.
//   3. Her sayfada veri kaynağı bağlantısı ve tarih; Türkiye donanım uyarısı.
//   4. Sayfalar gerçek kullanım değeri taşır: şarj maliyeti hesaplayıcı,
//      özgün değerlendirme, rehberler. Fotoğraf yerine jenerik çizim (telif yok).
// ============================================================
const fs = require('fs');
const path = require('path');

const MIN_SPECS = 8;
const MIN_EDITOR_WORDS = 120;
const SITE = 'https://teknoversus.com.tr';
const BASE = 'elektrikli-araclar';

const esc = s => (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TR = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c','ë':'e'};
const slugify = n => String(n).split('').map(c => TR[c] || c).join('').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const num = v => (typeof v === 'number') ? v.toLocaleString('tr-TR') : v;
const trDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

const BRAND_COLORS = { Togg: '#c2410c', Tesla: '#b91c1c', KGM: '#475569', MINI: '#0f766e', Volvo: '#1e40af', Opel: '#ca8a04', 'Citroën': '#be123c', BMW: '#2563eb', Kia: '#7c2d12', 'Mercedes-Benz': '#334155' };
const colorOf = m => BRAND_COLORS[m.brand] || '#0f766e';

// true: büyük değer iyi, false: küçük değer iyi
const BETTER_HIGH = {
  'Batarya net (kWh)': true, 'WLTP menzil (km)': true, 'WLTP tüketim (kWh/100 km)': false, 'Güç (kW)': true,
  '0-100 km/s (sn)': false, 'Azami hız (km/s)': true, 'DC şarj (kW)': true, 'DC %10-80 (dk)': false,
  'AC şarj (kW)': true, 'Bagaj (litre)': true, 'Ağırlık (kg)': false,
};
const SPEC_GROUPS = [
  ['Batarya ve menzil', ['Batarya net (kWh)', 'Batarya brüt (kWh)', 'WLTP menzil (km)', 'WLTP tüketim (kWh/100 km)']],
  ['Performans', ['Güç (kW)', '0-100 km/s (sn)', 'Azami hız (km/s)', 'Çekiş']],
  ['Şarj', ['DC şarj (kW)', 'DC %10-80 (dk)', 'AC şarj (kW)']],
  ['Boyut ve kullanım', ['Bagaj (litre)', 'Uzunluk (mm)', 'Ağırlık (kg)', 'Koltuk']],
];
const COMPARE_KEYS = ['WLTP menzil (km)', 'WLTP tüketim (kWh/100 km)', 'Batarya net (kWh)', 'DC şarj (kW)', 'DC %10-80 (dk)', 'AC şarj (kW)', 'Güç (kW)', '0-100 km/s (sn)', 'Bagaj (litre)', 'Ağırlık (kg)'];

const sp = (m, k) => (m.spec || {})[k];
const consumption = m => sp(m, 'WLTP tüketim (kWh/100 km)') || (sp(m, 'Batarya net (kWh)') && sp(m, 'WLTP menzil (km)') ? sp(m, 'Batarya net (kWh)') / sp(m, 'WLTP menzil (km)') * 100 : null);
const specCount = m => Object.values(m.spec || {}).filter(v => v !== null && v !== '' && v !== undefined).length;
const words = s => (s || '').trim().split(/\s+/).filter(Boolean).length;
const isIndexable = m => !m.sample && specCount(m) >= MIN_SPECS && words(m.editor) >= MIN_EDITOR_WORDS;
const modelUrl = m => `${slugify(m.name)}.html`;
const pairUrl = (a, b) => `karsilastir/${slugify(a.name)}-vs-${slugify(b.name)}.html`;

// Jenerik araç çizimi: gövde tipine göre siluet (SUV yüksek, sedan alçak, hatchback kısa)
function carSvg(color, uid, body){
  const shapes = {
    SUV: { b: 'M16 84 C17 62 30 54 52 50 L90 26 C100 20 112 18 128 18 L204 18 C220 18 232 22 242 32 L268 50 C290 54 304 62 304 84 L304 92 L16 92 Z', g: 'M98 30 L128 22 L200 22 C212 22 222 26 230 34 L244 48 L92 48 Z', p: 'M146 22 V48' },
    Sedan: { b: 'M14 86 C16 70 32 62 56 58 L104 34 C116 28 128 26 144 26 L190 26 C208 26 222 32 236 44 L262 58 C288 62 304 70 306 86 L306 92 L14 92 Z', g: 'M110 38 L140 30 L188 30 C200 30 212 34 222 42 L234 54 L104 54 Z', p: 'M150 30 V54' },
    Hatchback: { b: 'M34 84 C35 64 46 56 66 52 L100 28 C110 22 120 20 134 20 L212 20 C230 20 240 26 248 40 L262 56 C280 60 288 68 288 84 L288 92 L34 92 Z', g: 'M108 32 L136 24 L206 24 C220 24 228 30 234 42 L240 50 L100 50 Z', p: 'M160 24 V50' },
  };
  const s = shapes[body] || shapes.SUV;
  const [w1, w2] = body === 'Hatchback' ? [86, 236] : [82, 244];
  return `<svg viewBox="0 0 320 120" width="100%" role="img" aria-label="${esc(body || 'Araç')} gövde çizimi">
    <defs><linearGradient id="cg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".75"/></linearGradient></defs>
    <ellipse cx="160" cy="104" rx="140" ry="7" fill="#000" opacity=".08"/>
    <path d="${s.b}" fill="url(#cg${uid})"/>
    <path d="${s.g}" fill="#fff" opacity=".8"/>
    <path d="${s.p}" stroke="${color}" stroke-width="3" opacity=".55"/>
    <circle cx="${w1}" cy="92" r="19" fill="#1c1917"/><circle cx="${w1}" cy="92" r="8" fill="#d6d3d1"/>
    <circle cx="${w2}" cy="92" r="19" fill="#1c1917"/><circle cx="${w2}" cy="92" r="8" fill="#d6d3d1"/>
    <path d="M258 4 l-10 16 h9 l-5 14 14-19 h-9 l7-11z" fill="#fde68a" stroke="#d97706" stroke-width="1"/>
  </svg>`;
}

const CSS = `
.ev{--ev:#0f766e;--ev-dark:#115e59;--ev-soft:#f0fdfa;}
.ev-hero{background:linear-gradient(135deg,#0f172a 0%,#134e4a 100%);color:#fff;border-radius:var(--radius-lg);padding:36px 32px;margin:18px 0 24px;display:grid;grid-template-columns:1.2fr .8fr;gap:24px;align-items:center;}
.ev-hero h1{font-size:clamp(26px,4vw,40px);line-height:1.12;margin-bottom:10px;}
.ev-hero p{color:#cbd5e1;max-width:540px;font-size:15.5px;}
.ev-hero .eyebrow{font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:6px;}
.ev-hero .stats{display:flex;gap:22px;margin-top:20px;flex-wrap:wrap;}
.ev-hero .stats b{display:block;font-size:26px;color:#5eead4;white-space:nowrap;}
.ev-hero .stats span{font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;}
.ev-draft{background:#fef3c7;border:1px solid #f59e0b;color:#78350f;padding:10px 14px;border-radius:8px;font-size:13.5px;margin:14px 0 0;font-weight:600;}
.ev-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin:8px 0 18px;}
.ev-chips{display:flex;gap:8px;flex-wrap:wrap;}
.ev-chips button{font:inherit;font-size:13px;font-weight:600;border:1px solid var(--line-strong);background:#fff;border-radius:999px;padding:7px 14px;cursor:pointer;}
.ev-chips button.on{background:var(--ev);border-color:var(--ev);color:#fff;}
.ev-bar select{font:inherit;font-size:13px;padding:7px 10px;border:1px solid var(--line-strong);border-radius:8px;background:#fff;}
.ev-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;}
.ev-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:transform .2s var(--ease),box-shadow .2s var(--ease);}
.ev-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-md);}
.ev-card .art{background:var(--ev-soft);padding:18px 18px 6px;}
.ev-card .bd{padding:14px 16px 16px;flex:1;display:flex;flex-direction:column;}
.ev-card .tag{font-size:11.5px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.06em;font-weight:600;}
.ev-card h3{font-size:16.5px;margin:3px 0 10px;}
.ev-card .kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;border-top:1px solid var(--line);padding-top:10px;margin-top:auto;}
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
table.ev-t td:first-child{width:45%;}
table.ev-t td.w{font-weight:700;color:var(--ev-dark);background:var(--ev-soft);}
.ev-two{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.ev-box{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;}
.ev-box h3{font-size:15px;margin-bottom:8px;}
.ev-box ul{padding-left:18px;font-size:14.5px;color:var(--ink-soft);}
.ev-box p{font-size:15.5px;line-height:1.7;}
.ev-note{font-size:12.5px;color:var(--ink-soft);margin-top:10px;}
.ev-note a{color:var(--ev-dark);}
.ev-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;margin-top:18px;}
.ev-vs .vsb{background:var(--ev);color:#fff;border-radius:50%;width:44px;height:44px;display:grid;place-items:center;font-weight:800;}
.ev-vs h2{font-size:18px;text-align:center;}
.ev-vs a{text-decoration:none;color:inherit;}
.ev-faq details{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin-bottom:8px;}
.ev-faq summary{font-weight:600;cursor:pointer;}
.ev-faq p{margin-top:8px;color:var(--ink-soft);font-size:14.5px;}
.ev-art{max-width:760px;}
.ev-art h2{font-size:21px;margin:28px 0 10px;}
.ev-art p{font-size:16px;line-height:1.75;margin-bottom:12px;color:#292524;}
.ev-art ul{padding-left:20px;margin:0 0 12px;font-size:16px;line-height:1.75;}
.ev-art .lead{font-size:17.5px;color:var(--ink-soft);}
.ev-gl{display:block;text-decoration:none;color:inherit;}
.ev-gl h3{font-size:16px;margin-bottom:6px;}
.ev-gl p{font-size:14px;color:var(--ink-soft);line-height:1.5;}
.ev-gl span{display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:var(--ev-dark);}
.crumb{font-size:13px;color:var(--ink-soft);margin-top:18px;}
@media(max-width:760px){.ev-hero{grid-template-columns:1fr;padding:26px 20px;}.ev-calc,.ev-two{grid-template-columns:1fr;}.ev-vs{grid-template-columns:1fr;}.ev-vs .vsb{margin:0 auto;}table.ev-t{font-size:13.5px;}table.ev-t th,table.ev-t td{padding:9px 10px;}}
`;

const CALC_JS = `
(function(){
  var el=function(i){return document.getElementById(i)};
  if(!el('evKm')) return;
  function run(){
    var km=+el('evKm').value||0, tl=+el('evTl').value||0, c=+el('evC').value||0, fuelL=+el('evFuelL').value||0, fuelP=+el('evFuelP').value||0;
    var ev=km*(c/100)*tl*1.1, ice=km*(fuelL/100)*fuelP;
    el('evOut').textContent=Math.round(ev).toLocaleString('tr-TR')+' ₺';
    el('evCmp').textContent='Benzinli karşılığı yaklaşık '+Math.round(ice).toLocaleString('tr-TR')+' ₺; aylık fark '+Math.round(ice-ev).toLocaleString('tr-TR')+' ₺.';
  }
  var sel=el('evModel'); if(sel) sel.addEventListener('change',function(){ if(sel.value) el('evC').value=sel.value; run(); });
  ['evKm','evTl','evC','evFuelL','evFuelP'].forEach(function(i){el(i).addEventListener('input',run)}); run();
})();`;

function calcHtml(models, m){
  const opts = models.map(x => `<option value="${consumption(x).toFixed(1)}"${m && x.id === m.id ? ' selected' : ''}>${esc(x.name)} (${consumption(x).toFixed(1)} kWh/100 km)</option>`).join('');
  return `
<section class="ev-sec" id="sarj-maliyeti"><h2>Aylık şarj maliyeti hesaplayıcı</h2>
<div class="ev-calc"><div>
  <label for="evModel">Model (WLTP tüketimini doldurur)</label><select id="evModel"><option value="">Elle gireceğim</option>${opts}</select>
  <label for="evKm">Aylık yol (km)</label><input id="evKm" type="number" value="1500" min="0" inputmode="numeric">
  <label for="evTl">Elektrik birim fiyatı (₺/kWh)</label><input id="evTl" type="number" value="4.5" step="0.1" min="0" inputmode="decimal">
  <label for="evC">Tüketim (kWh/100 km)</label><input id="evC" type="number" step="0.1" min="0" value="${m ? consumption(m).toFixed(1) : '16'}" inputmode="decimal">
  <label for="evFuelL">Karşılaştırılacak benzinli araç (L/100 km)</label><input id="evFuelL" type="number" value="7" step="0.1" min="0" inputmode="decimal">
  <label for="evFuelP">Benzin fiyatı (₺/L)</label><input id="evFuelP" type="number" value="45" step="0.5" min="0" inputmode="decimal">
</div><div class="out"><small>Tahmini aylık şarj maliyeti</small><b id="evOut">—</b><small id="evCmp"></small>
<small>Hesaba %10 şarj kaybı eklenir. Elektrik ve benzin fiyatları örnek değerdir; kendi tarifenizi girin. Otoyol ve kış kullanımında tüketim artar.</small></div></div></section>`;
}

function shell({ title, desc, canonical, robots, body, root, draft, jsonld = [], scripts = '' }){
  return `<!DOCTYPE html>
<html lang="tr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="tr_TR">
<link rel="icon" href="${root}favicon.ico">
<link rel="stylesheet" href="${root}styles.css"><style>${CSS}</style>
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head><body class="ev">
<header class="site"><div class="wrap nav">
  <div class="brand"><a href="${root}index.html"><span class="brand-text"><span class="tekno">TEKNO</span><span class="versus">VERSUS</span></span></a></div>
  <nav class="nav-links" id="navLinks"><a href="${root}index.html#kategoriler">Kategoriler</a><a href="${root}karsilastirmalar.html">Karşılaştırmalar</a><a href="${root}haberler.html">Haberler</a><a href="${root}${BASE}/index.html">Elektrikli Araçlar</a></nav>
  <button class="burger" id="burgerBtn" aria-label="Menü">☰</button>
</div></header>
<main class="wrap">
${draft ? '<div class="ev-draft">TASLAK ÖNİZLEME — bu bölüm henüz yayında değil; tüm sayfalar noindex.</div>' : ''}
${body}
</main>
<footer><div class="wrap" style="text-align:center;font-size:12.5px;line-height:1.7">Elektrikli araç verileri üretici açıklamalarına ve <a href="https://ev-database.org/" rel="noopener" style="color:inherit">EV Database</a> kayıtlarına dayanır; Türkiye'de satılan donanım ve fiyatlar farklılık gösterebilir.<br><a href="${root}hakkimizda.html" style="color:inherit">Hakkımızda</a> · <a href="${root}iletisim.html" style="color:inherit">İletişim</a> · <a href="${root}gizlilik-politikasi.html" style="color:inherit">Gizlilik</a></div></footer>
<script>document.getElementById('burgerBtn').addEventListener('click',function(){document.getElementById('navLinks').classList.toggle('open')});</script>
${scripts}
</body></html>`;
}

const crumbLd = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u })) });
const faqLd = faq => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

function generateEv({ rootDir, outDir, publish = false }){
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'models.json'), 'utf8'));
  const guides = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'guides.json'), 'utf8'));
  const models = data.models;
  if(publish && models.some(m => m.sample)) throw new Error('EV: sample:true kayıt var, yayın modu reddedildi.');
  const draft = !publish;
  fs.mkdirSync(outDir, { recursive: true });
  if(path.resolve(outDir) !== path.resolve(rootDir)){
    ['styles.css', 'favicon.ico'].forEach(f => { const s = path.join(rootDir, f); if(fs.existsSync(s)) fs.copyFileSync(s, path.join(outDir, f)); });
  }
  const write = (rel, html) => { const f = path.join(outDir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
  const robots = ok => (publish && ok) ? 'index, follow' : 'noindex, follow';
  const sitemap = [];
  const pairs = data.curatedPairs.map(([a, b]) => [models.find(x => x.id === a), models.find(x => x.id === b)]).filter(([a, b]) => a && b);
  const brands = [...new Set(models.map(m => m.brand))].sort((a, b) => a.localeCompare(b, 'tr'));
  const bodies = [...new Set(models.map(m => m.body))];
  const best = (k, hi) => models.slice().sort((x, y) => hi ? sp(y, k) - sp(x, k) : sp(x, k) - sp(y, k))[0];
  const updated = models.map(m => m.sourceDate).sort().pop();

  const card = (m, pre = '') => `<a class="ev-card" href="${pre}${modelUrl(m)}" data-brand="${esc(m.brand)}" data-body="${esc(m.body)}" data-range="${sp(m, 'WLTP menzil (km)')}" data-cons="${consumption(m)}" data-dc="${sp(m, 'DC %10-80 (dk)')}">
    <div class="art">${carSvg(colorOf(m), 'c' + slugify(m.name), m.body)}</div>
    <div class="bd"><div class="tag">${esc(m.brand)} · ${esc(m.body)}</div><h3>${esc(m.name)}</h3>
    <div class="kpi"><div><b>${num(sp(m, 'WLTP menzil (km)'))} km</b><span>WLTP menzil</span></div><div><b>${num(consumption(m))}</b><span>kWh/100 km</span></div><div><b>${sp(m, 'DC %10-80 (dk)')} dk</b><span>DC %10-80</span></div></div></div></a>`;
  const guideCards = (pre) => guides.map(g => `<a class="ev-box ev-gl" href="${pre}rehber/${g.slug}.html"><h3>${esc(g.title)}</h3><p>${esc(g.desc)}</p><span>Rehberi oku →</span></a>`).join('');

  // ---------- Liste sayfası ----------
  const listFaq = [
    ['Türkiye\'de en uzun menzilli elektrikli araç hangisi?', `Listemizdeki modeller arasında WLTP menzili en yüksek olan ${best('WLTP menzil (km)', true).name} (${num(sp(best('WLTP menzil (km)', true), 'WLTP menzil (km)'))} km). Gerçek menzil otoyol hızı ve hava sıcaklığına göre düşer.`],
    ['En verimli elektrikli araç hangisi?', `Onaylı WLTP tüketimi en düşük model ${best('WLTP tüketim (kWh/100 km)', false).name} (${num(sp(best('WLTP tüketim (kWh/100 km)', false), 'WLTP tüketim (kWh/100 km)'))} kWh/100 km).`],
    ['En hızlı şarj olan elektrikli araç hangisi?', `%10-80 DC şarj süresi en kısa model ${best('DC %10-80 (dk)', false).name} (yaklaşık ${sp(best('DC %10-80 (dk)', false), 'DC %10-80 (dk)')} dakika). Bu süre için yeterince güçlü bir istasyon gerekir.`],
  ];
  const listBody = `
<nav class="crumb"><a href="../index.html">Anasayfa</a> / Elektrikli Araçlar</nav>
<section class="ev-hero"><div><div class="eyebrow">Elektrikli araç rehberi</div><h1>Elektrikli araçları menzil, şarj ve maliyete göre karşılaştır</h1>
<p>Türkiye'de satılan ${models.length} elektrikli modelin batarya, WLTP menzil, tüketim ve şarj süresi verileri tek yerde. Her model için özgün değerlendirme ve kendi kullanımına göre aylık şarj maliyeti hesabı.</p>
<div class="stats"><div><b>${models.length}</b><span>Model</span></div><div><b>${brands.length}</b><span>Marka</span></div><div><b>${num(sp(best('WLTP menzil (km)', true), 'WLTP menzil (km)'))} km</b><span>En uzun menzil</span></div></div></div>
<div>${carSvg('#14b8a6', 'hero', 'SUV')}</div></section>
<div class="ev-bar"><div class="ev-chips" id="evFilters"><button class="on" data-f="*" data-k="brand">Tümü</button>${bodies.map(b => `<button data-f="${esc(b)}" data-k="body">${esc(b)}</button>`).join('')}${brands.map(b => `<button data-f="${esc(b)}" data-k="brand">${esc(b)}</button>`).join('')}</div>
<select id="evSort" aria-label="Sırala"><option value="range">Menzile göre</option><option value="cons">Verimliliğe göre</option><option value="dc">Şarj süresine göre</option></select></div>
<div class="ev-grid" id="evGrid">${models.slice().sort((a, b) => sp(b, 'WLTP menzil (km)') - sp(a, 'WLTP menzil (km)')).map(m => card(m)).join('\n')}</div>
<p class="ev-note">Veriler son olarak ${trDate(updated)} tarihinde kontrol edildi. Fiyat bilgisi vermiyoruz; Türkiye fiyatları sık değiştiği için güncel fiyatı yetkili satıcıdan teyit edin.</p>
${calcHtml(models, null)}
<section class="ev-sec"><h2>Öne çıkan karşılaştırmalar</h2><div class="ev-grid">${pairs.map(([a, b]) => `<a class="ev-card" href="${pairUrl(a, b)}"><div class="bd"><div class="tag">Karşılaştırma</div><h3>${esc(a.name)} <span style="color:var(--ev)">vs</span> ${esc(b.name)}</h3>
    <div class="kpi" style="grid-template-columns:1fr 1fr"><div><b>${num(sp(a, 'WLTP menzil (km)'))} km</b><span>${esc(a.brand)}</span></div><div><b>${num(sp(b, 'WLTP menzil (km)'))} km</b><span>${esc(b.brand)}</span></div></div></div></a>`).join('\n')}</div></section>
<section class="ev-sec"><h2>Rehberler</h2><div class="ev-grid">${guideCards('')}</div></section>
<section class="ev-sec ev-faq"><h2>Sık sorulan sorular</h2>${listFaq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>`;
  const listJs = `<script>(function(){var b=document.querySelectorAll('#evFilters button'),g=document.getElementById('evGrid'),s=document.getElementById('evSort');
b.forEach(function(x){x.addEventListener('click',function(){b.forEach(function(y){y.classList.remove('on')});x.classList.add('on');var f=x.dataset.f,k=x.dataset.k;g.querySelectorAll('.ev-card').forEach(function(e){e.style.display=(f==='*'||e.dataset[k]===f)?'':'none'})})});
s.addEventListener('change',function(){var v=s.value,c=[].slice.call(g.children);c.sort(function(p,q){var a=+p.dataset[v],z=+q.dataset[v];return v==='range'?z-a:a-z});c.forEach(function(e){g.appendChild(e)})});})();${CALC_JS}</script>`;
  const listUrl = `${SITE}/${BASE}/`;
  write(`${BASE}/index.html`, shell({ title: 'Elektrikli Araçlar 2026 — Menzil, Şarj Süresi ve Tüketim Karşılaştırması | TeknoVersus', desc: `Türkiye'de satılan ${models.length} elektrikli aracın WLTP menzil, tüketim ve şarj süresi verileri. Aylık şarj maliyetini hesapla, modelleri karşılaştır.`, canonical: listUrl, robots: robots(true), body: listBody, root: '../', draft,
    jsonld: [crumbLd([['Anasayfa', `${SITE}/`], ['Elektrikli Araçlar', listUrl]]), faqLd(listFaq), { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Elektrikli araçlar', itemListElement: models.map((m, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/${BASE}/${modelUrl(m)}`, name: m.name })) }], scripts: listJs }));
  if(publish) sitemap.push(`${BASE}/`);

  // ---------- Model sayfaları ----------
  models.forEach(m => {
    const c = consumption(m);
    const rows = SPEC_GROUPS.map(([g, keys]) => {
      const r = keys.filter(k => sp(m, k) != null).map(k => `<tr><td>${esc(k)}</td><td>${esc(num(sp(m, k)))}</td></tr>`).join('');
      return r ? `<tr><th colspan="2">${g}</th></tr>${r}` : '';
    }).join('');
    const myPairs = pairs.filter(([a, b]) => a.id === m.id || b.id === m.id);
    const similar = models.filter(x => x.id !== m.id).sort((x, y) => (y.body === m.body) - (x.body === m.body) || Math.abs(sp(x, 'WLTP menzil (km)') - sp(m, 'WLTP menzil (km)')) - Math.abs(sp(y, 'WLTP menzil (km)') - sp(m, 'WLTP menzil (km)'))).slice(0, 3);
    const faq = [
      [`${m.name} menzili ne kadar?`, `Onaylı WLTP menzili ${num(sp(m, 'WLTP menzil (km)'))} km. Yazın 120 km/s otoyolda bunun yaklaşık %70-75'i, kışın daha azı beklenebilir.`],
      [`${m.name} kaç kWh batarya kullanıyor?`, `Brüt ${num(sp(m, 'Batarya brüt (kWh)'))} kWh, kullanılabilir (net) ${num(sp(m, 'Batarya net (kWh)'))} kWh batarya.`],
      [`${m.name} ne kadar sürede şarj olur?`, `DC hızlı şarjda tepe güç ${sp(m, 'DC şarj (kW)')} kW, %10'dan %80'e yaklaşık ${sp(m, 'DC %10-80 (dk)')} dakika. Evde ${num(sp(m, 'AC şarj (kW)'))} kW AC şarjla boş bataryayı doldurmak yaklaşık ${Math.ceil(sp(m, 'Batarya net (kWh)') / sp(m, 'AC şarj (kW)') * 1.1)} saat sürer.`],
      [`${m.name} 100 km'de ne kadar elektrik harcar?`, `Onaylı WLTP tüketimi ${num(c)} kWh/100 km. Gerçek tüketim hız, sıcaklık ve sürüş tarzına göre değişir.`],
    ];
    const url = `${SITE}/${BASE}/${modelUrl(m)}`;
    const body = `
<nav class="crumb"><a href="../index.html">Anasayfa</a> / <a href="index.html">Elektrikli Araçlar</a> / ${esc(m.name)}</nav>
<section class="ev-hero"><div><div class="eyebrow">${esc(m.brand)} · ${esc(m.body)} · ${esc(sp(m, 'Çekiş'))}</div><h1>${esc(m.name)}</h1>
<p>${num(sp(m, 'WLTP menzil (km)'))} km WLTP menzil, ${num(sp(m, 'Batarya net (kWh)'))} kWh kullanılabilir batarya ve %10-80 DC şarj için yaklaşık ${sp(m, 'DC %10-80 (dk)')} dakika.</p>
<div class="stats"><div><b>${num(sp(m, 'WLTP menzil (km)'))} km</b><span>WLTP menzil</span></div><div><b>${num(c)}</b><span>kWh/100 km</span></div><div><b>${num(sp(m, '0-100 km/s (sn)'))} sn</b><span>0-100 km/s</span></div><div><b>${sp(m, 'DC şarj (kW)')} kW</b><span>DC şarj</span></div></div></div>
<div>${carSvg(colorOf(m), 'm' + slugify(m.name), m.body)}</div></section>
<section class="ev-sec"><h2>Editör değerlendirmesi</h2><div class="ev-box"><p>${esc(m.editor)}</p></div></section>
<section class="ev-sec"><h2>Artılar ve eksiler</h2><div class="ev-two"><div class="ev-box"><h3>Artılar</h3><ul>${m.pros.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div><div class="ev-box"><h3>Eksiler</h3><ul>${m.cons.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div></div></section>
<section class="ev-sec"><h2>Teknik özellikler</h2><table class="ev-t">${rows}</table>
<p class="ev-note">Kaynak: <a href="${esc(m.source)}" rel="noopener nofollow" target="_blank">${esc(new URL(m.source).hostname)}</a>, ${trDate(m.sourceDate)} itibarıyla. Değerler Avrupa sürümüne aittir; Türkiye'de satılan donanım farklı olabilir.</p></section>
${calcHtml(models, m)}
${myPairs.length ? `<section class="ev-sec"><h2>Karşılaştırmalar</h2><div class="ev-grid">${myPairs.map(([a, b]) => { const o = a.id === m.id ? b : a; return `<a class="ev-card" href="${pairUrl(a, b)}"><div class="bd"><div class="tag">Karşılaştırma</div><h3>${esc(m.name)} <span style="color:var(--ev)">vs</span> ${esc(o.name)}</h3></div></a>`; }).join('')}</div></section>` : ''}
<section class="ev-sec ev-faq"><h2>Sık sorulan sorular</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
<section class="ev-sec"><h2>Benzer modeller</h2><div class="ev-grid">${similar.map(s => card(s)).join('')}</div></section>`;
    const ok = isIndexable(m);
    write(`${BASE}/${modelUrl(m)}`, shell({ title: `${m.name} — Menzil, Şarj Süresi ve Özellikler | TeknoVersus`, desc: `${m.name}: ${num(sp(m, 'WLTP menzil (km)'))} km WLTP menzil, ${num(c)} kWh/100 km tüketim, %10-80 DC şarj ${sp(m, 'DC %10-80 (dk)')} dk. Değerlendirme ve şarj maliyeti.`.slice(0, 160), canonical: url, robots: robots(ok), body, root: '../', draft,
      jsonld: [crumbLd([['Anasayfa', `${SITE}/`], ['Elektrikli Araçlar', listUrl], [m.name, url]]), faqLd(faq), { '@context': 'https://schema.org', '@type': 'Car', name: m.name, brand: { '@type': 'Brand', name: m.brand }, bodyType: m.body, fuelType: 'Electricity', driveWheelConfiguration: sp(m, 'Çekiş'), vehicleSeatingCapacity: sp(m, 'Koltuk'), description: m.editor.slice(0, 300) }],
      scripts: `<script>${CALC_JS}</script>` }));
    if(publish && ok) sitemap.push(`${BASE}/${modelUrl(m)}`);
  });

  // ---------- Karşılaştırma sayfaları (yalnızca curatedPairs) ----------
  pairs.forEach(([a, b]) => {
    let aw = 0, bw = 0;
    const rows = COMPARE_KEYS.map(k => {
      const x = sp(a, k), y = sp(b, k); let wa = false, wb = false;
      if(x != null && y != null && x !== y){ wa = BETTER_HIGH[k] ? x > y : x < y; wb = !wa; }
      if(wa) aw++; if(wb) bw++;
      return `<tr><td>${esc(k)}</td><td class="${wa ? 'w' : ''}">${x != null ? esc(num(x)) : '—'}</td><td class="${wb ? 'w' : ''}">${y != null ? esc(num(y)) : '—'}</td></tr>`;
    }).join('');
    const lead = aw === bw ? null : (aw > bw ? a : b);
    const dR = sp(a, 'WLTP menzil (km)') - sp(b, 'WLTP menzil (km)');
    const longer = dR >= 0 ? a : b, faster = sp(a, 'DC %10-80 (dk)') <= sp(b, 'DC %10-80 (dk)') ? a : b, roomier = sp(a, 'Bagaj (litre)') >= sp(b, 'Bagaj (litre)') ? a : b;
    const wins = new Map();
    const addWin = (m, txt) => { if(!wins.has(m)) wins.set(m, []); wins.get(m).push(txt); };
    if(dR !== 0) addWin(longer, `WLTP menzilde ${num(Math.abs(dR))} km`);
    if(sp(a, 'DC %10-80 (dk)') !== sp(b, 'DC %10-80 (dk)')) addWin(faster, `%10-80 DC şarjda (${sp(faster, 'DC %10-80 (dk)')} dk)`);
    if(sp(a, 'Bagaj (litre)') !== sp(b, 'Bagaj (litre)')) addWin(roomier, `bagaj hacminde (${num(sp(roomier, 'Bagaj (litre)'))} litre)`);
    const join = arr => arr.length > 1 ? arr.slice(0, -1).join(', ') + ' ve ' + arr[arr.length - 1] : arr[0];
    const parts = [...wins.entries()].map(([m, t]) => `${m.name} ${join(t)} önde.`);
    const verdict = `${parts.length ? parts.join(' ') : 'İki model aynı altyapıyı paylaştığı için menzil, şarj süresi ve bagajda aynı değerlere sahip; seçimi tasarım, konfor ve donanım belirler.'} ${lead ? `Karşılaştırdığımız ${COMPARE_KEYS.length} ölçülebilir özelliğin ${Math.max(aw, bw)} tanesinde ${lead === wins.keys().next().value && wins.size === 1 ? 'yine' : ''} ${lead.name} daha iyi değere sahip.`.replace('  ', ' ') : 'Ölçülebilir özelliklerin toplamında iki model başa baş.'}`;
    const faq = [
      [`${a.name} mı ${b.name} mı daha uzun menzilli?`, `${longer.name}: ${num(sp(longer, 'WLTP menzil (km)'))} km WLTP. Fark ${num(Math.abs(dR))} km.`],
      [`Hangisi daha hızlı şarj oluyor?`, `%10-80 DC şarjda ${a.name} yaklaşık ${sp(a, 'DC %10-80 (dk)')} dk, ${b.name} yaklaşık ${sp(b, 'DC %10-80 (dk)')} dk.`],
      [`Hangisi daha az elektrik harcıyor?`, `${a.name} ${num(consumption(a))}, ${b.name} ${num(consumption(b))} kWh/100 km WLTP tüketime sahip.`],
    ];
    const rel = `${BASE}/${pairUrl(a, b)}`, url = `${SITE}/${rel}`;
    const body = `
<nav class="crumb"><a href="../../index.html">Anasayfa</a> / <a href="../index.html">Elektrikli Araçlar</a> / Karşılaştırma</nav>
<h1 style="font-size:clamp(24px,3.4vw,34px);margin-top:14px">${esc(a.name)} vs ${esc(b.name)}</h1>
<section class="ev-vs"><a href="../${modelUrl(a)}">${carSvg(colorOf(a), 'a' + slugify(a.name), a.body)}<h2>${esc(a.name)}</h2></a><div class="vsb">VS</div><a href="../${modelUrl(b)}">${carSvg(colorOf(b), 'b' + slugify(b.name), b.body)}<h2>${esc(b.name)}</h2></a></section>
<section class="ev-sec"><h2>Kısa sonuç</h2><div class="ev-box"><p>${esc(verdict)}</p></div></section>
<section class="ev-sec"><h2>Özellik karşılaştırması</h2><table class="ev-t"><tr><th>Özellik</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr>${rows}</table>
<p class="ev-note">Renkli hücre o satırdaki daha iyi değeri gösterir. Kaynaklar: <a href="${esc(a.source)}" rel="noopener nofollow" target="_blank">${esc(a.name)}</a>, <a href="${esc(b.source)}" rel="noopener nofollow" target="_blank">${esc(b.name)}</a>.</p></section>
<section class="ev-sec"><h2>Hangisi kimin için?</h2><div class="ev-two">${[a, b].map(x => `<div class="ev-box"><h3>${esc(x.name)}</h3><ul>${x.pros.map(p => `<li>${esc(p)}</li>`).join('')}</ul><p class="ev-note" style="margin-top:8px">Dikkat: ${esc(x.cons.join('; '))}.</p><p class="ev-note"><a href="../${modelUrl(x)}">Ayrıntılı değerlendirmeyi oku →</a></p></div>`).join('')}</div></section>
<section class="ev-sec ev-faq"><h2>Sık sorulan sorular</h2>${faq.map(([q, a2]) => `<details><summary>${esc(q)}</summary><p>${esc(a2)}</p></details>`).join('')}</section>`;
    const ok = isIndexable(a) && isIndexable(b);
    write(rel, shell({ title: `${a.name} vs ${b.name}: Menzil, Şarj ve Tüketim | TeknoVersus`, desc: `${a.name} mı ${b.name} mı? WLTP menzil, tüketim, %10-80 şarj süresi ve bagaj karşılaştırması.`.slice(0, 160), canonical: url, robots: robots(ok), body, root: '../../', draft,
      jsonld: [crumbLd([['Anasayfa', `${SITE}/`], ['Elektrikli Araçlar', listUrl], [`${a.name} vs ${b.name}`, url]]), faqLd(faq)] }));
    if(publish && ok) sitemap.push(rel);
  });

  // ---------- Rehberler ----------
  guides.forEach(g => {
    const rel = `${BASE}/rehber/${g.slug}.html`, url = `${SITE}/${rel}`;
    const others = guides.filter(x => x.slug !== g.slug);
    const body = `
<nav class="crumb"><a href="../../index.html">Anasayfa</a> / <a href="../index.html">Elektrikli Araçlar</a> / Rehber</nav>
<article class="ev-art"><h1 style="font-size:clamp(26px,3.6vw,36px);margin:14px 0 12px;line-height:1.2">${esc(g.title)}</h1>
<p class="ev-note" style="margin:0 0 16px">TeknoVersus · Güncelleme: ${trDate(updated)}</p>
<p class="lead">${esc(g.intro)}</p>
${g.sections.map(s => `<h2>${esc(s.h)}</h2>${s.p.map(p => `<p>${esc(p)}</p>`).join('')}${s.list.length ? `<ul>${s.list.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}`).join('\n')}
</article>
<section class="ev-sec ev-faq"><h2>Sık sorulan sorular</h2>${g.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>
${calcHtml(models, null)}
<section class="ev-sec"><h2>Diğer rehberler</h2><div class="ev-grid">${others.map(o => `<a class="ev-box ev-gl" href="${o.slug}.html"><h3>${esc(o.title)}</h3><p>${esc(o.desc)}</p><span>Rehberi oku →</span></a>`).join('')}</div></section>`;
    write(rel, shell({ title: `${g.title} | TeknoVersus`, desc: g.desc.slice(0, 160), canonical: url, robots: robots(true), body, root: '../../', draft,
      jsonld: [crumbLd([['Anasayfa', `${SITE}/`], ['Elektrikli Araçlar', listUrl], [g.title, url]]), faqLd(g.faq.map(f => [f.q, f.a])), { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.desc, dateModified: updated, author: { '@type': 'Organization', name: 'TeknoVersus', url: `${SITE}/hakkimizda.html` }, publisher: { '@type': 'Organization', name: 'TeknoVersus' }, mainEntityOfPage: url }],
      scripts: `<script>${CALC_JS}</script>` }));
    if(publish) sitemap.push(rel);
  });

  const nIdx = models.filter(isIndexable).length;
  console.log(`EV: ${models.length} model (${nIdx} indekslenebilir), ${pairs.length} karşılaştırma, ${guides.length} rehber → ${outDir} [${draft ? 'TASLAK, hepsi noindex' : 'YAYIN'}; sitemap: ${sitemap.length}]`);
  return { sitemap };
}

module.exports = { generateEv, isIndexable };
