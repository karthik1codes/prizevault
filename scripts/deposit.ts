#!/usr/bin/env node
/**
 * Sponsor deposits lumens (XLM) into Stellar escrow.
 * Usage: npm run deposit [-- --amount=25.0]
 */
import { Asset, BASE_FEE, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import {
  getHorizonServer,
  getNetworkPassphrase,
  getSponsorKeypair,
  loadEscrowState,
} from "../src/config.js";

async function main() {
  const amountArg = process.argv.find((a) => a.startsWith("--amount="))?.split("=")[1];
  const amount = amountArg ? Number(amountArg) : 25;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  const server = getHorizonServer();
  const networkPassphrase = getNetworkPassphrase();
  const sponsor = getSponsorKeypair();
  const state = loadEscrowState();

  const sponsorAccount = await server.loadAccount(sponsor.publicKey());
  const tx = new TransactionBuilder(sponsorAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: state.escrowAddress,
        asset: Asset.native(),
        amount: amount.toFixed(7),
      }),
    )
    .setTimeout(120)
    .build();

  tx.sign(sponsor);
  const res = await server.submitTransaction(tx);
  console.log("Deposit submitted. Hash:", res.hash);
  console.log("Escrow", state.escrowAddress, "received", amount.toFixed(7), "XLM");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
