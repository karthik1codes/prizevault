#!/usr/bin/env node
/**
 * Release prize to winner: build atomic group [sponsor, organizer, escrow->winner],
 * sign with sponsor, organizer, and LogicSig; submit. Algorand only.
 */
import algosdk from "algosdk";
import { getAlgodClient, getSponsorAccount, getOrganizerAccount, loadEscrowState } from "../src/config.js";

async function main() {
  const winner = process.argv.find((a) => a.startsWith("--winner="))?.split("=")[1]
    ?? process.env.WINNER_ADDRESS;
  if (!winner || !algosdk.isValidAddress(winner)) {
    console.error("Usage: npm run release -- --winner=<ALGORAND_ADDRESS>");
    process.exit(1);
  }

  const algod = getAlgodClient();
  const sponsor = getSponsorAccount();
  const organizer = getOrganizerAccount();
  const state = loadEscrowState();

  const program = new Uint8Array(Buffer.from(state.programB64, "base64"));
  const escrowLsig = new algosdk.LogicSigAccount(program);

  const params = await algod.getTransactionParams().do();
  const fee = params.fee ?? 1000n;

  const groupFee = Number(fee) * 3;
  // Tx0: sponsor pays 0 ALGO to self (approval signal)
  const tx0 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: sponsor.addr,
    receiver: sponsor.addr,
    amount: 0,
    suggestedParams: { ...params, fee: groupFee }, // sponsor pays for whole group
  });

  // Tx1: organizer pays 0 ALGO to self (approval signal)
  const tx1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: organizer.addr,
    receiver: organizer.addr,
    amount: 0,
    suggestedParams: { ...params, fee: 0 },
  });

  // Tx2: escrow pays winner (all ALGO minus fees, or specify amount)
  const escrowInfo = await algod.accountInformation(state.escrowAddress).do();
  const escrowBalance = BigInt(escrowInfo.amount);
  const minBalance = 100_000; // keep escrow account alive or send all
  const payAmount = escrowBalance - BigInt(minBalance) - BigInt(fee);
  if (payAmount <= 0n) {
    throw new Error("Escrow has insufficient balance to release.");
  }

  const tx2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: state.escrowAddress,
    receiver: winner,
    amount: Number(payAmount),
    suggestedParams: { ...params, fee: 0 },
  });

  algosdk.assignGroupID([tx0, tx1, tx2]);

  const signed0 = tx0.signTxn(sponsor.sk);
  const signed1 = tx1.signTxn(organizer.sk);
  const signed2 = algosdk.signLogicSigTransactionObject(tx2, escrowLsig).blob;

  const res = await algod.sendRawTransaction([signed0, signed1, signed2]).do();
  const txid = res.txid;
  console.log("Release tx submitted. TxId:", txid);
  await algosdk.waitForConfirmation(algod, txid, 10);
  console.log("Confirmed. Winner", winner, "received prize.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
