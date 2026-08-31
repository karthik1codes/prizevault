# Supabase setup (PrizeVault)

Project: **https://mjlbcskcsrxkjycjpdyh.supabase.co**

## 1. Run the schema (one time)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/mjlbcskcsrxkjycjpdyh/sql/new)
2. Paste and run: `supabase/migrations/001_prizevault_schema.sql`
3. Then run: `supabase/migrations/002_participants_rls.sql` (enables `participants` RLS + `hackathon_registrations` table)
4. Then run: `supabase/migrations/003_payouts_rls.sql` (enables `payouts` RLS + unique index per proposal/winner)

## 2. Environment variables

Already in `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mjlbcskcsrxkjycjpdyh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_jM9a3lNktIjheG6joFKvYw_G8PcKjPx
```

Add the same to **Vercel → Environment Variables** and redeploy.

Optional (production): `SUPABASE_SERVICE_ROLE_KEY` for server-only admin access with tighter RLS.

## 3. API routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/hackathons` | List hackathons (`?organizer=G...` `?sponsor=G...`) |
| POST | `/api/hackathons` | Create hackathon |
| PATCH | `/api/hackathons/[id]` | Update hackathon |
| GET | `/api/proposals` | List payout proposals |
| PUT | `/api/proposals` | Bulk sync proposals |
| POST | `/api/proposals` | Create proposal |

The UI still caches to `localStorage` as fallback when Supabase is unavailable.

## 4. Tables

- `hackathons` — main event data + JSON `payload` (participants, winners)
- `participants` — global wallet profiles (`full_name`, `payout_wallet_address` required)
- `hackathon_registrations` — per-event roster with `status` (registered / shortlisted / winner)
- `proposals` — payout proposals linked to hackathons
- `payouts` — one row per executed winner (`winner_wallet`, `amount_stroops`, `transaction_hash`, `status`)
- `escrows`, `organizers`, `sponsors`, `payouts`, `chain_transactions`, `idempotency_keys`, `audit_logs`

## 5. Security note

Current RLS policies allow anon read/write for **testnet MVP**. Tighten before mainnet (wallet-based policies or service role only on API).
