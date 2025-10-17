const VERSION = 'v' + Date.now(); // bump on each deploy to purge old shell
const SHELL = 'vobc-shell-' + VERSION;
const RUNTIME = 'vobc-run';

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(SHELL_FILES.map(u => new Request(u, {cache:'reload'})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // clear old shells
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k.startsWith('vobc-shell-') && k !== SHELL) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const t = event.data && event.data.type;
  if(t === 'SKIP_WAITING'){ self.skipWaiting(); }
  if(t === 'WARMUP'){
    SHELL_FILES.forEach(u => fetch(u, {cache:'reload'}).catch(()=>{}));
    fetch('./assets/dedup.json?warm=' + Date.now(), {cache:'reload'}).catch(()=>{});
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);

  // Data: network-first, fallback cache (so UPDATE pulls fresh quickly)
  if(url.pathname.endsWith('/assets/dedup.json') || url.pathname === '/assets/dedup.json'){
    event.respondWith((async () => {
      try{
        const fresh = await fetch(new Request(req, {cache:'no-store'}));
        const c = await caches.open(RUNTIME);
        c.put(req, fresh.clone());
        return fresh;
      }catch{
        const c = await caches.open(RUNTIME);
        const hit = await c.match(req);
        return hit || new Response('[]', {headers:{'content-type':'application/json'}});
      }
    })());
    return;
  }

  // HTML: network-first -> cache fallback
  if(req.headers.get('accept')?.includes('text/html')){
    event.respondWith((async () => {
      try{
        const fresh = await fetch(req);
        const c = await caches.open(SHELL);
        c.put(req, fresh.clone());
        return fresh;
      }catch{
        const c = await caches.open(SHELL);
        return (await c.match('./index.html')) || fetch(req);
      }
    })());
    return;
  }

  // Others: stale-while-revalidate
  event.respondWith((async () => {
    const c = await caches.open(RUNTIME);
    const cached = await c.match(req);
    const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(()=>{});
    return cached || net || fetch(req);
  })());
});