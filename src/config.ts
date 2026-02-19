import algosdk from "algosdk";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ENV = process.env;

export function getAlgodClient(): algosdk.Algodv2 {
  const url = ENV.ALGOD_URL || "http://localhost:8080";
  const token = ENV.ALGOD_TOKEN || "";
  return new algosdk.Algodv2(token, url, "");
}

export function getSponsorAccount(): algosdk.Account {
  const mnemonic = ENV.SPONSOR_MNEMONIC;
  if (!mnemonic) throw new Error("SPONSOR_MNEMONIC not set");
  return algosdk.mnemonicToSecretKey(mnemonic);
}

export function getOrganizerAccount(): algosdk.Account {
  const mnemonic = ENV.ORGANIZER_MNEMONIC;
  if (!mnemonic) throw new Error("ORGANIZER_MNEMONIC not set");
  return algosdk.mnemonicToSecretKey(mnemonic);
}

export function loadEscrowLsigPath(): string {
  return resolve(process.cwd(), "escrow.lsig.json");
}

export function escrowStatePath(): string {
  return resolve(process.cwd(), "escrow-state.json");
}

export interface EscrowState {
  escrowAddress: string;
  sponsorAddress: string;
  organizerAddress: string;
  programB64: string;
}

export function loadEscrowState(): EscrowState {
  const path = escrowStatePath();
  if (!existsSync(path)) throw new Error(`Escrow state not found at ${path}. Run create-escrow first.`);
  return JSON.parse(readFileSync(path, "utf-8")) as EscrowState;
}
