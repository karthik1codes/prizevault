# AI-Agent-Managed Hackathon Prize Escrow (Algorand)

Escrow on **Algorand only** (AlgoKit): sponsors deposit hackathon prize funds into an account controlled by a **stateless LogicSig**. The LogicSig releases funds only when **both** the sponsor and the organizer sign a release transaction that designates the winner. AI agents orchestrate the flow: monitor hackathon end, obtain approvals, build the atomic release transaction, and submit it.

---

## Explain it like I'm five

Imagine a **treasure box** that holds the prize for the winner of a game.

- **Sponsor** = the person who put the money in the box.  
- **Organizer** = the person who ran the game.  
- **Winner** = the person who won.

The box has a **special lock**: it opens only when **both** the sponsor and the organizer turn their keys at the same time, and they both agree on who the winner is. Nobody can open it with just one key, so the money is safe. A **robot (AI agent)** helps by reminding everyone when the game is over, collecting both keys, and opening the box for the winner so they get the prize quickly and nobody has to argue.

That’s what this project does, but the “box” is on the Algorand blockchain and the “lock” is a small program (LogicSig) that only allows the payment when both parties have signed.

---

## Is it implementable in 24 hours?

**Yes, with a focused scope.** Below is a phase-wise plan that fits in ~24 hours. The **x402 / gift-card** path is out of scope for an Algorand-only implementation; we implement **on-chain ALGO/ASA (token) prizes** and document gift cards as a future integration.

### Phase-wise plan (24h)

| Phase | Task | Time | Notes |
|-------|------|------|--------|
| **1** | **Problem & design** | 1h | Lock: escrow = LogicSig contract account; release = atomic group of 3 txs (sponsor, organizer, escrow→winner). |
| **2** | **TEAL LogicSig** | 3h | Write stateless TEAL: approve only if group size = 3, gtxn 0 from sponsor, gtxn 1 from organizer, this tx = payment/axfer from escrow, no rekey/close. Template params: `TMPL_SPONSOR`, `TMPL_ORGANIZER`. |
| **3** | **AlgoKit + compile/deploy** | 3h | AlgoKit (algokit-utils + algosdk) only. Compile TEAL with template substitution, derive escrow address, script to “create” escrow (compile + optionally fund). |
| **4** | **Deposit & release flows** | 4h | Deposit: sponsor sends ALGO/ASA to escrow address. Release: build atomic group [sponsor 0 ALGO, organizer 0 ALGO, escrow payment/axfer to winner], sign with sponsor, organizer, and LogicSig; submit. |
| **5** | **Agent orchestration** | 5h | Simple “agent”: wait for hackathon end (or manual trigger), collect sponsor + organizer approvals (CLI or minimal API), construct atomic release tx, submit. No other network. |
| **6** | **Testing & docs** | 4h | Local/testnet: create escrow, deposit, release. README, usage, and note that gift cards / x402 are future work. |
| **7** | **Buffer** | 4h | Debug, edge cases, demo. |

**Total:** ~24h.  
**Out of scope for “Algorand only”:** Full x402 integration (that’s HTTP/API + other chains). We keep everything on Algorand; gift cards can be documented as “agent pays provider via x402 later” without implementing x402 in this repo.

---

## Pros and cons

### Pros

- **Clear rules:** Release only when both sponsor and organizer sign; no single point of control.
- **Fast finality:** Algorand settles in seconds; winners get token prizes quickly.
- **Less manual work:** Agents can drive reminders, collect approvals, and submit the release.
- **Fewer disputes:** On-chain proof of who signed and who received; transparent and auditable.
- **Algorand-only:** Single chain, single toolkit (AlgoKit), no cross-chain or extra networks.
- **Reusable:** Same pattern can be used for many hackathons by deploying new escrow contracts.

### Cons

- **Gift cards / x402:** Real gift-card delivery via x402 is off-chain and multi-ecosystem; not implemented here if we stay strictly Algorand-only.
- **Key management:** Sponsor and organizer must keep keys safe and be available to sign; no in-app key recovery.
- **LogicSig limits:** TEAL size/cost limits; complex logic might require an app contract instead.
- **No built-in dispute resolution:** If one party never signs, funds stay locked; need process (e.g. timeout/refund) outside this contract or in a future version.
- **Agent trust:** The “agent” that builds and submits the release must be trusted or verified; we keep it minimal and transparent.

---

## Tech stack (Algorand only)

- **Algorand** blockchain only.
- **AlgoKit:** `@algorandfoundation/algokit-utils` + `algosdk` (TypeScript).
- **Stateless LogicSig (TEAL):** contract account escrow with template parameters.
- **No other networks**, no x402 implementation in this repo (documented as future work).

---

## Project layout

- `contracts/` – TEAL LogicSig (template with `TMPL_SPONSOR`, `TMPL_ORGANIZER`).
- `scripts/` – Compile, create escrow, deposit, release, and simple agent orchestration.
- `README.md` – This file.

---

## Quick start

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set Algorand config (algod URL, tokens, sponsor/organizer/winner addresses).
3. Create escrow: `npm run create-escrow`
4. Sponsor deposits: send ALGO/ASA to the printed escrow address.
5. Release (after both approve): `npm run release -- --winner <ADDRESS>`
6. Optional: run the simple agent that waits for approvals and submits release: `npm run agent`

(Exact commands may match the scripts we add below.)

---

## License

MIT.
