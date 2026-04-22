#!/usr/bin/env node
/**
 * Placeholder helper for Soroban deployment workflow.
 * Compile/deploy is done via `stellar contract` CLI.
 */
import { writeFileSync } from "node:fs";
import { escrowStatePath, loadEscrowState } from "../src/config.js";

async function main() {
  const contractId = process.env.SOROBAN_CONTRACT_ID;
  if (!contractId) {
    console.log("Set SOROBAN_CONTRACT_ID after deploying your contract with Stellar CLI.");
    console.log("Example:");
    console.log("  stellar contract deploy --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm --source sponsor --network testnet");
    process.exit(0);
  }

  const state = loadEscrowState();
  const updated = { ...state, contractId };
  writeFileSync(escrowStatePath(), JSON.stringify(updated, null, 2));
  console.log("Saved Soroban contract id to escrow-state.json:", contractId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
