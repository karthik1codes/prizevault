/**
 * Soroban escrow contract ids (not personal G-addresses).
 * Personal wallets come from Freighter / WalletConnect / session only.
 */

/** Soroban contract id used for release operations. */
export const ESCROW_APP_ID = 'CABGEMTXCDXD7SEEABNAMTIXWZUKWQ76HYBL5JC74R4CI573FU4R2L4C'

/**
 * Classic XLM on Soroban testnet (STELLAR / native asset contract).
 */
export const SOROBAN_TESTNET_XLM_TOKEN_CONTRACT_ID =
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'

/** Stellar G-address (Ed25519 public key) format. */
export function isValidStellarAddress(value: string): boolean {
  return /^G[A-Z2-7]{55}$/.test((value || '').trim())
}
