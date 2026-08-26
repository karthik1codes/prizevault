/**
 * Stellar wallet adapter using Freighter browser wallet.
 * Uses signMessage so Freighter always opens a confirmation step (pick / confirm account),
 * instead of requestAccess + getAddress which can return immediately for allowlisted sites.
 */
import { getAddress, isConnected, signMessage } from '@stellar/freighter-api'
import { Networks } from '@stellar/stellar-sdk'

const CONNECT_CHALLENGE =
  'Prize Vault (Stellar testnet): sign this message to connect your wallet to this browser session. This is not a payment and does not move funds.'

function freighterErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string') {
    return (err as { message: string }).message
  }
  return 'Freighter request failed'
}

const stellarWallet = {
  connector: null as null,
  async connect(): Promise<string[]> {
    const signed = await signMessage(CONNECT_CHALLENGE, {
      networkPassphrase: Networks.TESTNET,
    })
    if (signed.error) {
      throw new Error(freighterErrorMessage(signed.error))
    }
    const addr = signed.signerAddress
    if (!addr) {
      throw new Error('No wallet address returned from Freighter. Approve the sign request or pick an account.')
    }
    return [addr]
  },
  async reconnectSession(): Promise<string[]> {
    const connected = await isConnected()
    if (connected.error || !connected.isConnected) return []
    const addrRes = await getAddress()
    if (addrRes.error || !addrRes.address) return []
    return [addrRes.address]
  },
  async disconnect(): Promise<void> {
    return
  },
}

export default stellarWallet
