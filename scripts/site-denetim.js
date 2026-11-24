// ============================================================
// SİTE DENETİMİ (yalnızca ölçer; hiçbir dosyayı değiştirmez, deploy etmez).
// node build.js sonrası üretilen tüm .html sayfalarını tarar ve AdSense
// "düşük değerli içerik" riskine bakar:
//   - indekslenebilir sayfalarda ŞABLON DIŞI (özgün) kelime sayısı,
//   - aynı/çok benzer başlık ve açıklamalar,
//   - birbirine çok benzeyen sayfalar (shingle benzerliği),
//   - sitemap ↔ noindex ↔ canonical tutarsızlıkları,
//   - kırık iç bağlantılar,
//   - boş/yer tutucu değerler ("—", "Bilinmiyor", "0 ₺" vb.).
// Çıktı: rapor/site-denetim.md + rapor/*.csv
// ============================================================
const fs = require('fs'), path = require('path');
const root = process.cwd();
const SKIP = new Set(['node_modules', '.git', '.github', 'docs', 'scripts', 'rapor', 'lib', 'yedek', 'admin']);
const out = path.join(root, 'rapor'); fs.mkdirSync(out, { recursive: true });

function walk(d, rel = '') {
  let r = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
    const p = path.join(d, e.name), rp = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) r = r.concat(walk(p, rp));
    else if (e.name.endsWith('.html')) r.push(rp);
  }
  return r;
}
const files = walk(root);
const exists = new Set(files);

// sitemap URL'leri
const BASE = 'https://teknoversus.com.tr/';
const inSitemap = new Set();
for (const f of fs.readdirSync(root).filter(f => /^sitemap.*\.xml$/.test(f))) {
  const x = fs.readFileSync(path.join(root, f), 'utf8');
  for (const m of x.matchAll(/<loc>([^<]+)<\/loc>/g)) if (m[1].startsWith(BASE) && !m[1].endsWith('.xml')) inSitemap.add(m[1].slice(BASE.length) || 'index.html');
}

const dec = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
function mainText(html) {
  let h = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ').replace(/<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<footer[\s\S]*?<\/footer>/gi, ' ');
  h = h.replace(/<\/(p|div|li|h[1-6]|tr|td|th|section|article|br)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ');
  return dec(h).split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s.length > 0);
}
const folderOf = f => f.includes('/') ? f.split('/')[0] : '(kök)';

