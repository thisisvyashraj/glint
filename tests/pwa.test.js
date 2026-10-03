'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const pub = path.resolve(__dirname, '../public');
const manifest = JSON.parse(fs.readFileSync(path.join(pub, 'manifest.webmanifest'), 'utf8'));

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), isPng: b.toString('ascii', 1, 4) === 'PNG' };
}

describe('manifest', () => {
  test('is installable', () => {
    expect(manifest).toMatchObject({ name: 'Glint', short_name: 'Glint', display: 'standalone', scope: '/' });
    expect(manifest.start_url).toMatch(/^\//);
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test('maps the icon set: 192, 512, maskable and the apple-touch icon', () => {
    const find = (sizes, purpose) => manifest.icons.find((i) => i.sizes === sizes && i.purpose === purpose);
    expect(find('192x192', 'any')).toBeTruthy();
    expect(find('512x512', 'any')).toBeTruthy();
    expect(find('512x512', 'maskable')).toBeTruthy();
    expect(manifest.icons.find((i) => i.src === '/icons/apple-touch-icon.png')).toBeTruthy();
  });

  test('every icon exists and has the declared dimensions', () => {
    for (const icon of manifest.icons) {
      const f = path.join(pub, icon.src);
      expect(fs.existsSync(f)).toBe(true);
      const s = pngSize(f);
      expect(s.isPng).toBe(true);
      expect(`${s.w}x${s.h}`).toBe(icon.sizes);
    }
  });

  test('shortcuts point at actions the app understands', () => {
    const html = fs.readFileSync(path.join(pub, 'app.html'), 'utf8');
    for (const s of manifest.shortcuts) {
      const action = new URL(s.url, 'https://x.test').searchParams.get('action');
      expect(html).toContain(`a==='${action}'`);
    }
  });
});

/** Loads sw.js into a sandbox with a tiny fake Cache API and a controllable fetch. */
function loadServiceWorker() {
  const origin = 'https://glint.test';
  const key = (r) => new URL(typeof r === 'string' ? r : r.url, origin).href;
  const stores = new Map();
  class FakeCache {
    constructor() {
      this.map = new Map();
    }
    async match(r) {
      return this.map.get(key(r));
    }
    async put(r, res) {
      this.map.set(key(r), res);
    }
    async addAll(urls) {
      for (const u of urls) {
        const res = await sandbox.fetch(u);
        if (!res.ok) throw new Error('addAll failed for ' + u);
        this.map.set(key(u), res);
      }
    }
    async keys() {
      return [...this.map.keys()].map((url) => ({ url }));
    }
    async delete(r) {
      return this.map.delete(key(r));
    }
  }
  const caches = {
    async open(n) {
      if (!stores.has(n)) stores.set(n, new FakeCache());
      return stores.get(n);
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(n) {
      return stores.delete(n);
    },
    async match(r) {
      for (const c of stores.values()) {
        const hit = await c.match(r);
        if (hit) return hit;
      }
    },
  };
  const listeners = {};
  const state = { network: new Map(), offline: false, fetched: [], claimed: false, skipped: false };
  const sandbox = {
    URL,
    Response,
    Promise,
    setTimeout,
    clearTimeout,
    console,
    caches,
    fetch: async (r) => {
      const url = key(r);
      state.fetched.push(url);
      if (state.offline) throw new TypeError('Failed to fetch');
      const body = state.network.get(new URL(url).pathname);
      if (body === undefined) return new Response('missing', { status: 404 });
      return new Response(body, { status: 200 });
    },
    self: {
      location: { origin },
      registration: { navigationPreload: { enable: async () => {} } },
      clients: {
        claim: async () => {
          state.claimed = true;
        },
      },
      skipWaiting: async () => {
        state.skipped = true;
      },
      addEventListener: (type, fn) => (listeners[type] = fn),
    },
  };
  sandbox.self.caches = caches;
  vm.runInNewContext(fs.readFileSync(path.join(pub, 'sw.js'), 'utf8'), { ...sandbox, caches });
  const dispatch = async (type, extra = {}) => {
    const waits = [];
    let responded;
    const event = { waitUntil: (p) => waits.push(p), respondWith: (p) => (responded = p), ...extra };
    listeners[type](event);
    const response = responded ? await responded : undefined;
    await Promise.all(waits);
    return { response, handled: responded !== undefined, event };
  };
  return { state, stores, dispatch, caches, key, origin };
}

const PRECACHED = [
  '/',
  '/app',
  '/premium.css',
  '/premium.js',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];
const seedNetwork = (sw) => PRECACHED.forEach((p) => sw.state.network.set(p, `body of ${p}`));

describe('service worker', () => {
  test('install precaches the app shell and activates immediately', async () => {
    const sw = loadServiceWorker();
    seedNetwork(sw);
    await sw.dispatch('install');
    const cache = await sw.caches.open('glint-precache-v4');
    for (const p of PRECACHED) expect(await cache.match(p)).toBeTruthy();
    expect(sw.state.skipped).toBe(true);
  });

  test('install fails (and so retries later) if a precached file cannot be fetched', async () => {
    const sw = loadServiceWorker();
    await expect(sw.dispatch('install')).rejects.toThrow();
  });

  test('activate removes old Glint caches, keeps the current ones and foreign caches, and claims clients', async () => {
    const sw = loadServiceWorker();
    for (const n of ['glint-precache-v1', 'glint-runtime-v2', 'glint-precache-v4', 'glint-runtime-v4', 'someone-elses'])
      await sw.caches.open(n);
    await sw.dispatch('activate');
    expect((await sw.caches.keys()).sort()).toEqual(['glint-precache-v4', 'glint-runtime-v4', 'someone-elses']);
    expect(sw.state.claimed).toBe(true);
  });

  test('navigations are network-first and refresh the cached shell', async () => {
    const sw = loadServiceWorker();
    sw.state.network.set('/', 'fresh html');
    const { response } = await sw.dispatch('fetch', {
      request: { url: sw.origin + '/', method: 'GET', mode: 'navigate' },
    });
    expect(await response.text()).toBe('fresh html');
    const cached = await (await sw.caches.open('glint-precache-v4')).match('/');
    expect(await cached.text()).toBe('fresh html');
  });

  test('offline navigations fall back to the cached shell, then to the offline page', async () => {
    const sw = loadServiceWorker();
    seedNetwork(sw);
    await sw.dispatch('install');
    sw.state.offline = true;
    const nav = { url: sw.origin + '/chat', method: 'GET', mode: 'navigate' };
    expect(await (await sw.dispatch('fetch', { request: nav })).response.text()).toBe('body of /app');
    const pre = await sw.caches.open('glint-precache-v4');
    await pre.delete('/app');
    await pre.delete('/');
    expect(await (await sw.dispatch('fetch', { request: nav })).response.text()).toBe('body of /offline.html');
  });

  test('static assets use stale-while-revalidate', async () => {
    const sw = loadServiceWorker();
    const asset = { url: sw.origin + '/icons/icon-192.png', method: 'GET', mode: 'no-cors' };
    sw.state.network.set('/icons/icon-192.png', 'v1');
    expect(await (await sw.dispatch('fetch', { request: asset })).response.text()).toBe('v1'); // miss: network
    sw.state.network.set('/icons/icon-192.png', 'v2');
    sw.state.fetched.length = 0;
    expect(await (await sw.dispatch('fetch', { request: asset })).response.text()).toBe('v1'); // hit: instant stale copy
    expect(sw.state.fetched).toHaveLength(1); // ...while refreshing in the background
    expect(await (await sw.dispatch('fetch', { request: asset })).response.text()).toBe('v2'); // next time: fresh
  });

  test('a stale copy is still served when the network is gone', async () => {
    const sw = loadServiceWorker();
    const asset = { url: sw.origin + '/icons/icon-512.png', method: 'GET', mode: 'no-cors' };
    sw.state.network.set('/icons/icon-512.png', 'cached');
    await sw.dispatch('fetch', { request: asset });
    sw.state.offline = true;
    expect(await (await sw.dispatch('fetch', { request: asset })).response.text()).toBe('cached');
  });

  test('Google Fonts are cached the same way', async () => {
    const sw = loadServiceWorker();
    const font = { url: 'https://fonts.gstatic.com/s/x.woff2', method: 'GET', mode: 'no-cors' };
    const { handled } = await sw.dispatch('fetch', { request: font });
    expect(handled).toBe(true);
  });

  test('never touches the API, other origins, or non-GET requests', async () => {
    const sw = loadServiceWorker();
    const cases = [
      { url: sw.origin + '/api/glint', method: 'GET' },
      { url: sw.origin + '/api/glint', method: 'POST' },
      { url: 'https://api.groq.com/openai/v1/models', method: 'GET' },
      { url: sw.origin + '/icons/icon-192.png', method: 'PUT' },
    ];
    for (const request of cases) expect((await sw.dispatch('fetch', { request })).handled).toBe(false);
  });
});
