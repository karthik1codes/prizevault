import {
  getAddress,
  isConnected,
  requestAccess,
  signMessage,
  signTransaction,
} from '@stellar/freighter-api'
import { Networks } from '@stellar/stellar-sdk'

export const CONNECT_CHALLENGE =
  'Prize Vault (Stellar testnet): sign this message to connect your wallet to this browser session. This is not a payment and does not move funds.'

export function freighterErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string') {
    return (err as { message: string }).message
  }
  return 'Freighter request failed'
}

function looksLikeMissingExtension(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('not installed') ||
    m.includes('not detected') ||
    m.includes('could not find') ||
    m.includes('no freighter') ||
    m.includes('unavailable')
  )
}

/** True when the Freighter browser extension (or injected API) is present. */
export async function isFreighterExtensionAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const res = await isConnected()
    if (res.error) {
      const msg = freighterErrorMessage(res.error)
      if (looksLikeMissingExtension(msg)) return false
      // Extension present but locked / not connected yet
      return true
    }
    return true
  } catch (err) {
    const msg = freighterErrorMessage(err)
    if (looksLikeMissingExtension(msg)) return false
    return false
  }
}

export async function connectFreighterExtension(): Promise<string> {
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
  return addr
}

export async function requestFreighterAccess(): Promise<string> {
  const access = await requestAccess()
  if (access.error) throw new Error(freighterErrorMessage(access.error))
  if (!access.address) throw new Error('Freighter did not return an address')
  return access.address
}

export async function getFreighterAddress(): Promise<string | null> {
  const connected = await isConnected()
  if (connected.error || !connected.isConnected) return null
  const addrRes = await getAddress()
  if (addrRes.error || !addrRes.address) return null
  return addrRes.address
}

export async function signWithFreighterExtension(
  xdr: string,
  options: { networkPassphrase: string; address?: string },
): Promise<string> {
  const signed = await signTransaction(xdr, {
    networkPassphrase: options.networkPassphrase,
    address: options.address,
  })
  if (signed.error || !signed.signedTxXdr) {
    throw new Error(freighterErrorMessage(signed.error) || 'Failed to sign transaction in Freighter')
  }
  return signed.signedTxXdr
}
