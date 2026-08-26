#!/usr/bin/env node
import "./load-env.js";
/**
 * Create a Stellar escrow account and enforce 2-of-2 signer approvals.
 * Escrow account signer weights:
 * - sponsor: weight 1
 * - organizer: weight 1
 * - master key: weight 0
 * Thresholds: low/med/high = 2
 */
import { writeFileSync } from "node:fs";
import {
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import {
  escrowStatePath,
  getHorizonServer,
  getNetworkPassphrase,
  getOrganizerKeypair,
  getSponsorKeypair,
} from "../src/config.js";

async function main() {
  const server = getHorizonServer();
  const networkPassphrase = getNetworkPassphrase();
  const sponsor = getSponsorKeypair();
  const organizer = getOrganizerKeypair();
  const escrow = Keypair.random();

  // Fund escrow account on testnet.
  const friendbotRes = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(escrow.publicKey())}`);
  if (!friendbotRes.ok) {
    throw new Error("Failed to fund escrow via Friendbot. Ensure you are on Stellar testnet.");
  }

  const sponsorAccount = await server.loadAccount(sponsor.publicKey());
  const setOptionsTx = new TransactionBuilder(sponsorAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.setOptions({
        source: escrow.publicKey(),
        signer: {
          ed25519PublicKey: sponsor.publicKey(),
          weight: 1,
        },
      }),
    )
    .addOperation(
      Operation.setOptions({
        source: escrow.publicKey(),
        signer: {
          ed25519PublicKey: organizer.publicKey(),
          weight: 1,
        },
      }),
    )
    .addOperation(
      Operation.setOptions({
        source: escrow.publicKey(),
        masterWeight: 0,
        lowThreshold: 2,
        medThreshold: 2,
        highThreshold: 2,
      }),
    )
    .setTimeout(120)
    .build();

  // Escrow authorizes account changes; sponsor submits tx.
  setOptionsTx.sign(escrow);
  setOptionsTx.sign(sponsor);
  await server.submitTransaction(setOptionsTx);

  const state = {
    escrowAddress: escrow.publicKey(),
    sponsorAddress: sponsor.publicKey(),
    organizerAddress: organizer.publicKey(),
    networkPassphrase,
  };
  writeFileSync(escrowStatePath(), JSON.stringify(state, null, 2));

  console.log("Stellar escrow created with 2-of-2 signer policy.");
  console.log("Escrow public key:", escrow.publicKey());
  console.log("Escrow secret (store securely):", escrow.secret());
  console.log("Sponsor:", sponsor.publicKey());
  console.log("Organizer:", organizer.publicKey());
  console.log("State saved to", escrowStatePath());
  console.log("\nNext: run deposit and release scripts to move funds.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
