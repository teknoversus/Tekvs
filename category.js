// ============================================================
// TeknoVersus — tek kategori sayfası motoru
// Her kategori sayfası (telefon.html, dizustu.html, ...) bu dosyayı
// shared.js'den SONRA yükler ve öncesinde şu değişkeni tanımlar:
//   const CATEGORY_FIXED = 'Telefon';
// ============================================================

const SLUG_MAP = {
  'Telefon':'telefon', 'Dizüstü':'dizustu', 'Kulaklık':'kulaklik',
  'Kamera':'kamera', 'Akıllı Saat':'akilli-saat', 'Tablet':'tablet',
  'Televizyon':'televizyon'
};

let products = [];
let scores = {};
let favorites = [];
let viewCounts = {};
let selected = new Set();
let favOnly = false;
let sortMode = 'date_desc';
let searchIds = null;
let detailChart = null;
let priceMin = null;
let priceMax = null;
let brandFilter = new Set(); // boşsa tüm markalar gösterilir

async function init(){
  products = await loadSharedProducts();
  scores = computeScores(products);
  favorites = await getFavorites();
  handleShareLinkFromURL();
  renderCatNav();
  renderBrandFilterChips();
  renderSearchSuggestions();
  render();
  renderRecentlyViewedInto('recentlyViewedStrip', products, null);
}

function renderSearchSuggestions(){
  const el = document.getElementById('productSuggestions');
  if(!el) return;
  const catProducts = products.filter(p => !p.upcoming && p.cat === CATEGORY_FIXED);
  el.innerHTML = catProducts.map(p => `<option value="${p.name.replace(/"/g,'&quot;')}"></option>`).join('');
}

function renderCatNav(){
  const el = document.getElementById('catChipsNav');
  if(!el) return;
  const all = `<a class="chip-filter" href="index.html#katalog">Tümü</a>`;
  const rest = CATS.map(c => `<a class="chip-filter ${c===CATEGORY_FIXED?'active':''}" href="${SLUG_MAP[c]}.html">${c}</a>`).join('');
  el.innerHTML = all + rest;
}

async function runSmartSearch(){
  const q = document.getElementById('searchInput').value.trim();
  const statusEl = document.getElementById('searchStatus');
  if(!q){ searchIds = null; statusEl.innerHTML = ''; render(); return; }

  statusEl.innerHTML = 'Yapay zekâ kataloğu tarıyor…';
  const catalogForAI = products.filter(p=>!p.upcoming && p.cat===CATEGORY_FIXED).map(p => ({id:p.id, name:p.name, blurb:p.blurb, specs:p.specs}));

  try{
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Aşağıda "${CATEGORY_FIXED}" kategorisine ait bir ürün kataloğu JSON olarak verilmiştir. Kullanıcının doğal dilde yazdığı arama isteğine en uygun ürünleri, en alakalıdan en az alakalıya doğru sıralayarak SADECE ürün id'lerinden oluşan geçerli bir JSON dizisi olarak döndür. Başka hiçbir açıklama, markdown ya da ek metin ekleme. Örnek çıktı formatı: ["s2","h3"]\n\nKullanıcının isteği: "${q}"\n\nKatalog:\n${JSON.stringify(catalogForAI)}`
        }]
      })
    });
    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const ids = JSON.parse(clean);
    if(Array.isArray(ids) && ids.length){
      searchIds = ids;
      statusEl.innerHTML = `"${q}" için yapay zekâ ${ids.length} sonuç buldu. <button onclick="clearSmartSearch()">Aramayı temizle</button>`;
    } else { throw new Error('boş sonuç'); }
  }catch(e){
    const kw = q.toLowerCase();
    const matches = products.filter(p => !p.upcoming && p.cat===CATEGORY_FIXED && (
      p.name.toLowerCase().includes(kw) ||
      (p.blurb||'').toLowerCase().includes(kw) ||
      Object.entries(p.specs||{}).some(([k,v]) => (k+' '+v).toLowerCase().includes(kw))
    ));
    searchIds = matches.map(p=>p.id);
    if(searchIds.length){
      statusEl.innerHTML = `Yapay zekâ aramasına şu an ulaşılamadı, basit kelime aramasıyla ${searchIds.length} sonuç bulundu. <button onclick="clearSmartSearch()">Aramayı temizle</button>`;
    } else {
      logMissedSearch(q);
      const suggestions = products.filter(p => !p.upcoming && p.cat===CATEGORY_FIXED)
        .sort((a,b) => (scores[b.id]||0) - (scores[a.id]||0)).slice(0,4);
      searchIds = suggestions.map(p=>p.id);
      statusEl.innerHTML = suggestions.length
        ? `"${q}" için tam eşleşme yok — bu kategoride bunlara göz atabilirsin: <button onclick="clearSmartSearch()">Aramayı temizle</button>`
        : `Sonuç bulunamadı. <button onclick="clearSmartSearch()">Aramayı temizle</button>`;
    }
  }
  render();
}

