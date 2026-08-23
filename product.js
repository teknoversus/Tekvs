// ============================================================
// TeknoVersus — ürün detay sayfası motoru
// Her ürün sayfası (urun/*.html) bu dosyayı shared.js'den SONRA yükler ve
// öncesinde şu değişkeni tanımlar:
//   const PRODUCT_ID = 's4';
// Sayfadaki statik (SEO için önceden oluşturulmuş) içeriği değiştirmez;
// sadece görüntülenme sayısı, favori durumu ve fiyat grafiğini canlandırır.
// ============================================================

let pdFavorites = [];
let pdChart = null;

function pdScoreColor(s){
  const css = getComputedStyle(document.documentElement);
  if(s>=70) return css.getPropertyValue('--good').trim();
  if(s>=40) return css.getPropertyValue('--mid').trim();
  return css.getPropertyValue('--bad').trim();
}

function pdHeartIcon(filled){
  return filled
    ? `<svg viewBox="0 0 24 24" fill="#B23A5C" style="width:16px;height:16px;vertical-align:-3px;margin-right:5px;"><path d="M12 21s-7.2-4.6-10-9.1C.4 8.6 1.8 5 5.4 4.2 7.7 3.7 10 4.8 12 7c2-2.2 4.3-3.3 6.6-2.8C22.2 5 23.6 8.6 22 11.9 19.2 16.4 12 21 12 21z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:16px;height:16px;vertical-align:-3px;margin-right:5px;"><path d="M12 21s-7.2-4.6-10-9.1C.4 8.6 1.8 5 5.4 4.2 7.7 3.7 10 4.8 12 7c2-2.2 4.3-3.3 6.6-2.8C22.2 5 23.6 8.6 22 11.9 19.2 16.4 12 21 12 21z"/></svg>`;
}

function pdUpdateFavBtn(btn, isFav){
  btn.innerHTML = pdHeartIcon(isFav) + (isFav ? 'Favorilerde' : 'Favorilere Ekle');
  btn.classList.toggle('btn-dark', isFav);
  btn.classList.toggle('btn-outline', !isFav);
}

async function initProductPage(){
  const products = await loadSharedProducts();
  const p = products.find(x => x.id === PRODUCT_ID);
  if(!p) return;

  const scores = computeScores(products);
  pdFavorites = await getFavorites();

  await trackRecentlyViewed(PRODUCT_ID);
  await renderRecentlyViewedInto('recentlyViewedStrip', products, PRODUCT_ID);

  const count = await incrementViews(PRODUCT_ID);
  const vEl = document.getElementById('viewCountLabel');
  const vSep = document.getElementById('viewCountSep');
  // Sayaç yalnızca GERÇEK görüntülenme varsa gösterilir. Yeni bir sayfada
  // "0 görüntülenme" yazmak güvenilirlik algısını zayıflatıyor; veri yoksa
  // hiçbir şey göstermemek daha dürüst ve daha iyi görünüyor.
  if(vEl){
    if(count != null && count > 0){
      vEl.textContent = count + ' görüntülenme';
      if(vSep) vSep.style.display = '';
    } else {
      vEl.textContent = '';
      if(vSep) vSep.style.display = 'none';
    }
  }

  const favBtn = document.getElementById('favBtn');
  if(favBtn){
    pdUpdateFavBtn(favBtn, pdFavorites.includes(PRODUCT_ID));
    favBtn.addEventListener('click', async () => {
      const idx = pdFavorites.indexOf(PRODUCT_ID);
      if(idx >= 0) pdFavorites.splice(idx, 1); else pdFavorites.push(PRODUCT_ID);
      await saveFavorites(pdFavorites);
      pdUpdateFavBtn(favBtn, pdFavorites.includes(PRODUCT_ID));
    });
  }

  const s = scores[PRODUCT_ID];
  const scoreEl = document.getElementById('scorePill');
  if(scoreEl && s != null){
    scoreEl.textContent = 'Fiyat/Performans Skoru: ' + s;
    scoreEl.style.background = pdScoreColor(s) + '22';
    scoreEl.style.color = pdScoreColor(s);
    scoreEl.style.display = 'inline-block';
  }

  const hist = (await loadRealPriceHistory(PRODUCT_ID)) || generatePriceHistory(p);
  const canvas = document.getElementById('priceChart');
  const chartNote = document.getElementById('chartNote');
  if(chartNote){
    chartNote.textContent = hist && hist.isReal
      ? 'Gerçek, haftalık kaydedilen fiyat verisine dayanır.'
      : 'Fiyat geçmişi temsilidir (simüle edilmiştir); henüz yeterli gerçek veri birikmedi.';
  }
  if(hist && canvas && window.Chart){
    const color = colorFor(p.cat);
    const ctx = canvas.getContext('2d');
    pdChart = new Chart(ctx, {
      type: 'line',
      data: { labels: hist.labels, datasets: [{ label: `Fiyat (${hist.currency})`, data: hist.data, borderColor: color, backgroundColor: color + '22', fill: true, tension: .3, pointRadius: 2 }] },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: v => hist.currency + v, font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
      }
    });
  }

  // Artı / eksi kutusu — kategori ortalamasına göre veriden hesaplanır
  const catProducts = products.filter(x => x.cat === p.cat);
  const { pros, cons } = prosConsFor(p, catProducts);
  const pcEl = document.getElementById('prosConsBox');
  if(pcEl && (pros.length || cons.length)){
    pcEl.innerHTML = `<div class="proscons">
      <div class="col pros"><h4>Artılar</h4><ul>${pros.length ? pros.map(x=>`<li>${x}</li>`).join('') : '<li>Belirgin bir öne çıkan yön yok</li>'}</ul></div>
      <div class="col cons"><h4>Eksiler</h4><ul>${cons.length ? cons.map(x=>`<li>${x}</li>`).join('') : '<li>Belirgin bir zayıf yön yok</li>'}</ul></div>
    </div>`;
  }

  // Benzer ürünler kutucuklarındaki görüntülenme sayılarını canlandır
  document.querySelectorAll('.similar-card[data-id]').forEach(async el => {
    const id = el.getAttribute('data-id');
    const v = await getViews(id);
    const sEl = el.querySelector('.v');
    if(sEl) sEl.textContent = v ? v + ' görüntülenme' : '';
  });

  await initRatings(p);
}

