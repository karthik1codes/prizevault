# AI-Agent-Managed Hackathon Prize Escrow (Stellar)

This project runs on Stellar and provides sponsor-organizer co-controlled prize escrow flows for hackathons.

## Architecture

- Stellar escrow account with 2-of-2 signer policy (sponsor + organizer).
- Soroban smart contract scaffold for contract-based release logic.
- TypeScript automation scripts for create/deposit/release/agent actions.
- React frontend with Stellar wallet integration (Freighter-compatible).

## Core flow

1. Create escrow account and enforce dual signer thresholds.
2. Sponsor deposits XLM into escrow.
3. Organizer proposes winners and payout amounts.
4. Sponsor and organizer both approve.
5. Release transaction sends XLM to winner(s) on Stellar.

## Project layout

- `contracts/stellar_escrow_soroban.rs` - Soroban escrow contract scaffold.
- `scripts/create-escrow.ts` - creates/funds escrow and configures signers.
- `scripts/deposit.ts` - deposits XLM to escrow.
- `scripts/release.ts` - releases XLM to winner.
- `scripts/agent.ts` - approval-gated release automation.
- `scripts/deploy-contract.ts` - stores Soroban contract id in `escrow-state.json`.

## Quick start

1. Install dependencies:
   - `npm install`
   - `cd frontend && npm install`
2. Configure env:
   - copy `.env.example` to `.env`
   - set `STELLAR_HORIZON_URL`, `STELLAR_NETWORK_PASSPHRASE`
   - set `SPONSOR_SECRET_KEY`, `ORGANIZER_SECRET_KEY`
3. Create escrow:
   - `npm run create-escrow`
4. Deposit:
   - `npm run deposit -- --amount=25`
5. Release:
   - `npm run release -- --winner=<STELLAR_PUBLIC_KEY> --amount=5`
6. Agent mode:
   - set `WINNER_STELLAR_ADDRESS`, `APPROVE_SPONSOR=1`, `APPROVE_ORGANIZER=1`
   - run `npm run agent`

## Soroban contract deploy

Use Stellar CLI to deploy your Soroban contract, then set `SOROBAN_CONTRACT_ID` and run:

- `npm run deploy-contract`

## Notes

- Scripts default to Stellar Testnet.
- `create-escrow` uses Friendbot for initial account funding.
- Treat secret keys in `.env` as sensitive.

## License

MIT
