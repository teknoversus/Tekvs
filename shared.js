// ============================================================
// TeknoVersus — ortak veri ve yardımcı fonksiyonlar
// Bu dosya hem index.html hem de admin.html tarafından <script src="shared.js">
// ile paylaşılır. Ürün verisi, depolama yardımcıları, skor hesaplama ve
// basit yardımcı fonksiyonlar burada tanımlanır.
//
// 3 Ekim 2026 kök neden notu: canlıdaki shared.js, 28 Eylül'deki deploy'dan
// (commit 8151290) sonra FTP yüklemesi sırasında YARIM kalmış (41198 byte
// yerine 31784 byte) ve bu dosya o tarihten beri git'te değişmediği için
// FTP-Deploy-Action'ın fark tabanlı senkronu onu BİR DAHA ASLA yeniden
// yüklememiş — yani "ara sıra WAF kesiyor" sorunuymuş gibi görünen durumun
// gerçek sebebi, cardHTML/brandFor gibi dosya sonuna yakın tüm tanımların
// ayLARCA canlıda tamamen eksik olmasıydı. Bu satır dosya içeriğini
// değiştirerek bir sonraki deploy'un bu dosyayı eksiksiz yeniden
// yüklemesini zorluyor; deploy.yml'e eklenen boyut kontrolü de bunun bir
// daha fark edilmeden tekrarlanmasını önlüyor.
// ============================================================

const CATS = ['Telefon','Dizüstü','Kulaklık','Kamera','Akıllı Saat','Tablet','Televizyon'];
// Haberler SADECE bu listeyi kullanır — "Teknoloji" bir ÜRÜN kategorisi değil
// (kendi kataloğu/kategori sayfası/karşılaştırması yok), sadece genel teknoloji
// haberlerini (örn. NVIDIA'nın yapay zeka platformu) sınıflandırmak için var.
// Bu yüzden CATS'e EKLENMEDİ — eklenirse ürün ekleme formunda da (fCat) seçenek
// olarak çıkardı, anasayfa/katalog kategori filtrelerine de sızardı.
const NEWS_CATS = [...CATS, 'Teknoloji'];

const ICONS = {
  'Telefon':'<rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="18.3" r="0.8" fill="currentColor"/>',
  'Dizüstü':'<rect x="3" y="4" width="18" height="12" rx="1.2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M1 19h22l-2 2H3z" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  'Kulaklık':'<path d="M4 13v-1a8 8 0 0116 0v1" stroke="currentColor" stroke-width="1.6" fill="none"/><rect x="2.5" y="13" width="4.5" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6" fill="none"/><rect x="17" y="13" width="4.5" height="7" rx="1.4" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  'Kamera':'<rect x="2" y="7" width="20" height="13" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="13.5" r="4" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M8 7l1.5-3h5L16 7" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  'Akıllı Saat':'<rect x="7" y="6" width="10" height="12" rx="3" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M9 3h6M9 21h6" stroke="currentColor" stroke-width="1.6"/>',
  'Tablet':'<rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="19" r="0.8" fill="currentColor"/>',
  'Televizyon':'<rect x="2" y="4" width="20" height="13" rx="1.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.6"/>'
};

function logoSVG(){
  return `<svg width="26" height="26" viewBox="0 0 30 30" fill="none">
    <line x1="15" y1="3" x2="15" y2="24" stroke="#1B211D" stroke-width="2"/>
    <line x1="4" y1="8" x2="26" y2="8" stroke="#1B211D" stroke-width="2"/>
    <path d="M4 8 L1 15 A4 4 0 0 0 9 15 Z" stroke="#1F7A6C" stroke-width="1.6" fill="none"/>
    <path d="M26 8 L23 15 A4 4 0 0 0 31 15 Z" stroke="#B23A5C" stroke-width="1.6" fill="none"/>
    <rect x="10" y="24" width="10" height="2.4" rx="1" fill="#1B211D"/>
  </svg>`;
}

// Gerçek ürünler. 2025-2026 modelleri: güncel çıkış tarihi ve Türkiye'deki en düşük piyasa fiyatı (₺).
// 2020-2024 modelleri: bilinen resmi çıkış tarihi; fiyat, bilinen orijinal ABD lansman fiyatının
// (bu modeller artık üretimde/satışta olmadığı için) GÜNCEL DÖVİZ KURUYLA TL'ye çevrilmiş temsili
// değeridir — gerçek bir ikinci el/güncel piyasa fiyatı değildir, ilgili sayfalarda bu belirtilir.
// "upcoming: true" olan ürünler henüz piyasaya çıkmamış, beklenen/duyurulmamış modellerdir; bunlar
// ana katalogda değil "Beklenenler" sekmesinde gösterilir ve skor hesaplamasına dahil edilmez.
// SEED ve NEWS_SEED artık seed-data.js'de — gerekince dinamik yüklenir (bkz. loadSeedDataIfNeeded()).

// ============================================================
// Haberler (haber/blog) örnek verisi — admin panelinden veya
// Supabase'den veri gelmezse bu liste kullanılır. Yapı products'a
// benzer: id aynı zamanda URL slug'ıdır, body paragraf dizisidir.
// ============================================================


// ============================================================
// Supabase yapılandırması
// ------------------------------------------------------------
// Ürünler, görüntülenmeler ve yorumlar artık Supabase'deki gerçek
// paylaşılan veritabanında tutulur — tüm ziyaretçiler için anlık senkron.
// Favoriler ve "son gezdiklerin" ise kişisel kalmaya devam eder (localStorage).
// ============================================================

const SUPABASE_URL = 'https://qsetmleywkhjcntajphx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_z74ZnvDgMWR7JzQDezgdqg_G_eh3e5B';

// Admin oturumu varsa (giriş yapılmışsa) onun access_token'ı ile,
// yoksa herkese açık anahtar ile istek atar.
function getAdminAccessToken(){
  try{
    const raw = localStorage.getItem('tv_admin_session');
    if(!raw) return null;
    const s = JSON.parse(raw);
    if(!s.access_token || !s.expires_at || Date.now() > s.expires_at) return null;
    return s.access_token;
  }catch(e){ return null; }
}

function sbHeaders(extra){
  return Object.assign({
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + (getAdminAccessToken() || SUPABASE_KEY),
    'Content-Type': 'application/json'
  }, extra || {});
}

async function sbFetch(path, options){
  try{
    const res = await fetch(SUPABASE_URL + path, Object.assign({}, options, { headers: sbHeaders(options && options.headers) }));
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if(!res.ok) console.warn('Supabase isteği başarısız:', res.status, data);
    return { ok: res.ok, status: res.status, data };
  }catch(e){
    console.warn('Supabase isteğinde ağ hatası (internet yok ya da CORS):', e);
    return { ok: false, status: 0, data: null };
  }
}

function rowToProduct(row){
  return {
    id: row.id, name: row.name, cat: row.cat, blurb: row.blurb || '',
    addedAt: row.added_at, link: row.link || '', upcoming: !!row.upcoming,
    specs: row.specs || {}
  };
}

function productToRow(p){
  return {
    id: p.id, name: p.name, cat: p.cat, blurb: p.blurb || '',
    added_at: p.addedAt || null, link: p.link || '', upcoming: !!p.upcoming,
    specs: p.specs || {}, deleted: false
  };
}

// ---- Ürünler ----
// seed-data.js (SEED + NEWS_SEED, ~130KB) normalde HİÇ yüklenmez — sadece
// Supabase'e ulaşılamadığı nadir durumda dinamik olarak eklenir. Bu, her
// sayfada gereksiz yere büyük bir dosya indirilmesini önlüyor.
let _seedDataPromise = null;
function loadSeedDataScript(){
  if(typeof SEED !== 'undefined') return Promise.resolve(); // zaten yüklü
  if(_seedDataPromise) return _seedDataPromise; // eşzamanlı çağrılar tek indirme paylaşsın
  _seedDataPromise = new Promise((resolve, reject) => {
    const sharedTag = [...document.getElementsByTagName('script')].find(s => s.src && s.src.includes('shared.js'));
    const prefix = sharedTag ? sharedTag.src.replace(/shared\.js.*$/, '') : '';
    const script = document.createElement('script');
    script.src = prefix + 'seed-data.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('seed-data.js yüklenemedi'));
    document.head.appendChild(script);
  });
  return _seedDataPromise;
}

