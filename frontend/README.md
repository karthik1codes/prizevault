# PrizeVault (Next.js)

Vercel **Root Directory** must be `frontend` (this folder).

```bash
# from prizevault/
npm run dev
# → http://localhost:3000
```

Set these in Vercel Project → Settings → Environment Variables (and local `.env` / `frontend/.env.local`):

- `SOROBAN_CONTRACT_ID`
- `SPONSOR_SECRET_KEY`
- `ORGANIZER_SECRET_KEY`
- `STELLAR_RPC_URL` (optional)
