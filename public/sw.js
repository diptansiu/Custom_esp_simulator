// Service worker for ESP Simulator Studio (offline shell)
//
// Cache strategy:
//  - Navigations (HTML shell) are network-first, so a server update (new
//    assets, new Content-Security-Policy) is picked up immediately. The
//    cached shell is only used when the network is unavailable.
//  - Other static assets use stale-while-revalidate for fast loads offline.
const CACHE = 'esp-sim-v9';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/manifest.json',
  '/icons/icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Don't cache API or SSE
  if (url.pathname.startsWith('/api/')) return;

  const isShell = req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html');

  if (isShell) {
    // Network-first: keeps the installed PWA in sync with the server shell,
    // including response headers such as the Content-Security-Policy.
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
