#!/usr/bin/env node
'use strict';
/**
 * Build validation (`npm run build`). Glint is a static site plus one serverless function, so
 * "building" means proving the deployable files are coherent. Pure Node, no dev dependencies,
 * so it also runs on Vercel. Exits non-zero on the first category of failure.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const errors = [];
const ok = (cond, msg) => {
  if (!cond) errors.push(msg);
};

function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// 1. index.html: title, every inline script compiles, essential hooks exist
const html = read('public/index.html');
ok(/<title>Glint<\/title>/.test(html), 'index.html <title> must be exactly "Glint"');
ok(/<link rel="manifest" href="\/manifest\.webmanifest"/.test(html), 'index.html must link the manifest');
ok(
  /<link rel="apple-touch-icon" href="\/icons\/apple-touch-icon\.png"/.test(html),
  'index.html must link the apple-touch-icon',
);
ok(/<meta name="viewport"[^>]*viewport-fit=cover/.test(html), 'viewport meta must include viewport-fit=cover');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
ok(scripts.length >= 4, 'expected the inline application scripts');
scripts.forEach((m, i) => {
  try {
    new vm.Script(m[2], { filename: `index.html#script${i}` });
  } catch (e) {
    errors.push(`inline script ${i} does not compile: ${e.message}`);
  }
});
['gMain', 'gTown', 'gPost'].forEach((id) => ok(html.includes(`id="${id}"`), `missing application script #${id}`));

// 2. Manifest + icons
let manifest = {};
try {
  manifest = JSON.parse(read('public/manifest.webmanifest'));
} catch (e) {
  errors.push('manifest.webmanifest is not valid JSON: ' + e.message);
}
['name', 'short_name', 'start_url', 'theme_color', 'background_color'].forEach((k) =>
  ok(manifest[k], `manifest is missing "${k}"`),
);
ok(manifest.display === 'standalone', 'manifest display must be "standalone"');
const icons = manifest.icons || [];
const has = (size, purpose) => icons.some((i) => i.sizes === size && (i.purpose || 'any').split(' ').includes(purpose));
ok(has('192x192', 'any'), 'manifest needs a 192x192 icon');
ok(has('512x512', 'any'), 'manifest needs a 512x512 icon');
ok(has('512x512', 'maskable'), 'manifest needs a 512x512 maskable icon');
for (const i of icons) {
  const f = path.join(root, 'public', i.src);
  if (!fs.existsSync(f)) {
    errors.push(`icon file missing: ${i.src}`);
    continue;
  }
  const s = pngSize(f);
  ok(
    s && `${s.w}x${s.h}` === i.sizes,
    `icon ${i.src} is ${s ? s.w + 'x' + s.h : 'not a PNG'}, manifest says ${i.sizes}`,
  );
}

// 3. Service worker + offline page
try {
  new vm.Script(read('public/sw.js'), { filename: 'sw.js' });
} catch (e) {
  errors.push('sw.js does not compile: ' + e.message);
}
const sw = read('public/sw.js');
['install', 'activate', 'fetch'].forEach((ev) =>
  ok(sw.includes(`addEventListener('${ev}'`), `sw.js must handle "${ev}"`),
);
ok(fs.existsSync(path.join(root, 'public/offline.html')), 'public/offline.html is missing (offline fallback)');
const precache = [...sw.matchAll(/'(\/[^']*)'/g)]
  .map((m) => m[1])
  .filter((u) => u === '/' || /\.(png|html|webmanifest)$/.test(u));
for (const u of precache)
  ok(u === '/' || fs.existsSync(path.join(root, 'public', u)), `sw.js precaches a missing file: ${u}`);

// 4. vercel.json
let vercel = {};
try {
  vercel = JSON.parse(read('vercel.json'));
} catch (e) {
  errors.push('vercel.json is not valid JSON: ' + e.message);
}
const allHeaders = (vercel.headers || []).flatMap((r) => r.headers.map((h) => `${h.key}:${h.value}`)).join('\n');
[
  'Content-Security-Policy',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Strict-Transport-Security',
  'Referrer-Policy',
  'Permissions-Policy',
].forEach((h) => ok(allHeaders.includes(h + ':'), `vercel.json is missing the ${h} header`));
ok(/frame-ancestors 'none'/.test(allHeaders), "CSP must contain frame-ancestors 'none'");
ok(
  !/Access-Control-Allow-Origin/i.test(allHeaders),
  'CORS must be enforced in api/glint.js, not by a wildcard header in vercel.json',
);

// 5. API module loads and exports a handler
try {
  ok(typeof require('../api/glint.js') === 'function', 'api/glint.js must export a function');
} catch (e) {
  errors.push('api/glint.js failed to load: ' + e.message);
}

if (errors.length) {
  console.error('\nBuild validation failed:\n' + errors.map((e) => '  - ' + e).join('\n') + '\n');
  process.exit(1);
}
console.log(
  `Build validation passed (${scripts.length} inline scripts, ${icons.length} icons, ${precache.length} precached files).`,
);