function clearSmartSearch(){
  searchIds = null;
  document.getElementById('searchInput').value = '';
  document.getElementById('searchStatus').innerHTML = '';
  render();
}

function onSortChange(){ sortMode = document.getElementById('sortSelect').value; render(); }

function toggleFavOnly(){
  favOnly = !favOnly;
  document.getElementById('favToggle').classList.toggle('active', favOnly);
  render();
}

function parsePrice(p){
  const specs = p.specs || {};
  const key = Object.keys(specs).find(k=>/fiyat/i.test(k));
  if(!key) return null;
  const n = parseFloat((specs[key]||'').toString().replace(/[^\d.,]/g,'').replace(',','.'));
  return isNaN(n) ? null : n;
}

function sortProducts(list){
  const arr = [...list];
  switch(sortMode){
    case 'date_desc': return arr.sort((a,b)=> new Date(b.addedAt)-new Date(a.addedAt));
    case 'date_asc': return arr.sort((a,b)=> new Date(a.addedAt)-new Date(b.addedAt));
    case 'price_asc': return arr.sort((a,b)=> (parsePrice(a)??Infinity) - (parsePrice(b)??Infinity));
    case 'price_desc': return arr.sort((a,b)=> (parsePrice(b)??-Infinity) - (parsePrice(a)??-Infinity));
    case 'views_desc': return arr.sort((a,b)=> (viewCounts[b.id]||0) - (viewCounts[a.id]||0));
    case 'score_desc':
    default: return arr.sort((a,b)=> (scores[b.id]||0) - (scores[a.id]||0));
  }
}

function scoreColor(s){
  if(s>=70) return 'var(--good)';
  if(s>=40) return 'var(--mid)';
  return 'var(--bad)';
}

function heartIcon(filled){
  return filled
    ? `<svg viewBox="0 0 24 24" fill="#B23A5C"><path d="M12 21s-7.2-4.6-10-9.1C.4 8.6 1.8 5 5.4 4.2 7.7 3.7 10 4.8 12 7c2-2.2 4.3-3.3 6.6-2.8C22.2 5 23.6 8.6 22 11.9 19.2 16.4 12 21 12 21z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="#5B6B60" stroke-width="1.6"><path d="M12 21s-7.2-4.6-10-9.1C.4 8.6 1.8 5 5.4 4.2 7.7 3.7 10 4.8 12 7c2-2.2 4.3-3.3 6.6-2.8C22.2 5 23.6 8.6 22 11.9 19.2 16.4 12 21 12 21z"/></svg>`;
}

function cardHTML(p){
  const color = colorFor(p.cat);
  const specEntries = Object.entries(p.specs || {}).slice(0,4);
  const isFav = favorites.includes(p.id);
  const s = scores[p.id];
  return `
  <div class="card" onclick="openDetail('${p.id}')">
    <button class="fav-btn" onclick="event.stopPropagation(); toggleFavorite('${p.id}')" title="Favorilere ekle">${heartIcon(isFav)}</button>
    <div class="card-icon" style="background:${color}22;color:${color};">
      <svg width="24" height="24" viewBox="0 0 24 24">${ICONS[p.cat]||''}</svg>
    </div>
    <div class="card-cat">${p.cat} · Çıkış: ${fmtDate(p.addedAt)}</div>
    <a class="card-name" href="${productUrl(p)}" onclick="event.stopPropagation()">${p.name}</a>
    ${s!=null ? `<span class="score-pill" style="background:${scoreColor(s)}22;color:${scoreColor(s)};">Skor: ${s}</span>` : ''}
    <div class="card-blurb">${p.blurb||''}</div>
    <div class="card-specs">${specEntries.map(([k,v])=>`<span class="spec-pill">${k}: ${v}</span>`).join('')}</div>
    <div class="card-foot">
      <label class="compare-check" onclick="event.stopPropagation()">
        <input type="checkbox" ${selected.has(p.id)?'checked':''} onchange="toggleSelect('${p.id}')" />
        Karşılaştır
      </label>
      <span class="view-count">${viewCounts[p.id] ? viewCounts[p.id]+' görüntülenme' : ''}</span>
      <a class="buy-link" href="${affiliateLink(p)}" target="_blank" rel="noopener noreferrer sponsored" onclick="event.stopPropagation()">Satın Al →</a>
    </div>
  </div>`;
}

