# PrizeVault Web (Next.js)

Single process for **UI + Soroban escrow API**.

```bash
# from prizevault/
cp .env.example .env   # fill SPONSOR_SECRET_KEY, ORGANIZER_SECRET_KEY, SOROBAN_CONTRACT_ID
npm run dev            # → http://localhost:3000
```

| Route | UI |
|-------|-----|
| `/` | Landing |
| `/organizer` `/issuer` | Organizer console |
| `/verifier` | Sponsor console |
| `/holder` | Participant / wallet |

| API | Method |
|-----|--------|
| `/api/health` | GET |
| `/api/escrow/propose` | POST |
| `/api/escrow/approve` | POST |
| `/api/escrow/execute` | POST |

UI source: `src/client/` (`@frontend/*`). Backend Soroban helpers: `../src` (`@backend/*`).
