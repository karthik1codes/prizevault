## Backend Overview

This backend is a **lightweight orchestration and API layer** around Algorand and the stateless LogicSig escrow. It does not hold funds or private keys itself; it coordinates:

- Creation of the escrow contract account (LogicSig)
- Sponsor deposits into the escrow
- Dual‑approval prize release (sponsor + organizer)
- Simple “agent” automation hooks

All critical fund movements are enforced **on Algorand** by the TEAL `escrow_lsig.teal` program; the backend only builds and submits transactions using `algosdk` and `@algorandfoundation/algokit-utils`.

---

## Responsibilities

- **Escrow lifecycle**
  - Generate a LogicSig escrow account bound to a sponsor + organizer.
  - Persist escrow metadata (addresses, compiled LogicSig) in `escrow-state.json`.
- **Transaction orchestration**
  - Build deposit transactions (ALGO / ASA) from sponsor → escrow.
  - Build atomic group `[sponsor approval, organizer approval, escrow → winner payout]`.
  - Sign with the right keys and submit to Algorand.
- **Agent integration**
  - Provide commands / endpoints that an “AI agent” can call to:
    - Check hackathon state and escrow funding.
    - Trigger prize release once approvals are in place.
- **API for frontend**
  - Expose simple JSON APIs so a React/Vite frontend can:
    - Create / inspect an escrow.
    - Request a deposit transaction to sign in‑wallet.
    - Request a release transaction group to sign, or trigger server‑side signing.

---

## Process & Data Flow

### 1. Environment & Configuration

Backend reads configuration via `.env` and `src/config.ts`:

- `ALGOD_URL`, `ALGOD_TOKEN` – Algod client connection.
- `SPONSOR_MNEMONIC`, `ORGANIZER_MNEMONIC` – base accounts (dev/demo only).
- Helper functions:
  - `getAlgodClient()` → `algosdk.Algodv2`
  - `getSponsorAccount()` / `getOrganizerAccount()` → `{ addr, sk }`
  - `escrowStatePath()` → path to `escrow-state.json`
  - `loadEscrowState()` → read current escrow metadata

In a production, multi‑user setup, sponsor/organizer keys should be **held client‑side in wallets**, and the backend should only build unsigned transactions.

---

### 2. Escrow Creation Flow

**Script:** `scripts/create-escrow.ts`  
**Goal:** Create a new LogicSig escrow contract tied to one sponsor + one organizer.

1. Backend (or CLI) loads:
   - Algod client via `getAlgodClient()`
   - Sponsor & organizer accounts via `getSponsorAccount()`, `getOrganizerAccount()`
2. Reads `contracts/escrow_lsig.teal` and substitutes template placeholders:
   - `TMPL_B64_SPONSOR` = base64‑encoded sponsor public key
   - `TMPL_B64_ORGANIZER` = base64‑encoded organizer public key
3. Calls `compileTeal(teal, algod)` (AlgoKit) to compile TEAL → program bytes.
4. Creates a `LogicSigAccount` from compiled bytes and derives the **escrow address**.
5. Saves `escrow-state.json`:
   - `escrowAddress`
   - `sponsorAddress`
   - `organizerAddress`
   - `programB64` (compiled program for later reconstruction)

**Possible API endpoint (optional):**

- `POST /api/escrows`
  - Body: `{ sponsorAddress, organizerAddress }`
  - Response: `{ escrowAddress, escrowState }`

Backend can internally reuse the same logic as `create-escrow.ts`.

---

### 3. Deposit Flow (Sponsor → Escrow)

**Script:** `scripts/deposit.ts`  
**Goal:** Let sponsor fund the escrow with ALGO or a specific ASA.

1. Backend loads Algod, sponsor account, and `escrow-state.json`.
2. Parses input:
   - `amount` in microAlgos or asset units (default: `1_000_000` μAlgo).
   - Optional `assetId` for ASA deposits.
3. Fetches suggested transaction params: `algod.getTransactionParams().do()`.
4. Builds a `Transaction`:
   - If `assetId` present → `makeAssetTransferTxnWithSuggestedParamsFromObject`  
     (sender = sponsor, receiver = escrow, `assetIndex = assetId`).
   - Else → `makePaymentTxnWithSuggestedParamsFromObject`  
     (sender = sponsor, receiver = escrow, `amount = microAlgos`).
