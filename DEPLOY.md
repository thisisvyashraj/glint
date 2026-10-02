# Deploying Glint to Vercel

Everything here fits the **free** Vercel Hobby plan and Upstash's free Redis tier.

## Prerequisites

| Need                     | Notes                                                                |
| ------------------------ | -------------------------------------------------------------------- |
| GitHub account           | Hosts the repo; also runs CI                                         |
| Vercel account (Hobby)   | Sign in with GitHub                                                  |
| Upstash Redis database   | Created from Vercel's Storage tab (Marketplace); free plan is enough |
| Node.js 20+ (local only) | Only needed to run `npm run verify` before pushing                   |

## Environment variables

Set these in **Vercel -> Project -> Settings -> Environment Variables** (Production, Preview and Development).

| Variable                                | Required | Value                                                                                                            |
| --------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Yes      | Added automatically when you connect Upstash from the Storage tab. `UPSTASH_REDIS_REST_URL` / `_TOKEN` also work |
| `ALLOWED_ORIGINS`                       | No       | Comma-separated extra origins that may call the API, e.g. `https://glint.example.com`. Leave empty normally      |

Rules of thumb: never commit `.env`, never paste tokens into source files, and rotate the Upstash token (Upstash console, then update Vercel and redeploy) if it ever leaks.

## First deployment

1. **Push the code** to a GitHub repository (private is fine). The repo root must contain `public/`, `api/`, `vercel.json`, `package.json` and `package-lock.json`.
2. **Import it**: Vercel -> Add New -> Project -> pick the repo. Leave the framework preset on **Other**. The build command (`npm run build`) and output directory (`public`) come from `vercel.json`. Click **Deploy**.
3. **Add the database**: project -> **Storage** -> Create Database -> **Upstash Redis** -> Free plan -> connect it to the project for all environments.
4. **Redeploy once** (Deployments -> latest -> menu -> Redeploy) so the function sees the new variables.
5. **Verify** (see the checklist below).

`npm run build` is a validation step, not a bundler: it fails the deployment if an inline script does not compile, an icon is missing or the wrong size, the service worker precaches a file that does not exist, or a required security header is absent. That is the point: a broken build never reaches users.

## Choosing how deployments are gated

### Option A: simple (recommended to start)

Vercel's GitHub integration deploys on every push. To make CI a real gate, enable GitHub **branch protection** on `main` (Settings -> Branches) and require the **CI** checks to pass before merging pull requests. Merging only happens when lint, tests and build are green, and the merge triggers the deployment.

### Option B: deploy only after CI succeeds

`.github/workflows/deploy.yml` deploys with the Vercel CLI after the CI workflow succeeds on `main`. It is inert until you opt in:

1. GitHub -> Settings -> Secrets and variables -> Actions:
   - Secrets: `VERCEL_TOKEN` (Vercel -> Account Settings -> Tokens), `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (both in `.vercel/project.json` after running `npx vercel link` locally, or in the project settings).
   - Variable: `ENABLE_VERCEL_ACTIONS_DEPLOY` = `true`.
2. Vercel -> Project -> Settings -> Git -> disable automatic production deployments (or set an Ignored Build Step of `exit 0`). Otherwise Vercel also deploys on every push and the gate is bypassed.

## Post-deployment checklist

- [ ] The site loads and the tab title is **Glint**.
- [ ] Create an account, save the recovery code, add an API key in Settings.
- [ ] Sign in from a second device or browser: chats, keys and background image appear.
- [ ] `curl -sI https://<your-domain>/` shows `content-security-policy`, `strict-transport-security`, `x-frame-options: DENY` and `x-content-type-options: nosniff`.
- [ ] `curl -s -X POST https://<your-domain>/api/glint -H 'Origin: https://evil.example' -H 'content-type: application/json' -d '{}'` returns **403**.
- [ ] Chrome DevTools -> Application: manifest has no warnings, the service worker is activated, and "Offline" mode still loads the app.
- [ ] The browser console shows no `Content Security Policy` errors while you use chat, the Townhall and a code preview.

## Updating

Commit to a branch, open a pull request, let CI go green, merge. Vercel redeploys; accounts and data live in Upstash and are untouched. When you change cached files, bump `VERSION` in `public/sw.js` so every client drops its old caches. Open tabs show a "Glint was updated" toast.

## Rolling back

Vercel -> Deployments -> pick a previous deployment -> **Promote to Production** (instant, no rebuild).

## Custom domain

Vercel -> Project -> Settings -> Domains -> add the domain and follow the DNS instructions. If the API will also be called from another origin, add it to `ALLOWED_ORIGINS`.

## Troubleshooting

| Symptom                                     | Cause and fix                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Database not connected"                    | Upstash not connected, or you did not redeploy after connecting it. Do steps 3 and 4.                                                                                                                                                                                                                                           |
| Build fails with "Build validation failed"  | Read the listed problems; run `npm run build` locally for the same message.                                                                                                                                                                                                                                                     |
| A feature breaks only on the deployed site  | Open the console for `Content Security Policy` messages. To investigate safely, rename the header key `Content-Security-Policy` to `Content-Security-Policy-Report-Only` in `vercel.json`, redeploy, and the browser will log violations without blocking. Then add the needed host to the right directive and restore the key. |
| Code previews that load a library fail      | Previews inherit the page CSP. Add the CDN to `script-src` (already allowed: cdnjs, jsDelivr, unpkg, Tailwind CDN).                                                                                                                                                                                                             |
| Sign-in says wrong password on a new device | Usernames are case-insensitive; passwords are not.                                                                                                                                                                                                                                                                              |
| Old version keeps appearing                 | Bump `VERSION` in `public/sw.js`; a hard reload (Shift+Reload) also clears it once.                                                                                                                                                                                                                                             |
| Upstash limits reached                      | The free tier has monthly command and bandwidth quotas; upgrade or reduce sync frequency.                                                                                                                                                                                                                                       |
