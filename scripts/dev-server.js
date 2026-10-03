#!/usr/bin/env node
'use strict';
/**
 * Local development server: serves ./public, runs api/glint.js, and applies the same response
 * headers as production (vercel.json), so CSP problems show up here instead of after a deploy.
 *
 *   npm run dev          -> http://localhost:3000
 *
 * Database: if UPSTASH_REDIS_REST_URL / _TOKEN are set (see .env.example) the real database is used,
 * otherwise an in-memory mock is used and all data is lost when the server stops.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv(path.join(root, '.env'));

const hasDb =
  (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
  (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN);
if (!hasDb) {
  const { installRedisMock } = require('./lib/redis-mock');
  const mock = installRedisMock();
  process.env.UPSTASH_REDIS_REST_URL = mock.url;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'dev';
  console.log('No database configured: using an in-memory mock (data is lost on restart).');
}
const handler = require('../api/glint.js');

const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const headerRules = (vercel.headers || []).map((r) => ({
  re: new RegExp('^' + r.source.replace(/\(\.\*\)/g, '.*') + '$'),
  headers: r.headers,
}));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function send(res, code, body, type) {
  if (type) res.setHeader('Content-Type', type);
  res.statusCode = code;
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
  });
}

function createServer() {
  return http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(req.url.split('?')[0]);
    for (const rule of headerRules)
      if (rule.re.test(pathname)) for (const h of rule.headers) res.setHeader(h.key, h.value);

    if (pathname === '/api/glint') {
      let body;
      try {
        const raw = await readBody(req);
        body = raw ? JSON.parse(raw) : undefined;
      } catch {
        return send(res, 400, JSON.stringify({ error: 'Invalid JSON' }), 'application/json');
      }
      req.body = body;
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (obj) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(obj));
        return res;
      };
      return handler(req, res);
    }

    const file = path.normalize(path.join(root, 'public', pathname === '/' ? 'index.html' : /^\/c\/[\w-]+$/.test(pathname) ? 'app.html' : /^\/s\/[\w-]+$/.test(pathname) ? 'share.html' : (/^\/(chat|townhall|account|personalization|help|app)$/.test(pathname) ? 'app.html' : pathname)));
    if (!file.startsWith(path.join(root, 'public'))) return send(res, 403, 'Forbidden', 'text/plain');
    fs.readFile(file, (err, data) => {
      if (err) return send(res, 404, 'Not found', 'text/plain');
      send(res, 200, data, TYPES[path.extname(file)] || 'application/octet-stream');
    });
  });
}

module.exports = { createServer };

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, () => console.log(`Glint dev server: http://localhost:${port}`));
}