async function loadSharedProducts(){
  // 3 Ekim 2026 kök neden notu: PostgREST (Supabase'in REST katmanı)
  // varsayılan olarak TEK istekte en fazla 1000 satır döndürür (db
  // max_rows ayarı) — Range header'ı olmadan yapılan bu sorgu, katalog
  // 1000 ürünü geçtiği anda en ESKİ eklenen ürünleri (added_at.desc
  // sıralamasında 1000. satırdan sonra kalanları) SESSİZCE kesiyordu.
  // "Kamera bölümündeki tüm ürünler kayboldu" şikayetinin asıl sebebi
  // buydu: kataloğa yeni bir telefon eklenip toplam ürün sayısı 1000'i
  // geçtiğinde, kataloğun en eski eklenen kategorisi olan Kamera'nın
  // TAMAMI bu sınırın dışında kaldı. CSV import'un ya da bir render
  // hatasının hiçbir ilgisi yoktu; veri Supabase'de hep sağlamdı. Artık
  // Range header'ıyla sayfalayarak TÜM ürünleri (kaç tane olursa olsun)
  // çekiyoruz.
  const PAGE_SIZE = 1000;
  let all = [];
  let offset = 0;
  for(let guard = 0; guard < 50; guard++){ // 50 sayfa (50.000 ürün) güvenlik sınırı
    const r = await sbFetch('/rest/v1/products?deleted=eq.false&select=*&order=added_at.desc', {
      headers: { 'Range-Unit': 'items', 'Range': `${offset}-${offset + PAGE_SIZE - 1}` }
    });
    if(!r.ok || !r.data){
      break; // bu sayfa başarısız oldu — elimizdeki önceki sayfalarla devam
    }
    all = all.concat(r.data);
    if(r.data.length < PAGE_SIZE) break; // son sayfaya ulaşıldı
    offset += PAGE_SIZE;
  }
  if(!all.length){
    await loadSeedDataScript(); // veritabanı boşsa/erişilemezse örnek katalog
    return [...SEED];
  }
  return all.map(rowToProduct);
}

async function saveProductShared(product){
  const r = await sbFetch('/rest/v1/products', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(productToRow(product))
  });
  return r.ok;
}

async function deleteProductShared(id){
  const r = await sbFetch('/rest/v1/products?id=eq.'+encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ deleted: true })
  });
  return r.ok;
}

// ---- Haberler ----
function rowToNews(row){
  return {
    id: row.id, title: row.title, cat: row.cat || 'Telefon',
    date: row.date, summary: row.summary || '',
    body: Array.isArray(row.body) ? row.body : [],
    relatedProductId: row.related_product_id || null,
    pendingReview: !!row.pending_review,
    // GEO alanları (Kısa Cevap/Tablo/SSS/Özet) — admin formu bunları
    // göstermiyor ama var olan bir haberi düzenleyip kaydederken bu
    // alanların YANLIŞLIKLA silinmemesi için yükleyip geri gönderiyoruz.
    tldr: row.tldr || '',
    table: Array.isArray(row.table_data) ? row.table_data : [],
    faq: Array.isArray(row.faq) ? row.faq : [],
    conclusion: row.conclusion || ''
  };
}

function newsToRow(n){
  const row = {
    id: n.id, title: n.title, cat: n.cat || 'Telefon',
    date: n.date || null, summary: n.summary || '',
    body: n.body || [], related_product_id: n.relatedProductId || null,
    pending_review: !!n.pendingReview,
    deleted: false
  };
  // Sadece obje üzerinde GERÇEKTEN varsa gönder — yoksa (örn. admin
  // formundan yeni eklenen bir haberde) alanı hiç göndermeyip Supabase'in
  // mevcut değeri korumasını/varsayılanı kullanmasını sağlıyoruz.
  if(n.tldr !== undefined) row.tldr = n.tldr;
  if(n.table !== undefined) row.table_data = n.table;
  if(n.faq !== undefined) row.faq = n.faq;
  if(n.conclusion !== undefined) row.conclusion = n.conclusion;
  return row;
}

async function loadSharedNews(){
  const r = await sbFetch('/rest/v1/news?deleted=eq.false&pending_review=eq.false&select=*&order=date.desc');
  if(!r.ok || !r.data){
    await loadSeedDataScript(); // veritabanı boşsa/erişilemezse örnek haberler
    return [...NEWS_SEED];
  }
  return r.data.map(rowToNews);
}

// Admin panelindeki onay kuyruğu — sadece giriş yapmış kullanıcı görebilir (RLS).
async function loadPendingNews(){
  const r = await sbFetch('/rest/v1/news?deleted=eq.false&pending_review=eq.true&select=*&order=created_at.desc');
  if(!r.ok || !r.data) return [];
  return r.data.map(rowToNews);
}

async function saveNewsShared(newsItem){
  const r = await sbFetch('/rest/v1/news', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(newsToRow(newsItem))
  });
  return r.ok;
}

// Onay kuyruğundaki bir taslağı yayına al (pending_review'ı false yapar,
// bu da webhook'u tetikleyip otomatik build+deploy başlatır).
async function approveNewsShared(id){
  const r = await sbFetch('/rest/v1/news?id=eq.'+encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ pending_review: false })
  });
  return r.ok;
}

// Onay kuyruğundaki bir taslağı reddet — asla yayına çıkmaz.
async function rejectNewsShared(id){
  return deleteNewsShared(id);
}

async function deleteNewsShared(id){
  const r = await sbFetch('/rest/v1/news?id=eq.'+encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ deleted: true })
  });
  return r.ok;
}

// ---- Görüntülenmeler ----
async function getViews(id){
  const r = await sbFetch('/rest/v1/views?product_id=eq.'+encodeURIComponent(id)+'&select=count');
  return (r.ok && r.data && r.data.length) ? r.data[0].count : 0;
}

async function incrementViews(id){
  const cur = await getViews(id);
  const next = cur + 1;
  const r = await sbFetch('/rest/v1/views', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ product_id: id, count: next })
  });
  return r.ok ? next : null;
}

// ---- Haber görüntülenmeleri (ürünlerdeki 'views' ile aynı desen, ayrı tablo) ----
async function getNewsViews(newsId){
  const r = await sbFetch('/rest/v1/news_views?news_id=eq.'+encodeURIComponent(newsId)+'&select=count');
  return (r.ok && r.data && r.data.length) ? r.data[0].count : 0;
}

async function incrementNewsViews(newsId){
  const cur = await getNewsViews(newsId);
  const next = cur + 1;
  const r = await sbFetch('/rest/v1/news_views', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ news_id: newsId, count: next })
  });
  return r.ok ? next : null;
}

async function getAllNewsViewCounts(){
  const out = {};
  const r = await sbFetch('/rest/v1/news_views?select=news_id,count');
  if(r.ok && r.data) r.data.forEach(row => { out[row.news_id] = row.count; });
  Object.defineProperty(out, '_ok', { value: r.ok, enumerable: false });
  return out;
}

async function getAllViewCounts(products){
  const out = {};
  products.forEach(p => out[p.id] = 0);
  const r = await sbFetch('/rest/v1/views?select=product_id,count');
  if(r.ok && r.data) r.data.forEach(row => { out[row.product_id] = row.count; });
  Object.defineProperty(out, '_ok', { value: r.ok, enumerable: false });
  return out;
}

// ---- Puan / yorum ----
// Tüm ürünlerin puan özetini TEK sorguda çeker (kart rozetleri için —
// her kart için ayrı sorgu atmak yerine, tek seferde tüm onaylı yorumları
// çekip ürün bazında grupluyoruz).
async function getAllRatingsSummary(){
  const r = await sbFetch('/rest/v1/ratings?approved=eq.true&select=product_id,stars');
  if(!r.ok || !r.data) return {};
  const byProduct = {};
  r.data.forEach(row => {
    if(!byProduct[row.product_id]) byProduct[row.product_id] = [];
    byProduct[row.product_id].push(row.stars);
  });
  const summary = {};
  Object.entries(byProduct).forEach(([pid, stars]) => {
    const count = stars.length;
    const avg = stars.reduce((a,b) => a+b, 0) / count;
    summary[pid] = { count, average: Math.round(avg * 10) / 10 };
  });
  return summary;
}

