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

// Faz 14: fiyat aralığı + marka filtreleri. HTML'deki #priceMinInput,
// #priceMaxInput, #brandFilterChips, applyPriceFilter()/clearAllFilters()
// onclick'leri zaten vardı ama arkalarında hiçbir implementasyon yoktu
// (çağrıldıklarında sessizce "function is not defined" hatası veriyorlardı) —
// burada gerçek işlevleri eklendi.
let priceMin = null;
let priceMax = null;
let activeBrands = new Set();

// Faz 14: kart/tablo görünüm anahtarı. Tablo, aynı filtrelenmiş/sıralanmış
// veriyi (mevcut sortSelect + fiyat/marka filtreleri) tablo halinde gösterir —
// ayrı bir sıralama/filtre motoru YOK, tek kaynak (`render()`daki `base`)
// korunuyor.
let viewMode = 'grid';

async function init(){
  // 2 Ekim 2026: HER adım kendi try/catch'inde, veri yükleme adımları da
  // dahil. Hosting WAF'ı bu sayfanın bağımlı scriptlerinden birini (shared.js,
  // product-filter.js, ...) ara sıra kesiyor; kesinti NEREYE denk gelirse
  // gelsin (brandFor, cardHTML, computeScores, getFavorites — hangisi
  // tanımsız kalırsa), o fonksiyonu çağıran adım artık SADECE kendini
  // durduruyor, diğer BAĞIMSIZ adımlar yine de çalışıyor. Önceden TEK bir
  // yakalanmamış hata init()'in TAMAMINI durduruyordu.
  try{ products = await loadSharedProducts(); }catch(e){ console.error('loadSharedProducts() başarısız:', e); products = products || []; }
  try{ scores = computeScores(products); }catch(e){ console.error('computeScores() başarısız:', e); scores = scores || {}; }
  try{ favorites = await getFavorites(); }catch(e){ console.error('getFavorites() başarısız:', e); favorites = favorites || []; }
  try{ handleShareLinkFromURL(); }catch(e){ console.error('handleShareLinkFromURL() başarısız:', e); }
  try{ renderCatNav(); }catch(e){ console.error('renderCatNav() başarısız:', e); }
  try{ renderBrandChips(); }catch(e){ console.error('renderBrandChips() başarısız:', e); }
  try{ injectViewToggle(); }catch(e){ console.error('injectViewToggle() başarısız:', e); }
  try{ injectFinder(); }catch(e){ console.error('injectFinder() başarısız:', e); }
  try{ render(); }catch(e){ console.error('render() başarısız:', e); }
  try{ renderRecentlyViewedInto('recentlyViewedStrip', products, null); }catch(e){ console.error('renderRecentlyViewedInto() başarısız:', e); }
}

// ============================================================
// Faz 14: Ürün Bulucu (mini anket). index.html'deki "Bana Uygun Ürünü Bul"
// akışıyla AYNI mantık (bütçe terzili + öncelik sıralaması) — kategori
// sayfasında kategori zaten sabit olduğu için 1. adım (kategori seçimi)
// atlanıyor, doğrudan bütçe sorusuyla başlıyor. Önceden kategori
// sayfalarındaki "Bulucu" linki kullanıcıyı index.html'e yönlendirip
// kategori bağlamını kaybettiriyordu (index.html?finder=1 kategori
// bilgisi taşımıyordu) — artık sayfadan hiç çıkmadan, doğrudan bu
// kategorinin ürünleri arasında çalışıyor.
// ============================================================
let finderState = { budget: null, priority: null };

