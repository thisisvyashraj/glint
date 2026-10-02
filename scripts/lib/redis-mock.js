'use strict';
/**
 * Minimal in-memory stand-in for the Upstash Redis REST API.
 * Only the commands api/glint.js uses are implemented. TTLs are accepted but not enforced.
 * Used by the local dev server (when no real database is configured) and by the Jest tests.
 */
function createStore() {
  const kv = new Map();
  function run(command, ...a) {
    const key = a[0];
    switch (String(command).toUpperCase()) {
      case 'GET':
        return kv.has(key) ? kv.get(key) : null;
      case 'SET':
        kv.set(key, a[1]);
        return 'OK';
      case 'SETNX':
        if (kv.has(key)) return 0;
        kv.set(key, a[1]);
        return 1;
      case 'INCR':
        kv.set(key, (kv.get(key) || 0) + 1);
        return kv.get(key);
      case 'EXPIRE':
        return 1;
      case 'DEL':
        return kv.delete(key) ? 1 : 0;
      case 'HSET': {
        const m = kv.get(key) || new Map();
        m.set(a[1], a[2]);
        kv.set(key, m);
        return 1;
      }
      case 'HGETALL': {
        const m = kv.get(key);
        return m ? [...m].flat() : [];
      }
      case 'HMGET': {
        const m = kv.get(key);
        return a.slice(1).map((f) => (m && m.has(f) ? m.get(f) : null));
      }
      case 'SADD': {
        const s = kv.get(key) || new Set();
        s.add(a[1]);
        kv.set(key, s);
        return 1;
      }
      case 'SMEMBERS':
        return [...(kv.get(key) || [])];
      case 'SREM': {
        const s = kv.get(key);
        if (s) s.delete(a[1]);
        return 1;
      }
      default:
        throw new Error('redis-mock: unsupported command ' + command);
    }
  }
  return { kv, run, clear: () => kv.clear() };
}

/** Replaces global.fetch so POSTs to `url` are answered by the in-memory store. Returns a handle. */
function installRedisMock(url = 'http://redis-mock.local') {
  const store = createStore();
  const realFetch = global.fetch;
  global.fetch = async (u, opts) => {
    if (u !== url) return realFetch(u, opts);
    const [command, ...args] = JSON.parse(opts.body);
    let payload;
    try {
      payload = { result: store.run(command, ...args) };
    } catch (e) {
      payload = { error: e.message };
    }
    return { json: async () => payload };
  };
  return { url, store, restore: () => (global.fetch = realFetch) };
}

module.exports = { createStore, installRedisMock };
