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
let currentPage = 1;
const PAGE_SIZE = 24;
let lastSearchCriteria = null; // Faz 6B: gerekçe motoru için, index.html ile aynı mekanizma
let detailChart = null;

async function init(){
  products = await loadSharedProducts();
  scores = computeScores(products);
  favorites = await getFavorites();
  handleShareLinkFromURL();
  renderCatNav();
  render();
  renderRecentlyViewedInto('recentlyViewedStrip', products, null);
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
  if(!q){ searchIds = null; lastSearchCriteria = null; currentPage = 1; statusEl.innerHTML = ''; render(); return; }

  // ============================================================
  // Faz 6B: index.html'deki Faz 2-6A ücretsiz/yerel mimarisiyle
  // BİREBİR AYNI akış. Eski davranış (bu dosyaya özgü) doğrudan
  // tarayıcıdan api.anthropic.com'a fetch atıyordu — CSP tarafından
  // engelleniyordu, hiç çalışmıyordu. Artık nlp-parser.js +
  // product-filter.js + performance-data.js + recommendation-reason.js
  // kullanılıyor, hiçbir ağ isteği yok.
  //
  // KATEGORİ BAĞLAMI KORUMASI: kullanıcı ne yazarsa yazsın (örn.
  // "laptop" kelimesi geçse bile), kriterin category alanı HER ZAMAN
  // bu sayfanın CATEGORY_FIXED'ine zorlanıyor — kategori sayfasının
  // bağlamı asla kırılmıyor, kategori dışı ürün hiç gösterilmiyor.
  // ============================================================
  try{
    const criteria = extractCriteriaLocally(q);
    criteria.category = CATEGORY_FIXED;
    lastSearchCriteria = criteria;
    const results = filterAndRankProducts(criteria, products, scores);
    searchIds = results.map(p => p.id);
    currentPage = 1;
    if(searchIds.length){
      statusEl.innerHTML = `"${q}" için ${searchIds.length} sonuç bulundu. <button onclick="clearSmartSearch()">Aramayı temizle</button>`;
    } else {
      logMissedSearch(q);
      statusEl.innerHTML = `Aradığınız kriterlere uygun ürün bulunamadı. <button onclick="clearSmartSearch()">Aramayı temizle</button>`;
    }
  }catch(e){
    // Ham JS/teknik hata kullanıcıya ASLA gösterilmez — temiz bir
    // mesajla, arama öncesi duruma güvenle dönülür (index.html ile
    // birebir aynı davranış, teknik hata product_requests'e yazılmaz).
    searchIds = null;
    lastSearchCriteria = null;
    currentPage = 1;
    statusEl.innerHTML = `Arama sırasında bir sorun oluştu, lütfen farklı bir ifadeyle tekrar dene. <button onclick="clearSmartSearch()">Aramayı temizle</button>`;
  }
  render();
}

function clearSmartSearch(){
  searchIds = null;
  lastSearchCriteria = null;
  currentPage = 1;
  document.getElementById('searchInput').value = '';
  document.getElementById('searchStatus').innerHTML = '';
  render();
}

function onSortChange(){ sortMode = document.getElementById('sortSelect').value; currentPage = 1; render(); }

function toggleFavOnly(){
  favOnly = !favOnly;
  currentPage = 1;
  document.getElementById('favToggle').classList.toggle('active', favOnly);
  render();
}

// parsePrice/sortProducts/scoreColor/heartIcon artık shared.js'te (Faz 13,
// 27 Eylül 2026) — index.html ile birebir aynı kopya buradaydı, tekilleştirildi.

// cardHTML() artık shared.js'te (Faz 13, 27 Eylül 2026) — index.html ile aynı,
// tek bir kart tasarımı kullanılıyor. Bu sayfadaki çağrılar akıllı arama
// gerekçelerini `{reasons}` opts nesnesiyle iletiyor.

function render(){
  let base = products.filter(p => !p.upcoming && p.cat === CATEGORY_FIXED);
  if(searchIds){
    const rankMap = new Map(searchIds.map((id,i)=>[id,i]));
    base = base.filter(p=>rankMap.has(p.id)).sort((a,b)=> rankMap.get(a.id)-rankMap.get(b.id));
  } else {
    base = sortProducts(base);
  }
  if(favOnly) base = base.filter(p => favorites.includes(p.id));

  // Faz 11C: filtrele/sırala TAMAMLANDIKTAN sonra sayfala — DOM'a hiçbir
  // zaman tüm kategori değil, sadece aktif sayfanın PAGE_SIZE kadar
  // ürünü yazılır (önceki davranış: 200+ ürün aynı anda DOM'daydı).
  const totalPages = Math.max(1, Math.ceil(base.length / PAGE_SIZE));
  if(currentPage > totalPages) currentPage = totalPages;
  if(currentPage < 1) currentPage = 1;
  const pageItems = base.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

  document.getElementById('mainGrid').innerHTML = pageItems.length
    ? pageItems.map(p => cardHTML(
        p,
        // Faz 6B: gerekçeler SADECE akıllı arama sonuçlarında (index.html
        // ile birebir aynı mantık) — normal kategori gezinmesinde hiç
        // hesaplanmaz, mevcut görünüm korunur.
        { reasons: searchIds ? generateRecommendationReasons(p, lastSearchCriteria, scores[p.id]) : null }
      )).join('')
    : '<p style="color:var(--ink-soft);font-size:14px;">Bu aramaya veya filtreye uygun ürün bulunamadı.</p>';

  renderPagination(totalPages, base.length);
  updateCompareBar();
}

function renderPagination(totalPages, totalCount){
  const el = document.getElementById('paginationBox');
  if(!el) return;
  if(totalPages <= 1){ el.innerHTML = ''; return; }

  function pageBtn(n){
    return `<button class="page-btn${n===currentPage?' active':''}" onclick="goToPage(${n})" ${n===currentPage?'aria-current="page"':''}>${n}</button>`;
  }
  // 50+ sayfa olabileceği için numaraları kısalt: 1 2 3 … 8 9
  let nums = [];
  const windowSize = 1;
  for(let i=1;i<=totalPages;i++){
    if(i===1 || i===totalPages || Math.abs(i-currentPage)<=windowSize) nums.push(i);
    else if(nums[nums.length-1] !== '…') nums.push('…');
  }
  const numsHTML = nums.map(n => n==='…' ? `<span class="page-ellipsis">…</span>` : pageBtn(n)).join('');

  el.innerHTML = `
    <button class="page-btn page-nav" onclick="goToPage(${currentPage-1})" ${currentPage<=1?'disabled':''} aria-label="Önceki sayfa">‹ Önceki</button>
    ${numsHTML}
    <button class="page-btn page-nav" onclick="goToPage(${currentPage+1})" ${currentPage>=totalPages?'disabled':''} aria-label="Sonraki sayfa">Sonraki ›</button>
  `;
}

function goToPage(n){
  if(n < 1 || n === currentPage) return;
  currentPage = n;
  render();
  const grid = document.getElementById('mainGrid');
  if(grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
