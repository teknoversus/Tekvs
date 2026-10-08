// ============================================================
// TeknoVersus — Rehber içerik yükleyici ve HTML çizici.
//
// 8 Ekim 2026: Konu rehberleri (7 "nasıl seçilir") ve destek makaleleri (59)
// ortalama ~150 kelimelik kısa metinlerdi. Yeniden yazılan, bölümlü içerik
// lib/rehber-icerik/<slug>.json dosyalarında durur (lib/ FTP'ye yüklenmez,
// yalnızca build sırasında okunur). Bir slug için dosya varsa üretici modüller
// (generate-topical-guides.js, generate-cluster-articles.js) onu kullanır;
// yoksa eski, modül içindeki kısa metne düşer.
//
// İçerik şeması: { slug, title, description, tldr, intro[], sections[
//   { h, p[], list[], ol[], table{head[], rows[][]}, note } ], faq[{q,a}],
//   sources[{t,u}], updated? }
// ============================================================
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'rehber-icerik');
// İçeriğin elle yeniden yazıldığı tarih (dosyada "updated" yoksa bu kullanılır).
const DEFAULT_UPDATED = '2026-10-08';

function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function loadGuideContent(slug){
  const f = path.join(CONTENT_DIR, `${slug}.json`);
  if(!fs.existsSync(f)) return null;
  try{
    const c = JSON.parse(fs.readFileSync(f, 'utf8'));
    if(!c || !Array.isArray(c.sections) || !c.sections.length) return null;
    return c;
  }catch(e){
    console.warn(`UYARI: rehber içeriği okunamadı (${slug}): ${e.message} — eski metin kullanılacak.`);
    return null;
  }
}

function contentWords(c){
  const parts = [c.tldr || '', ...(c.intro || [])];
  (c.sections || []).forEach(s => {
    parts.push(...(s.p || []), ...(s.list || []), ...(s.ol || []));
    if(s.note) parts.push(s.note);
    if(s.table && s.table.rows) s.table.rows.forEach(r => parts.push(...r));
  });
  (c.faq || []).forEach(f => parts.push(f.q, f.a));
  return parts.join(' ').split(/\s+/).filter(Boolean).length;
}

