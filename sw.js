
const CACHE_NAME = 'applfault-offline-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './app.js',
  './assets/dedup.json',
  './assets/records_full.json',
  './assets/grouped_full.json',
  './assets/atp_var_enums_dedup.xlsx',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k === CACHE_NAME ? null : caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Try cache first (ignore query for JSON/Excel), then network
  event.respondWith((async () => {
    const isData = url.pathname.endsWith('.json') || url.pathname.endsWith('.xlsx');
    const match = await caches.match(event.request, { ignoreSearch: isData });
    if (match) return match;
    try {
      const resp = await fetch(event.request);
      // Runtime cache GET requests
      if (event.request.method === 'GET' && resp && resp.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, resp.clone());
      }
      return resp;
    } catch (e) {
      // Offline fallback for navigations
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      throw e;
    }
  })());
});
