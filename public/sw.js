// Glint service worker: installable app + works offline. Never touches /api or other origins.
const V = 'glint-v2', SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  if (r.mode === 'navigate') { // network first so a new deploy shows up immediately; cache when offline
    e.respondWith(fetch(r).then(x => { const c = x.clone(); caches.open(V).then(k => k.put('/', c)); return x; }).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => { const net = fetch(r).then(x => { if (x.ok) { const c = x.clone(); caches.open(V).then(k => k.put(r, c)); } return x; }).catch(() => hit); return hit || net; }));
});
