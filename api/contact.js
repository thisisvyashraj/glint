'use strict';
/* Contact form endpoint. The destination address comes from the CONTACT_TO environment
 * variable on the server, so it never appears in any page, script or API response. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

const send = (res, code, obj) => {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
};
const readBody = (req) =>
  new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (typeof req.body === 'string') {
      try {
        return resolve(JSON.parse(req.body));
      } catch {
        return resolve({});
      }
    }
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 20000) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
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
    const extra = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!same && !extra.includes(origin)) return send(res, 403, { error: 'Forbidden' });
  }
  const ip =
    String(req.headers['x-forwarded-for'] || '')
      .split(',')[0]
      .trim() ||
    (req.socket && req.socket.remoteAddress) ||
    'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return send(res, 429, { error: 'Too many messages. Please try again later.' });
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();

  const b = await readBody(req);
  if (b.website) return send(res, 200, { ok: true }); // honeypot: bots fill this in
  const name = clean(b.name, 80);
  const email = clean(b.email, 120);
  const topic = clean(b.topic, 40) || 'General';
  const message = clean(b.message, 4000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5)
    return send(res, 400, { error: 'Please enter a valid email and a message.' });

  const to = process.env.CONTACT_TO;
  const key = process.env.RESEND_API_KEY;
  if (!to || !key) return send(res, 503, { error: 'Messaging is not set up yet. Please try again later.' });
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'Glint <onboarding@resend.dev>',
        to: [to],
        reply_to: email,
        subject: `[Glint] ${topic}${name ? ' from ' + name : ''}`.replace(/[\r\n]/g, ' '),
        text: `Topic: ${topic}\nName: ${name || '-'}\nEmail: ${email}\n\n${message}`,
      }),
    });
    if (!r.ok) return send(res, 502, { error: 'Could not send your message. Please try again.' });
    return send(res, 200, { ok: true });
  } catch {
    return send(res, 502, { error: 'Could not send your message. Please try again.' });
  }
};
