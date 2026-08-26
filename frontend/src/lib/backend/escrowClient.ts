import {
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";
import {
  getContractId,
  getNetworkPassphrase,
  getSorobanRpcUrl,
} from "./config";

export interface WinnerPayoutInput {
  winner_address: string;
  /** Amount in stroops (1 XLM = 10_000_000). Prefer string to avoid precision loss. */
  amount: string | number | bigint;
}

function toBigIntAmount(amount: string | number | bigint): bigint {
  if (typeof amount === "bigint") return amount;
  if (typeof amount === "number") {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    return BigInt(Math.trunc(amount));
  }
  const trimmed = String(amount).trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Invalid amount (expected integer stroops): ${amount}`);
  }
  return BigInt(trimmed);
}

/** Encode `WinnerPayout { winner, amount }` as an ScVal map (Soroban contracttype). */
function winnerPayoutToScVal(payout: WinnerPayoutInput): xdr.ScVal {
  const winner = payout.winner_address?.trim();
  if (!winner || !winner.startsWith("G")) {
    throw new Error(`Invalid winner_address: ${payout.winner_address}`);
  }
  const amount = toBigIntAmount(payout.amount);
  if (amount <= 0n) {
    throw new Error("Each payout amount must be > 0 stroops");
  }

  return nativeToScVal(
    {
      amount,
      winner: Address.fromString(winner),
    },
    {
      type: {
        amount: ["symbol", "i128"],
        winner: ["symbol", "address"],
      },
    },
  );
}

function proposalIdToScVal(proposalId: number | string): xdr.ScVal {
  const id = typeof proposalId === "number" ? proposalId : Number(proposalId);
  if (!Number.isInteger(id) || id < 0 || id > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Invalid proposal_id (need u64-safe integer): ${proposalId}`);
  }
  return nativeToScVal(id, { type: "u64" });
}

async function waitForTx(
  server: rpc.Server,
  hash: string,
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  const started = Date.now();
  const timeoutMs = 60_000;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await server.getTransaction(hash);
    if (response.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return response;
    }
    if (response.status === rpc.Api.GetTransactionStatus.FAILED) {
      const detail =
        "resultXdr" in response && response.resultXdr
          ? String(response.resultXdr)
          : "transaction failed on-chain";
      throw new Error(`Soroban transaction failed: ${detail}`);
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting for transaction ${hash}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

/**
 * Build, simulate/prepare, sign, and submit a Soroban contract invocation.
 * Returns the transaction hash once the RPC reports SUCCESS.
 */
export async function invokeEscrowMethod(options: {
  source: Keypair;
  method: "propose_release" | "approve_release" | "execute_release";
  args: xdr.ScVal[];
}): Promise<{ txHash: string }> {
  const rpcUrl = getSorobanRpcUrl();
  const networkPassphrase = getNetworkPassphrase();
  const contractId = getContractId();
  const server = new rpc.Server(rpcUrl);
  const account = await server.getAccount(options.source.publicKey());
  const contract = new Contract(contractId);

  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(options.method, ...options.args))
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(built);
  prepared.sign(options.source);

  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") {
    const err =
      sent.errorResult != null ? JSON.stringify(sent.errorResult) : "sendTransaction ERROR";
    throw new Error(`Stellar RPC rejected transaction: ${err}`);
  }

  await waitForTx(server, sent.hash);
  return { txHash: sent.hash };
}

export async function proposeRelease(
  organizer: Keypair,
  proposalId: number | string,
  payouts: WinnerPayoutInput[],
): Promise<{ txHash: string }> {
  if (!Array.isArray(payouts) || payouts.length === 0) {
    throw new Error("payouts must be a non-empty array");
  }
  const payoutScVals = payouts.map(winnerPayoutToScVal);
  return invokeEscrowMethod({
    source: organizer,
    method: "propose_release",
    args: [proposalIdToScVal(proposalId), xdr.ScVal.scvVec(payoutScVals)],
  });
}

export async function approveRelease(
  sponsor: Keypair,
  proposalId: number | string,
): Promise<{ txHash: string }> {
  return invokeEscrowMethod({
    source: sponsor,
    method: "approve_release",
    args: [proposalIdToScVal(proposalId)],
  });
}

export async function executeRelease(
  organizer: Keypair,
  proposalId: number | string,
): Promise<{ txHash: string }> {
  return invokeEscrowMethod({
    source: organizer,
    method: "execute_release",
    args: [proposalIdToScVal(proposalId)],
  });
}
