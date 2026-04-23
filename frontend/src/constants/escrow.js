/**
 * Default organizer / escrow wallet address used across organizer and sponsor flows.
 * Single source of truth for Stellar escrow address.
 */
export const DEFAULT_ORGANIZER_ESCROW_ADDRESS =
  'GBQTXTNRLKN7JOXQ72AAG73JS2RGIUEYY6ALGN3BXQKWNVMS5WW3E7J2'

/** Default sponsor wallet (Stellar G-address) for flows that need a known sponsor key. */
export const DEFAULT_SPONSOR_WALLET_ADDRESS =
  'GDZEOLYUIF4SHIV2LAN6SDNTN5WIIB4T2436S4E5QOY4XMNSVTGRLAOL'

/** Soroban contract id used for release operations. */
export const ESCROW_APP_ID = 'CAUJ4RX466K7VU6D3QUMIPBV7ODI2MRJVK2CN7PSKCPK2JLPK5NCQF7B'

/**
 * Classic XLM on Soroban testnet (STELLAR / native asset contract).
 * Use with `stellar contract invoke` / client init for this escrow contract.
 */
export const SOROBAN_TESTNET_XLM_TOKEN_CONTRACT_ID =
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
