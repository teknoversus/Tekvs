// TeknoVersus Service Worker
// ------------------------------------------------------------
// BİLİNÇLİ KISITLAMA: Bu service worker SADECE değişmeyen statik
// varlıkları (CSS, JS, ikonlar) önbelleğe alır. HTML sayfalarını ve
// Supabase API çağrılarını ASLA önbelleklemez — çünkü ürün fiyatları,
// stok durumu ve yorumlar sürekli güncellenen canlı veriler. Bunları
// önbelleklemek, kullanıcıya eski/yanlış fiyat göstermek gibi ciddi
// bir güven sorununa yol açar.
//
// Tek istisna: internet yokken bir sayfa açılmaya çalışılırsa, tarayıcının
// hata ekranı yerine /offline.html gösterilir (sayfa yine ağdan istenir,
// yalnızca istek başarısız olursa devreye girer).
const CACHE_NAME = 'teknoversus-static-v2';
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = [
  '/styles.css',
  '/shared.js',
  '/pwa.js',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  OFFLINE_URL,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, Analytics, reklamlar: dokunma

  // Sayfa açılışı: her zaman ağdan; ağ yoksa çevrimdışı sayfası.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Sadece kendi statik varlıklarımız için cache-first, network fallback.
  // (?v=... sürüm eki farklıysa önbellekte yoktur, ağdan gelir.)
  const isStaticAsset = STATIC_ASSETS.some((path) => url.pathname === path);
  if (!isStaticAsset) return; // tarayıcının normal davranışına bırak

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      });
    })
  );
});
