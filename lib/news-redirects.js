// ============================================================
// Silinen (tekrarlanan) haberlerin eski sayfalarını 301 ile asıl habere yönlendirir.
//
// lib/silinen-haberler.json: { "haberler": [ { "id": "eski-id", "yerine": "kalan-id" } ] }
//
// Kural haberler/.htaccess'e yazılır. GÜVENLİK: haber hâlâ veritabanında
// duruyorsa (henüz silinmediyse) veya yerine geçen haber yoksa o satır için
// kural YAZILMAZ; canlı bir sayfa yanlışlıkla yönlendirilmesin.
// ============================================================
const fs = require('fs');
const path = require('path');

function writeDeletedNewsRedirects({ rootDir, news }){
  const listFile = path.join(rootDir, 'lib', 'silinen-haberler.json');
  if(!fs.existsSync(listFile) || !Array.isArray(news)) return;
  let list = [];
  try{ list = (JSON.parse(fs.readFileSync(listFile, 'utf8')).haberler) || []; }
  catch(e){ console.warn('UYARI: silinen-haberler.json okunamadı:', e.message); return; }
  const ids = new Set(news.map(n => n.id));
  const lines = [];
  for(const r of list){
    if(!r || !r.id || !r.yerine) continue;
    if(ids.has(r.id)) continue;          // hâlâ canlı: dokunma
    if(!ids.has(r.yerine)) continue;     // hedef yok: yönlendirme yapma
    lines.push(`Redirect 301 /haberler/${r.id}.html https://teknoversus.com.tr/haberler/${r.yerine}.html`);
  }
  if(!lines.length) return;
  const dir = path.join(rootDir, 'haberler');
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, '.htaccess');
  const prev = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/\s*$/, '\n') : '';
  fs.writeFileSync(f, prev + '# Silinen tekrar haberler\n' + lines.join('\n') + '\n');
  console.log(`→ ${lines.length} silinen haber 301 ile yönlendirildi.`);
}
module.exports = { writeDeletedNewsRedirects };
