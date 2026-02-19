# Polygon Testnet Wallet Integration

This project uses **MetaMask** and the **Polygon Mumbai** testnet through the `wagmi` library.

## Prerequisites

- MetaMask browser extension installed and unlocked.
- A Mumbai testnet RPC (the default public RPCs embedded in `wagmi` work, but you can also add your own Alchemy/Infura endpoint).
- Testnet MATIC for gas. You can request it from the official [Polygon faucet](https://faucet.polygon.technology/).

## Install JavaScript dependencies

From `issuer/did/frontend/` run:

```bash
npm install
```

This will install `wagmi` and `viem`, which power account management and RPC calls.

## Running the app

```bash
npm run dev
```

Open the dev server URL and navigate either to `index.html` (marketing landing) or `issuer.html` (dashboard).

## Connecting MetaMask

1. Click **Connect Wallet** in the dashboard header.
2. Approve the MetaMask connection popup.
3. If MetaMask is on a different network, click **Switch to Polygon** when prompted; MetaMask will request confirmation.
4. Once connected, the header displays your truncated wallet address and lets you disconnect at any time.

> Tip: If no **Connect Wallet** popup appears, ensure MetaMask is unlocked and the extension permissions allow the current site.

## Switching networks manually

If the automatic switch fails:

1. Open MetaMask.
2. Click the network selector and choose **Polygon Mumbai** (or add it manually using:
   - RPC URL: `https://rpc-mumbai.maticvigil.com/`
   - Chain ID: `80001`
   - Currency symbol: `MATIC`
3. Reload the page and reconnect.

## Extending functionality

- Use the `useSigner` hook from `wagmi` whenever you need to sign payloads (for issuing credentials, anchoring on-chain, etc.).
- Combine `signMessage` with a backend endpoint to verify user control of the address before executing privileged actions.
- For production, migrate to the Polygon mainnet by swapping `polygonMumbai` with `polygon` in `src/main.jsx`.