async function getRatings(id){
  // Halka açık sayfalarda sadece ONAYLANMIŞ yorumlar gösterilir.
  const r = await sbFetch('/rest/v1/ratings?product_id=eq.'+encodeURIComponent(id)+'&approved=eq.true&select=*&order=created_at.asc');
  if(r.ok && r.data) return r.data.map(row => ({ stars: row.stars, name: row.name, comment: row.comment, date: row.created_at }));
  return [];
}

async function addRating(id, stars, name, comment){
  await sbFetch('/rest/v1/ratings', {
    method: 'POST',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      product_id: id,
      stars: Math.max(1, Math.min(5, stars|0)),
      name: (name||'Anonim').slice(0,40),
      comment: (comment||'').slice(0,400)
      // approved sütunu veritabanında varsayılan olarak false — admin onaylamadan görünmez.
    })
  });
  return await getRatings(id); // sadece onaylı olanları döndürür (yenisi henüz onaysızdır)
}

// ---- Admin — yorum moderasyonu (sadece giriş yapmış admin görebilir/işlem yapabilir) ----
// ============================================================
// Kataloğa girmeyen ("bulunamadı") arama talepleri
// ============================================================
async function logMissedSearch(query){
  try{
    await sbFetch('/rest/v1/product_requests', {
      method: 'POST',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({ query: (query||'').slice(0,200) })
    });
  }catch(e){}
}

async function getProductRequests(){
  const r = await sbFetch('/rest/v1/product_requests?resolved=eq.false&select=*&order=created_at.desc');
  return (r.ok && r.data) ? r.data : [];
}

async function resolveProductRequest(id){
  const r = await sbFetch('/rest/v1/product_requests?id=eq.'+id, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ resolved: true })
  });
  return r.ok;
}

async function deleteProductRequest(id){
  const r = await sbFetch('/rest/v1/product_requests?id=eq.'+id, { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } });
  return r.ok;
}

// Arama hiçbir şey bulamazsa, en azından alakalı olabilecek ürünleri öner.
// Sorguda bir kategori adı geçiyorsa o kategoriden, geçmiyorsa genel en yüksek skorlulardan seçer.
function suggestFallbackProducts(query, products, scores){
  const q = (query||'').toLowerCase();
  const catMatch = CATS.find(c => q.includes(c.toLowerCase()));
  let pool = products.filter(p => !p.upcoming);
  if(catMatch) pool = pool.filter(p => p.cat === catMatch);
  return pool.sort((a,b) => (scores[b.id]||0) - (scores[a.id]||0)).slice(0,4);
}

async function getAllRatingsForAdmin(){
  const r = await sbFetch('/rest/v1/ratings?select=*&order=created_at.desc');
  return (r.ok && r.data) ? r.data : [];
}

async function approveRating(ratingId){
  const r = await sbFetch('/rest/v1/ratings?id=eq.'+ratingId, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ approved: true })
  });
  return r.ok;
}

async function deleteRating(ratingId){
  const r = await sbFetch('/rest/v1/ratings?id=eq.'+ratingId, {
    method: 'DELETE',
    headers: { 'Prefer': 'return=minimal' }
  });
  return r.ok;
}

// ============================================================
// Kişisel depolama (favoriler, son gezilenler) — sadece bu tarayıcıda
// window.storage (Claude artifact önizlemesi) varsa onu, yoksa localStorage'ı kullanır.
// ============================================================

function hasClaudeStorage(){
  return typeof window !== 'undefined' && !!window.storage && typeof window.storage.get === 'function';
}

const LS_PREFIX = { true: 'tv_shared:', false: 'tv_personal:' };

async function storageGet(key, shared){
  if(hasClaudeStorage()){
    try{ return await window.storage.get(key, shared); }catch(e){ return null; }
  }
  try{
    const raw = localStorage.getItem(LS_PREFIX[shared]+key);
    return raw != null ? { key, value: raw, shared } : null;
  }catch(e){ return null; }
}

async function storageSet(key, value, shared){
  if(hasClaudeStorage()){
    try{ return await window.storage.set(key, value, shared); }catch(e){ return null; }
  }
  try{ localStorage.setItem(LS_PREFIX[shared]+key, value); return { key, value, shared }; }
  catch(e){ return null; }
}

// ============================================================
// Çerez onayı / KVKK bildirimi
// ============================================================
function hasCookieConsent(){
  try{ return localStorage.getItem('tv_cookie_consent') === '1'; }catch(e){ return false; }
}

function renderCookieBanner(privacyHref){
  if(hasCookieConsent()) return;
  const el = document.createElement('div');
  el.className = 'cookie-banner';
  el.innerHTML = `
    <span>Bu site, deneyiminizi iyileştirmek, istatistik toplamak ve iş ortaklığı/reklam bağlantılarını
    yönetmek için çerezler kullanır. Devam ederek çerez kullanımını kabul etmiş olursunuz.
    <a href="${privacyHref}">Gizlilik Politikası</a></span>
    <button class="btn btn-dark btn-sm" onclick="acceptCookies()">Kabul Et</button>
  `;
  document.body.appendChild(el);
}

function acceptCookies(){
  try{ localStorage.setItem('tv_cookie_consent', '1'); }catch(e){}
  const el = document.querySelector('.cookie-banner');
  if(el) el.remove();
}

async function getFavorites(){
  const r = await storageGet('favorites', false);
  return r ? JSON.parse(r.value) : [];
}

async function saveFavorites(idsArray){
  const r = await storageSet('favorites', JSON.stringify(idsArray), false);
  return !!r;
}

function ratingSummary(list){
  if(!list || !list.length) return { avg: null, count: 0 };
  const sum = list.reduce((a,r) => a + r.stars, 0);
  return { avg: Math.round((sum/list.length)*10)/10, count: list.length };
}

// ============================================================
// Son gezilenler (kişisel — sadece bu tarayıcıda)
// ============================================================
async function trackRecentlyViewed(id){
  const r = await storageGet('recentlyViewed', false);
  let list = r ? JSON.parse(r.value) : [];
  list = [id, ...list.filter(x => x !== id)].slice(0, 8);
  await storageSet('recentlyViewed', JSON.stringify(list), false);
  return list;
}

async function getRecentlyViewed(){
  const r = await storageGet('recentlyViewed', false);
  return r ? JSON.parse(r.value) : [];
}

// ============================================================
// Artı / eksi analizi — kategori ortalamasına göre veriden türetilir.
// Not: Pazarlama iddiası değildir; sadece girilen sayısal özelliklerin
// kategori içi göreli karşılaştırmasıdır.
// ============================================================
function prosConsFor(product, categoryProducts){
  const others = categoryProducts.filter(p => p.id !== product.id && !p.upcoming);
  const pros = [], cons = [];
  if(!others.length) return { pros, cons };

  const specKeys = Object.keys(product.specs || {}).filter(k => !/fiyat/i.test(k) && !/genişlik \(mm\)|uzunluk \(mm\)/i.test(k));
  specKeys.forEach(key => {
    const myVal = parseFloat(String(product.specs[key]).replace(',', '.'));
    if(isNaN(myVal)) return;
    const otherVals = others.map(p => parseFloat(String((p.specs||{})[key]||'').replace(',', '.'))).filter(v => !isNaN(v));
    if(otherVals.length < 2) return;
    const avg = otherVals.reduce((a,b)=>a+b,0) / otherVals.length;
    if(avg === 0) return;
    const diffPct = (myVal - avg) / avg;
    const lowerIsBetter = /ağırlı[kğ]|gram|kalınlık/i.test(key);
    const better = lowerIsBetter ? diffPct < -0.08 : diffPct > 0.08;
    const worse = lowerIsBetter ? diffPct > 0.08 : diffPct < -0.08;
    if(better) pros.push(`${key}: kategori ortalamasının üzerinde (${product.specs[key]})`);
    else if(worse) cons.push(`${key}: kategori ortalamasının altında (${product.specs[key]})`);
  });

  // Fiyat konumu
  const priceKey = Object.keys(product.specs||{}).find(k => /fiyat/i.test(k));
  if(priceKey){
    const myPrice = parseFloat(String(product.specs[priceKey]).replace(/[^\d.,]/g,'').replace(',', '.'));
    const otherPrices = others.map(p => {
      const pk = Object.keys(p.specs||{}).find(k => /fiyat/i.test(k));
      return pk ? parseFloat(String(p.specs[pk]).replace(/[^\d.,]/g,'').replace(',', '.')) : NaN;
    }).filter(v => !isNaN(v));
    if(!isNaN(myPrice) && otherPrices.length >= 2){
      const avgPrice = otherPrices.reduce((a,b)=>a+b,0)/otherPrices.length;
      if(myPrice < avgPrice * 0.9) pros.push('Kategori ortalamasına göre daha uygun fiyatlı');
      else if(myPrice > avgPrice * 1.15) cons.push('Kategori ortalamasına göre daha yüksek fiyatlı');
    }
  }

  return { pros: pros.slice(0,4), cons: cons.slice(0,4) };
}

