# Hackathon Prize Escrow (Stellar)

Blockchain-native hackathon prize escrow for **Web2 and Web3** events. Prize funds are held in shared on-chain escrow until **both sponsor and organizer** approve payouts — neither party can move money alone.

## What it solves

Sponsors worry prize money will be misused or delayed; organizers don't want to front cash or defend payouts alone; winners want a guaranteed, auditable payment once results are final. This platform coordinates **dual-approval escrow** from funding through winner payout.

## Architecture

- **Classic Stellar escrow account** — 2-of-2 multisig (sponsor + organizer) for script-driven flows.
- **Soroban smart contract** (`contracts/stellar-escrow`) — on-chain propose → approve → execute release logic.
- **Next.js app** (`frontend/`) — UI + `/api/escrow/*` in one process; server-held testnet keys invoke the contract.
- **TypeScript scripts** — create escrow, deposit, release, and approval-gated agent runner.

## Payout proposal cycle (Soroban)

1. **Deploy & init** — sponsor configures organizer and token on the contract (once per deployment).
2. **Fund** — sponsor transfers XLM into the contract.
3. **Propose** — organizer submits winner addresses and amounts.
4. **Approve** — sponsor approves the proposal.
5. **Execute** — organizer executes; funds transfer to winners atomically on-chain.

Classic account flow (scripts): create escrow → deposit → dual-signed release.

## Project layout

| Path | Description |
|------|-------------|
| `contracts/stellar-escrow/` | Soroban escrow contract (Rust) |
| `frontend/` | Next.js app (pages + `/api/escrow/*`) — **Vercel Root Directory** |
| `frontend/src/client/` | React UI (organizer, sponsor, participant) |
| `src/soroban/escrowClient.ts` | Soroban invoke helpers (stellar-sdk) |
| `src/api/escrowHandlers.ts` | Shared propose/approve/execute handlers |
| `scripts/` | Classic escrow CLI scripts |
| `Hackathon_Event_Card_Format.pdf` | Reference PDF for timeline auto-import |
| `backend.md` | API and production notes |

## Quick start

### 1. Install

```bash
npm install
cd frontend && npm install
```

### 2. Configure environment

Create `.env` in the repo root (see `.env.example`):

```env
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
SPONSOR_SECRET_KEY=
ORGANIZER_SECRET_KEY=
SOROBAN_CONTRACT_ID=
PORT=3000
```

Treat secret keys as sensitive. Defaults target **Stellar Testnet**.

### 3. Run (UI + API together)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Escrow actions use same-origin `/api/escrow/*`.

| Route | Role |
|-------|------|
| `/` | Landing |
| `/organizer` | Organizer console (hackathons, winners, payouts, timeline) |
| `/holder` | Escrow wallet / participant views |
| `/verifier` | Sponsor approval flows |

Organizer timeline supports PDF upload in **Event Card format** (`Event #`, `TIME / SLOT`, `TITLE`, `DETAILS`) — see `Hackathon_Event_Card_Format.pdf`.

### 4. Classic escrow scripts

```bash
npm run create-escrow
npm run deposit -- --amount=25
npm run release -- --winner=<STELLAR_G_ADDRESS> --amount=5
```

### 5. Agent mode (approval-gated release)

Set in `.env`:

- `WINNER_STELLAR_ADDRESS` — winner public key
- `APPROVE_SPONSOR=1` and `APPROVE_ORGANIZER=1` — both required
- `RELEASE_AMOUNT_XLM` — payout amount (optional, default `1`)

Then:

```bash
npm run agent
```

If either approval flag is missing, the agent prints status and exits without paying. When both are set, it delegates to `release.ts`.

## Soroban contract (Stellar CLI)

From `contracts/stellar-escrow`:

```bash
stellar contract build
stellar contract deploy --wasm target/wasm32v1-none/release/stellar_escrow.wasm --source sponsor --network testnet
```

Set `CONTRACT_ID`, addresses, and token (testnet native XLM: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`), then:

```bash
# Init (once per contract; sponsor signs)
stellar contract invoke --id $CONTRACT_ID --source sponsor --network testnet -- \
  init --sponsor $SPONSOR_ADDRESS --organizer $ORGANIZER_ADDRESS --token_addr $TOKEN_ADDR

# Fund contract (amounts in stroops: 1 XLM = 10_000_000)
stellar contract invoke --id $TOKEN_ADDR --source sponsor --network testnet -- \
  transfer --from $SPONSOR_ADDRESS --to $CONTRACT_ID --amount 2000000000

# Propose → approve → execute
stellar contract invoke --id $CONTRACT_ID --source organiser --network testnet -- \
  propose_release --proposal_id 1 --payouts '[{"winner":"G...","amount":"1000000000"}]'

stellar contract invoke --id $CONTRACT_ID --source sponsor --network testnet -- \
  approve_release --proposal_id 1

stellar contract invoke --id $CONTRACT_ID --source organiser --network testnet -- \
  execute_release --proposal_id 1
```

**Notes:**

- `init` cannot be run twice on the same contract — redeploy if addresses were wrong.
- `--sponsor` / `--organizer` must match the G-addresses of your CLI keys (`stellar keys address sponsor` / `organiser`).
- Pass `amount` in payout JSON as a **string**, not a number.
- After deploy, update `frontend/src/client/constants/escrow.ts` (`ESCROW_APP_ID`) and `SOROBAN_CONTRACT_ID` in `.env`.

Save the deployed contract id:

```bash
SOROBAN_CONTRACT_ID=<id> npm run deploy-contract
```

## Who controls the escrow?

Neither sponsor nor organizer alone. A dedicated escrow account/contract holds funds; **both** must approve before any payout.

| Action | Party |
|--------|--------|
| Deposit / approve release | Sponsor |
| Propose winners / execute release | Organizer |
| Move funds unilaterally | Not allowed |

## Notes

- `create-escrow` uses Friendbot for initial testnet funding.
- See `backend.md` for production recommendations (HSM/KMS, wallet-signed txs, idempotency).
- Contract tests: `cd contracts/stellar-escrow && cargo test`

## License

MIT
