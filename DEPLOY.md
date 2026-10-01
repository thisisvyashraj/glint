# Glint

```
public/index.html            the app
public/sw.js                 service worker (installable + offline)
public/manifest.webmanifest  PWA manifest
public/icons/                app icons
api/glint.js                 accounts, encrypted sync, team codes (Vercel function)
vercel.json                  security headers + caching
package.json
```

## Deploy to Vercel (free)
1. **GitHub**: new private repo, upload the *contents* of this folder (keep `public/`, `api/`, `vercel.json`, `package.json`).
2. **Vercel**: vercel.com -> Continue with GitHub -> Add New -> Project -> pick the repo. Framework Preset **Other**, leave build settings empty, Deploy.
3. **Database**: project -> Storage -> Create Database -> **Upstash Redis** (Free) -> connect to the project (all environments).
4. **Redeploy** once (Deployments -> ... -> Redeploy) so the API sees the database variables.
5. Open your `*.vercel.app` link, sign up, save your recovery code. Sign in on any other device with the same username + password.

## Updating an existing deployment
Replace the files in your GitHub repo (same paths) and commit. Vercel redeploys automatically. Your accounts and data live in Upstash and are untouched.
Open the site once on each device; a toast may say "Glint was updated, reload".
On first load after this update, provider keys (Groq, OpenRouter, Tavily) that were stored in plain text in that browser move into your encrypted vault and then sync to your other devices.
A team you created before this update is re-registered on the server the next time **you (the owner)** open Glint; after that the code works from any device.

## Security model
- Chats, API keys, settings and the background image are AES-GCM encrypted in the browser with a random master key.
- The master key is wrapped by your password (PBKDF2) and by your recovery code. The server never sees either.
- The server stores ciphertext + a login verifier, issues 30-day session tokens, and rate-limits login/signup/reset/delete/team lookups.
- Team codes: the code encrypts a copy of the owner's API keys; the server stores only that ciphertext. Anyone who has the code can use the owner's keys, and the owner can revoke it by disbanding the team.
- Losing both your password and your recovery code means the data cannot be recovered, by design.

## Troubleshooting
- "Database not connected": step 3/4 not done.
- Something looks off after an update: Account panel -> the "Startup notes" line lists any step that failed to start; send it along.
- The Upstash free plan has monthly command limits, which is plenty for personal use.
