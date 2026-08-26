import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Keypair, Horizon, Networks } from "@stellar/stellar-sdk";

/**
 * Env is provided by:
 * - Vercel project env vars (production)
 * - next.config.ts dotenv load (local Next)
 * - scripts/load-env.ts (CLI)
 */
const ENV = process.env;

/** Current testnet escrow (must export propose_release / approve_release / execute_release). */
const DEFAULT_CONTRACT_ID = "CABGEMTXCDXD7SEEABNAMTIXWZUKWQ76HYBL5JC74R4CI573FU4R2L4C";

/** Known-bad / superseded deployments that must never be used. */
const RETIRED_CONTRACT_IDS = new Set([
  "CAUJ4RX466K7VU6D3QUMIPBV7ODI2MRJVK2CN7PSKCPK2JLPK5NCQF7B",
]);

export function getHorizonServer(): Horizon.Server {
  const url = ENV.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
  return new Horizon.Server(url);
}

export function getSorobanRpcUrl(): string {
  return ENV.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
}

export function getNetworkPassphrase(): string {
  return ENV.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
}

export function getSponsorKeypair(): Keypair {
  const secret = ENV.SPONSOR_SECRET_KEY;
  if (!secret) throw new Error("SPONSOR_SECRET_KEY not set");
  return Keypair.fromSecret(secret);
}

export function getOrganizerKeypair(): Keypair {
  const secret = ENV.ORGANIZER_SECRET_KEY;
  if (!secret) throw new Error("ORGANIZER_SECRET_KEY not set");
  return Keypair.fromSecret(secret);
}

export function escrowStatePath(): string {
  const inCwd = resolve(process.cwd(), "escrow-state.json");
  if (existsSync(inCwd)) return inCwd;
  const inParent = resolve(process.cwd(), "../escrow-state.json");
  if (existsSync(inParent)) return inParent;
  return inCwd;
}

export interface EscrowState {
  escrowAddress: string;
  sponsorAddress: string;
  organizerAddress: string;
  networkPassphrase: string;
  contractId?: string;
}

export function loadEscrowState(): EscrowState {
  const path = escrowStatePath();
  if (!existsSync(path)) throw new Error(`Escrow state not found at ${path}. Run create-escrow first.`);
  return JSON.parse(readFileSync(path, "utf-8")) as EscrowState;
}

function pickContractId(candidate: string | undefined | null): string | null {
  const id = candidate?.trim();
  if (!id) return null;
  if (RETIRED_CONTRACT_IDS.has(id)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[prizevault] Ignoring retired contract id ${id} (no propose_release). Using current escrow instead.`,
    );
    return null;
  }
  return id;
}

/**
 * Resolve deployed Soroban contract id:
 * 1) SOROBAN_CONTRACT_ID env
 * 2) escrow-state.json contractId (if not retired)
 * 3) built-in default
 */
export function getContractId(): string {
  const fromEnv = pickContractId(ENV.SOROBAN_CONTRACT_ID);
  if (fromEnv) return fromEnv;
  try {
    const fromState = pickContractId(loadEscrowState().contractId);
    if (fromState) return fromState;
  } catch {
    // optional
  }
  return DEFAULT_CONTRACT_ID;
}
