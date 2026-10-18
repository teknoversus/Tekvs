// ============================================================
// Elle yazılmış editör değerlendirmeleri.
//   lib/editorial/karsilastir.json  -> anahtar: iki ürün id'si, sıralı, "|" ile (örn. "n7|n8")
//   lib/editorial/inceleme.json     -> anahtar: ürün id'si
// Bu metinler şablon değil; en çok trafik alan sayfalar için tek tek yazıldı.
// Bir sayfanın metni varsa ilgili generator onu kullanır, yoksa eski
// şablon metin aynen kalır.
// ============================================================
const fs = require('fs');
const path = require('path');

const cache = {};
function load(name){
  if(cache[name]) return cache[name];
  const f = path.join(__dirname, 'editorial', name + '.json');
  let data = {};
  try{ if(fs.existsSync(f)) data = JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch(e){ console.warn(`UYARI: ${f} okunamadı: ${e.message}`); }
  delete data._aciklama;
  cache[name] = data;
  return data;
}

const esc = s => (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function trDate(iso){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${+m[3]} ${MONTHS[+m[2]-1]} ${m[1]}` : '';
}

function editorialForPair(idA, idB){
  return load('karsilastir')[[String(idA), String(idB)].sort().join('|')] || null;
}
function editorialForProduct(id){
  return load('inceleme')[String(id)] || null;
}

function paragraphs(list){
  return (list || []).map(t => `  <p style="font-size:14px;line-height:1.75;margin:0 0 12px;">${esc(t)}</p>`).join('\n');
}

// Karşılaştırma sayfası bloğu. nameOf: id -> ürün adı
function renderPairEditorial(ed, nameOf){
  const secim = (ed.secim || []).map(s =>
    `    <li style="margin-bottom:8px;"><strong>${esc(nameOf(s.urun) || s.urun)} alın:</strong> ${esc(s.metin)}</li>`).join('\n');
  return `
  <section class="editor-review" style="border:1px solid var(--line);border-radius:12px;padding:18px 18px 8px;margin:22px 0;background:var(--surface,#fff);">
  <h2 style="font-size:17px;margin:0 0 4px;">${esc(ed.baslik || 'Editör Değerlendirmesi: Hangisini Almalısınız?')}</h2>
  <div style="font-size:12.5px;color:var(--ink-soft);margin:0 0 14px;"><span rel="author">Sinan Tanrı</span>${ed.tarih ? ` · ${trDate(ed.tarih)} tarihinde güncellendi` : ''}</div>
${paragraphs(ed.metin)}
${secim ? `  <ul style="font-size:14px;line-height:1.7;padding-left:18px;margin:4px 0 12px;">\n${secim}\n  </ul>` : ''}
${ed.sonuc ? `  <p style="font-size:14px;line-height:1.75;margin:0 0 12px;font-weight:600;">${esc(ed.sonuc)}</p>` : ''}
  </section>`;
}

// İnceleme sayfası bloğu (Kısa cevap'ın hemen altına girer).
function renderProductEditorial(ed){
  return `
  <section class="editor-review" style="margin:0 0 8px;">
  <h2 style="font-size:17px;margin:20px 0 4px;">${esc(ed.baslik || 'Editör Değerlendirmesi')}</h2>
  <div style="font-size:12.5px;color:var(--ink-soft);margin:0 0 12px;"><span rel="author">Sinan Tanrı</span>${ed.tarih ? ` · ${trDate(ed.tarih)} tarihinde güncellendi` : ''}</div>
${paragraphs(ed.metin)}
  </section>`;
}

module.exports = { editorialForPair, editorialForProduct, renderPairEditorial, renderProductEditorial };
