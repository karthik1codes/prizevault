import {
  Address,
  BASE_FEE,
  Contract,
  Networks,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
} from '@stellar/stellar-sdk'
import { signTransaction } from '@stellar/freighter-api'
import {
  ESCROW_APP_ID,
  SOROBAN_TESTNET_XLM_TOKEN_CONTRACT_ID,
} from '../constants/escrow'

const RPC_URL = 'https://soroban-testnet.stellar.org'
const NETWORK = Networks.TESTNET
const STROOPS_PER_XLM = 10_000_000n

export function getEscrowContractId(): string {
  const fromEnv =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID?.trim()
      : undefined
  return (fromEnv || ESCROW_APP_ID).trim()
}

export function getXlmTokenId(): string {
  return SOROBAN_TESTNET_XLM_TOKEN_CONTRACT_ID
}

export function xlmToStroopsBigInt(xlm: number | string): bigint {
  const raw = String(xlm).trim()
  const [wholePart, fracPart = ''] = raw.replace(/^-/, '').split('.')
  const whole = wholePart.replace(/\D/g, '') || '0'
  const frac = (fracPart.replace(/\D/g, '') + '0000000').slice(0, 7)
  const stroops = BigInt(whole) * STROOPS_PER_XLM + BigInt(frac)
  if (raw.startsWith('-') && stroops !== 0n) {
    throw new Error('Amount must be non-negative')
  }
  return stroops
}

export function stroopsToXlm(stroops: bigint | number | string): number {
  const n = typeof stroops === 'bigint' ? stroops : BigInt(String(stroops))
  return Number(n) / 1e7
}

async function waitForTx(server: rpc.Server, hash: string): Promise<void> {
  const started = Date.now()
  while (Date.now() - started < 60_000) {
    const response = await server.getTransaction(hash)
    if (response.status === rpc.Api.GetTransactionStatus.SUCCESS) return
    if (response.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error('Soroban transaction failed on-chain')
    }
    await new Promise((r) => setTimeout(r, 1200))
  }
  throw new Error(`Timed out waiting for transaction ${hash}`)
}

/**
 * Read classic XLM SAC balance held by the escrow contract (C...).
 * Uses a simulate-only `balance` call; `simulatorAddress` must exist on testnet.
 */
export async function getContractXlmBalanceXlm(
  simulatorAddress: string,
  contractId: string = getEscrowContractId(),
): Promise<number> {
  const server = new rpc.Server(RPC_URL)
  const account = await server.getAccount(simulatorAddress)
  const token = new Contract(getXlmTokenId())
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(token.call('balance', new Address(contractId).toScVal()))
    .setTimeout(30)
    .build()

  const sim = await server.simulateTransaction(tx)
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result?.retval) {
    throw new Error('Failed to simulate token.balance for escrow contract')
  }
  const raw = scValToNative(sim.result.retval)
  return stroopsToXlm(typeof raw === 'bigint' ? raw : BigInt(String(raw)))
}

/**
 * Sponsor Freighter → SAC `transfer` into the escrow contract (funds execute_release).
 */
export async function fundEscrowContractWithFreighter(options: {
  sponsorAddress: string
  amountXlm: number
  contractId?: string
}): Promise<{ txHash: string }> {
  const contractId = options.contractId || getEscrowContractId()
  const amountStroops = xlmToStroopsBigInt(options.amountXlm)
  if (amountStroops <= 0n) throw new Error('Amount must be > 0')

  const server = new rpc.Server(RPC_URL)
  const account = await server.getAccount(options.sponsorAddress)
  const token = new Contract(getXlmTokenId())

  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK,
  })
    .addOperation(
      token.call(
        'transfer',
        new Address(options.sponsorAddress).toScVal(),
        new Address(contractId).toScVal(),
        nativeToScVal(amountStroops, { type: 'i128' }),
      ),
    )
    .setTimeout(120)
    .build()

  const prepared = await server.prepareTransaction(built)
  const signed = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK,
    address: options.sponsorAddress,
  })

  if (signed.error || !signed.signedTxXdr) {
    throw new Error(signed.error || 'Failed to sign Soroban transfer in Freighter')
  }

  const signedTx = new Transaction(signed.signedTxXdr, NETWORK)
  const sent = await server.sendTransaction(signedTx)
  if (sent.status === 'ERROR') {
    throw new Error(
      sent.errorResult != null
        ? `RPC rejected funding tx: ${JSON.stringify(sent.errorResult)}`
        : 'RPC rejected funding transaction',
    )
  }

  await waitForTx(server, sent.hash)
  return { txHash: sent.hash }
}
