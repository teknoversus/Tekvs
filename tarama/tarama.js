// Geçici site tarayıcı: sitemap -> tüm sayfalar -> linkler/görseller. Sadece okur.
const fs = require('fs'), crypto = require('crypto');
const BASE = 'https://teknoversus.com.tr';
const UA = 'Mozilla/5.0 (compatible; TeknoVersusAudit/1.0)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function req(url, { method = 'GET', timeout = 25000, text = false } = {}) {
  for (let i = 0; i < 3; i++) {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), timeout);
    try {
      const r = await fetch(url, { method, redirect: 'follow', signal: ac.signal, headers: { 'user-agent': UA, 'accept': '*/*' } });
      let body = null;
      if (text) body = await r.text(); else { try { await r.body?.cancel(); } catch {} }
      clearTimeout(t);
      return { status: r.status, final: r.url, redirected: r.redirected, ctype: r.headers.get('content-type') || '', body };
    } catch (e) { clearTimeout(t); if (i === 2) return { status: 0, err: String(e.cause?.code || e.message), final: url }; await sleep(800 * (i + 1)); }
  }
}
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}
const dec = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
async function sitemapUrls(u, seen = new Set()) {
  if (seen.has(u)) return []; seen.add(u);
  const r = await req(u, { text: true }); if (r.status !== 200) return [{ err: u + ' -> ' + r.status }];
  const locs = [...r.body.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(m => dec(m[1]));
  if (/<sitemapindex/.test(r.body)) { let o = []; for (const l of locs) o = o.concat(await sitemapUrls(l, seen)); return o; }
  return locs.map(l => ({ url: l, sm: u }));
}
function parse(html, pageUrl) {
  const g = (re) => { const m = html.match(re); return m ? dec(m[1]).trim() : ''; };
  const title = g(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const desc = g(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) || g(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const canon = g(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const robots = g(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  const h2 = (html.match(/<h2[\s>]/gi) || []).length;
  const ogimg = g(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  let body = (html.match(/<main[\s\S]*?<\/main>/i) || html.match(/<body[\s\S]*<\/body>/i) || [html])[0];
  body = body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<svg[\s\S]*?<\/svg>|<!--[\s\S]*?-->/gi, ' ');
  const text = dec(body.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  const links = new Set(), imgs = new Set();
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)) {
    let h = dec(m[1]).trim(); if (!h || /^(mailto:|tel:|javascript:|#|data:)/i.test(h)) continue;
    try { const u = new URL(h, pageUrl); u.hash = ''; links.add(u.href); } catch {}
  }
  for (const m of html.matchAll(/<img\s[^>]*?(?:src|data-src)=["']([^"']+)["']/gi)) {
    const h = dec(m[1]).trim(); if (!h || /^data:/i.test(h)) continue;
    try { imgs.add(new URL(h, pageUrl).href); } catch {}
  }
  const noAlt = (html.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) || []).length;
  return {
    title, desc, canon, robots, h1, h2, words, ogimg, noAlt,
    hash: crypto.createHash('sha1').update(text.slice(0, 4000)).digest('hex').slice(0, 12),
    adsense: /adsbygoogle|pagead2\.googlesyndication|ca-pub-/i.test(html),
    jsonld: (html.match(/application\/ld\+json/gi) || []).length,
    lang: g(/<html[^>]*\blang=["']([^"']+)["']/i),
    viewport: /name=["']viewport["']/i.test(html),
    links: [...links], imgs: [...imgs], snippet: text.slice(0, 160)
  };
}
(async () => {
  fs.mkdirSync('rapor', { recursive: true });
  const t0 = Date.now();
  const sm = [];
  for (const s of ['/sitemap.xml', '/sitemap-news.xml']) sm.push(...await sitemapUrls(BASE + s));
  const errs = sm.filter(x => x.err).map(x => x.err);
  const urls = [...new Map(sm.filter(x => x.url).map(x => [x.url, x])).values()];
  console.log('sitemap urls', urls.length, 'errs', errs);
  // ek: sitemap'te olmayabilecek bilinen sayfalar
  const extra = ['/', '/404.html', '/offline.html', '/robots.txt', '/ads.txt', '/llms.txt', '/manifest.json', '/gizlilik-politikasi.html', '/hakkimizda.html', '/iletisim.html', '/cerez-politikasi.html', '/kullanim-kosullari.html', '/yakinda-cikacak.html'].map(p => BASE + p);
  for (const e of extra) if (!urls.find(u => u.url === e)) urls.push({ url: e, sm: '(ek)' });

  const pages = await pool(urls, 10, async (u, k) => {
    if (k % 200 === 0) console.log('sayfa', k, '/', urls.length, ((Date.now() - t0) / 1000) | 0, 's');
    const r = await req(u.url, { text: true });
    const rec = { url: u.url, sm: u.sm, status: r.status, final: r.final, redirected: r.redirected, ctype: r.ctype, err: r.err };
    if (r.status === 200 && /html/i.test(r.ctype) && r.body) Object.assign(rec, parse(r.body, r.final));
    return rec;
  });
  fs.writeFileSync('rapor/sayfalar.json', JSON.stringify({ smErrs: errs, pages }));

  // iç linkler (taranmayanlar) + görseller + dış linkler
  const crawled = new Set(pages.map(p => p.url));
  const host = new URL(BASE).host;
  const internal = new Set(), imgs = new Set(), ext = new Set();
  for (const p of pages) { for (const l of p.links || []) { try { const h = new URL(l).host; (h === host || h === 'www.' + host ? internal : ext).add(l); } catch {} } for (const i of p.imgs || []) imgs.add(i); }
  const inList = [...internal].filter(l => !crawled.has(l));
  console.log('ek ic link', inList.length, 'img', imgs.size, 'dis', ext.size);
  const inRes = await pool(inList, 10, async l => { const r = await req(l); return { url: l, status: r.status, final: r.final, err: r.err }; });
  const imgList = [...imgs];
  const imgRes = await pool(imgList, 12, async l => { const r = await req(l); return { url: l, status: r.status, ctype: r.ctype, err: r.err }; });
  const extList = [...ext];
  const extRes = await pool(extList, 8, async l => { const r = await req(l, { timeout: 15000 }); return { url: l, status: r.status, err: r.err }; });
  // kök dosyalar
  const misc = {};
  for (const p of ['/ads.txt', '/robots.txt', '/sitemap.xml', '/favicon.ico', '/manifest.json', '/ff24f614b05803dd642f59025f1a75a2.txt']) { const r = await req(BASE + p, { text: true }); misc[p] = { status: r.status, head: (r.body || '').slice(0, 300) }; }
  fs.writeFileSync('rapor/linkler.json', JSON.stringify({ inRes, imgRes, extRes, misc }));
  console.log('bitti', ((Date.now() - t0) / 1000) | 0, 's');
})();