function render(){
  let base = products.filter(p => !p.upcoming && p.cat === CATEGORY_FIXED);
  if(searchIds){
    const rankMap = new Map(searchIds.map((id,i)=>[id,i]));
    base = base.filter(p=>rankMap.has(p.id)).sort((a,b)=> rankMap.get(a.id)-rankMap.get(b.id));
  } else {
    base = sortProducts(base);
  }
  if(favOnly) base = base.filter(p => favorites.includes(p.id));
  if(priceMin != null || priceMax != null){
    base = base.filter(p => {
      const price = parsePrice(p);
      if(price == null) return true; // fiyatı bilinmeyen ürünü filtre dışı bırakma
      if(priceMin != null && price < priceMin) return false;
      if(priceMax != null && price > priceMax) return false;
      return true;
    });
  }
  if(brandFilter.size > 0){
    base = base.filter(p => brandFilter.has(brandOf(p)));
  }

  document.getElementById('mainGrid').innerHTML = base.length
    ? base.map(p=>cardHTML(p)).join('')
    : '<p style="color:var(--ink-soft);font-size:14px;">Bu aramaya veya filtreye uygun ürün bulunamadı.</p>';

  updateCompareBar();
}

// Marka adını ürün adının ilk kelimesinden çıkarır (generate-brand-pages.js
// ile aynı mantık — tutarlılık için).
const BRAND_FOLD = { 'MacBook':'Apple','iPhone':'Apple','AirPods':'Apple','iPad':'Apple','General':'General Mobile' };
function brandOf(p){ const first = p.name.split(' ')[0]; return BRAND_FOLD[first] || first; }

function renderBrandFilterChips(){
  const el = document.getElementById('brandFilterChips');
  if(!el) return;
  const catProducts = products.filter(p => !p.upcoming && p.cat === CATEGORY_FIXED);
  const brandCounts = {};
  catProducts.forEach(p => { const b = brandOf(p); brandCounts[b] = (brandCounts[b]||0)+1; });
  const brands = Object.keys(brandCounts).sort((a,b) => brandCounts[b]-brandCounts[a]);
  el.innerHTML = brands.map(b => `<label style="display:inline-flex;align-items:center;gap:4px;margin:0 10px 6px 0;font-size:12.5px;cursor:pointer;">
    <input type="checkbox" onchange="toggleBrandFilter('${b.replace(/'/g,"\\'")}')" ${brandFilter.has(b)?'checked':''} /> ${b} (${brandCounts[b]})
  </label>`).join('');
}

function toggleBrandFilter(brand){
  if(brandFilter.has(brand)) brandFilter.delete(brand);
  else brandFilter.add(brand);
  render();
}

function applyPriceFilter(){
  const minVal = document.getElementById('priceMinInput').value;
  const maxVal = document.getElementById('priceMaxInput').value;
  priceMin = minVal ? parseFloat(minVal) : null;
  priceMax = maxVal ? parseFloat(maxVal) : null;
  render();
}

function clearAllFilters(){
  priceMin = null; priceMax = null; brandFilter.clear();
  const minEl = document.getElementById('priceMinInput'); if(minEl) minEl.value = '';
  const maxEl = document.getElementById('priceMaxInput'); if(maxEl) maxEl.value = '';
  renderBrandFilterChips();
  render();
}

async function toggleFavorite(id){
  if(favorites.includes(id)) favorites = favorites.filter(x=>x!==id);
  else favorites.push(id);
  render();
  await saveFavorites(favorites);
}