// ============================================================
// Skor hesaplama — kategori içi göreli "fiyat/performans" skoru (0-100)
// Not: Bu, girilen özellik değerlerinin ürünler arasında göreli normalizasyonuyla
// otomatik hesaplanan yaklaşık bir gösterge niteliğindedir; bağımsız bir laboratuvar
// benchmark'ı ya da nesnel bir performans testi DEĞİLDİR.
//
// 5 Ekim 2026 — AĞIRLIKLI SKOR REVİZYONU
// Eski yöntem "sayıya çevrilebilen her özelliği" eşit ağırlıkla ortalıyor ve
// (kategorinin en ucuz ürününün fiyatı ÷ ürün fiyatı) ile DOĞRUSAL çarpıyordu.
// Sonuçlar: (1) kategorinin en ucuz, genelde yıllar önce çıkmış ürünü 100 alıyor,
// amiral gemileri tek haneli skorlarda kalıyordu; (2) "Webcam: 12MP / 1080p",
// "Bağlantı Noktaları: 2x ...", "Çözünürlük: 2560x1664" gibi metinlerin İLK sayısı
// performans sanılıyordu; (3) işlemci, ekran paneli, ANC gibi asıl belirleyici
// özellikler metin olduğu için HİÇ sayılmıyordu; (4) /ağırlık/ deseni "Ürünün
// Ağırlığı (g)" anahtarını yakalamadığı için AĞIR ürün daha iyi sayılıyordu.
//
// Yeni yöntem:
//   performans = kategoriye özel, AĞIRLIKLI özellik ortalaması (aşağıdaki tablo)
//   ham skor   = performans^1.5 × (referans fiyat ÷ fiyat)^0.35 × güncellik
//   skor       = ham ÷ kategorinin en yüksek hamı × 100
// - Referans fiyat: kategorideki fiyatların alt %10'luk dilimi (tek bir çok ucuz
//   ürün kategoriyi ezemesin diye), oran en fazla 1.
// - Güncellik: çıkış tarihi (addedAt) kategorinin en yeni ürününe göre 1 yıldan
//   eskiyse yıl başına küçük bir indirim, en fazla %40.
// - İşlemci / ekran kartı için BENCHMARK PUANI UYDURULMAZ; üreticinin KENDİ
//   segment sınıflandırması kullanılır (ör. Snapdragon 8 = amiral, 7 = üst-orta,
//   6 = orta, 4 = giriş). Nesil farkını güncellik çarpanı karşılar.
// - Eksik özellik, o özelliğin kategori ortalamasıyla doldurulur (ne ödül ne ceza).
// - Tabloda olmayan (ileride eklenecek) bir kategori için eski genel yönteme
//   (tüm sayısal özellikler, eşit ağırlık) düşülür.
// ============================================================
const SCORE_PERF_EXP = 1.5;
const SCORE_PRICE_EXP = 0.35;
const SCORE_AGE_FLOOR = 0.6;
// Yıl başına güncellik indirimi (ilk 1 yıl indirimsiz)
const SCORE_AGE_RATE = { 'Telefon':0.07, 'Tablet':0.06, 'Dizüstü':0.06, 'Akıllı Saat':0.06, 'Televizyon':0.05, 'Kulaklık':0.04, 'Kamera':0.03 };

function scoreNum(v){
  if(v === undefined || v === null) return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}
