# PrizeVault (Next.js)

Vercel **Root Directory** must be `frontend` (this folder).

## Vercel project settings (required)

In **Project → Settings → Build & Deployment**:

| Setting | Value |
|---------|--------|
| Framework Preset | **Next.js** |
| Root Directory | `frontend` |
| Build Command | `next build` (or default) |
| Output Directory | **leave empty** (do **not** use `dist`) |
| Install Command | `npm install` (default) |

If Output Directory is still `dist` from the old Vite app, the build will succeed then fail with “No Output Directory named dist”. Clear that field and redeploy.

## Env vars

Set in Vercel → Settings → Environment Variables:

- `SOROBAN_CONTRACT_ID`
- `SPONSOR_SECRET_KEY`
- `ORGANIZER_SECRET_KEY`
- `STELLAR_RPC_URL` (optional)

## Local

```bash
# from prizevault/
npm run dev
# → http://localhost:3000
```
