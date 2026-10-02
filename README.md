# Glint

A private, end-to-end encrypted workspace for Gemini, Groq and OpenRouter models: chat, compare models side by side, and run a live multi-model **Townhall**. It installs as an app (PWA), works offline, and syncs encrypted data across your devices.

- **Frontend:** one static page (`public/index.html`), no build step, no framework.
- **Backend:** one Vercel serverless function (`api/glint.js`) backed by Upstash Redis. It only ever stores ciphertext.
- **Tooling:** Jest, ESLint, Prettier, GitHub Actions.

## Project layout

```
public/
  index.html               the app
  sw.js                    service worker (offline + caching)
  offline.html             offline fallback page
  manifest.webmanifest     PWA manifest
  icons/                   192, 512, maskable and apple-touch icons
api/glint.js               accounts, encrypted sync, team codes
scripts/
  dev-server.js            local server (static files + API + production headers)
  check.js                 build validation, run by `npm run build`
  lib/redis-mock.js        in-memory Redis used by the dev server and the tests
tests/                     Jest unit and integration tests
.github/workflows/         CI, and an opt-in CI-gated deploy
vercel.json                security headers, caching, function settings
.env.example               environment variable template
```

## Local setup

Requirements: **Node.js 20 or newer** (`.nvmrc` pins 20) and npm.

```bash
git clone <your-repo-url> glint && cd glint
npm ci                    # installs exactly what package-lock.json says
cp .env.example .env      # optional, see below
npm run dev               # http://localhost:3000
```

With no database configured, `npm run dev` uses an **in-memory mock**, so you can sign up and try everything immediately; data disappears when you stop the server. To use a real database locally, put your Upstash REST URL and token in `.env`.

The dev server sends the **same security headers as production** (from `vercel.json`), so a Content-Security-Policy problem shows up on your machine rather than after a deploy.

### Scripts

| Command                 | What it does                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev` / `start` | Local server on `PORT` (default 3000)                                                 |
| `npm run build`         | Validates the deployable files (inline scripts compile, manifest, icons, SW, headers) |
| `npm test`              | Runs the Jest suite                                                                   |
| `npm run test:coverage` | Same, with coverage and thresholds                                                    |
| `npm run lint`          | ESLint (`lint:fix` to auto-fix)                                                       |
| `npm run format`        | Prettier (`format:check` to verify only)                                              |
| `npm run verify`        | Everything CI runs: lint, format check, tests with coverage, build                    |

### Environment variables

| Variable                            | Required      | Purpose                                                                     |
| ----------------------------------- | ------------- | --------------------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | In production | Upstash Redis REST credentials (`KV_REST_API_URL` / `_TOKEN` also work)     |
| `ALLOWED_ORIGINS`                   | No            | Extra origins allowed to call `/api/glint`. The site's own origin always is |
| `PORT`                              | No            | Dev server port                                                             |

Secrets live in `.env` locally (git-ignored) and in the Vercel dashboard in production. They are never in the source tree.

## Tests

`npm test` covers:

- **API** (`tests/api.test.js`): accounts, sessions, rate limiting, recovery reset, deletion, encrypted sync (including chunked items), team codes and ownership, strict CORS, and error handling, all against an in-memory Redis.
- **PWA** (`tests/pwa.test.js`): manifest and icon validity, and the real `sw.js` running in a sandbox with a fake Cache API (precache, cleanup, network-first navigation, stale-while-revalidate, offline fallback, bypass rules).
- **App and config** (`tests/app.test.js`): inline scripts compile, regression tests for bugs fixed along the way, and a check that every API host the app calls is allowed by the CSP.

## Security model

- Chats, API keys, settings and the background image are AES-GCM encrypted **in the browser** with a random master key.
- The master key is wrapped by your password (PBKDF2, 210k iterations) and by your recovery code. The server never sees either.
- The server stores ciphertext plus a login verifier, issues 30-day session tokens, and rate-limits login, signup, reset, delete and team lookups.
- Logout revokes the session. A recovery reset revokes every device.
- `/api/glint` is same-origin only. Other origins get `403` unless listed in `ALLOWED_ORIGINS`; there is no wildcard CORS anywhere.
- Team codes encrypt a copy of the owner's API keys. Anyone with the code can use those keys; the owner can revoke access by disbanding the team.
- If you lose both your password and your recovery code the data cannot be recovered. That is by design.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request, on Node 20 and 22: `npm ci`, lint, format check, tests with coverage, build. See [DEPLOY.md](DEPLOY.md) for gating deployments on it.

## Deploying

See **[DEPLOY.md](DEPLOY.md)**.