function scoreYesNo(v){
  const t = String(v||'').trim().toLowerCase();
  if(/^var/.test(t)) return 1;
  if(/^yok/.test(t)) return 0;
  return null;
}
// Mobil işlemci — üreticinin kendi segment sınıfı (0-1)
function scoreCpuMobile(v){
  const t = String(v||'').toLowerCase();
  if(!t) return null;
  if(/apple\s*a\d+/.test(t)) return 1;
  if(/apple\s*m\d+/.test(t)) return 1;
  if(/snapdragon/.test(t)){
    if(/8\s*elite/.test(t)) return 1;
    if(/8s\s*gen/.test(t)) return 0.85;
    if(/8\+?\s*gen/.test(t)) return 1;
    if(/7\+\s*gen/.test(t)) return 0.75;
    if(/7s\s*gen/.test(t)) return 0.55;
    if(/7\s*gen/.test(t)) return 0.65;
    if(/6s?\s*gen/.test(t)) return 0.4;
    if(/4s?\s*gen/.test(t)) return 0.2;
    const m = t.match(/snapdragon\s*(\d)\d{2}/);
    if(m){ const s = +m[1]; return s >= 8 ? 1 : s === 7 ? 0.6 : s === 6 ? 0.35 : s === 4 ? 0.15 : 0.05; }
    return null;
  }
  let m = t.match(/dimensity\s*(\d+)/);
  if(m){ const n = +m[1]; return n >= 9000 ? 1 : n >= 8000 ? 0.75 : n >= 7000 ? 0.55 : n >= 6000 ? 0.35 : n >= 1000 ? 0.7 : n >= 900 ? 0.5 : 0.4; }
  m = t.match(/(?:helio|mediatek)\s*g(\d+)/);
  if(m){ const n = +m[1]; return n >= 90 ? 0.3 : n >= 70 ? 0.25 : 0.15; }
  if(/helio/.test(t)) return 0.15;
  m = t.match(/exynos\s*(\d+)/);
  if(m){ const n = +m[1]; if((n >= 2000 && n < 3000) || n >= 9000 || (n >= 980 && n < 1000)) return 1; if(n >= 1000 && n < 2000) return (n % 100) >= 80 ? 0.55 : 0.4; return 0.2; }
  if(/tensor/.test(t)) return 0.9;
  m = t.match(/kirin\s*(\d+)/);
  if(m){ const n = +m[1]; return (n >= 9000 || (n >= 950 && n < 1000)) ? 1 : n >= 800 ? 0.5 : n >= 700 ? 0.35 : 0.2; }
  if(/unisoc|spreadtrum|tiger|sc98/.test(t)) return /t[78]\d\d/.test(t) ? 0.25 : 0.15;
  return null;
}
// Tablet: Apple M masaüstü sınıfı çip (1), A-serisi bir alt sınıf
function scoreCpuTablet(v){
  const t = String(v||'').toLowerCase();
  if(/apple\s*m\d+/.test(t)) return 1;
  if(/apple\s*a\d+/.test(t)) return 0.85;
  return scoreCpuMobile(v);
}
// Dizüstü işlemci — seri (i5/i7/Ryzen 7...) × güç sınıfı (U/P/H/HX)
function scoreCpuLaptop(v){
  const t = String(v||'').toLowerCase();
  if(!t) return null;
  if(/apple\s*m\d+/.test(t)) return /max|ultra/.test(t) ? 1 : /pro/.test(t) ? 0.9 : 0.75;
  if(/snapdragon\s*x/.test(t)) return /elite/.test(t) ? 0.75 : 0.6;
  let base = null;
  if(/celeron|pentium|athlon|\bn\d{2,3}\b/.test(t)) return 0.1;
  if(/ryzen\s*(\d)/.test(t)){ const s = +t.match(/ryzen\s*(\d)/)[1]; base = s >= 9 ? 1 : s === 7 ? 0.75 : s === 5 ? 0.5 : 0.3; }
  else if(/i9|ultra\s*9|core\s*9/.test(t)) base = 1;
  else if(/i7|ultra\s*7|core\s*7/.test(t)) base = 0.75;
  else if(/i5|ultra\s*5|core\s*5/.test(t)) base = 0.5;
  else if(/i3|core\s*3/.test(t)) base = 0.3;
  if(base == null) return null;
  const sm = t.match(/\d{3,5}([a-z]{1,2})\d?\b/);
  const suf = sm ? sm[1] : '';
  const mult = suf === 'hx' ? 1.1 : /^h/.test(suf) ? 1 : suf === 'p' ? 0.9 : (/^u/.test(suf) || /^g/.test(suf)) ? 0.8 : 0.9;
  return Math.min(1, base * mult);
}
// Dizüstü ekran kartı — NVIDIA'nın kendi model segmenti; entegre ayrı sınıf
function scoreGpuLaptop(v){
  const t = String(v||'').toLowerCase();
  if(!t) return null;
  let m = t.match(/rtx\s*(\d)0(\d)0/);
  if(m){
    const gen = +m[1], cls = +m[2];
    const c = cls >= 9 ? 1 : cls === 8 ? 0.97 : cls === 7 ? 0.9 : cls === 6 ? 0.8 : 0.68;
    return Math.max(0.5, Math.min(1, c + (gen - 4) * 0.03));
  }
  if(/gtx/.test(t)) return 0.5;
  if(/radeon\s*rx/.test(t)) return 0.75;
  if(/arc\s*a\d{3}/.test(t)) return 0.55;
  if(/apple/.test(t)) return /max|ultra/.test(t) ? 0.7 : /pro/.test(t) ? 0.6 : 0.45;
  if(/uhd/.test(t)) return 0.12;
  if(/iris|radeon|arc|entegre|integrated|dahili/.test(t)) return 0.25;
  return null;
}
function scoreIp(v){
  const t = String(v||'').toUpperCase();
  if(!t.trim()) return null;
  let best = null;
  const re = /IP[0-9X]([0-9X])/g; let m;
  while((m = re.exec(t))){ const d = m[1] === 'X' ? 0 : +m[1]; best = Math.max(best == null ? 0 : best, d); }
  if(best == null) return (/^YOK/.test(t.trim()) || t.trim() === '-') ? 0 : null;
  return best >= 8 ? 1 : best === 7 ? 0.85 : best === 6 ? 0.6 : best === 5 ? 0.5 : best === 4 ? 0.35 : 0.2;
}
function scorePanelMobile(v){
  const t = String(v||'').toLowerCase();
  if(/ltpo/.test(t)) return 1;
  if(/oled/.test(t)) return 0.9;
  if(/mini.?led/.test(t)) return 0.8;
  if(/lcd|ips|tft|pls/.test(t)) return 0.4;
  return null;
}
function scorePanelLaptop(v){
  const t = String(v||'').toLowerCase();
  if(/oled/.test(t)) return 1;
  if(/mini.?led/.test(t)) return 0.9;
  if(/ips|retina/.test(t)) return 0.6;
  if(/\btn\b|\bva\b/.test(t)) return 0.3;
  return null;
}
function scorePanelTv(v){
  const t = String(v||'').toLowerCase();
  if(/oled/.test(t)) return 1;
  if(/mini.?led|neo\s*qled/.test(t)) return 0.85;
  if(/qled|qned|uled/.test(t)) return 0.6;
  if(/nanocell/.test(t)) return 0.5;
  if(/led|lcd/.test(t)) return 0.3;
  return null;
}
function scorePixels(v){
  const m = String(v||'').match(/(\d{3,5})\s*[x×]\s*(\d{3,5})/i);
  return m ? (+m[1]) * (+m[2]) : null;
}
function scoreCellular(v){
  const t = String(v||'').toLowerCase();
  if(/5g/.test(t)) return 1;
  if(/4g|lte/.test(t)) return 0.3;
  return null;
}
function scoreHdr(v){
  const t = String(v||'').toLowerCase();
  if(!t.trim()) return null;
  const dv = /dolby\s*vision/.test(t), hp = /hdr10\+/.test(t);
  return dv && hp ? 1 : dv ? 0.8 : hp ? 0.6 : /hdr|hlg/.test(t) ? 0.3 : 0;
}
function scoreSensorSize(v){
  const t = String(v||'').toLowerCase().trim();
  if(/full\s*frame|tam\s*kare|orta\s*format/.test(t)) return 1;
  if(/aps-?c/.test(t)) return 0.7;
  if(/four\s*thirds|4\/3/.test(t)) return 0.55;
  if(/^1\s*("|''|inç|inch)/.test(t)) return 0.4;
  if(/^1\/\d/.test(t)) return 0.2;
  return null;
}
function scoreVideo(v){
  const t = String(v||'').toLowerCase();
  const m = t.match(/(\d)\s*k\s*(\d{2,3})?/);
  if(m) return (+m[1]) + (m[2] ? Math.min(120, +m[2]) / 60 : 0.5);
  if(/1080/.test(t)) return 2.5;
  return null;
}
function scoreIsoMax(v){
  const nums = (String(v||'').split('(')[0].match(/\d+/g) || []).map(Number);
  return nums.length ? Math.max(...nums) : null;
}
function scoreGps(v){
  const t = String(v||'').toLowerCase();
  if(/çift/.test(t)) return 1;
  if(/^\s*var/.test(t)) return 0.7;
  if(/^\s*yok/.test(t)) return 0;
  return null;
}
function scoreSensors(v){
  const t = String(v||'').toLowerCase();
  if(!t.trim()) return null;
  const groups = [/kalp/, /spo2/, /ekg/, /sıcaklık/, /stres|iletkenli/, /empedans|bia/];
  return Math.min(1, groups.filter(r => r.test(t)).length / 4);
}
function scoreWaterMeters(v){
  const t = String(v||'').toLowerCase();
  let best = null;
  let m = t.match(/(\d+)\s*atm/); if(m) best = +m[1] * 10;
  m = t.match(/(\d+)\s*m\b/); if(m) best = Math.max(best || 0, +m[1]);
  return best;
}
// Akıllı saat platformu: uygulama mağazalı tam akıllı saat sistemi mi, kapalı sistem mi
function scoreWatchOs(v){
  const t = String(v||'').toLowerCase();
  if(!t.trim()) return null;
  if(/watchos|wear\s*os/.test(t)) return 1;
  if(/harmony|zepp|garmin|polar|tizen|one\s*ui/.test(t)) return 0.6;
  return 0.3;
}
function scoreCaseMaterial(v){
  const t = String(v||'').toLowerCase();
  if(/titanyum/.test(t)) return 1;
  if(/çelik|seramik|safir/.test(t)) return 0.8;
  if(/alüminyum/.test(t)) return 0.5;
  if(/polimer|plastik|reçine/.test(t)) return 0.2;
  return null;
}
function scoreFastCharge(v){
  const m = String(v||'').replace(/,/g, '.').match(/([\d.]+)\s*dk\s*=\s*([\d.]+)\s*saat/i);
  return m && +m[1] > 0 ? (+m[2] * 60) / (+m[1]) : null;
}
function scorePen(v){
  const t = String(v||'').toLowerCase();
  if(/^\s*var/.test(t)) return /dahil/.test(t) ? 1 : 0.7;
  if(/^\s*yok/.test(t)) return 0;
  return null;
}
function scoreWeather(v){
  const t = String(v||'').toLowerCase();
  if(!t.trim()) return null;
  if(/^\s*yok/.test(t) || t.trim() === '-') return 0;
  if(/korumalı|dayanıklı|geçirmez|ip\d/.test(t)) return 1;
  return null;
}

// Kategoriye özel özellik tablosu.
//   k: özellik anahtarı deseni · w: ağırlık · x: değer çıkarıcı (varsayılan: sayı)
//   s: 'log' | 'lin' (kategori içi min-max) | 'abs' (çıkarıcı zaten 0-1 veriyor)
//   inv: düşük olan daha iyi
const SCORE_FEATURES = {
  'Telefon': [
    { k:/^İşlemci/i, w:3, x:scoreCpuMobile, s:'abs' },
    { k:/^RAM/i, w:1.5, s:'log' },
    { k:/^Depolama/i, w:1, s:'log' },
    { k:/^Pil \(mAh\)/i, w:1.5, s:'lin' },
    { k:/^(Arka )?Kamera \(MP\)/i, w:1, s:'log' },
    { k:/^Ön Kamera \(MP\)/i, w:0.5, s:'log' },
    { k:/^Yenileme Hızı/i, w:1, s:'lin' },
    { k:/^Ekran Türü/i, w:1, x:scorePanelMobile, s:'abs' },
    { k:/^Piksel Yoğunluğu/i, w:0.5, s:'lin' },
    { k:/^Su Geçirmezlik/i, w:0.5, x:scoreIp, s:'abs' },
    { k:/^Hücresel Teknoloji/i, w:0.5, x:scoreCellular, s:'abs' }
  ],
  'Dizüstü': [
    { k:/^İşlemci/i, w:3, x:scoreCpuLaptop, s:'abs' },
    { k:/^Ekran Kartı/i, w:1.5, x:scoreGpuLaptop, s:'abs' },
    { k:/^RAM/i, w:2, s:'log' },
    { k:/^Depolama/i, w:1, s:'log' },
    { k:/^Pil \(saat\)/i, w:1.5, s:'lin' },
    { k:/^Yenileme Hızı/i, w:0.75, s:'lin' },
    { k:/^Ekran Türü/i, w:0.5, x:scorePanelLaptop, s:'abs' },
    { k:/^Çözünürlük/i, w:0.75, x:scorePixels, s:'log' },
    { k:/Ağırlı[kğ]/i, w:0.75, s:'lin', inv:true }
  ],
  'Tablet': [
    { k:/^İşlemci/i, w:2.5, x:scoreCpuTablet, s:'abs' },
    { k:/^RAM/i, w:1.5, s:'log' },
    { k:/^Depolama/i, w:1, s:'log' },
    { k:/^Pil \(mAh\)/i, w:1, s:'lin' },
    { k:/^Yenileme Hızı/i, w:1, s:'lin' },
    { k:/^Ekran Türü/i, w:1, x:scorePanelMobile, s:'abs' },
    { k:/^Çözünürlük/i, w:0.75, x:scorePixels, s:'log' },
    { k:/^(Arka )?Kamera \(MP\)/i, w:0.25, s:'log' },
    { k:/^Ön Kamera \(MP\)/i, w:0.25, s:'log' },
    { k:/^Kalem Desteği/i, w:0.5, x:scorePen, s:'abs' }
  ],
  'Kulaklık': [
    { k:/Gürültü Engelleme|ANC/i, w:3, x:scoreYesNo, s:'abs' },
    { k:/^Pil \(saat\)/i, w:1.5, s:'log' },
    { k:/^Bluetooth( Versiyonu)?$/i, w:0.75, s:'lin' },
    { k:/^Su\/Ter Direnci|^Su Geçirmezlik/i, w:0.75, x:scoreIp, s:'abs' },
    { k:/^Kablosuz Şarj/i, w:0.5, x:scoreYesNo, s:'abs' },
    { k:/^Hızlı Şarj/i, w:0.5, x:scoreFastCharge, s:'log' }
  ],
  'Akıllı Saat': [
    { k:/^Pil \(saat\)/i, w:1.5, s:'log' },
    { k:/^İşletim Sistemi/i, w:1.5, x:scoreWatchOs, s:'abs' },
    { k:/^GPS/i, w:1.5, x:scoreGps, s:'abs' },
    { k:/^Sensörler/i, w:1.5, x:scoreSensors, s:'abs' },
    { k:/^Su Geçirmezlik/i, w:0.75, x:scoreWaterMeters, s:'lin' },
    { k:/^Ekran Türü/i, w:0.75, x:scorePanelMobile, s:'abs' },
    { k:/^Kasa Malzemesi/i, w:0.5, x:scoreCaseMaterial, s:'abs' }
  ],
  'Televizyon': [
    { k:/^Ekran Türü/i, w:3, x:scorePanelTv, s:'abs' },
    { k:/^Yenileme Hızı/i, w:2, s:'lin' },
    { k:/^Ekran \(inç\)/i, w:2, s:'lin' },
    { k:/^HDR/i, w:1, x:scoreHdr, s:'abs' },
    { k:/^Ses Çıkış Gücü/i, w:0.75, s:'lin' }
  ],
  'Kamera': [
    { k:/^Sensör Boyutu/i, w:3, x:scoreSensorSize, s:'abs' },
    { k:/^Çözünürlük \(MP\)/i, w:1.5, s:'log' },
    { k:/^Video/i, w:1.5, x:scoreVideo, s:'lin' },
    { k:/^ISO/i, w:0.75, x:scoreIsoMax, s:'log' },
    { k:/^Su\/Toz Direnci/i, w:0.5, x:scoreWeather, s:'abs' }
  ]
};

// Bir ürünün, tablodaki bir özellik için ham değerini bulur (yoksa null)
function scoreFeatureRaw(p, f){
  const specs = p.specs || {};
  const keys = Object.keys(specs);
  for(let i = 0; i < keys.length; i++){
    if(!f.k.test(keys[i])) continue;
    const val = f.x ? f.x(specs[keys[i]]) : scoreNum(specs[keys[i]]);
    if(val != null && !isNaN(val)) return val;
  }
  return null;
}

// Kategoriye özel ağırlıklı performans (0-1). Dönüş: { id: perf }
function scoreWeightedPerf(list, features){
  const cols = features.map(f => {
    let vals = list.map(p => scoreFeatureRaw(p, f));
    if(f.s === 'log') vals = vals.map(v => (v != null && v > 0) ? Math.log(v) : null);
    const present = vals.filter(v => v != null);
    if(!present.length) return null; // bu kategoride bu özellik hiç girilmemiş
    let norm;
    if(f.s === 'abs'){
      norm = vals.map(v => v == null ? null : Math.max(0, Math.min(1, v)));
    } else {
      const min = Math.min(...present), max = Math.max(...present);
      if(max === min) return null; // herkes aynı → ayırt edici değil
      norm = vals.map(v => v == null ? null : (v - min) / (max - min));
    }
    if(f.inv) norm = norm.map(v => v == null ? null : 1 - v);
    const have = norm.filter(v => v != null);
    const mean = have.reduce((a,b) => a+b, 0) / have.length;
    return { w: f.w, norm, mean };
  }).filter(Boolean);

  const out = {};
  list.forEach((p, i) => {
    let sum = 0, wsum = 0;
    cols.forEach(c => { const v = c.norm[i] == null ? c.mean : c.norm[i]; sum += v * c.w; wsum += c.w; });
    out[p.id] = wsum ? sum / wsum : 0.5;
  });
  return out;
}

// Tabloda olmayan kategoriler için eski genel yöntem (eşit ağırlık)
function scoreGenericPerf(list){
  const perfKeys = new Set();
  list.forEach(p => Object.keys(p.specs || {}).forEach(k => {
    if(/fiyat/i.test(k)) return;
    if(/genişlik \(mm\)|uzunluk \(mm\)/i.test(k)) return;
    if(scoreNum(p.specs[k]) != null) perfKeys.add(k);
  }));
  const ranges = {};
  perfKeys.forEach(k => {
    const vals = list.map(p => scoreNum((p.specs||{})[k])).filter(v => v != null);
    if(vals.length) ranges[k] = { min: Math.min(...vals), max: Math.max(...vals) };
  });
  const out = {};
  list.forEach(p => {
    let sum = 0, count = 0;
    perfKeys.forEach(k => {
      const v = scoreNum((p.specs||{})[k]);
      if(v == null) return;
      const { min, max } = ranges[k];
      let norm = max === min ? 1 : (v - min) / (max - min);
      if(/ağırlı[kğ]|kalınlık/i.test(k)) norm = 1 - norm; // düşük olan daha iyi
      sum += norm; count++;
    });
    out[p.id] = count ? sum / count : 0.5;
  });
  return out;
}

function computeScores(products){
  const scored = products.filter(p => !p.upcoming);
  const byCat = {};
  scored.forEach(p => { (byCat[p.cat] = byCat[p.cat] || []).push(p); });

  const scores = {};
  Object.keys(byCat).forEach(cat => {
    const list = byCat[cat];
    // fiyatı bul ve ayıkla. 0 ve altı fiyat "bilinmiyor" sayılır (27 Eylül 2026
    // düzeltmesi: tek bir 0 ₺'lik kayıt tüm kategoriyi sıfırlıyordu).
    list.forEach(p => {
      const specs = p.specs || {};
      const priceKey = Object.keys(specs).find(k => /fiyat/i.test(k));
      const raw = priceKey ? specs[priceKey] : null;
      const num = raw ? parseFloat(raw.toString().replace(/[^\d.,]/g,'').replace(',','.')) : NaN;
      p.__price = (isNaN(num) || num <= 0) ? null : num;
    });
    const prices = list.map(p => p.__price).filter(v => v != null).sort((x,y) => x-y);
    const refPrice = prices.length ? prices[Math.floor(prices.length * 0.1)] : null;

    const perf = SCORE_FEATURES[cat] ? scoreWeightedPerf(list, SCORE_FEATURES[cat]) : scoreGenericPerf(list);

    // Güncellik: kategorinin en yeni ürününe göre yaş (build ve tarayıcı aynı
    // sonucu versin diye "bugün" değil, verinin kendisi referans alınır).
    const times = list.map(p => p.addedAt ? new Date(p.addedAt).getTime() : NaN).filter(t => !isNaN(t));
    const newest = times.length ? Math.max(...times) : null;
    const ageRate = SCORE_AGE_RATE[cat] != null ? SCORE_AGE_RATE[cat] : 0.05;

    list.forEach(p => {
      // Fiyatı bilinmeyen ürün "fiyat/performans değerlendirilemez" → 0 (Faz 7C).
      let priceFactor = 1;
      if(refPrice != null) priceFactor = p.__price ? Math.min(1, refPrice / p.__price) : 0;
      let ageFactor = 1;
      const t = p.addedAt ? new Date(p.addedAt).getTime() : NaN;
      if(newest != null && !isNaN(t)){
        const years = (newest - t) / (365.25 * 24 * 3600 * 1000);
        ageFactor = Math.max(SCORE_AGE_FLOOR, 1 - ageRate * Math.max(0, years - 1));
      }
      p.__rawScore = Math.pow(perf[p.id], SCORE_PERF_EXP) * Math.pow(priceFactor, SCORE_PRICE_EXP) * ageFactor;
    });

    const maxRaw = Math.max(...list.map(p => p.__rawScore), 0.0001);
    list.forEach(p => { scores[p.id] = Math.round((p.__rawScore / maxRaw) * 100); });
  });

  return scores;
}

// ============================================================
// Basit deterministik sözde-rastgele üretici (fiyat geçmişi simülasyonu için)
// Not: Gerçek bir tarihsel fiyat API'sine bağlı değiliz; bu grafik TEMSİLİDİR,
// mevcut fiyattan geriye doğru makul bir dalgalanma üretir. UI'da açıkça
// "temsili/simüle edilmiş" olarak etiketlenir.
// ============================================================
function seededRandom(seedStr){
  let h = 0;
  for(let i=0;i<seedStr.length;i++){ h = (h*31 + seedStr.charCodeAt(i)) >>> 0; }
  return function(){ h = (h*1664525 + 1013904223) >>> 0; return h / 4294967296; };
}

// Gerçek fiyat geçmişini Supabase'den çeker (price_history tablosu,
// haftalık kaydedilir — bkz. scripts/record-price-snapshots.js).
// Yeterli veri yoksa (2'den az farklı gün) null döner, çağıran taraf
// simüle edilmiş grafiğe düşer.
async function loadRealPriceHistory(productId){
  const r = await sbFetch('/rest/v1/price_history?product_id=eq.'+encodeURIComponent(productId)+'&select=price,recorded_at&order=recorded_at.asc');
  if(!r.ok || !r.data || r.data.length < 2) return null;
  const shortDate = iso => { try{ return new Date(iso).toLocaleDateString('tr-TR', {day:'numeric', month:'short'}); } catch(e){ return iso; } };
  return {
    labels: r.data.map(row => shortDate(row.recorded_at)),
    data: r.data.map(row => Math.round(row.price)),
    currency: '₺',
    isReal: true
  };
}

// Fiyat geçmişi grafiği için tek giriş noktası: önce Supabase'deki GERÇEK
// price_history verisini dener (haftalık kaydedilir), yeterli veri yoksa
// (2'den az farklı gün) temsili/simüle edilmiş veriye düşer. Çağıran taraf
// dönen { isReal } alanına bakarak grafiğin altındaki notu buna göre
// yazdırmalı — gerçek veri varken "temsilidir" demek yanıltıcı olurdu,
// veri yokken "gerçek veriye dayanır" demek de öyle.
async function getPriceHistory(product){
  const real = await loadRealPriceHistory(product.id);
  if(real) return real;
  const sim = generatePriceHistory(product);
  return sim ? Object.assign(sim, { isReal: false }) : null;
}

function generatePriceHistory(product){
  const specs = product.specs || {};
  const priceKey = Object.keys(specs).find(k => /fiyat/i.test(k));
  const base = priceKey ? parseFloat((specs[priceKey]||'0').toString().replace(/[^\d.,]/g,'').replace(',','.')) : null;
  if(!base) return null;
  const rand = seededRandom(product.id);
  const labels = ['6 ay önce','5 ay önce','4 ay önce','3 ay önce','2 ay önce','1 ay önce','Bugün'];
  const data = [];
  let price = base * (1 + rand()*0.16 + 0.04);
  for(let i=0;i<labels.length;i++){
    if(i === labels.length-1){ price = base; }
    else{
      const remaining = labels.length - 1 - i;
      price = price - (price-base)/(remaining+1) * (0.5 + rand()*0.6);
    }
    data.push(Math.round(price));
  }
  return { labels, data, currency: priceKey && priceKey.includes('₺') ? '₺' : '$' };
}

function getPalette(){
  return ['--c1','--c2','--c3','--c4','--c5','--c6','--c7'].map(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim());
}

function colorFor(cat){
  const idx = CATS.indexOf(cat);
  const PALETTE = getPalette();
  return PALETTE[idx >= 0 ? idx % PALETTE.length : 0];
}

function fmtDate(iso){
  try{ return new Date(iso).toLocaleDateString('tr-TR', {day:'numeric', month:'long', year:'numeric'}); }
  catch(e){ return ''; }
}

// ============================================================
// Kart render yardımcıları — 27 Eylül 2026 (Faz 13) öncesinde index.html
// ve category.js'in her ikisinde de BİREBİR AYNI kopyalanmış haldeydi
// (kopyala-yapıştır); biri değişince diğerinin unutulması riski vardı.
// Artık tek kaynak burası. sortProducts() bilerek çağıran sayfanın kendi
// üst-seviye `sortMode`/`scores`/`viewCounts` değişkenlerine bakıyor —
// hem index.html hem category.js bu isimlerle aynı state'i tutuyor, bu
// yüzden davranış değişmedi (diğer paylaşılan fonksiyonlar da — cardHTML
// içindeki `scores`/`favorites` gibi — aynı örtük paylaşılan-global
// deseniyle çalışıyor).
// ============================================================
// Marka çıkarımı — lib/generate-site.js'teki sunucu tarafı mantığıyla
// BİREBİR AYNI (tek istisna listesi burada tutulur, kart/tablo/filtre
// gibi istemci tarafı kullanımlar için).
const BRAND_EXCEPTIONS = { 'iphone':'Apple', 'macbook':'Apple', 'airpods':'Apple' };
function brandFor(p){
  const firstWord = (p.name.split(' ')[0] || '').toLowerCase();
  return BRAND_EXCEPTIONS[firstWord] || p.name.split(' ')[0];
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

// ============================================================
// cardHTML() — 27 Eylül 2026 (Faz 13, gelişim raporu madde "kart
// tasarımının birleştirilmesi"): index.html ve category.js'de GÖRSEL
// OLARAK FARKLI iki ayrı kart tasarımı vardı (index.html: "score-pill" +
// tıklayınca açılan hızlı önizleme modalı; category.js: "card-score-price"
// bloğu + doğrudan ürün sayfasına giden linkler, "Satın Al" linkli).
// Kategori sayfalarının tasarımı standart seçildi: daha güçlü skor
// gösterimi (büyük puan + fiyat aynı blokta), net bir "İncele" CTA'sı ve
// zaten iki yerde (canlı kategori render + statik SEO kartları) kullanılan
// tasarım. Ana sayfanın "karta tıkla → modal aç" davranışı bilinçli olarak
// kaldırıldı — artık her yerde ürün adı/"İncele" linkine tıklamak doğrudan
// ürün sayfasına götürüyor, siteye tek bir tutarlı etkileşim modeli geldi.
// `opts`: { newIds: Set (ana sayfa "YENİ" rozeti), reasons: string[]
// (akıllı arama gerekçeleri, sadece category.js'te kullanılıyor) }.
// ============================================================
function cardHTML(p, opts){
  opts = opts || {};
  const newIds = opts.newIds instanceof Set ? opts.newIds : new Set(Array.isArray(opts.newIds) ? opts.newIds : []);
  const reasons = opts.reasons;
  const color = colorFor(p.cat);
  const priceEntries = Object.entries(p.specs || {}).filter(([k]) => /fiyat/i.test(k));
  const otherSpecs = Object.entries(p.specs || {}).filter(([k]) => !/fiyat/i.test(k)).slice(0,3);
  const isFav = favorites.includes(p.id);
  const s = scores[p.id];
  const priceText = priceEntries.length ? priceEntries[0][1] : 'Fiyat bilgisi yok';
  const rating = (typeof ratingsSummary !== 'undefined' && ratingsSummary[p.id]) ? ratingsSummary[p.id] : null;
  const reasonsHTML = (Array.isArray(reasons) && reasons.length)
    ? `<div class="card-reasons" onclick="event.stopPropagation()">
        <div class="card-reasons-title">Neden öneriyoruz?</div>
        ${reasons.map(r => `<div class="card-reason-item">✓ ${r}</div>`).join('')}
      </div>`
    : '';
  return `
  <div class="card">
    ${newIds.has(p.id) ? '<span class="badge-new">YENİ</span>' : ''}
    <button class="fav-btn" onclick="event.stopPropagation(); toggleFavorite('${p.id}')" aria-label="${p.name} ürününü favorilere ekle" title="Favorilere ekle">${heartIcon(isFav)}</button>
    <div class="card-icon" style="background:${color}22;color:${color};">
      <svg width="24" height="24" viewBox="0 0 24 24">${ICONS[p.cat]||''}</svg>
    </div>
    <div class="card-cat">${p.cat} · Çıkış: ${fmtDate(p.addedAt)}</div>
    <a class="card-name" href="${productUrl(p)}">${p.name}</a>
    <div class="card-score-price">
      ${s!=null ? `<span class="card-score" style="color:${scoreColor(s)};">${s}<small>/100</small></span>` : `<span class="card-score card-score-empty">—</span>`}
      <span class="card-price${priceEntries.length?'':' card-price-empty'}">${priceText}</span>
    </div>
    ${rating ? `<div class="card-rating" style="font-size:12px;color:var(--ink-soft);margin:-2px 0 4px;">★ ${rating.average} (${rating.count})</div>` : ''}
    <div class="card-blurb">${p.blurb||''}</div>
    <div class="card-specs">${otherSpecs.map(([k,v])=>`<span class="spec-pill">${k}: ${v}</span>`).join('')}</div>
    ${reasonsHTML}
    <div class="card-actions">
      <a class="btn-card-primary" href="${productUrl(p)}">İncele →</a>
      <label class="compare-check" onclick="event.stopPropagation()">
        <input type="checkbox" aria-label="${p.name} ürününü karşılaştırmaya ekle" ${selected.has(p.id)?'checked':''} onchange="toggleSelect('${p.id}')" />
        Karşılaştır
      </label>
    </div>
    <div class="card-foot">
      <span class="view-count">${viewCounts[p.id] ? viewCounts[p.id]+' görüntülenme' : ''}</span>
      <a class="buy-link" href="${affiliateLink(p)}" target="_blank" rel="noopener noreferrer sponsored" onclick="event.stopPropagation()">Satın Al →</a>
    </div>
  </div>`;
}

// ============================================================
// Ürün detay sayfaları (urun/*.html) için slug/URL yardımcıları
// ============================================================
function slugify(name){
  const trMap = {'ı':'i','İ':'i','ş':'s','Ş':'s','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ö':'o','Ö':'o','ç':'c','Ç':'c'};
  return name
    .split('').map(ch => trMap[ch] !== undefined ? trMap[ch] : ch).join('')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}

function productSlug(p){
  return `${slugify(p.name)}-${p.id}`;
}

function productUrl(p){
  return `urun/${productSlug(p)}.html`;
}

// Amazon Ortaklık (Associates) affiliate linki üretir — StoreID: teknoversus-21.
// Ürünün gerçek Amazon ürün linki (p.link) varsa ona ?/&tag= ekler;
// yoksa ürün adıyla Amazon arama sonucuna affiliate tag'i ekleyerek yönlendirir.
// urun/*.html (generate-site.js) ve karsilastir/*.html (generate-comparisons.js)
// sayfaları bu mantığın aynısını build sırasında zaten uyguluyor — bu fonksiyon
// index.html / category.js gibi istemci tarafında canlı render edilen kartlar içindir.
const AMAZON_AFFILIATE_TAG = 'teknoversus-21';
function affiliateLink(p){
  if(!p) return '';
  return p.link
    ? p.link + (p.link.includes('?') ? '&' : '?') + `tag=${AMAZON_AFFILIATE_TAG}`
    : `https://www.amazon.com.tr/s?k=${encodeURIComponent(p.name)}&tag=${AMAZON_AFFILIATE_TAG}`;
}

// Son gezilenler şeridini verilen container'a basar.
// Ürün detay sayfaları (urun/ altında) ile kök sayfalar farklı göreli yol
// gerektirdiği için location.pathname'e bakarak "urun/" ön ekini ayarlar.
async function renderRecentlyViewedInto(containerId, allProducts, excludeId){
  const container = document.getElementById(containerId);
  if(!container) return;
  const insideUrunFolder = location.pathname.includes('/urun/');
  const ids = (await getRecentlyViewed()).filter(id => id !== excludeId);
  const byId = {}; allProducts.forEach(p => byId[p.id] = p);
  const items = ids.map(id => byId[id]).filter(Boolean).slice(0,6);
  if(!items.length){ container.innerHTML = ''; return; }
  container.innerHTML = '<h2 style="font-size:14px;margin:14px 0 8px;color:var(--ink-soft);">Son gezdiklerin</h2>' +
    '<div class="recent-strip">' +
    items.map(p => {
      const href = insideUrunFolder ? productSlug(p) + '.html' : productUrl(p);
      return `<a href="${href}"><div style="font-weight:700;margin-bottom:3px;">${p.name}</div><div style="color:var(--ink-soft);">${p.cat}</div></a>`;
    }).join('') +
    '</div>';
}

// ---- PWA: Service Worker kaydı ----
// typeof kontrolleri: shared.js hem tarayıcıda hem build.js'nin Node.js VM
// ortamında (helpers çıkarmak için) çalıştırılıyor — o ortamda navigator/
// window gerçek tarayıcı nesneleri değil, bu yüzden koşulsuz çağrı build'i
// bozar.
if(typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator){
  window.addEventListener('load', () => {
    const swPath = location.pathname.includes('/urun/') || location.pathname.includes('/inceleme/')
      || location.pathname.includes('/rehber/') || location.pathname.includes('/liste/')
      ? '../sw.js' : './sw.js';
    navigator.serviceWorker.register(swPath).catch(() => {
      // Sessizce başarısız ol — PWA olmadan da site normal çalışmaya devam etmeli.
    });
  });
}

// ============================================================
// 28 Eylül 2026: hosting WAF'ı bazı yanıtları (dosya boyutundan bağımsız,
// büyük ihtimalle sayfa yüklenirken oluşan eşzamanlı istek yoğunluğuna bağlı
// olarak) ARA SIRA KESİYOR — bu da shared.js'in yarım inmesine ve
// cardHTML/CATS gibi dosya sonuna yakın tanımların hiç çalışmamasına yol
// açabiliyor. Bu satıra ulaşıldıysa dosya SONUNA KADAR eksiksiz çalıştı
// demektir — sayfa sonundaki bütünlük kontrolü bunu kullanır.
if(typeof window !== 'undefined'){
  window.__tvLoaded = window.__tvLoaded || {};
  window.__tvLoaded.shared = true;
}
