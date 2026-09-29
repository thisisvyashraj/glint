# Glint on Vercel (free)

```
public/index.html   the app
api/glint.js        accounts + encrypted sync API
package.json
```

## Deploy (5 minutes, free)
1. Put this folder in a GitHub repo -> vercel.com -> **Add New Project** -> import it (Framework: *Other*, no build command).
2. In the project: **Storage -> Create Database -> Upstash Redis** (free tier) -> connect it to the project.
   Vercel adds `KV_REST_API_URL` / `KV_REST_API_TOKEN` automatically.
3. **Redeploy** once so the function sees the new env vars. Done - sign up on any device with the same username/password.

## How the security works
- Everything (chats, API keys, settings) is AES-GCM encrypted **in your browser** with a random master key.
- The master key is wrapped with your password (PBKDF2, 210k iterations) and with your recovery code. The server never sees either.
- The server stores only ciphertext + a login verifier, issues 30-day session tokens, and rate-limits login/signup/reset.
- **Lose both the password and the recovery code = data is unrecoverable** (by design).

## Notes
- Sync is last-write-wins per item (chats are one item), so avoid editing on two devices at the same second.
- Existing local-only accounts are uploaded automatically the first time you sign in after deploying.
- Deleting an account is not implemented yet.
