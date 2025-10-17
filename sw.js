
const CACHE_NAME = 'applfault-index-v7-1760669946';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/dedup.json',
  './assets/atp_var_enums_dedup.xlsx',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
self.addEventListener('install', (event) => { self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', (event) => { self.clients && self.clients.claim && self.clients.claim();
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
});
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