// ---- Puan / yorum sistemi ----
function pdStarsHTML(avg){
  const rounded = Math.round(avg);
  let out = '';
  for(let i=1;i<=5;i++) out += i<=rounded ? '★' : '☆';
  return out;
}

async function initRatings(p){
  const box = document.getElementById('ratingsBox');
  if(!box) return;

  async function refresh(){
    const list = await getRatings(p.id);
    const { avg, count } = ratingSummary(list);
    const summaryHTML = count
      ? `<div class="ratings-summary"><span class="stars">${pdStarsHTML(avg)}</span> ${avg} / 5 · ${count} değerlendirme</div>`
      : `<div class="ratings-summary">Henüz değerlendirme yok — ilk yorumu sen yaz.</div>`;
    const listHTML = list.slice().reverse().slice(0,20).map(r => `
      <div class="review-item">
        <div class="meta"><span class="stars">${pdStarsHTML(r.stars)}</span> — ${r.name || 'Anonim'}</div>
        ${r.comment ? `<div class="txt">${r.comment.replace(/</g,'&lt;')}</div>` : ''}
      </div>`).join('');

    box.innerHTML = `
      <h2 style="font-size:15px;margin:22px 0 6px;">Kullanıcı değerlendirmeleri</h2>
      <p style="font-size:11px;color:var(--ink-soft);margin:-4px 0 10px;">Yorumlar yayınlanmadan önce incelenir.</p>
      ${summaryHTML}
      <div class="rating-form">
        <div class="star-input" id="starInput">${[1,2,3,4,5].map(i=>`<span data-v="${i}">★</span>`).join('')}</div>
        <input type="text" id="reviewName" placeholder="Adın (isteğe bağlı)" maxlength="40" />
        <textarea id="reviewText" rows="3" placeholder="Bu ürün hakkında düşüncen (isteğe bağlı)" maxlength="400"></textarea>
        <button class="btn btn-dark" id="submitReview" type="button">Değerlendirmeyi Gönder</button>
      </div>
      <div id="reviewList">${listHTML}</div>
    `;

    let chosenStars = 0;
    const starInput = document.getElementById('starInput');
    starInput.querySelectorAll('span').forEach(sp => {
      sp.addEventListener('click', () => {
        chosenStars = parseInt(sp.getAttribute('data-v'));
        starInput.querySelectorAll('span').forEach(s2 => s2.classList.toggle('active', parseInt(s2.getAttribute('data-v')) <= chosenStars));
      });
    });

    document.getElementById('submitReview').addEventListener('click', async () => {
      if(!chosenStars){ alert('Lütfen yıldız puanı seç.'); return; }
      const name = document.getElementById('reviewName').value.trim();
      const text = document.getElementById('reviewText').value.trim();
      await addRating(p.id, chosenStars, name, text);
      await refresh();
      alert('Teşekkürler! Yorumun incelendikten sonra yayınlanacak.');
    });
  }

  await refresh();
}

document.addEventListener('DOMContentLoaded', initProductPage);
document.addEventListener('DOMContentLoaded', () => renderCookieBanner('../gizlilik-politikasi.html'));
