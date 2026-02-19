#!/usr/bin/env node
/**
 * Simple AI-agent orchestration: waits for hackathon end (or manual trigger),
 * collects sponsor + organizer approvals, builds atomic release tx, submits.
 * This script simulates the agent by using env approvals or prompting; in production
 * the agent would monitor events and call APIs. Algorand only.
 */
import { getAlgodClient, getSponsorAccount, getOrganizerAccount, loadEscrowState } from "../src/config.js";

const WINNER = process.env.WINNER_ADDRESS;
const APPROVE_SPONSOR = process.env.APPROVE_SPONSOR === "1" || process.env.APPROVE_SPONSOR === "true";
const APPROVE_ORGANIZER = process.env.APPROVE_ORGANIZER === "1" || process.env.APPROVE_ORGANIZER === "true";

async function main() {
  if (!WINNER) {
    console.error("Set WINNER_ADDRESS to the winner's Algorand address.");
    process.exit(1);
  }
  const state = loadEscrowState();
  console.log("Escrow:", state.escrowAddress);
  console.log("Winner:", WINNER);
  console.log("Approvals: sponsor=" + APPROVE_SPONSOR + ", organizer=" + APPROVE_ORGANIZER);

  if (!APPROVE_SPONSOR || !APPROVE_ORGANIZER) {
    console.log("\nTo release, set APPROVE_SPONSOR=1 and APPROVE_ORGANIZER=1 (or true), then run again.");
    console.log("This script then builds the atomic release and submits it (no other network).");
    process.exit(0);
  }

  // Delegate to release script logic
  const { execSync } = await import("node:child_process");
  execSync(`npx tsx scripts/release.ts --winner=${WINNER}`, {
    stdio: "inherit",
    env: { ...process.env, WINNER_ADDRESS: WINNER },
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
