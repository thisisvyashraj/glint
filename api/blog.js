'use strict';
/* Blog likes and comments. Uses the same Upstash Redis as the rest of Glint when it is configured,
 * otherwise falls back to in-process memory (fine for local development, not durable on serverless). */
const R = {
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
};
const SLUG = /^[a-z0-9-]{3,80}$/;
const URLISH = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|ru|xyz|info|biz|top|site|online|shop|link)\b)/i;

const send = (res, code, obj) => {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
};
const readBody = (req) =>
  new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let d = '';
    req.on('data', (c) => {
      d += c;
      if (d.length > 20000) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(d));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
const clean = (s, n) =>
  [...String(s || '')]
    .filter((ch) => ch === '\n' || ch === '\t' || ch.charCodeAt(0) >= 32)
    .join('')
    .trim()
    .slice(0, n);
const flat = (a) => {
  const o = {};
  for (let i = 0; i < (a || []).length; i += 2) o[a[i]] = Number(a[i + 1]) || 0;
  return o;
};

/* Single-command REST call: works with Upstash and with the local mock. Only portable commands are used. */
const local = new Map();
function runLocal(cmd, ...a) {
  const k = a[0];
  switch (cmd) {
    case 'SADD': {
      const s = local.get(k) || new Set();
      s.add(a[1]);
      local.set(k, s);
      return 1;
    }
    case 'SREM': {
      const s = local.get(k);
      return s && s.delete(a[1]) ? 1 : 0;
    }
    case 'SMEMBERS':
      return [...(local.get(k) || [])];
    case 'HSET': {
      const m = local.get(k) || new Map();
      m.set(a[1], a[2]);
      local.set(k, m);
      return 1;
    }
    case 'HGETALL':
      return local.has(k) ? [...local.get(k)].flat() : [];
    case 'INCR':
      local.set(k, (Number(local.get(k)) || 0) + 1);
      return local.get(k);
    default:
      return 1;
  }
}
async function rc(...cmd) {
  if (!R.url) return runLocal(...cmd);
  const r = await fetch(R.url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + R.token, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const VID = /^[a-zA-Z0-9-]{8,64}$/;

const store = {
  async counts() {
    const [l, c] = await Promise.all([rc('HGETALL', 'blog:likes'), rc('HGETALL', 'blog:cc')]);
    return { likes: flat(l), comments: flat(c) };
  },
  async page(slug, vid) {
    const [m, c] = await Promise.all([rc('SMEMBERS', 'blog:lk:' + slug), rc('HGETALL', 'blog:c:' + slug)]);
    const comments = [];
    for (let i = 1; i < (c || []).length; i += 2) {
      try {
        comments.push(JSON.parse(c[i]));
      } catch {
        /* skip bad entry */
      }
    }
    comments.sort((x, y) => y.ts - x.ts);
    return { likes: (m || []).length, liked: !!vid && (m || []).includes(vid), comments: comments.slice(0, 100) };
  },
  async like(slug, vid, on) {
    await rc(on ? 'SADD' : 'SREM', 'blog:lk:' + slug, vid);
    const n = ((await rc('SMEMBERS', 'blog:lk:' + slug)) || []).length;
    await rc('HSET', 'blog:likes', slug, n);
    return n;
  },
  async comment(slug, c) {
    await rc('HSET', 'blog:c:' + slug, c.id, JSON.stringify(c));
    const n = ((await rc('HGETALL', 'blog:c:' + slug)) || []).length / 2;
    await rc('HSET', 'blog:cc', slug, n);
  },
  async rate(key, max) {
    const n = await rc('INCR', 'blog:rl:' + key);
    if (n === 1) await rc('EXPIRE', 'blog:rl:' + key, 600);
    return n <= max;
  },
};

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const u = new URL(req.url, 'http://x');
      if (u.searchParams.get('counts')) return send(res, 200, await store.counts());
      const slug = u.searchParams.get('slug') || '';
      if (!SLUG.test(slug)) return send(res, 400, { error: 'Bad request' });
      return send(res, 200, await store.page(slug, u.searchParams.get('vid') || ''));
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return send(res, 405, { error: 'Method not allowed' });
    }
    const origin = req.headers.origin;
    if (origin) {
      const same = (() => {
        try {
          return new URL(origin).host === req.headers.host;
        } catch {
          return false;
        }
      })();
      if (!same) return send(res, 403, { error: 'Forbidden' });
    }
    const ip =
      String(req.headers['x-forwarded-for'] || '')
        .split(',')[0]
        .trim() ||
      (req.socket && req.socket.remoteAddress) ||
      'unknown';
    const b = await readBody(req);
    const slug = clean(b.slug, 80);
    if (!SLUG.test(slug)) return send(res, 400, { error: 'Bad request' });

    if (b.action === 'like' || b.action === 'unlike') {
      if (!(await store.rate('l:' + ip, 40))) return send(res, 429, { error: 'Slow down a little.' });
      const vid = clean(b.vid, 64);
      if (!VID.test(vid)) return send(res, 400, { error: 'Bad request' });
      return send(res, 200, { likes: await store.like(slug, vid, b.action === 'like') });
    }
    if (b.action === 'comment') {
      if (b.website) return send(res, 200, { ok: true }); // honeypot
      if (!(await store.rate('c:' + ip, 3)))
        return send(res, 429, { error: 'Too many comments. Please try again in a few minutes.' });
      const text = clean(b.text, 600);
      const name = clean(b.name, 40);
      if (text.length < 2) return send(res, 400, { error: 'Please write a comment first.' });
      if (URLISH.test(text) || URLISH.test(name))
        return send(res, 400, { error: 'Links are not allowed in comments.' });
      const comment = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: name || 'Reader',
        text,
        ts: Date.now(),
      };
      await store.comment(slug, comment);
      return send(res, 200, { ok: true, comment });
    }
    return send(res, 400, { error: 'Bad request' });
  } catch {
    return send(res, 500, { error: 'Something went wrong. Please try again.' });
  }
};
