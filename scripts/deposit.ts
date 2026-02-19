#!/usr/bin/env node
/**
 * Sponsor deposits ALGO (and optionally ASA) to the escrow address.
 * Usage: npm run deposit [-- --amount=1000000] [-- --asset-id=123]
 * Default: deposit 1 ALGO for testing. Algorand only.
 */
import algosdk from "algosdk";
import { getAlgodClient, getSponsorAccount, loadEscrowState } from "../src/config.js";

async function main() {
  const amountArg = process.argv.find((a) => a.startsWith("--amount="))?.split("=")[1];
  const assetIdArg = process.argv.find((a) => a.startsWith("--asset-id="))?.split("=")[1];
  const amount = amountArg ? Number(amountArg) : 1_000_000; // 1 ALGO default
  const assetId = assetIdArg ? Number(assetIdArg) : undefined;

  const algod = getAlgodClient();
  const sponsor = getSponsorAccount();
  const state = loadEscrowState();

  const params = await algod.getTransactionParams().do();
  let tx: algosdk.Transaction;

  if (assetId != null) {
    tx = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: sponsor.addr,
      receiver: state.escrowAddress,
      amount,
      assetIndex: assetId,
      suggestedParams: params,
    });
  } else {
    tx = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: sponsor.addr,
      receiver: state.escrowAddress,
      amount,
      suggestedParams: params,
    });
  }

  const signed = tx.signTxn(sponsor.sk);
  const { txId } = await algod.sendRawTransaction(signed).do();
  console.log("Deposit submitted. TxId:", txId);
  await algosdk.waitForConfirmation(algod, txId, 10);
  console.log("Deposit confirmed. Escrow", state.escrowAddress, "received", assetId ? `asset ${assetId}` : `${amount} microAlgos`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
