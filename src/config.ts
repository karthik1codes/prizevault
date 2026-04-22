import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Keypair, Horizon, Networks } from "@stellar/stellar-sdk";

const ENV = process.env;

export function getHorizonServer(): Horizon.Server {
  const url = ENV.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
  return new Horizon.Server(url);
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
  return resolve(process.cwd(), "escrow-state.json");
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