5. Signs with sponsor’s secret key (`tx.signTxn(sponsor.sk)`).
6. Submits via `algod.sendRawTransaction` and waits for confirmation.

**Possible API shapes:**

- **Server‑signed (demo/test):**
  - `POST /api/escrows/:id/deposit`
    - Body: `{ amount, assetId? }`
    - Backend signs and submits; returns `{ txId, escrowAddress }`.
- **Client‑signed (prod):**
  - `POST /api/escrows/:id/deposit/tx`
    - Body: `{ amount, assetId? }`
    - Response: `{ unsignedTxnBase64 }`
    - Frontend asks wallet to sign + send.

---

### 4. Release Flow (Sponsor + Organizer → Winner)

**Script:** `scripts/release.ts`  
**Goal:** Release prize to winner only when both sponsor and organizer approve.

1. Determine winner:
   - Via CLI arg `--winner=<ALGORAND_ADDRESS>` or env `WINNER_ADDRESS`.
2. Load:
   - Algod client, sponsor account, organizer account.
   - Escrow state (escrow address + LogicSig program).
3. Reconstruct `LogicSigAccount` from `programB64`.
4. Fetch suggested params and escrow account info:
   - `getTransactionParams()` for fee / rounds.
   - `accountInformation(escrowAddress)` for current balance.
5. Compute payout amount:
   - `payAmount = escrowBalance - minBalance - fee` (keeps minimum ALGO in escrow or drains it if preferred).
6. Build atomic group of 3 transactions:
   - **Tx0 (sponsor approval):** 0‑ALGO self‑payment, sponsor covers group fee.
   - **Tx1 (organizer approval):** 0‑ALGO self‑payment, zero fee (still part of group).
   - **Tx2 (escrow → winner payout):** payment from escrow address to winner.
7. Use `algosdk.assignGroupID([tx0, tx1, tx2])` so they are **atomic**.
8. Sign:
   - `tx0` with sponsor’s key.
   - `tx1` with organizer’s key.
   - `tx2` with `LogicSigAccount` (escrow).
9. Submit the signed group and wait for confirmation.

**Possible API (hybrid):**

- `POST /api/escrows/:id/release`
  - Body: `{ winnerAddress }`
  - Backend verifies that approvals exist (via env flags, DB flags, or signatures).
  - Builds, signs (if allowed), submits group; returns `{ txId, winnerAddress }`.

- `POST /api/escrows/:id/release/tx-group`
  - Body: `{ winnerAddress }`
  - Returns `{ unsignedGroup: [txn0, txn1, txn2] }` for a more advanced client to sign.

---

### 5. Agent Orchestration

**Script:** `scripts/agent.ts`  
**Goal:** Provide a simple “AI agent” loop that triggers the release when both parties have approved.

1. Reads:
   - `WINNER_ADDRESS`
   - `APPROVE_SPONSOR` and `APPROVE_ORGANIZER` flags from env.
2. If approvals are incomplete:
   - Prints instructions and exits (no on‑chain effect).
3. If both approvals are present:
   - Delegates to `scripts/release.ts` (as a child process) to actually build and submit the atomic group.

**In a server/agent context:**

- Wrap this logic in a cron job, queue worker, or HTTP handler:
  - Periodically check hackathon end time and approvals.
  - When ready, call the same underlying `release` function as `release.ts` uses.

---

## Suggested HTTP API (Summary)

_Optional, if you convert scripts into an HTTP backend (Express / Fastify / Nest, etc.)._

- `POST /api/escrows`
  - Create an escrow (single sponsor + organizer).
- `GET /api/escrows/:id`
  - Get escrow metadata and on‑chain status (balance, last tx).
- `POST /api/escrows/:id/deposit` or `/deposit/tx`
  - Fund escrow; server‑signed or client‑signed variant.
- `POST /api/escrows/:id/release`
  - Trigger prize release to winner (when approvals satisfied).
- `GET /api/escrows/:id/history`
  - List deposit + release transactions (with AlgoExplorer links).

---

## Non‑Goals / Out of Scope (Current Version)

- Multi‑escrow management for many simultaneous hackathons (single `escrow-state.json` is per‑instance).
- On‑chain dispute resolution, timeouts, or refunds (can be added in a future TEAL version).
- Off‑chain prize delivery (e.g., gift cards, bank transfers).
- Full user account system or complex auth (rely on wallet signatures or simple API keys initially).

