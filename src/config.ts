/**
 * Re-export backend helpers for CLI scripts (`npm run create-escrow`, etc.).
 * Source of truth lives in frontend/ (Vercel Root Directory).
 */
export {
  getHorizonServer,
  getSorobanRpcUrl,
  getNetworkPassphrase,
  getSponsorKeypair,
  getOrganizerKeypair,
  escrowStatePath,
  loadEscrowState,
  getContractId,
} from "../frontend/src/lib/backend/config.js";
export type { EscrowState } from "../frontend/src/lib/backend/config.js";
