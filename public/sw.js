/* Glint service worker
 *
 * Strategies
 *  - Navigations:   network first (so a new deploy shows up immediately) with a 4 s timeout and
 *                   navigation preload, falling back to the cached app shell, then /offline.html.
 *  - Static assets: stale-while-revalidate (instant from cache, refreshed in the background).
 *  - Google Fonts:  stale-while-revalidate, so typography survives a poor connection.
 *  - /api/* and every other cross-origin request (AI providers): never touched.
 *
 * Bump VERSION to invalidate every cache on the next deploy.
 */
const VERSION = 'v5';
const PRECACHE = `glint-precache-${VERSION}`;
const RUNTIME = `glint-runtime-${VERSION}`;
const PRECACHE_URLS = [
  '/',
  '/app',
  '/premium.css',
  '/premium.js',
  '/preloader.js',
  '/legal.css',
  '/site.js',
  '/privacy',
  '/terms',
  '/contact',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];
const NAV_TIMEOUT_MS = 4000;
const RUNTIME_MAX_ENTRIES = 60;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration && self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {
          /* not supported: fine */
        }
      }
      const keep = new Set([PRECACHE, RUNTIME]);
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith('glint-') && !keep.has(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const type = event.data && event.data.type;
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'GET_VERSION' && event.ports && event.ports[0]) event.ports[0].postMessage({ version: VERSION });
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

const APP_ROUTE = /^\/(chat|townhall|account|personalization|help|app|c\/[\w-]+)\/?$/;

async function networkFirstNavigation(event) {
  const cache = await caches.open(PRECACHE);
  const path = new URL(event.request.url).pathname;
  const shell = APP_ROUTE.test(path) ? '/app' : '/';
  try {
    const preload = event.preloadResponse ? await event.preloadResponse : undefined;
    const response = preload || (await withTimeout(fetch(event.request), NAV_TIMEOUT_MS));
    if (response && response.ok) event.waitUntil(cache.put(shell, response.clone()));
    return response;
  } catch {
    return (
      (await cache.match(shell)) || (await cache.match('/')) || (await cache.match('/offline.html')) || Response.error()
    );
  }
}

async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  const refresh = fetch(event.request)
    .then((response) => {
      // opaque (cross-origin no-cors) responses have status 0 and are fine to keep for fonts
      if (response && (response.ok || response.type === 'opaque')) {
        return cache.put(event.request, response.clone()).then(() => {
          trimCache(cacheName, RUNTIME_MAX_ENTRIES);
          return response;
        });
      }
      return response;
    })
    .catch(() => undefined);
  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  return (await refresh) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(event, RUNTIME));
    return;
  }
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(event));
    return;
  }
  event.respondWith(staleWhileRevalidate(event, RUNTIME));
});