function toggleSelect(id){
  if(selected.has(id)){
    selected.delete(id);
  } else {
    const p = products.find(x=>x.id===id);
    if(selected.size>0 && p){
      const firstP = products.find(x=>x.id===[...selected][0]);
      if(firstP && firstP.cat !== p.cat){
        showToast(`Sadece aynı kategorideki ürünler karşılaştırılabilir — önce "${firstP.cat}" seçimini temizle.`);
        render();
        return;
      }
    }
    selected.add(id);
  }
  updateCompareBar();
  render();
}
function clearCompare(){ selected.clear(); render(); }
function updateCompareBar(){
  const bar = document.getElementById('compareBar');
  if(selected.size>0){ bar.classList.add('show'); document.getElementById('compareCount').textContent = selected.size+' ürün seçildi'; }
  else bar.classList.remove('show');
}

function handleShareLinkFromURL(){
  const params = new URLSearchParams(location.search);
  const cmp = params.get('compare');
  if(cmp){
    cmp.split(',').filter(Boolean).forEach(id=>selected.add(id));
    if(selected.size>=2) setTimeout(openCompare, 200);
  }
}
function copyCompareLink(){
  const ids = [...selected].join(',');
  const url = `${location.origin}${location.pathname}?compare=${encodeURIComponent(ids)}`;
  navigator.clipboard.writeText(url).then(()=> showToast('Karşılaştırma linki kopyalandı'))
    .catch(()=> showToast('Link kopyalanamadı, tarayıcı izin vermiyor olabilir'));
}
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

function openCompare(){
  const list = products.filter(p=>selected.has(p.id));
  if(list.length<2){ alert('Karşılaştırmak için en az 2 ürün seç.'); return; }

  const cats = [...new Set(list.map(p=>p.cat))];
  if(cats.length>1){
    showToast('Farklı kategorideki ürünler karşılaştırılamaz — lütfen sadece tek bir kategoriden ürün seç.');
    selected = new Set(list.filter(p=>p.cat===cats[0]).map(p=>p.id));
    updateCompareBar();
    render();
    return;
  }

  const palette = getPalette();
  const colorMap = {};
  list.forEach((p,i)=> colorMap[p.id] = palette[i % palette.length]);

  const legend = document.getElementById('cmpLegend');
  legend.innerHTML = list.map(p=>`<span><span class="dot" style="background:${colorMap[p.id]}"></span>${p.name}</span>`).join('');

  // En yüksek fiyat/performans skoruna sahip ürünü öne çıkar
  const winnerBox = document.getElementById('cmpWinner');
  const scored = list.filter(p => scores[p.id] != null);
  if(scored.length >= 2){
    const winner = scored.reduce((best,p) => (scores[p.id] > scores[best.id] ? p : best), scored[0]);
    const wColor = colorMap[winner.id];
    const sameScore = scored.filter(p => scores[p.id] === scores[winner.id]).length > 1;
    winnerBox.style.background = wColor + '14';
    winnerBox.style.border = `1px solid ${wColor}40`;
    winnerBox.innerHTML = sameScore
      ? `<span class="trophy">🏆</span><div class="txt">Bu karşılaştırmada <b>birden fazla ürün</b> aynı skora sahip — aşağıdaki tabloya göz at.<span class="note">Fiyat/performans skoruna göre</span></div>`
      : `<span class="trophy">🏆</span><div class="txt">Bu karşılaştırmada en iyisi: <b>${winner.name}</b> (Skor: ${scores[winner.id]})<span class="note">Fiyat/performans skoruna göre — kategori içi göreli hesaplamadır, mutlak bir "en iyi ürün" garantisi değildir.</span></div>`;
    winnerBox.style.display = '';
  } else {
    winnerBox.style.display = 'none';
  }

  const allKeys = [...new Set(list.flatMap(p=>Object.keys(p.specs||{})))];
  const body = document.getElementById('cmpBody');
  body.innerHTML = allKeys.map(key=>{
    const nums = list.map(p=>({id:p.id, v:parseFloat((p.specs[key]||'').toString().replace(',','.'))})).filter(x=>!isNaN(x.v));
    const lowerBetter = /fiyat|ağırlık/i.test(key);
    let min=0,max=0;
    if(nums.length){ min=Math.min(...nums.map(n=>n.v)); max=Math.max(...nums.map(n=>n.v)); }
    const segs = list.map(p=>{
      const raw = p.specs[key];
      const n = nums.find(x=>x.id===p.id);
      let pct = 8;
      if(n){ pct = max===min ? 100 : ((n.v-min)/(max-min))*100; if(lowerBetter) pct = 100-pct; pct = Math.max(pct,6); }
      return `<div class="cmp-seg" style="flex:${pct};background:${colorMap[p.id]};opacity:${raw?0.35+0.65*pct/100:0.15}"></div>`;
    }).join('');
    const vals = list.map(p=>`<span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--ink-soft);margin-right:14px;">${p.specs[key]||'—'}</span>`).join('');
    return `<div class="cmp-row"><strong style="font-size:13.5px;">${key}</strong><div style="margin:4px 0;">${vals}</div><div class="cmp-track">${segs}</div></div>`;
  }).join('');

  document.getElementById('cmpOverlay').classList.add('show');
}
function closeCompare(){ document.getElementById('cmpOverlay').classList.remove('show'); }

