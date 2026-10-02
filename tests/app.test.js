'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

describe('index.html', () => {
  test('the document title is exactly "Glint"', () => {
    expect(html).toMatch(/<title>Glint<\/title>/);
  });

  test('every inline script compiles', () => {
    const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
    expect(scripts.length).toBeGreaterThanOrEqual(4);
    scripts.forEach((m) => expect(() => new vm.Script(m[2])).not.toThrow());
  });

  test('startup scripts are isolated so one failure cannot stop the others', () => {
    expect(html).toMatch(/post=\(\)=>\{add\('gTown'\);add\('gPost'\)/);
    expect(html).toMatch(/safe\(loadSettings\); safe\(checkSharedURL\); safe\(loadChats\)/);
  });

  test('regression: renderMarkdown tolerates the late-loaded media helper', () => {
    expect(html).toMatch(/typeof gMediaMd === 'function'/);
  });

  test('regression: base64 helper survives payloads far above the argument-count limit', () => {
    const m = html.match(/const b64=b=>\{[^]*?return btoa\(t\)\}/);
    expect(m).not.toBeNull();
    const b64 = vm.runInNewContext(`(${m[0].replace(/^const b64=/, '')})`, { Uint8Array, String, btoa });
    const bytes = new Uint8Array(6 * 1024 * 1024).map((_, i) => i % 251);
    let out;
    expect(() => (out = b64(bytes))).not.toThrow();
    expect(Buffer.from(out, 'base64').equals(Buffer.from(bytes))).toBe(true);
  });

  test('regression: no spread into String.fromCharCode (breaks on large inputs)', () => {
    expect(html).not.toMatch(/String\.fromCharCode\(\.\.\./);
  });

  test('provider keys are covered by the encrypted-storage key pattern', () => {
    expect(html).toMatch(/\^\(gemini\|glint\|groq\|openrouter\|tavily\)_/);
  });

  test('the default avatar set offers 24 designs', () => {
    expect(html).toMatch(/Array\.from\(\{length:24\}/);
  });
});

describe('Content-Security-Policy', () => {
  const csp = vercel.headers.flatMap((r) => r.headers).find((h) => h.key === 'Content-Security-Policy').value;
  const directive = (name) =>
    (
      csp
        .split(';')
        .map((d) => d.trim())
        .find((d) => d.startsWith(name + ' ')) || ''
    )
      .split(/\s+/)
      .slice(1);

  test('every API host the app calls is allowed by connect-src', () => {
    const hosts = [...html.matchAll(/fetch\(\s*[`'"]https:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1]);
    expect(hosts.length).toBeGreaterThan(2);
    const allowed = directive('connect-src');
    for (const h of new Set(hosts)) {
      const ok = allowed.some((a) => a === `https://${h}` || (a.startsWith('https://*.') && h.endsWith(a.slice(9))));
      expect({ host: h, ok }).toEqual({ host: h, ok: true });
    }
  });

  test('is locked down where it matters', () => {
    expect(directive('default-src')).toEqual(["'self'"]);
    expect(directive('object-src')).toEqual(["'none'"]);
    expect(directive('base-uri')).toEqual(["'none'"]);
    expect(directive('frame-ancestors')).toEqual(["'none'"]);
    expect(csp).toMatch(/upgrade-insecure-requests/);
  });

  test('allows the fonts the page loads', () => {
    expect(directive('style-src')).toContain('https://fonts.googleapis.com');
    expect(directive('font-src')).toContain('https://fonts.gstatic.com');
  });
});

describe('vercel.json', () => {
  const flat = vercel.headers.flatMap((r) => r.headers.map((h) => [r.source, h.key, h.value]));
  const has = (key) => flat.some(([, k]) => k === key);

  test.each([
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Strict-Transport-Security',
    'Referrer-Policy',
    'Permissions-Policy',
  ])('sends %s', (k) => {
    expect(has(k)).toBe(true);
  });

  test('never uses a wildcard CORS header (CORS is enforced inside the function)', () => {
    expect(flat.some(([, k]) => /^access-control-allow-origin$/i.test(k))).toBe(false);
  });

  test('caches icons immutably, keeps the service worker fresh, never caches the API', () => {
    const val = (src, key) => (flat.find(([s, k]) => s === src && k === key) || [])[2];
    expect(val('/icons/(.*)', 'Cache-Control')).toMatch(/immutable/);
    expect(val('/sw.js', 'Cache-Control')).toMatch(/no-cache/);
    expect(val('/api/(.*)', 'Cache-Control')).toMatch(/no-store/);
  });

  test('builds with the validation script and serves ./public', () => {
    expect(vercel.buildCommand).toBe('npm run build');
    expect(vercel.outputDirectory).toBe('public');
  });
});
