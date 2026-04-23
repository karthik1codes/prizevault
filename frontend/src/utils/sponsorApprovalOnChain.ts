import { signTransaction } from '@stellar/freighter-api'
import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk'

interface SponsorApprovalParams {
  sponsorAddress: string
  proposalId: string
}

interface SponsorApprovalResult {
  txHash: string
}

const DEFAULT_HORIZON_URL = 'https://horizon-testnet.stellar.org'

function getHorizonServer(): Horizon.Server {
  const horizonUrl = import.meta.env.VITE_STELLAR_HORIZON_URL || DEFAULT_HORIZON_URL
  return new Horizon.Server(horizonUrl)
}

function getNetworkPassphrase(): string {
  const configured = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE
  if (configured && configured.trim().length > 0) return configured
  const network = (import.meta.env.VITE_STELLAR_NETWORK || 'TESTNET').toUpperCase()
  return network === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET
}

function buildMemo(proposalId: string) {
  const trimmed = proposalId.trim().slice(0, 28)
  return Memo.text(`sponsor-approve:${trimmed}`)
}

export async function submitSponsorApprovalOnChain({
  sponsorAddress,
  proposalId,
}: SponsorApprovalParams): Promise<SponsorApprovalResult> {
  if (!sponsorAddress?.startsWith('G')) {
    throw new Error('Connect a valid Stellar sponsor wallet before approving payout.')
  }
  if (!proposalId?.trim()) {
    throw new Error('Missing payout proposal id.')
  }

  const server = getHorizonServer()
  const networkPassphrase = getNetworkPassphrase()
  const sourceAccount = await server.loadAccount(sponsorAddress)

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        source: sponsorAddress,
        destination: sponsorAddress,
        amount: '0.0000001',
        asset: Asset.native(),
      })
    )
    .addMemo(buildMemo(proposalId))
    .setTimeout(120)
    .build()

  const signed = await signTransaction(tx.toXDR(), {
    networkPassphrase,
    address: sponsorAddress,
  })

  if (signed.error) {
    throw new Error(signed.error)
  }
  if (!signed.signedTxXdr) {
    throw new Error('Freighter did not return a signed transaction.')
  }

  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase)
  const submitResult = await server.submitTransaction(signedTx)
  return { txHash: submitResult.hash }
}
