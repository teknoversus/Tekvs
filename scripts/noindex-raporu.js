// ============================================================
// noindex RAPORU (yalnızca ölçer, hiçbir şeyi değiştirmez, deploy etmez).
// node build.js çalıştıktan sonra üretilen karsilastir/*.html dosyalarını tarar:
//   - kaç sayfa index / noindex,
//   - Search Console'da gösterim alan "korunan" sayfaların durumu,
//   - önerilen EK kurallarla (TV boyut farkı, sıkı fiyat oranı) kaç sayfa daha noindex olurdu.
// Çıktı: rapor/noindex-raporu.md + rapor/aday-noindex.csv + ::notice:: özet satırları.
// ============================================================
const fs = require('fs'), path = require('path');
const root = process.cwd();
const dir = path.join(root, 'karsilastir');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html');

const prot = new Map();
(fs.readFileSync(path.join(root, 'lib', 'gsc-korunan-sayfalar.txt'), 'utf8').split('\n'))
  .filter(l => l && !l.startsWith('#')).forEach(l => { const [f, c, g] = l.split('\t'); prot.set(f, { c: +c, g: +g }); });

// karsilastir/.htaccess içindeki yönlendirmeler (eski adres -> yeni)
const redirected = new Set();
try {
  fs.readFileSync(path.join(dir, '.htaccess'), 'utf8').split('\n').forEach(l => {
    const m = /^Redirect 301 \/karsilastir\/(\S+\.html)\s/.exec(l.trim()); if (m) redirected.add(m[1]);
  });
} catch (e) {}

const num = s => parseFloat(String(s).replace(/\./g, '').replace(',', '.'));
function info(f) {
  const html = fs.readFileSync(path.join(dir, f), 'utf8');
  const noindex = /<meta name="robots" content="[^"]*noindex/i.test(html);
  let names = [], cat = '';
  const m = html.match(/"@type":\s*"ItemList"[\s\S]*?"itemListElement":\s*\[([\s\S]*?)\]\s*\}/);
  if (m) { names = [...m[1].matchAll(/"name":\s*"([^"]+)"/g)].map(x => x[1]); const c = m[1].match(/"category":\s*"([^"]+)"/); if (c) cat = c[1]; }
  let p1 = null, p2 = null;
  const pm = /([\d.]+) ₺[, ]+[^"]*?([\d.]+) ₺ — aradaki fark/.exec(html);
  if (pm) { p1 = num(pm[1]); p2 = num(pm[2]); }
  return { f, noindex, names, cat, p1, p2 };
}
const inch = n => { const m = /\b(\d{2,3})\s?(?:"|inç|inch)?[A-Za-z]{1,3}\d/.exec(n) || /\b(\d{2,3})\s?(?:"|inç|inch)\b/.exec(n); const v = m ? +m[1] : null; return v && v >= 24 && v <= 120 ? v : null; };

const all = files.map(info);
const idx = all.filter(x => !x.noindex), noi = all.filter(x => x.noindex);

const cand = [];
idx.forEach(x => {
  const reasons = [];
  if (/televizyon|tv/i.test(x.cat) && x.names.length === 2) {
    const a = inch(x.names[0]), b = inch(x.names[1]);
    if (a && b && Math.abs(a - b) >= 15) reasons.push(`TV boyut farkı ${Math.abs(a - b)}"`);
  }
  if (x.p1 && x.p2 && Math.max(x.p1, x.p2) / Math.min(x.p1, x.p2) > 1.6) reasons.push(`fiyat oranı ${(Math.max(x.p1, x.p2) / Math.min(x.p1, x.p2)).toFixed(2)}x`);
  if (reasons.length) cand.push({ ...x, reasons });
});
const candFree = cand.filter(x => !prot.has(x.f));
const candProt = cand.filter(x => prot.has(x.f));

const protExist = [...prot.keys()].filter(f => files.includes(f));
const protRedirected = [...prot.keys()].filter(f => !files.includes(f) && redirected.has(f));
const protGone = [...prot.keys()].filter(f => !files.includes(f) && !redirected.has(f));
const protNoindex = protExist.filter(f => all.find(x => x.f === f).noindex);
const clicks = fs => fs.reduce((s, f) => s + (prot.get(f)?.c || 0), 0);

const byCat = {};
all.forEach(x => { const k = x.cat || '?'; byCat[k] = byCat[k] || { n: 0, idx: 0 }; byCat[k].n++; if (!x.noindex) byCat[k].idx++; });
const byCatFree = {};
candFree.forEach(x => { const k = x.cat || '?'; byCatFree[k] = (byCatFree[k] || 0) + 1; });

const L = [];
L.push('# noindex raporu', '', `Toplam karşılaştırma sayfası: **${all.length}** — indekslenebilir: **${idx.length}**, noindex: **${noi.length}**`, '');
L.push('## Kategori', '| Kategori | Sayfa | İndekslenebilir | Yeni kurallarla noindex olacak (korunmayan) |', '|---|---|---|---|');
Object.entries(byCat).sort((a, b) => b[1].n - a[1].n).forEach(([k, v]) => L.push(`| ${k} | ${v.n} | ${v.idx} | ${byCatFree[k] || 0} |`));
L.push('', '## Korunan liste (Search Console, gösterim alan ilk 1000)',
  `- Listede: ${prot.size}`, `- Sitede mevcut: ${protExist.length} (bunların ${protNoindex.length} tanesi ŞU AN noindex)`,
  `- Yönlendirilen (eski adres → 301): ${protRedirected.length}`, `- Ne sitede ne yönlendirmede (404 riski): ${protGone.length}`,
  `- Mevcut sayfaların aldığı tıklama: ${clicks(protExist)}; yönlendirilenlerin: ${clicks(protRedirected)}; kayıp olanların: ${clicks(protGone)}`);
L.push('', '## Önerilen ek kurallar (UYGULANMADI, sadece ölçüldü)',
  `- TV boyut farkı ≥15" ve fiyat oranı >1.6x kuralına uyan indekslenebilir sayfa: ${cand.length}`,
  `- Bunlardan KORUNAN listede olan (dokunulmayacak): ${candProt.length}`,
  `- Noindex olacak (korunmayan): **${candFree.length}**`);
fs.mkdirSync(path.join(root, 'rapor'), { recursive: true });
fs.writeFileSync(path.join(root, 'rapor', 'noindex-raporu.md'), L.join('\n') + '\n');
fs.writeFileSync(path.join(root, 'rapor', 'aday-noindex.csv'), 'dosya,sebep,korunan\n' + cand.map(x => `${x.f},"${x.reasons.join('; ')}",${prot.has(x.f) ? 'evet' : 'hayir'}`).join('\n') + '\n');
fs.writeFileSync(path.join(root, 'rapor', 'korunan-eksik.csv'), 'dosya,durum,tiklama,gosterim\n' + [...protGone.map(f => [f, 'kayip']), ...protRedirected.map(f => [f, 'yonlendirilen']), ...protNoindex.map(f => [f, 'noindex'])].map(([f, s]) => `${f},${s},${prot.get(f).c},${prot.get(f).g}`).join('\n') + '\n');
console.log(L.join('\n'));
[`Toplam ${all.length}, indekslenebilir ${idx.length}, noindex ${noi.length}`,
 `Korunan ${prot.size}: sitede ${protExist.length} (noindex ${protNoindex.length}), yönlendirilen ${protRedirected.length}, kayıp ${protGone.length}`,
 `Ek kural adayı ${cand.length}; korunan ${candProt.length}; noindex olacak ${candFree.length}`].forEach(s => console.log('::notice::' + s));