function trDate(iso){
  try{ return new Date(iso + 'T12:00:00Z').toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' }); }
  catch(e){ return iso; }
}

const P = 'margin:0 0 14px;line-height:1.75;font-size:14.5px;';

// Başlık altı bilgi satırı: yazar, güncelleme tarihi, okuma süresi
function metaLineHTML(c){
  const minutes = Math.max(2, Math.round(contentWords(c) / 200));
  return `<div style="font-size:12.5px;color:var(--ink-soft);margin:0 0 16px;">
    <a href="../hakkimizda.html" style="color:inherit;">TeknoVersus editör ekibi</a> · Son güncelleme: ${esc(trDate(c.updated || DEFAULT_UPDATED))} · ${minutes} dk okuma
  </div>`;
}

// İçindekiler (4+ bölümlü içeriklerde)
function tocHTML(c){
  if((c.sections || []).length < 4) return '';
  return `<nav aria-label="İçindekiler" style="background:var(--surface,#fff);border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin:0 0 20px;">
    <div style="font-weight:600;font-size:13.5px;margin-bottom:6px;">Bu sayfada</div>
    <ol style="margin:0;padding-left:20px;font-size:13.5px;line-height:1.8;">
${c.sections.map((s, i) => `      <li><a href="#b${i+1}" style="color:inherit;">${esc(s.h)}</a></li>`).join('\n')}
    </ol>
  </nav>`;
}

function sectionHTML(s, i){
  const out = [`  <h2 id="b${i+1}" style="font-size:17px;margin:28px 0 10px;">${esc(s.h)}</h2>`];
  (s.p || []).forEach(p => out.push(`  <p style="${P}">${esc(p)}</p>`));
  if(s.ol && s.ol.length){
    out.push(`  <ol style="font-size:14.5px;line-height:1.75;padding-left:22px;margin:0 0 14px;">\n${s.ol.map(x => `    <li style="margin-bottom:6px;">${esc(x)}</li>`).join('\n')}\n  </ol>`);
  }
  if(s.list && s.list.length){
    out.push(`  <ul style="font-size:14.5px;line-height:1.75;padding-left:20px;margin:0 0 14px;">\n${s.list.map(x => `    <li style="margin-bottom:4px;">${esc(x)}</li>`).join('\n')}\n  </ul>`);
  }
  if(s.table && Array.isArray(s.table.head) && Array.isArray(s.table.rows) && s.table.rows.length){
    out.push(`  <div style="overflow-x:auto;margin:0 0 16px;">
  <table style="width:100%;border-collapse:collapse;font-size:13.5px;">
    <thead><tr style="border-bottom:2px solid var(--line);">${s.table.head.map(h => `<th style="text-align:left;padding:8px 10px 8px 0;">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>
${s.table.rows.map(r => `      <tr style="border-bottom:1px solid var(--line);">${r.map((c, j) => `<td style="padding:8px 10px 8px 0;${j === 0 ? 'font-weight:600;' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('\n')}
    </tbody>
  </table>
  </div>`);
  }
  if(s.note){
    out.push(`  <div class="product-notice" style="margin:0 0 16px;"><strong>Not:</strong> ${esc(s.note)}</div>`);
  }
  return out.join('\n');
}

// Gövde: kısa cevap + bilgi satırı + giriş + içindekiler + bölümler
function bodyHTML(c){
  return [
    metaLineHTML(c),
    `  <div class="product-notice" style="background:#F0F7FF;border-color:#B8D4F0;margin-bottom:20px;">\n    <strong>Kısa cevap:</strong> ${esc(c.tldr)}\n  </div>`,
    ...(c.intro || []).map(p => `  <p style="${P}">${esc(p)}</p>`),
    tocHTML(c),
    ...(c.sections || []).map(sectionHTML),
  ].join('\n');
}

function faqHTML(faq){
  if(!faq || !faq.length) return '';
  return `<h2 style="font-size:17px;margin:28px 0 10px;">Sıkça Sorulan Sorular</h2>
${faq.map(f => `  <div style="margin-bottom:14px;">
    <div style="font-weight:600;font-size:14.5px;margin-bottom:4px;">${esc(f.q)}</div>
    <div style="font-size:14px;color:var(--ink-soft);line-height:1.7;">${esc(f.a)}</div>
  </div>`).join('\n')}`;
}

function sourcesHTML(sources){
  const list = (sources || []).filter(s => s && /^https:\/\//.test(s.u || ''));
  if(!list.length) return '';
  return `<h2 style="font-size:15px;margin:24px 0 10px;">Kaynaklar</h2>
  <ul style="font-size:13px;line-height:1.8;padding-left:18px;margin-bottom:20px;">
${list.map(s => `    <li><a href="${esc(s.u)}" target="_blank" rel="noopener noreferrer nofollow">${esc(s.t)}</a></li>`).join('\n')}
  </ul>`;
}

// schema.org Article + FAQPage
function schemas(c, url){
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": c.title,
    "description": c.description || c.tldr,
    "inLanguage": "tr-TR",
    "dateModified": c.updated || DEFAULT_UPDATED,
    "mainEntityOfPage": url,
    "author": { "@type": "Organization", "name": "TeknoVersus", "url": "https://teknoversus.com.tr/hakkimizda.html" },
    "publisher": { "@type": "Organization", "name": "TeknoVersus", "url": "https://teknoversus.com.tr/" }
  };
  const out = [article];
  if(c.faq && c.faq.length){
    out.push({ "@context":"https://schema.org", "@type":"FAQPage", "mainEntity": c.faq.map(f => ({ "@type":"Question", "name":f.q, "acceptedAnswer": { "@type":"Answer", "text":f.a } })) });
  }
  return out;
}

module.exports = { loadGuideContent, bodyHTML, faqHTML, sourcesHTML, schemas, contentWords, esc };
