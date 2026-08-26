#!/usr/bin/env node
import "./load-env.js";
/**
 * Release prize from Stellar escrow to winner.
 * Escrow account is configured as 2-of-2 multisig.
 * A payout tx from escrow must be signed by sponsor and organizer.
 */
import { Asset, BASE_FEE, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import {
  getHorizonServer,
  getNetworkPassphrase,
  getOrganizerKeypair,
  getSponsorKeypair,
  loadEscrowState,
} from "../src/config.js";

async function main() {
  const winner = process.argv.find((a) => a.startsWith("--winner="))?.split("=")[1]
    ?? process.env.WINNER_ADDRESS
    ?? process.env.WINNER_STELLAR_ADDRESS;
  if (!winner || !winner.startsWith("G")) {
    console.error("Usage: npm run release -- --winner=<STELLAR_PUBLIC_KEY>");
    process.exit(1);
  }
  const amountArg = process.argv.find((a) => a.startsWith("--amount="))?.split("=")[1];
  const amount = amountArg ? Number(amountArg) : Number(process.env.RELEASE_AMOUNT_XLM || "1");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Release amount must be a positive number.");
  }

  const server = getHorizonServer();
  const networkPassphrase = getNetworkPassphrase();
  const sponsor = getSponsorKeypair();
  const organizer = getOrganizerKeypair();
  const state = loadEscrowState();

  const escrowAccount = await server.loadAccount(state.escrowAddress);
  const tx = new TransactionBuilder(escrowAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        source: state.escrowAddress,
        destination: winner,
        asset: Asset.native(),
        amount: amount.toFixed(7),
      }),
    )
    .setTimeout(120)
    .build();

  tx.sign(sponsor);
  tx.sign(organizer);
  const res = await server.submitTransaction(tx);
  console.log("Release submitted. Hash:", res.hash);
  console.log("Winner", winner, "received", amount.toFixed(7), "XLM.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
