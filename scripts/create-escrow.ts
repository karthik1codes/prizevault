#!/usr/bin/env node
/**
 * Create hackathon prize escrow: compile TEAL with sponsor/organizer addresses,
 * compute escrow address, and save state for release.
 * Uses AlgoKit (@algorandfoundation/algokit-utils) + algosdk only; Algorand only.
 */
import algosdk from "algosdk";
import { compileTeal } from "@algorandfoundation/algokit-utils";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getAlgodClient, getSponsorAccount, getOrganizerAccount, escrowStatePath } from "../src/config.js";

const CONTRACTS_DIR = resolve(process.cwd(), "contracts");
const TEAL_PATH = resolve(CONTRACTS_DIR, "escrow_lsig.teal");

function substituteTemplate(teal: string, sponsorB64: string, organizerB64: string): string {
  return teal
    .replace(/TMPL_B64_SPONSOR/g, sponsorB64)
    .replace(/TMPL_B64_ORGANIZER/g, organizerB64);
}

async function main() {
  const algod = getAlgodClient();
  const sponsor = getSponsorAccount();
  const organizer = getOrganizerAccount();

  if (!existsSync(TEAL_PATH)) {
    throw new Error(`TEAL not found at ${TEAL_PATH}`);
  }
  let teal = readFileSync(TEAL_PATH, "utf-8");

  // 32-byte addresses as base64 for TEAL "byte base64" instruction
  const sponsorB64 = Buffer.from(algosdk.decodeAddress(String(sponsor.addr)).publicKey).toString("base64");
  const organizerB64 = Buffer.from(algosdk.decodeAddress(String(organizer.addr)).publicKey).toString("base64");
  teal = substituteTemplate(teal, sponsorB64, organizerB64);

  const compiled = await compileTeal(teal, algod);
  const program = compiled.compiledBase64ToBytes;
  const lsig = new algosdk.LogicSigAccount(program);
  const escrowAddress = lsig.address();

  const state = {
    escrowAddress,
    sponsorAddress: sponsor.addr,
    organizerAddress: organizer.addr,
    programB64: compiled.compiled,
  };
  writeFileSync(escrowStatePath(), JSON.stringify(state, null, 2));

  console.log("Escrow created (Algorand only, AlgoKit/algosdk).");
  console.log("Escrow address:", escrowAddress);
  console.log("Sponsor:", sponsor.addr);
  console.log("Organizer:", organizer.addr);
  console.log("State saved to", escrowStatePath());
  console.log("\nNext: Sponsor deposits ALGO/ASA to the escrow address, then run release when both parties approve.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
