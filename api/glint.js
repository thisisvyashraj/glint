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
  await R('SADD', 'st:' + id, tok);
  await R('EXPIRE', 'st:' + id, 60 * 60 * 24 * 30);
  return tok;
}
async function revokeAll(id) {
  const toks = (await R('SMEMBERS', 'st:' + id)) || [];
  for (const t of toks) await R('DEL', 's:' + t);
  await R('DEL', 'st:' + id);
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
      case 'tget': { // team records are ciphertext; the 96-bit code is the secret
        if (!(await limit(req, 'tg', 120))) return fail(res, 429, 'Too many attempts, try again later');
        const tid = String(b.tid || '');
        const v = /^[A-Za-z0-9]{24}$/.test(tid) && await R('GET', 't:' + tid);
        if (!v) return fail(res, 404, 'No team found for that code');
        const t = JSON.parse(v);
        return res.json({ team: { salt: t.salt, d: t.d } });
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
        await revokeAll(id);
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
        if (/^[\w.:-]{1,120}$/.test(k) && s.length < 900000) { await R('HSET', 'b:' + uid, k, s); await R('HSET', 'm:' + uid, k, String(v.t || 0)); }
      }
      return res.json({ ok: true });
    }
    if (b.op === 'meta') { // tiny: record + {key: timestamp}; blobs are fetched separately in small batches
      const flat = (await R('HGETALL', 'm:' + uid)) || [], meta = {};
      for (let i = 0; i < flat.length; i += 2) meta[flat[i]] = +flat[i + 1];
      return res.json({ rec: await getRec(uid), meta });
    }
    if (b.op === 'get') {
      const ks = (Array.isArray(b.keys) ? b.keys : []).filter(k => /^[\w.:-]{1,120}$/.test(k)).slice(0, 6), blobs = {};
      if (ks.length) { const vs = await R('HMGET', 'b:' + uid, ...ks); ks.forEach((k, i) => { if (vs[i]) blobs[k] = JSON.parse(vs[i]); }); }
      return res.json({ blobs });
    }
    if (b.op === 'tput') {
      const tid = String(b.tid || ''), t = b.team || {};
      if (!/^[A-Za-z0-9]{24}$/.test(tid) || !t.salt || !t.d) return fail(res, 400, 'Bad team data');
      const cur = await R('GET', 't:' + tid);
      if (cur && JSON.parse(cur).owner !== uid) return fail(res, 403, 'That team belongs to someone else');
      const s = JSON.stringify({ owner: uid, salt: t.salt, d: t.d });
      if (s.length > 100000) return fail(res, 400, 'Team data too large');
      await R('SET', 't:' + tid, s); await R('SADD', 'ut:' + uid, tid);
      return res.json({ ok: true });
    }
    if (b.op === 'tdel') {
      const tid = String(b.tid || ''), cur = /^[A-Za-z0-9]{24}$/.test(tid) && await R('GET', 't:' + tid);
      if (cur && JSON.parse(cur).owner === uid) { await R('DEL', 't:' + tid); await R('SREM', 'ut:' + uid, tid); }
      return res.json({ ok: true });
    }
    if (b.op === 'logout') {
      await R('DEL', 's:' + b.tok); await R('SREM', 'st:' + uid, b.tok);
      return res.json({ ok: true });
    }
    if (b.op === 'delete') { // permanent: needs the session AND the password verifier
      if (!(await limit(req, 'del', 10))) return fail(res, 429, 'Too many attempts, try again later');
      const u = await getRec(uid);
      if (!u || !eq(u.h, b.h)) return fail(res, 401, 'Wrong password');
      await R('DEL', 'u:' + uid); await R('DEL', 'b:' + uid); await R('DEL', 'm:' + uid);
      for (const tid of ((await R('SMEMBERS', 'ut:' + uid)) || [])) await R('DEL', 't:' + tid);
      await R('DEL', 'ut:' + uid);
      await revokeAll(uid);
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
