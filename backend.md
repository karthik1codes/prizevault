## Backend Overview (Stellar)

The backend layer coordinates Stellar escrow lifecycle operations and payout execution.

### Responsibilities

- Create escrow accounts on Stellar testnet/mainnet.
- Configure 2-of-2 multisig (sponsor + organizer).
- Accept sponsor deposits (XLM / Stellar assets).
- Execute winner payouts after dual approval.
- Optionally call Soroban contract methods for release workflows.

### Runtime configuration

- `STELLAR_HORIZON_URL`
- `STELLAR_NETWORK_PASSPHRASE`
- `SPONSOR_SECRET_KEY`
- `ORGANIZER_SECRET_KEY`
- `SOROBAN_CONTRACT_ID` (optional)

### Script mapping

- `npm run create-escrow` - create and lock escrow signer policy.
- `npm run deposit -- --amount=<xlm>` - sponsor deposit.
- `npm run release -- --winner=<G...> --amount=<xlm>` - payout release.
- `npm run agent` - approval-gated orchestration wrapper.
- `npm run deploy-contract` - store deployed Soroban contract id.

### Production recommendations

- Move private keys to secure signer infrastructure (HSM/KMS).
- Use wallet-signed transactions in frontend instead of server-side private keys.
- Add idempotent payout records and replay protection.
- Add timeout/refund path for unresolved approvals.