async function openDetail(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  const count = await incrementViews(id);
  if(count!=null) viewCounts[id] = count; else viewCounts[id] = (viewCounts[id]||0)+1;

  const color = colorFor(p.cat);
  const s = scores[id];
  const specRows = Object.entries(p.specs||{}).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');

  const similar = products.filter(x=>!x.upcoming && x.cat===p.cat && x.id!==p.id)
    .sort((a,b)=> Math.abs((scores[a.id]||0)-(s||0)) - Math.abs((scores[b.id]||0)-(s||0)))
    .slice(0,3);

  document.getElementById('detailBody').innerHTML = `
    <div class="detail-head">
      <div class="detail-icon" style="background:${color}22;color:${color};"><svg width="30" height="30" viewBox="0 0 24 24">${ICONS[p.cat]||''}</svg></div>
      <div>
        <div class="detail-meta">${p.cat} · Çıkış: ${fmtDate(p.addedAt)} · ${viewCounts[id]||0} görüntülenme</div>
        <h3 style="font-size:20px;">${p.name}</h3>
        ${s!=null ? `<span class="score-pill" style="background:${scoreColor(s)}22;color:${scoreColor(s)};margin-top:6px;">Fiyat/Performans Skoru: ${s}</span>` : ''}
      </div>
    </div>
    <p style="color:var(--ink-soft);font-size:14px;margin:12px 0;">${p.blurb||''}</p>
    <table class="detail-specs-table">${specRows}</table>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:4px;">
      <a class="btn btn-dark" style="display:inline-block;text-decoration:none;" href="${affiliateLink(p)}" target="_blank" rel="noopener noreferrer sponsored">Amazon'da Satın Al →</a>
      <a class="btn btn-outline" style="display:inline-block;text-decoration:none;" href="${productUrl(p)}">Tam sayfayı görüntüle →</a>
    </div>
    <div class="chart-wrap">
      <canvas id="priceChart" height="140"></canvas>
      <div class="chart-note">Fiyat geçmişi temsilidir (simüle edilmiştir); gerçek bir tarihsel fiyat veri kaynağına dayanmaz.</div>
    </div>
    <h4 style="font-size:14px;margin-bottom:4px;">Bunlara da bak</h4>
    <div class="similar-row">
      ${similar.map(x=>`<div class="similar-card" onclick="openDetail('${x.id}')"><div class="n">${x.name}</div><div class="s">Skor: ${scores[x.id]??'—'}</div></div>`).join('') || '<p style="font-size:12.5px;color:var(--ink-soft);">Bu kategoride başka ürün yok.</p>'}
    </div>
  `;
  document.getElementById('detailOverlay').classList.add('show');
  render();

  const hist = generatePriceHistory(p);
  if(detailChart){ detailChart.destroy(); detailChart = null; }
  if(hist && window.Chart){
    const ctx = document.getElementById('priceChart').getContext('2d');
    detailChart = new Chart(ctx, {
      type: 'line',
      data: { labels: hist.labels, datasets: [{ label: `Fiyat (${hist.currency})`, data: hist.data, borderColor: color, backgroundColor: color+'22', fill:true, tension:.3 }] },
      options: { plugins:{ legend:{ display:false } }, scales:{ y:{ ticks:{ callback:v=>hist.currency+v } } } }
    });
  }
}
function closeDetail(){
  document.getElementById('detailOverlay').classList.remove('show');
  if(detailChart){ detailChart.destroy(); detailChart = null; }
}

document.getElementById('burgerBtn').addEventListener('click', ()=> document.getElementById('navLinks').classList.toggle('open'));

init();
renderCookieBanner('gizlilik-politikasi.html');
