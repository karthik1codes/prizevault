#!/usr/bin/env node
/**
 * Simple Stellar orchestration helper:
 * waits for dual approval flags and triggers payout release.
 */
import { loadEscrowState } from "../src/config.js";

const WINNER = process.env.WINNER_STELLAR_ADDRESS || process.env.WINNER_ADDRESS;
const APPROVE_SPONSOR = process.env.APPROVE_SPONSOR === "1" || process.env.APPROVE_SPONSOR === "true";
const APPROVE_ORGANIZER = process.env.APPROVE_ORGANIZER === "1" || process.env.APPROVE_ORGANIZER === "true";
const RELEASE_AMOUNT_XLM = process.env.RELEASE_AMOUNT_XLM || "1";

async function main() {
  if (!WINNER) {
    console.error("Set WINNER_STELLAR_ADDRESS to the winner's Stellar public key.");
    process.exit(1);
  }
  const state = loadEscrowState();
  console.log("Escrow:", state.escrowAddress);
  console.log("Winner:", WINNER);
  console.log("Approvals: sponsor=" + APPROVE_SPONSOR + ", organizer=" + APPROVE_ORGANIZER);

  if (!APPROVE_SPONSOR || !APPROVE_ORGANIZER) {
    console.log("\nTo release, set APPROVE_SPONSOR=1 and APPROVE_ORGANIZER=1 (or true), then run again.");
    console.log("This script will then submit the Stellar payout transaction.");
    process.exit(0);
  }

  // Delegate to release script logic
  const { execSync } = await import("node:child_process");
  execSync(`npx tsx scripts/release.ts --winner=${WINNER} --amount=${RELEASE_AMOUNT_XLM}`, {
    stdio: "inherit",
    env: { ...process.env, WINNER_STELLAR_ADDRESS: WINNER, RELEASE_AMOUNT_XLM },
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
