'use strict';
const { installRedisMock } = require('../scripts/lib/redis-mock');
const handler = require('../api/glint.js');

let mock;
let ipCounter = 0;
const savedEnv = { ...process.env };

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    status(c) {
      this.statusCode = c;
      return this;
    },
    json(o) {
      this.body = o;
      return this;
    },
    end() {
      return this;
    },
  };
  return res;
}

/** Calls the handler like Vercel would. Every call gets its own client IP unless one is given. */
async function call(body, { method = 'POST', headers = {}, ip } = {}) {
  const res = makeRes();
  await handler(
    { method, body, headers: { host: 'glint.test', 'x-forwarded-for': ip || `10.0.0.${++ipCounter}`, ...headers } },
    res,
  );
  return res;
}

const rec = (over = {}) => ({
  name: 'Alice',
  avatar: 'a:1',
  salt: 'SALT',
  h: 'HASH',
  w: { iv: 'i', ct: 'c' },
  rs: 'rs',
  rw: { iv: 'i', ct: 'rw' },
  vault: { iv: 'i', ct: 'v' },
  mh: 'MH',
  created: 1,
  ...over,
});

let n = 0;
const signup = async (over) => {
  const id = `user${++n}${Date.now() % 1000}`;
  const r = await call({ op: 'signup', id, rec: rec(over) });
  return { id, tok: r.body.tok, res: r };
};

beforeEach(() => {
  process.env.UPSTASH_REDIS_REST_URL = 'http://redis-mock.local';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test';
  delete process.env.ALLOWED_ORIGINS;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  mock = installRedisMock();
});
afterEach(() => {
  mock.restore();
  process.env = { ...savedEnv };
});

describe('transport and configuration', () => {
  test('rejects non-POST methods with an Allow header', async () => {
    const r = await call(undefined, { method: 'GET' });
    expect(r.statusCode).toBe(405);
    expect(r.headers.allow).toMatch(/POST/);
  });

  test('reports a missing database clearly', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const r = await call({ op: 'salt', id: 'alice' });
    expect(r.statusCode).toBe(500);
    expect(r.body.error).toMatch(/Database not connected/);
  });

  test('also accepts the KV_REST_API_* variable names', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.KV_REST_API_URL = 'http://redis-mock.local';
    process.env.KV_REST_API_TOKEN = 'x';
    const r = await call({ op: 'salt', id: 'nobody1' });
    expect(r.statusCode).toBe(404);
  });

  test.each([[undefined], ['text'], [[1, 2]], [null]])('rejects a non-object body (%p)', async (body) => {
    const r = await call(body);
    expect(r.statusCode).toBe(400);
  });

  test('unknown operations need a session, then fail with 400', async () => {
    const { tok } = await signup();
    expect((await call({ op: 'nope', tok })).statusCode).toBe(400);
    expect((await call({ op: 'nope' })).statusCode).toBe(401);
  });

  test('never caches API responses', async () => {
    const r = await call({ op: 'salt', id: 'nobody1' });
    expect(r.headers['cache-control']).toBe('no-store');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
  });

  test('returns a generic 500 when the database fails', async () => {
    mock.restore();
    global.fetch = async () => ({ json: async () => ({ error: 'boom' }) });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const r = await call({ op: 'salt', id: 'alice' });
    expect(r.statusCode).toBe(500);
    expect(r.body).toEqual({ error: 'Server error' });
    expect(JSON.stringify(r.body)).not.toMatch(/boom/);
    spy.mockRestore();
  });
});

