// TeknoVersus Service Worker
// ------------------------------------------------------------
// BİLİNÇLİ KISITLAMA: Bu service worker SADECE değişmeyen statik
// varlıkları (CSS, JS, ikonlar) önbelleğe alır. HTML sayfalarını ve
// Supabase API çağrılarını ASLA önbelleklemez — çünkü ürün fiyatları,
// stok durumu ve yorumlar sürekli güncellenen canlı veriler. Bunları
// önbelleklemek, kullanıcıya eski/yanlış fiyat göstermek gibi ciddi
// bir güven sorununa yol açar.
const CACHE_NAME = 'teknoversus-static-v1';
const STATIC_ASSETS = [
  '/styles.css',
  '/shared.js',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
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
  const url = new URL(event.request.url);

  // Sadece kendi statik varlıklarımız için cache-first, network fallback.
  // HTML sayfaları, Supabase istekleri ve diğer her şey her zaman ağdan
  // (network) gelir — hiçbir zaman önbellekten sunulmaz.
  const isStaticAsset = STATIC_ASSETS.some((path) => url.pathname === path);
  if (!isStaticAsset) return; // tarayıcının normal davranışına bırak

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
