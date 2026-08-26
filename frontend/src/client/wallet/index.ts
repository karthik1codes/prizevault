/**
 * Unified Stellar wallet: Freighter browser extension (desktop) or
 * Freighter Mobile via WalletConnect (phone).
 */
import {
  clearStoredConnector,
  getStoredConnector,
  getStoredWalletAddress,
  setStoredConnector,
  type WalletConnector,
} from './connectorState'
import {
  connectFreighterExtension,
  getFreighterAddress,
  isFreighterExtensionAvailable,
  requestFreighterAccess,
  signWithFreighterExtension,
} from './freighterExtension'
import {
  connectWalletConnect,
  disconnectWalletConnect,
  getWalletConnectAddress,
  getWalletConnectProjectId,
  isWalletConnectConfigured,
  signWithWalletConnect,
} from './walletConnect'

export { isWalletConnectConfigured, getWalletConnectProjectId }
export type { WalletConnector }

export async function connectWallet(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet connect is only available in the browser')
  }

  const extensionOk = await isFreighterExtensionAvailable()
  if (extensionOk) {
    try {
      const address = await connectFreighterExtension()
      setStoredConnector('freighter', address)
      return address
    } catch (err) {
      // On phones the injected API may appear broken; fall through to WalletConnect.
      if (!isWalletConnectConfigured()) throw err
    }
  }

  if (isWalletConnectConfigured()) {
    const address = await connectWalletConnect()
    setStoredConnector('walletconnect', address)
    return address
  }

  throw new Error(
    'No Freighter extension found. On mobile, set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID and use Freighter Mobile. On desktop, install Freighter from https://www.freighter.app/',
  )
}

/** Ensure we have a signing address (extension allowlist or WC session). */
export async function ensureWalletAddress(): Promise<string> {
  const connector = getStoredConnector()
  if (connector === 'walletconnect') {
    const fromSession = getWalletConnectAddress() || getStoredWalletAddress()
    if (fromSession) return fromSession
    return connectWallet()
  }

  if (await isFreighterExtensionAvailable()) {
    const existing = await getFreighterAddress()
    if (existing) {
      setStoredConnector('freighter', existing)
      return existing
    }
    const address = await requestFreighterAccess()
    setStoredConnector('freighter', address)
    return address
  }

  if (isWalletConnectConfigured()) {
    const fromSession = getWalletConnectAddress() || getStoredWalletAddress()
    if (fromSession) {
      setStoredConnector('walletconnect', fromSession)
      return fromSession
    }
    return connectWallet()
  }

  throw new Error('Connect your Stellar wallet first')
}

export async function signTransactionXdr(
  xdr: string,
  options: { networkPassphrase: string; address?: string },
): Promise<string> {
  const connector = getStoredConnector()

  if (connector === 'walletconnect' || (!connector && !(await isFreighterExtensionAvailable()))) {
    return signWithWalletConnect(xdr)
  }

  return signWithFreighterExtension(xdr, options)
}

export async function reconnectWalletSession(): Promise<string[]> {
  const connector = getStoredConnector()
  if (connector === 'walletconnect') {
    const address = getWalletConnectAddress() || getStoredWalletAddress()
    return address ? [address] : []
  }
  const address = await getFreighterAddress()
  return address ? [address] : []
}

export async function disconnectWallet(): Promise<void> {
  const connector = getStoredConnector()
  if (connector === 'walletconnect') {
    await disconnectWalletConnect()
  }
  clearStoredConnector()
}

const stellarWallet = {
  connector: null as null,
  connect: async (): Promise<string[]> => {
    const address = await connectWallet()
    return [address]
  },
  reconnectSession: reconnectWalletSession,
  disconnect: disconnectWallet,
}

export default stellarWallet