function injectFinder(){
  if(document.getElementById('finderOverlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'finder-overlay';
  overlay.id = 'finderOverlay';
  overlay.innerHTML = `
  <div class="finder-box">
    <div class="modal-head" style="margin-bottom:10px;">
      <h3>${CATEGORY_FIXED} — Bana Uygun Ürünü Bul</h3>
      <button class="modal-close" onclick="closeFinder()">×</button>
    </div>
    <div class="finder-step active" data-step="2">
      <p style="font-size:13.5px;color:var(--ink-soft);margin-bottom:14px;">Bütçen nasıl?</p>
      <button class="finder-opt" onclick="finderSetBudget('low')">Uygun fiyatlı — bütçe öncelikli</button>
      <button class="finder-opt" onclick="finderSetBudget('mid')">Orta seviye — dengeli</button>
      <button class="finder-opt" onclick="finderSetBudget('high')">Bütçe önemli değil — en iyisi</button>
    </div>
    <div class="finder-step" data-step="3">
      <p style="font-size:13.5px;color:var(--ink-soft);margin-bottom:14px;">Senin için en önemlisi ne?</p>
      <button class="finder-opt" onclick="finderSetPriority('score')">Genel fiyat/performans</button>
      <button class="finder-opt" onclick="finderSetPriority('new')">En güncel model</button>
      <button class="finder-opt" onclick="finderSetPriority('popular')">En çok tercih edilen</button>
    </div>
    <div class="finder-step" data-step="4">
      <p style="font-size:13.5px;color:var(--ink-soft);margin-bottom:14px;">Sana en uygun olanlar:</p>
      <div id="finderResults"></div>
      <button class="btn btn-outline" style="margin-top:6px;" onclick="resetFinder()">Baştan başla</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);

  // Sayfadaki mevcut "Bulucu" linkini (nav'da index.html?finder=1'e giden)
  // yakalayıp yerinde açılan bu anketle değiştir — kategori bağlamı korunur.
  document.querySelectorAll('a[href="index.html?finder=1"]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); openFinder(); });
  });
}

function openFinder(){
  finderState = { budget: null, priority: null };
  goToFinderStep(2);
  document.getElementById('finderOverlay').classList.add('open');
}
function closeFinder(){
  document.getElementById('finderOverlay').classList.remove('open');
}
function resetFinder(){ openFinder(); }

function goToFinderStep(n){
  document.querySelectorAll('.finder-step').forEach(el => el.classList.toggle('active', el.getAttribute('data-step') == n));
}

function finderSetBudget(b){ finderState.budget = b; goToFinderStep(3); }

async function finderSetPriority(p){
  finderState.priority = p;
  goToFinderStep(4);

  let pool = categoryProducts();

  if(finderState.budget && pool.length >= 3){
    const withPrice = pool.map(prod => ({ p: prod, val: parsePrice(prod) }))
      .filter(x => x.val != null).sort((a,b) => a.val - b.val);
    if(withPrice.length >= 3){
      const third = Math.ceil(withPrice.length/3);
      let slice;
      if(finderState.budget === 'low') slice = withPrice.slice(0, third);
      else if(finderState.budget === 'high') slice = withPrice.slice(-third);
      else slice = withPrice.slice(third, withPrice.length-third).length ? withPrice.slice(third, withPrice.length-third) : withPrice;
      pool = slice.map(x => x.p);
    }
  }

  let sorted;
  if(finderState.priority === 'new'){
    sorted = [...pool].sort((a,b) => new Date(b.addedAt)-new Date(a.addedAt));
  } else if(finderState.priority === 'popular'){
    const counts = await getAllViewCounts(pool);
    sorted = [...pool].sort((a,b) => (counts[b.id]||0)-(counts[a.id]||0));
  } else {
    sorted = [...pool].sort((a,b) => (scores[b.id]||0)-(scores[a.id]||0));
  }

  const results = sorted.slice(0,3);
  const box = document.getElementById('finderResults');
  if(!results.length){
    box.innerHTML = '<p style="font-size:13px;color:var(--ink-soft);">Bu kritere uyan ürün bulunamadı, biraz daha geniş seçim dene.</p>';
    return;
  }
  box.innerHTML = results.map(p => `
    <a class="finder-result-card" href="${productUrl(p)}">
      <div style="font-weight:700;font-size:14.5px;">${p.name}</div>
      <div style="font-size:12px;color:var(--ink-soft);margin-top:2px;">${p.cat}${scores[p.id]!=null ? ' · Skor: '+scores[p.id] : ''}</div>
    </a>`).join('');
}

function categoryProducts(){
  return products.filter(p => !p.upcoming && p.cat === CATEGORY_FIXED);
}

function renderBrandChips(){
  const el = document.getElementById('brandFilterChips');
  if(!el) return;
  const brands = [...new Set(categoryProducts().map(brandFor))].sort((a,b)=>a.localeCompare(b,'tr'));
  el.innerHTML = brands.map(b => `<button type="button" class="chip-filter${activeBrands.has(b)?' active':''}" onclick="toggleBrand('${b.replace(/'/g,"\\'")}')">${b}</button>`).join('') || '<span style="font-size:12.5px;color:var(--ink-soft);">Marka bilgisi yok</span>';
}

function toggleBrand(brand){
  if(activeBrands.has(brand)) activeBrands.delete(brand); else activeBrands.add(brand);
  currentPage = 1;
  renderBrandChips();
  render();
}

function applyPriceFilter(){
  const minV = parseFloat(document.getElementById('priceMinInput').value);
  const maxV = parseFloat(document.getElementById('priceMaxInput').value);
  priceMin = isNaN(minV) ? null : minV;
  priceMax = isNaN(maxV) ? null : maxV;
  currentPage = 1;
  render();
}

function clearAllFilters(){
  priceMin = null; priceMax = null;
  activeBrands.clear();
  favOnly = false;
  searchIds = null;
  lastSearchCriteria = null;
  currentPage = 1;
  const minEl = document.getElementById('priceMinInput'); if(minEl) minEl.value = '';
  const maxEl = document.getElementById('priceMaxInput'); if(maxEl) maxEl.value = '';
  const favBtn = document.getElementById('favToggle'); if(favBtn) favBtn.classList.remove('active');
  const searchInput = document.getElementById('searchInput'); if(searchInput) searchInput.value = '';
  const statusEl = document.getElementById('searchStatus'); if(statusEl) statusEl.innerHTML = '';
  renderBrandChips();
  render();
}

// Kart gridinin hemen üstüne "Kart / Tablo" görünüm anahtarı ve tablonun
// kendi konteynerini ekler — 7 kategori sayfasının statik HTML'i elle
// DEĞİŞTİRİLMEDEN (her sayfada birebir aynı olduğu için tek noktadan,
// JS'ten) enjekte edilir.
function injectViewToggle(){
  const grid = document.getElementById('mainGrid');
  if(!grid || document.getElementById('viewToggle')) return;
  const toggle = document.createElement('div');
  toggle.id = 'viewToggle';
  toggle.style.cssText = 'display:flex;gap:6px;margin:10px 0;';
  toggle.innerHTML = `
    <button type="button" class="btn btn-outline btn-sm active" id="viewToggleGrid" onclick="setViewMode('grid')">▦ Kart</button>
    <button type="button" class="btn btn-outline btn-sm" id="viewToggleTable" onclick="setViewMode('table')">☰ Tablo</button>
  `;
  grid.parentNode.insertBefore(toggle, grid);
  const tableWrap = document.createElement('div');
  tableWrap.id = 'tableView';
  tableWrap.style.display = 'none';
  tableWrap.style.overflowX = 'auto';
  grid.parentNode.insertBefore(tableWrap, grid.nextSibling);
}

function setViewMode(mode){
  viewMode = mode;
  document.getElementById('viewToggleGrid').classList.toggle('active', mode==='grid');
  document.getElementById('viewToggleTable').classList.toggle('active', mode==='table');
  document.getElementById('mainGrid').style.display = mode==='grid' ? '' : 'none';
  document.getElementById('tableView').style.display = mode==='table' ? '' : 'none';
  render();
}

// Tablodaki tüm ürünlerin spec sütunlarının birleşimini değil, kategori
// genelinde en yaygın (en çok üründe dolu) ilk birkaç spec'i seçer — aksi
// halde tablo çok geniş/boş hücre dolu olurdu.
function topSpecKeys(list, n){
  const counts = {};
  list.forEach(p => Object.keys(p.specs||{}).forEach(k => {
    if(/fiyat/i.test(k)) return;
    counts[k] = (counts[k]||0) + 1;
  }));
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,n).map(x=>x[0]);
}