describe('CORS', () => {
  test('same-origin requests are allowed and echo the origin', async () => {
    const r = await call({ op: 'salt', id: 'nobody1' }, { headers: { origin: 'https://glint.test' } });
    expect(r.statusCode).toBe(404);
    expect(r.headers['access-control-allow-origin']).toBe('https://glint.test');
    expect(r.headers.vary).toMatch(/Origin/);
  });

  test('requests without an Origin header are allowed and get no CORS headers', async () => {
    const r = await call({ op: 'salt', id: 'nobody1' });
    expect(r.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('foreign origins are refused', async () => {
    const r = await call({ op: 'salt', id: 'alice' }, { headers: { origin: 'https://evil.example' } });
    expect(r.statusCode).toBe(403);
    expect(r.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('the opaque "null" origin (sandboxed frames) is refused', async () => {
    const r = await call({ op: 'salt', id: 'alice' }, { headers: { origin: 'null' } });
    expect(r.statusCode).toBe(403);
  });

  test('origins on ALLOWED_ORIGINS are accepted, including with a trailing slash in the setting', async () => {
    process.env.ALLOWED_ORIGINS = 'https://app.example.com/, https://other.example';
    const r = await call({ op: 'salt', id: 'nobody1' }, { headers: { origin: 'https://app.example.com' } });
    expect(r.statusCode).toBe(404);
    expect(r.headers['access-control-allow-origin']).toBe('https://app.example.com');
  });

  test('preflight succeeds for allowed origins and fails for others', async () => {
    const ok = await call(undefined, { method: 'OPTIONS', headers: { origin: 'https://glint.test' } });
    expect(ok.statusCode).toBe(204);
    expect(ok.headers['access-control-allow-methods']).toMatch(/POST/);
    expect(ok.headers['access-control-allow-headers']).toMatch(/Content-Type/i);
    const bad = await call(undefined, { method: 'OPTIONS', headers: { origin: 'https://evil.example' } });
    expect(bad.statusCode).toBe(403);
  });

  test('x-forwarded-host is honoured behind a proxy', async () => {
    const r = await call(
      { op: 'salt', id: 'nobody1' },
      { headers: { origin: 'https://glint.example.org', 'x-forwarded-host': 'glint.example.org' } },
    );
    expect(r.statusCode).toBe(404);
  });
});

describe('accounts', () => {
  test('signup stores the account and returns a session', async () => {
    const { res } = await signup();
    expect(res.statusCode).toBe(200);
    expect(res.body.tok).toEqual(expect.any(String));
  });

  test('refuses duplicate and malformed usernames', async () => {
    const id = 'duplicate1';
    expect((await call({ op: 'signup', id, rec: rec() })).statusCode).toBe(200);
    expect((await call({ op: 'signup', id: id.toUpperCase(), rec: rec() })).statusCode).toBe(409);
    expect((await call({ op: 'signup', id: 'a b', rec: rec() })).statusCode).toBe(400);
    expect((await call({ op: 'signup', id: 'abc', rec: rec() })).statusCode).toBe(400);
  });

  test('refuses incomplete or oversized account data', async () => {
    expect((await call({ op: 'signup', id: 'nodata1', rec: { name: 'x' } })).statusCode).toBe(400);
    const huge = rec({ vault: { iv: 'i', ct: 'x'.repeat(250000) } });
    expect((await call({ op: 'signup', id: 'huge1', rec: huge })).statusCode).toBe(400);
  });

  test('salt is public; unknown users get the same generic error as a wrong password', async () => {
    const { id } = await signup();
    expect((await call({ op: 'salt', id })).body.salt).toBe('SALT');
    expect((await call({ op: 'salt', id: 'nobody1' })).body.error).toBe('Wrong username or password');
    expect((await call({ op: 'login', id, h: 'WRONG' })).body.error).toBe('Wrong username or password');
  });

  test('login returns the encrypted record and a fresh session', async () => {
    const { id } = await signup();
    const r = await call({ op: 'login', id, h: 'HASH' });
    expect(r.statusCode).toBe(200);
    expect(r.body.rec.w).toEqual({ iv: 'i', ct: 'c' });
    expect(r.body.tok).toEqual(expect.any(String));
  });

  test('login is rate limited per client', async () => {
    const { id } = await signup();
    let last;
    for (let i = 0; i < 31; i++) last = await call({ op: 'login', id, h: 'x' }, { ip: '203.0.113.9' });
    expect(last.statusCode).toBe(429);
  });

  test('recovery material is available only when a recovery code exists', async () => {
    const a = await signup();
    expect((await call({ op: 'rec', id: a.id })).body.rec.rw).toEqual({ iv: 'i', ct: 'rw' });
    const b = await signup({ rw: undefined });
    expect((await call({ op: 'rec', id: b.id })).statusCode).toBe(404);
  });

  test('a recovery reset needs the right proof and signs every other device out', async () => {
    const { id, tok } = await signup();
    expect((await call({ op: 'reset', id, mh: 'nope', rec: {} })).statusCode).toBe(401);
    const r = await call({ op: 'reset', id, mh: 'MH', rec: { h: 'NEW', w: { iv: 'n', ct: 'n' }, salt: 'S2' } });
    expect(r.statusCode).toBe(200);
    expect((await call({ op: 'meta', tok })).statusCode).toBe(401);
    expect((await call({ op: 'meta', tok: r.body.tok })).statusCode).toBe(200);
    expect((await call({ op: 'login', id, h: 'NEW' })).statusCode).toBe(200);
    expect((await call({ op: 'login', id, h: 'HASH' })).statusCode).toBe(401);
  });

  test('logout revokes only that session', async () => {
    const { id } = await signup();
    const a = (await call({ op: 'login', id, h: 'HASH' })).body.tok;
    const b = (await call({ op: 'login', id, h: 'HASH' })).body.tok;
    await call({ op: 'logout', tok: a });
    expect((await call({ op: 'meta', tok: a })).statusCode).toBe(401);
    expect((await call({ op: 'meta', tok: b })).statusCode).toBe(200);
  });

  test('deleting an account needs the password, erases everything and frees the username', async () => {
    const { id, tok } = await signup();
    await call({ op: 'push', tok, blobs: { gemini_x: { t: 1, c: { iv: 'i', ct: 'c' } } } });
    expect((await call({ op: 'delete', tok, h: 'WRONG' })).statusCode).toBe(401);
    expect((await call({ op: 'delete', tok, h: 'HASH' })).statusCode).toBe(200);
    expect((await call({ op: 'salt', id })).statusCode).toBe(404);
    expect((await call({ op: 'meta', tok })).statusCode).toBe(401);
    const again = await call({ op: 'signup', id, rec: rec() });
    expect(again.statusCode).toBe(200);
    expect((await call({ op: 'meta', tok: again.body.tok })).body.meta).toEqual({});
  });
});

describe('encrypted sync', () => {
  test('push, then meta lists timestamps and get returns the blobs', async () => {
    const { tok } = await signup();
    await call({ op: 'push', tok, blobs: { gemini_all_chats: { t: 5, c: { iv: 'x', ct: 'y' } } } });
    const meta = await call({ op: 'meta', tok });
    expect(meta.body.meta).toEqual({ gemini_all_chats: 5 });
    expect(meta.body.blobs).toBeUndefined();
    const got = await call({ op: 'get', tok, keys: ['gemini_all_chats', 'missing'] });
    expect(got.body.blobs.gemini_all_chats.c.ct).toBe('y');
    expect(got.body.blobs.missing).toBeUndefined();
  });

  test('push can also update the account record', async () => {
    const { tok } = await signup();
    await call({ op: 'push', tok, rec: { avatar: 'a:9' } });
    expect((await call({ op: 'meta', tok })).body.rec.avatar).toBe('a:9');
  });

  test('chunked items are stored as separate parts and read back in batches', async () => {
    const { tok } = await signup();
    await call({
      op: 'push',
      tok,
      blobs: {
        gemini_bg_src: { t: 7, c: { iv: 'i', n: 2 } },
        'gemini_bg_src:p0': { t: 7, p: 'AAA' },
        'gemini_bg_src:p1': { t: 7, p: 'BBB' },
      },
    });
    const meta = (await call({ op: 'meta', tok })).body.meta;
    expect(meta['gemini_bg_src:p1']).toBe(7);
    const parts = await call({ op: 'get', tok, keys: ['gemini_bg_src:p0', 'gemini_bg_src:p1'] });
    expect(parts.body.blobs['gemini_bg_src:p0'].p + parts.body.blobs['gemini_bg_src:p1'].p).toBe('AAABBB');
  });

  test('invalid keys are ignored and oversized items are dropped', async () => {
    const { tok } = await signup();
    await call({
      op: 'push',
      tok,
      blobs: { 'bad key/x': { t: 1 }, big: { t: 1, c: { ct: 'x'.repeat(950000) } }, ok: { t: 1, c: {} } },
    });
    expect(Object.keys((await call({ op: 'meta', tok })).body.meta)).toEqual(['ok']);
  });

  test('get returns at most six keys per request', async () => {
    const { tok } = await signup();
    const blobs = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`k${i}`, { t: 1, c: {} }]));
    await call({ op: 'push', tok, blobs });
    const r = await call({ op: 'get', tok, keys: Object.keys(blobs) });
    expect(Object.keys(r.body.blobs)).toHaveLength(6);
  });

  test('every data operation needs a valid session', async () => {
    for (const op of ['push', 'meta', 'get', 'pull', 'tput', 'tdel', 'logout', 'delete']) {
      expect((await call({ op, tok: 'invalid' })).statusCode).toBe(401);
    }
  });

  test("one user cannot read another user's data", async () => {
    const a = await signup();
    const b = await signup();
    await call({ op: 'push', tok: a.tok, blobs: { gemini_secret: { t: 1, c: { ct: 'a-only' } } } });
    expect((await call({ op: 'meta', tok: b.tok })).body.meta).toEqual({});
    expect((await call({ op: 'get', tok: b.tok, keys: ['gemini_secret'] })).body.blobs).toEqual({});
  });
});

describe('team codes', () => {
  const TID = 'A'.repeat(24);
  const team = { salt: 's', d: { iv: 'i', ct: 'c' } };

  test('owner can publish; anyone with the code can fetch ciphertext only', async () => {
    const { tok } = await signup();
    expect((await call({ op: 'tput', tok, tid: TID, team })).statusCode).toBe(200);
    const r = await call({ op: 'tget', tid: TID });
    expect(r.body.team).toEqual(team);
    expect(r.body.team.owner).toBeUndefined();
    expect((await call({ op: 'tget', tid: 'B'.repeat(24) })).statusCode).toBe(404);
    expect((await call({ op: 'tget', tid: 'short' })).statusCode).toBe(404);
  });

  test('only the owner may change or remove a team', async () => {
    const owner = await signup();
    const other = await signup();
    await call({ op: 'tput', tok: owner.tok, tid: TID, team });
    expect(
      (await call({ op: 'tput', tok: other.tok, tid: TID, team: { ...team, d: { iv: 'x', ct: 'hijack' } } }))
        .statusCode,
    ).toBe(403);
    await call({ op: 'tdel', tok: other.tok, tid: TID });
    expect((await call({ op: 'tget', tid: TID })).body.team.d.ct).toBe('c');
    await call({ op: 'tdel', tok: owner.tok, tid: TID });
    expect((await call({ op: 'tget', tid: TID })).statusCode).toBe(404);
  });

  test('validates team payloads', async () => {
    const { tok } = await signup();
    expect((await call({ op: 'tput', tok, tid: 'short', team })).statusCode).toBe(400);
    expect((await call({ op: 'tput', tok, tid: TID, team: { salt: 's' } })).statusCode).toBe(400);
    expect((await call({ op: 'tput', tok, tid: TID, team: { salt: 's', d: 'x'.repeat(100001) } })).statusCode).toBe(
      400,
    );
  });

  test('deleting the owner account removes its teams', async () => {
    const { tok } = await signup();
    await call({ op: 'tput', tok, tid: TID, team });
    await call({ op: 'delete', tok, h: 'HASH' });
    expect((await call({ op: 'tget', tid: TID })).statusCode).toBe(404);
  });
});