const pages = [];
for (const f of files) {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  if (html.length < 400 && /http-equiv="refresh"/i.test(html)) continue; // yönlendirme sayfası
  const robots = (html.match(/<meta name="robots" content="([^"]*)"/i) || [])[1] || '';
  const noindex = /noindex/i.test(robots);
  const title = dec((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
  const desc = dec((html.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || '').trim();
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/i) || [])[1] || '';
  const lines = mainText(html);
  const links = [...html.matchAll(/<a\s[^>]*href="([^"#?]+)[^"]*"/gi)].map(m => m[1]).filter(h => !/^(https?:|mailto:|tel:|javascript:|\/\/)/i.test(h) || h.startsWith(BASE));
  pages.push({ f, folder: folderOf(f), noindex, title, desc, canon, lines, links, html: null });
}

// --- şablon cümleleri: klasör içinde sayfaların %25'inden fazlasında geçen satırlar
const byFolder = {};
pages.forEach(p => (byFolder[p.folder] = byFolder[p.folder] || []).push(p));
const normLine = s => s.toLowerCase().replace(/[\d.,]+/g, '#').replace(/\s+/g, ' ');
for (const [fo, ps] of Object.entries(byFolder)) {
  const cnt = new Map();
  ps.forEach(p => new Set(p.lines.map(normLine)).forEach(l => cnt.set(l, (cnt.get(l) || 0) + 1)));
  const thr = Math.max(3, ps.length * 0.25);
  ps.forEach(p => {
    const uniq = p.lines.filter(l => (cnt.get(normLine(l)) || 0) < thr);
    p.words = p.lines.join(' ').split(/\s+/).filter(Boolean).length;
    p.uniqWords = uniq.join(' ').split(/\s+/).filter(w => /[a-zçğıöşü]/i.test(w)).length;
    p.uniqText = uniq.join(' ');
  });
}

// --- benzerlik (5 kelimelik shingle, MinHash yaklaşımı yerine örneklenmiş Jaccard)
function shingles(t) {
  const w = t.toLowerCase().replace(/[\d.,]+/g, '#').split(/\s+/).filter(Boolean), s = new Set();
  for (let i = 0; i + 5 <= w.length; i++) { const k = w.slice(i, i + 5).join(' '); let h = 0; for (let j = 0; j < k.length; j++) h = (h * 31 + k.charCodeAt(j)) | 0; if ((h & 7) === 0) s.add(h); }
  return s;
}
const idx = pages.filter(p => !p.noindex);
const nearDup = [];
for (const [fo, ps0] of Object.entries(byFolder)) {
  const ps = ps0.filter(p => !p.noindex && p.uniqWords >= 40);
  if (ps.length > 2500) continue;
  ps.forEach(p => p.sh = shingles(p.uniqText));
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i].sh, b = ps[j].sh; if (!a.size || !b.size) continue;
    const small = a.size < b.size ? a : b, big = small === a ? b : a;
    let inter = 0; small.forEach(x => { if (big.has(x)) inter++; });
    const jac = inter / (a.size + b.size - inter);
    if (jac >= 0.5) nearDup.push({ a: ps[i].f, b: ps[j].f, jac });
  }
}

// --- başlık benzerliği (haberler için kelime örtüşmesi)
const tw = t => new Set(t.toLowerCase().replace(/[^a-zçğıöşü0-9 ]/gi, ' ').split(/\s+/).filter(w => w.length > 3));
const newsTitleDup = [];
const news = idx.filter(p => p.folder === 'haberler');
for (let i = 0; i < news.length; i++) for (let j = i + 1; j < news.length; j++) {
  const a = tw(news[i].title), b = tw(news[j].title); let inter = 0; a.forEach(x => { if (b.has(x)) inter++; });
  const s = inter / Math.min(a.size, b.size || 1);
  if (s >= 0.6 && inter >= 3) newsTitleDup.push({ a: news[i].f, b: news[j].f, s, ta: news[i].title, tb: news[j].title });
}

// --- aynı başlık / açıklama
const group = (arr, key) => { const m = new Map(); arr.forEach(p => { const k = key(p); if (!k) return; (m.get(k) || m.set(k, []).get(k)).push(p.f); }); return [...m.entries()].filter(([, v]) => v.length > 1); };
const dupTitle = group(idx, p => p.title), dupDesc = group(idx, p => p.desc);

// --- tutarlılık
const noindexInSitemap = pages.filter(p => p.noindex && inSitemap.has(p.f)).map(p => p.f);
const idxNotInSitemap = idx.filter(p => !inSitemap.has(p.f)).map(p => p.f);
const canonOther = idx.filter(p => p.canon && p.canon !== BASE + p.f && !(p.f === 'index.html' && p.canon === BASE) && !(p.f.endsWith('/index.html') && p.canon === BASE + p.f.replace(/index\.html$/, ''))).map(p => `${p.f} -> ${p.canon}`);
const noTitle = idx.filter(p => !p.title).map(p => p.f), noDesc = idx.filter(p => !p.desc).map(p => p.f);

// --- kırık iç bağlantılar (yalnızca indekslenebilir sayfalardan)
const broken = new Map();
idx.forEach(p => p.links.forEach(h => {
  let t = h.startsWith(BASE) ? h.slice(BASE.length) : h;
  if (!t || t.startsWith('/')) t = t.replace(/^\//, ''); else t = path.posix.normalize(path.posix.join(path.posix.dirname(p.f), t));
  if (!t || t === '.' ) t = 'index.html';
  if (t.endsWith('/')) t += 'index.html';
  if (!/\.html$/.test(t)) return;
  if (!exists.has(t)) broken.set(t, (broken.get(t) || []).concat(p.f));
}));

// --- yer tutucu değerler
const PH = [/>\s*(—|-|N\/A|Bilinmiyor|Belirtilmemiş|undefined|null|NaN)\s*</g, /\b0 ₺/g];
const placeholder = idx.map(p => { const h = fs.readFileSync(path.join(root, p.f), 'utf8'); let n = 0; PH.forEach(r => n += (h.match(r) || []).length); return { f: p.f, n }; }).filter(x => x.n >= 8).sort((a, b) => b.n - a.n);

// --- klasör özetleri
const csv = (name, rows) => fs.writeFileSync(path.join(out, name), rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n'));
const q = (arr, k) => { const s = arr.map(x => x[k]).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const lines = [];
lines.push('# Site denetimi', '', `Toplam HTML: ${pages.length} · indekslenebilir: ${idx.length} · noindex: ${pages.length - idx.length} · sitemap URL: ${inSitemap.size}`, '');
lines.push('## Klasör özeti (indekslenebilir sayfalar)', '', '| Klasör | index | noindex | özgün kelime medyan | <150 özgün kelime | <300 özgün kelime |', '|---|---|---|---|---|---|');
for (const [fo, ps] of Object.entries(byFolder).sort((a, b) => b[1].length - a[1].length)) {
  const i = ps.filter(p => !p.noindex);
  lines.push(`| ${fo} | ${i.length} | ${ps.length - i.length} | ${q(i, 'uniqWords')} | ${i.filter(p => p.uniqWords < 150).length} | ${i.filter(p => p.uniqWords < 300).length} |`);
}
lines.push('', `## Tutarlılık`, '', `- noindex ama sitemap'te: ${noindexInSitemap.length}`, `- indekslenebilir ama sitemap'te değil: ${idxNotInSitemap.length}`, `- canonical başka sayfayı gösteren indekslenebilir: ${canonOther.length}`, `- başlıksız: ${noTitle.length} · açıklamasız: ${noDesc.length}`, `- aynı başlığı paylaşan grup: ${dupTitle.length} · aynı açıklama grubu: ${dupDesc.length}`, `- çok benzer içerik çifti (Jaccard ≥ 0,5): ${nearDup.length}`, `- benzer başlıklı haber çifti: ${newsTitleDup.length}`, `- kırık iç bağlantı hedefi: ${broken.size}`, `- çok yer tutucu değer içeren sayfa (≥8): ${placeholder.length}`, '');
lines.push('## En zayıf 40 indekslenebilir sayfa (özgün kelime)', '');
idx.slice().sort((a, b) => a.uniqWords - b.uniqWords).slice(0, 40).forEach(p => lines.push(`- ${p.uniqWords} · ${p.f} · ${p.title}`));
lines.push('', '## Benzer başlıklı haberler', ''); newsTitleDup.sort((a, b) => b.s - a.s).forEach(d => lines.push(`- ${d.s.toFixed(2)} · ${d.ta} ⟷ ${d.tb}`));
lines.push('', '## Çok benzer içerik (ilk 40)', ''); nearDup.sort((a, b) => b.jac - a.jac).slice(0, 40).forEach(d => lines.push(`- ${d.jac.toFixed(2)} · ${d.a} ⟷ ${d.b}`));
lines.push('', '## Kırık iç bağlantılar (ilk 40)', ''); [...broken.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 40).forEach(([t, s]) => lines.push(`- ${t} ← ${s.length} sayfa (ör. ${s[0]})`));
lines.push('', '## Aynı başlık (ilk 20)', ''); dupTitle.slice(0, 20).forEach(([t, v]) => lines.push(`- ${v.length}× ${t} (${v.slice(0, 3).join(', ')})`));
lines.push('', '## canonical başka sayfa (ilk 20)', ''); canonOther.slice(0, 20).forEach(x => lines.push('- ' + x));
lines.push('', '## noindex ama sitemap\'te (ilk 20)', ''); noindexInSitemap.slice(0, 20).forEach(x => lines.push('- ' + x));
lines.push('', '## indekslenebilir ama sitemap\'te değil (ilk 40)', ''); idxNotInSitemap.slice(0, 40).forEach(x => lines.push('- ' + x));
lines.push('', '## Yer tutucu yoğun (ilk 20)', ''); placeholder.slice(0, 20).forEach(x => lines.push(`- ${x.n} · ${x.f}`));
fs.writeFileSync(path.join(out, 'site-denetim.md'), lines.join('\n'));
csv('indekslenebilir-sayfalar.csv', [['dosya', 'klasor', 'ozgun_kelime', 'toplam_kelime', 'sitemap', 'baslik']].concat(idx.map(p => [p.f, p.folder, p.uniqWords, p.words, inSitemap.has(p.f) ? 1 : 0, p.title])));
csv('benzer-icerik.csv', [['a', 'b', 'jaccard']].concat(nearDup.map(d => [d.a, d.b, d.jac.toFixed(3)])));
csv('kirik-baglanti.csv', [['hedef', 'kaynak_sayisi', 'ornek']].concat([...broken.entries()].map(([t, s]) => [t, s.length, s[0]])));
console.log(lines.slice(0, 40).join('\n'));