function renderTable(list){
  const el = document.getElementById('tableView');
  if(!el) return;
  if(!list.length){ el.innerHTML = ''; return; }
  const specKeys = topSpecKeys(list, 3);
  const rows = list.map(p => {
    const price = parsePrice(p);
    return `<tr onclick="openDetail('${p.id}')" style="cursor:pointer;">
      <td style="padding:8px 10px 8px 0;font-weight:600;">${p.name}</td>
      <td style="padding:8px 10px;font-family:'IBM Plex Mono',monospace;white-space:nowrap;">${price ? price.toLocaleString('tr-TR')+' ₺' : '—'}</td>
      <td style="padding:8px 10px;font-family:'IBM Plex Mono',monospace;color:${scoreColor(scores[p.id]||0)};">${scores[p.id] ?? '—'}</td>
      ${specKeys.map(k => `<td style="padding:8px 10px;font-size:12.5px;color:var(--ink-soft);">${(p.specs||{})[k] ?? '—'}</td>`).join('')}
    </tr>`;
  }).join('');
  el.innerHTML = `<table class="detail-specs-table" style="width:100%;min-width:520px;">
    <thead><tr style="text-align:left;border-bottom:1.5px solid var(--line-strong);">
      <th style="padding:8px 10px 8px 0;">Ürün</th>
      <th style="padding:8px 10px;">Fiyat</th>
      <th style="padding:8px 10px;">Skor</th>
      ${specKeys.map(k => `<th style="padding:8px 10px;">${k}</th>`).join('')}
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
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
  if(priceMin != null) base = base.filter(p => { const v = parsePrice(p); return v != null && v >= priceMin; });
  if(priceMax != null) base = base.filter(p => { const v = parsePrice(p); return v != null && v <= priceMax; });
  if(activeBrands.size) base = base.filter(p => activeBrands.has(brandFor(p)));

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

  if(viewMode === 'table') renderTable(pageItems);

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

  const allKeys = [...new Set(list.flatMap(p=>Object.keys(p.specs||{})))].filter(key => list.some(p => !specValueMissing(p.specs[key])));
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
      return `<div class="cmp-seg" style="flex:${pct};background:${colorMap[p.id]};opacity:${!specValueMissing(raw)?0.35+0.65*pct/100:0.15}"></div>`;
    }).join('');
    const vals = list.map(p=>`<span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--ink-soft);margin-right:14px;">${specValueMissing(p.specs[key]) ? '—' : p.specs[key]}</span>`).join('');
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
  const specRows = Object.entries(p.specs||{}).filter(([,v])=>!specValueMissing(v)).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');

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
      <div class="chart-note" id="chartNote">Fiyat geçmişi temsilidir (simüle edilmiştir); gerçek bir tarihsel fiyat veri kaynağına dayanmaz.</div>
    </div>
    <h4 style="font-size:14px;margin-bottom:4px;">Bunlara da bak</h4>
    <div class="similar-row">
      ${similar.map(x=>`<div class="similar-card" onclick="openDetail('${x.id}')"><div class="n">${x.name}</div><div class="s">Skor: ${scores[x.id]??'—'}</div></div>`).join('') || '<p style="font-size:12.5px;color:var(--ink-soft);">Bu kategoride başka ürün yok.</p>'}
    </div>
  `;
  document.getElementById('detailOverlay').classList.add('show');
  render();

  const hist = await getPriceHistory(p);
  if(detailChart){ detailChart.destroy(); detailChart = null; }
  const noteEl = document.getElementById('chartNote');
  if(noteEl && hist){
    noteEl.textContent = hist.isReal
      ? 'Gerçek fiyat geçmişi — TeknoVersus tarafından haftalık kaydedilen fiyat verisine dayanır.'
      : 'Fiyat geçmişi temsilidir (simüle edilmiştir); gerçek bir tarihsel fiyat veri kaynağına dayanmaz.';
  }
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

// 28 Eylül 2026: init() çağrısı artık BURADA değil, bu dosyayı yükleyen HTML
// sayfasının kendi inline <script>'inde (category.js'ten SONRA) yapılıyor —
// bkz. o script'teki bütünlük kontrolü. Neden: hosting WAF'ı bu dosyanın
// kendisini ara sıra keserse, kontrol kodu da BU dosyanın içinde olsaydı o da
// hiç çalışmazdı. Kontrol kodunun ayrı bir kaynakta (HTML'in kendi inline
// script'i) olması, category.js kesilse bile devreye girebilmesini sağlıyor.
if(typeof window !== 'undefined'){
  window.__tvLoaded = window.__tvLoaded || {};
  window.__tvLoaded.category = true;
}
