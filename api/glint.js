// Glint cloud API — accounts + encrypted sync. The server only ever stores ciphertext:
// the master key never leaves the browser. Storage: Upstash Redis (free, via Vercel Marketplace).
const crypto = require('crypto');
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOK_ = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const R = (...c) => fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOK_ }, body: JSON.stringify(c) })
  .then(r => r.json()).then(j => { if (j.error) throw new Error(j.error); return j.result; });
const eq = (a, b) => { a = Buffer.from(String(a)); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const ID = /^[a-z0-9_.-]{4,32}$/;
const FIELDS = ['name', 'avatar', 'salt', 'h', 'w', 'rs', 'rw', 'vault', 'vt', 'mh', 'created'];
const pick = o => Object.fromEntries(FIELDS.filter(k => o && o[k] !== undefined).map(k => [k, o[k]]));
const fail = (res, code, error) => res.status(code).json({ error });

async function limit(req, key, max) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  const k = `rl:${key}:${ip}`, n = await R('INCR', k);
  if (n === 1) await R('EXPIRE', k, 900);
  return n <= max;
}
async function session(id) {
  const tok = crypto.randomBytes(32).toString('base64url');
  await R('SET', 's:' + tok, id, 'EX', 60 * 60 * 24 * 30);
  return tok;
}
const getRec = async id => { const v = await R('GET', 'u:' + id); return v ? JSON.parse(v) : null; };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'POST only');
  if (!URL_ || !TOK_) return fail(res, 500, 'Database not connected (add Upstash Redis in Vercel → Storage)');
  try {
    const b = req.body || {}, id = String(b.id || '').toLowerCase();
    switch (b.op) {
      case 'salt': { // public: only the KDF salt
        const u = ID.test(id) && await getRec(id);
        if (!u) return fail(res, 404, 'Wrong username or password');
        return res.json({ salt: u.salt });
      }
      case 'rec': { // public: only recovery-wrapped material (safe: 100-bit random code)
        const u = ID.test(id) && await getRec(id);
        if (!u || !u.rw) return fail(res, 404, 'No recovery code exists for this account');
        return res.json({ rec: { name: u.name, avatar: u.avatar, rs: u.rs, rw: u.rw, salt: u.salt } });
      }
      case 'signup': {
        if (!(await limit(req, 'su', 20))) return fail(res, 429, 'Too many attempts, try again later');
        if (!ID.test(id)) return fail(res, 400, 'Username must be 4-32 characters: letters, numbers, . _ -');
        const rec = pick(b.rec), s = JSON.stringify(rec);
        if (!rec.h || !rec.w || !rec.vault || s.length > 200000) return fail(res, 400, 'Bad account data');
        if (!(await R('SETNX', 'u:' + id, s))) return fail(res, 409, 'That username is already taken');
        return res.json({ tok: await session(id) });
      }
      case 'login': {
        if (!(await limit(req, 'li', 30))) return fail(res, 429, 'Too many attempts, try again in 15 minutes');
        const u = ID.test(id) && await getRec(id);
        if (!u || !eq(u.h, b.h)) return fail(res, 401, 'Wrong username or password');
        return res.json({ tok: await session(id), rec: u });
      }
      case 'reset': { // proof = sha256 of the master key, obtainable only with the recovery code
        if (!(await limit(req, 'rs', 10))) return fail(res, 429, 'Too many attempts, try again later');
        const u = ID.test(id) && await getRec(id);
        if (!u || !u.mh || !eq(u.mh, b.mh)) return fail(res, 401, 'Invalid recovery code');
        const n = { ...u, ...pick(b.rec), mh: u.mh, vt: Date.now() };
        await R('SET', 'u:' + id, JSON.stringify(n));
        return res.json({ tok: await session(id), rec: n });
      }
    }
    // everything below needs a session token
    const uid = b.tok && await R('GET', 's:' + b.tok);
    if (!uid) return fail(res, 401, 'Session expired');
    if (b.op === 'push') {
      if (b.rec) {
        const u = await getRec(uid), n = { ...u, ...pick(b.rec), mh: u.mh || b.rec.mh };
        if (JSON.stringify(n).length < 200000) await R('SET', 'u:' + uid, JSON.stringify(n));
      }
      for (const [k, v] of Object.entries(b.blobs || {})) {
        const s = JSON.stringify(v);
        if (/^[\w.:-]{1,120}$/.test(k) && s.length < 900000) await R('HSET', 'b:' + uid, k, s);
      }
      return res.json({ ok: true });
    }
    if (b.op === 'pull') {
      const flat = (await R('HGETALL', 'b:' + uid)) || [], blobs = {};
      for (let i = 0; i < flat.length; i += 2) blobs[flat[i]] = JSON.parse(flat[i + 1]);
      return res.json({ rec: await getRec(uid), blobs });
    }
    return fail(res, 400, 'Unknown operation');
  } catch (e) {
    return fail(res, 500, 'Server error');
  }
};
