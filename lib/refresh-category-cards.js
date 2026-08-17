// ============================================================
// TeknoVersus — kategori sayfalarındaki STATİK SEO kartlarını tazeler.
//
// SORUN: telefon.html, dizustu.html gibi kategori sayfaları generator
// tarafından üretilmiyor (elle bakımı yapılan statik dosyalar). İçlerindeki
// ürün kartları da statik HTML olarak gömülüydü ve aylar önceki veriyi
// taşıyordu: dolar cinsinden fiyatlar, eski skorlar, eksik ürünler.
//
// Gerçek kullanıcılar bunu görmüyordu çünkü category.js sayfa yüklenince
// mainGrid'i canlı veriyle değiştiriyor. Ama JS çalıştırmayan tarayıcılar ve
// bazı arama motoru botları statik hali görüyordu — yani SEO temeli bayattı.
//
// ÇÖZÜM: Bu modül <!-- KARTLAR_START --> ve <!-- KARTLAR_END --> işaretçileri
// arasını her build'de canlı veriyle yeniden yazar. İşaretçi tabanlı olduğu
// için tekrar tekrar çalıştırılabilir (idempotent).
// ============================================================
const fs = require('fs');
const path = require('path');

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};

function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function refreshCategoryCards({ products, colorFor, fmtDate, computeScores, ICONS, rootDir }){
  const catalog = products.filter(p => !p.upcoming);
  const scores = computeScores(catalog);

  function scoreColor(s){
    if(s >= 70) return 'var(--good)';
    if(s >= 40) return 'var(--mid)';
    return 'var(--bad)';
  }

  function cardHTML(p){
    const color = colorFor(p.cat);
    const s = scores[p.id];
    // Kartta gösterilecek ilk 4 özellik (fiyat her zaman başta)
    const entries = Object.entries(p.specs || {});
    const priceEntry = entries.find(([k]) => /fiyat/i.test(k));
    const others = entries.filter(([k]) => !/fiyat/i.test(k) && !/genişlik|uzunluk|kalınlık|piksel|çözünürlük|renk|konektör|güvenlik|bağlantı|hücresel|sim |flash|webcam|klavye|kamera sayısı/i.test(k));
    const shown = (priceEntry ? [priceEntry] : []).concat(others.slice(0, 3));
    const specPills = shown.map(([k,v]) => `<span class="spec-pill">${esc(k)}: ${esc(v)}</span>`).join('');

    return `  <div class="card" onclick="openDetail('${p.id}')">
    <button class="fav-btn" onclick="event.stopPropagation(); toggleFavorite('${p.id}')" title="Favorilere ekle" aria-label="${esc(p.name)} ürününü favorilere ekle"><svg viewBox="0 0 24 24" fill="none" stroke="#5B6B60" stroke-width="1.6"><path d="M12 21s-7.2-4.6-10-9.1C.4 8.6 1.8 5 5.4 4.2 7.7 3.7 10 4.8 12 7c2-2.2 4.3-3.3 6.6-2.8C22.2 5 23.6 8.6 22 11.9 19.2 16.4 12 21 12 21z"/></svg></button>
    <div class="card-icon" style="background:${color}22;color:${color};">
      <svg width="24" height="24" viewBox="0 0 24 24">${ICONS[p.cat] || ''}</svg>
    </div>
    <div class="card-cat">${esc(p.cat)} · Çıkış: ${fmtDate(p.addedAt)}</div>
    <div class="card-name">${esc(p.name)}</div>
    ${s != null ? `<span class="score-pill" style="background:${scoreColor(s)}22;color:${scoreColor(s)};">Skor: ${s}</span>` : ''}
    <div class="card-blurb">${esc(p.blurb || '')}</div>
    <div class="card-specs">${specPills}</div>
    <div class="card-foot">
      <label class="compare-check" onclick="event.stopPropagation()">
        <input type="checkbox" aria-label="${esc(p.name)} ürününü karşılaştırmaya ekle" onchange="toggleSelect('${p.id}')" />
        Karşılaştır
      </label>
      <span class="view-count"></span>
    </div>
  </div>`;
  }

  let updated = 0;
  Object.entries(SLUG_MAP).forEach(([cat, slug]) => {
    const file = path.join(rootDir, `${slug}.html`);
    if(!fs.existsSync(file)) return;
    let html = fs.readFileSync(file, 'utf8');
    if(!html.includes('<!-- KARTLAR_START -->')) return; // işaretçi yoksa dokunma

    // Kategorinin ürünleri, skora göre azalan (kullanıcıya en alakalı sıra)
    const items = catalog.filter(p => p.cat === cat)
      .sort((a,b) => (scores[b.id] || 0) - (scores[a.id] || 0));

    const cards = items.map(cardHTML).join('\n');
    html = html.replace(
      /<!-- KARTLAR_START -->[\s\S]*?<!-- KARTLAR_END -->/,
      `<!-- KARTLAR_START -->\n${cards}\n<!-- KARTLAR_END -->`
    );

    // Footer'daki fiyat tarihi notunu da güncel tut
    html = html.replace(/Fiyatlar [A-Za-zğüşıöçĞÜŞİÖÇ]+ \d{4} itibarıyla/,
      `Fiyatlar ${new Date().toLocaleDateString('tr-TR',{month:'long',year:'numeric'})} itibarıyla`);

    fs.writeFileSync(file, html);
    updated++;
  });

  console.log(`${updated} kategori sayfasının statik SEO kartları canlı veriyle tazelendi.`);
  return updated;
}

module.exports = { refreshCategoryCards };
