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
function slugify(name){
  const tr = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return name.split('').map(ch => tr[ch] !== undefined ? tr[ch] : ch).join('')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function refreshCategoryCards({ products, colorFor, fmtDate, computeScores, ICONS, rootDir }){
  const catalog = products.filter(p => !p.upcoming);
  const scores = computeScores(catalog);

  function scoreColor(s){
    if(s >= 70) return 'var(--good)';
    if(s >= 40) return 'var(--mid)';
    return 'var(--bad)';
  }

  function cardHTML(p, yeniMi){
    const color = colorFor(p.cat);
    const s = scores[p.id];
    // Kartta gösterilecek ilk 4 özellik (fiyat her zaman başta)
    const entries = Object.entries(p.specs || {});
    const priceEntry = entries.find(([k]) => /fiyat/i.test(k));
    const others = entries.filter(([k]) => !/fiyat/i.test(k) && !/genişlik|uzunluk|kalınlık|piksel|çözünürlük|renk|konektör|güvenlik|bağlantı|hücresel|sim |flash|webcam|klavye|kamera sayısı/i.test(k));
    const shown = (priceEntry ? [priceEntry] : []).concat(others.slice(0, 3));
    const specPills = shown.map(([k,v]) => `<span class="spec-pill">${esc(k)}: ${esc(v)}</span>`).join('');

    return `  <div class="card" onclick="openDetail('${p.id}')">
    ${yeniMi ? '<span class="badge-new">YENİ</span>' : ''}
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

  // ---- ANASAYFA (index.html) ----
  // Kategori sayfalarıyla aynı sorun burada da vardı: statik SEO kartları
  // aylar öncesinin verisini (dolar fiyatları, bozuk skorlar) taşıyordu.
  // Anasayfa sitenin en önemli sayfası olduğu için bu kartlar da her build'de
  // canlı veriyle tazeleniyor.
  const anaSayfa = path.join(rootDir, 'index.html');
  if(fs.existsSync(anaSayfa)){
    let html = fs.readFileSync(anaSayfa, 'utf8');
    let degisti = false;

    // "Bu Ay Hangi Yeni Ürünler Çıktı?" — en yeni 4 ürün
    if(html.includes('<!-- YENI_KARTLAR_START -->')){
      const yeniler = [...catalog]
        .sort((a,b) => String(b.addedAt||'').localeCompare(String(a.addedAt||'')))
        .slice(0, 4);
      html = html.replace(/<!-- YENI_KARTLAR_START -->[\s\S]*?<!-- YENI_KARTLAR_END -->/,
        `<!-- YENI_KARTLAR_START -->\n${yeniler.map(p => cardHTML(p, true)).join('\n')}\n<!-- YENI_KARTLAR_END -->`);
      degisti = true;
    }

    // Katalog — tüm ürünler, skora göre azalan
    if(html.includes('<!-- KATALOG_KARTLAR_START -->')){
      const hepsi = [...catalog].sort((a,b) => (scores[b.id]||0) - (scores[a.id]||0));
      html = html.replace(/<!-- KATALOG_KARTLAR_START -->[\s\S]*?<!-- KATALOG_KARTLAR_END -->/,
        `<!-- KATALOG_KARTLAR_START -->\n${hepsi.map(p => cardHTML(p, false)).join('\n')}\n<!-- KATALOG_KARTLAR_END -->`);
      degisti = true;
    }

    // "Katalogda Neler Var?" istatistik tablosu — kategori bazlı model
    // sayısı ve fiyat aralığı artık ELLE DEĞİL, gerçek katalogdan
    // hesaplanıyor. Önceki sabit "54" gibi rakamlar CSV/admin panelinden
    // yapılan her değişiklikte YANLIŞ kalıyordu; artık her build'de
    // otomatik güncelleniyor. SADECE normal (upcoming=false) ürünler
    // sayılıyor — "yakında çıkacak" ürünler henüz satılamadığı için
    // kategori sayfalarında da gösterilmiyor, aynı mantık burada da geçerli.
    if(html.includes('<!-- ISTATISTIK_TABLO_START -->')){
      const CAT_LINKS = {
        'Telefon':'telefon.html', 'Dizüstü':'dizustu.html', 'Tablet':'tablet.html',
        'Kulaklık':'kulaklik.html', 'Akıllı Saat':'akilli-saat.html',
        'Televizyon':'televizyon.html', 'Kamera':'kamera.html'
      };
      const catStats = Object.keys(CAT_LINKS).map(cat => {
        const urunler = catalog.filter(p => p.cat === cat);
        const fiyatlar = urunler
          .map(p => parseFloat(String(p.specs['Fiyat (₺)']||'').replace(/[^\d.]/g,'')))
          .filter(v => !isNaN(v) && v > 0);
        const min = fiyatlar.length ? Math.min(...fiyatlar) : 0;
        const max = fiyatlar.length ? Math.max(...fiyatlar) : 0;
        const tl = n => Math.round(n).toLocaleString('tr-TR');
        return { cat, href: CAT_LINKS[cat], sayi: urunler.length, aralik: fiyatlar.length ? `${tl(min)} – ${tl(max)} ₺` : '—' };
      }).sort((a,b) => b.sayi - a.sayi);

      const rows = catStats.map((s,i) => `    <tr${i===catStats.length-1?'':' style="border-bottom:1px solid var(--line);"'}><td style="padding:7px 10px 7px 0;"><a href="${s.href}">${s.cat === 'Dizüstü' ? 'Dizüstü Bilgisayar' : s.cat}</a></td><td style="padding:7px 10px;">${s.sayi}</td><td style="padding:7px 0;">${s.aralik}</td></tr>`).join('\n');
      const toplamUrun = catStats.reduce((a,s) => a+s.sayi, 0);

      html = html.replace(
        /TeknoVersus kataloğunda 7 kategoride \d+ ürün bulunuyor\./,
        `TeknoVersus kataloğunda 7 kategoride ${toplamUrun} ürün bulunuyor.`
      );
      html = html.replace(
        /<!-- ISTATISTIK_TABLO_START -->[\s\S]*?<tbody>[\s\S]*?<\/tbody>/,
        (m) => m.replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>\n${rows}\n  </tbody>`)
      );
      degisti = true;
    }

    if(degisti){
      html = html.replace(/Fiyatlar [A-Za-zğüşıöçĞÜŞİÖÇ]+ \d{4} itibarıyla/,
        `Fiyatlar ${new Date().toLocaleDateString('tr-TR',{month:'long',year:'numeric'})} itibarıyla`);
      fs.writeFileSync(anaSayfa, html);
      console.log('Anasayfanın statik SEO kartları ve istatistik tablosu canlı veriyle tazelendi.');
    }
  }

  console.log(`${updated} kategori sayfasının statik SEO kartları canlı veriyle tazelendi.`);

  // ============================================================
  // Faz 7E: llms.txt'deki DEĞİŞKEN sayıları (ürün sayısı, karşılaştırma
  // sayısı, ürün URL örneği) build zamanında GERÇEK verilerden günceller.
  // Sabit metin (rehber linkleri, açıklamalar, affiliate bilgisi) hiç
  // dokunulmadan kalır.
  //
  // Faz 7E-1 DÜZELTMESİ: Önceki tasarımda TEK bir "LLMS_STATS_START/END"
  // marker'ı 4 farklı yerde SIRAYLA dolduruluyordu — marker'ların
  // llms.txt içinde yer değiştirmesi/eklenmesi durumunda yanlış değerin
  // yanlış yere yazılması riski taşıyordu. Artık her veri türü kendi
  // BAĞIMSIZ, isme dayalı marker'ını kullanıyor — sıra önemli değil:
  //   - LLMS_PRODUCT_COUNT_START/END  → ürün sayısı (2 yerde geçer, hep aynı değer)
  //   - LLMS_COMPARISON_COUNT_START/END → karşılaştırma sayısı
  //   - LLMS_PRODUCT_URL_START/END → gerçek ürün URL örneği
  // ============================================================
  const llmsPath = path.join(rootDir, 'llms.txt');
  if(fs.existsSync(llmsPath)){
    let llmsHtml = fs.readFileSync(llmsPath, 'utf8');

    const toplamUrun = catalog.length;
    let karsSayisi = 0;
    const karsDir = path.join(rootDir, 'karsilastir');
    if(fs.existsSync(karsDir)){
      karsSayisi = fs.readdirSync(karsDir).filter(f => f.endsWith('.html')).length;
    }
    // Gerçek, çalışan bir ürün URL'si — mevcut productSlug mantığıyla
    // BİREBİR aynı (slugify(isim) + '-' + id), uydurma değil.
    // ÖNCELİKLE fiyatı olan VE gerçekten oluşturulmuş bir HTML dosyasına
    // karşılık gelen bir ürün seçiliyor.
    const urunDosyaVarMi = (urun) => {
      const yol = path.join(rootDir, 'urun', `${slugify(urun.name)}-${urun.id}.html`);
      return fs.existsSync(yol);
    };
    let ornekUrun = catalog.find(p => p.specs && p.specs['Fiyat (₺)'] && urunDosyaVarMi(p));
    if(!ornekUrun) ornekUrun = catalog.find(p => urunDosyaVarMi(p)); // fiyatlı yoksa, en azından dosyası var olan
    if(!ornekUrun) ornekUrun = catalog[0]; // hiçbiri yoksa (ör. izole testte urun/ klasörü hiç yoksa) son çare
    const ornekUrl = ornekUrun ? `${slugify(ornekUrun.name)}-${ornekUrun.id}.html` : '[ürün-slug].html';

    const degistir = (isim, deger) => {
      const re = new RegExp(`<!-- ${isim}_START -->[\\s\\S]*?<!-- ${isim}_END -->`, 'g');
      llmsHtml = llmsHtml.replace(re, `<!-- ${isim}_START -->${deger}<!-- ${isim}_END -->`);
    };
    degistir('LLMS_PRODUCT_COUNT', `${toplamUrun}+`);
    degistir('LLMS_COMPARISON_COUNT', `${karsSayisi}+`);
    degistir('LLMS_PRODUCT_URL', ornekUrl);

    // Encoding açıkça UTF-8 belirtiliyor (Node'un varsayılanıyla aynı,
    // ama niyeti netleştirmek ve ileride yanlışlıkla değişmesini
    // önlemek için açık yazım tercih edildi).
    fs.writeFileSync(llmsPath, llmsHtml, 'utf8');
    console.log(`llms.txt güncellendi: ${toplamUrun} ürün, ${karsSayisi} karşılaştırma, örnek URL: /urun/${ornekUrl}`);
  } else {
    console.log('llms.txt bulunamadı, atlandı (bu build\'e özgü olabilir).');
  }

  return updated;
}

module.exports = { refreshCategoryCards };
