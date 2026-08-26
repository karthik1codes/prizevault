import { CONNECT_CHALLENGE } from './freighterExtension'

/** Freighter listing in WalletConnect / Reown Explorer (featured row). */
export const FREIGHTER_WALLET_ID =
  '997a355c8f682468706a76cff1b004a7115f505fb962dac54b6e9b442dd1c380'

/** From WalletConnect Explorer — opens Freighter Mobile with a WC pairing URI. */
export const FREIGHTER_MOBILE_NATIVE = 'freighterwallet://wc-redirect'

/** PrizeVault runs on Stellar Testnet. */
export const STELLAR_CHAIN = 'stellar:testnet'

const STELLAR_METHODS = [
  'stellar_signXDR',
  'stellar_signAndSubmitXDR',
  'stellar_signMessage',
  'stellar_signAuthEntry',
] as const

type AppKitModal = {
  open: () => void
  close: () => void
}

type WcSession = {
  namespaces?: { stellar?: { accounts?: string[]; methods?: string[] } }
}

type WcProvider = {
  uri?: string | null
  session?: WcSession | null
  on: (event: string, listener: (...args: unknown[]) => void) => void
  off?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
  connect: (args: {
    namespaces: {
      stellar: {
        methods: string[]
        chains: string[]
        events: string[]
      }
    }
  }) => Promise<WcSession | undefined>
  request: (args: { method: string; params: Record<string, string> }, chain: string) => Promise<unknown>
  disconnect: () => Promise<void>
}

let providerSingleton: WcProvider | null = null
let modalSingleton: AppKitModal | null = null
let initPromise: Promise<{ provider: WcProvider; modal: AppKitModal }> | null = null
let lastDisplayUri: string | null = null
const uriListeners = new Set<(uri: string) => void>()

export function getWalletConnectProjectId(): string {
  return (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '').trim()
}

export function isWalletConnectConfigured(): boolean {
  return getWalletConnectProjectId().length > 0
}

export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

function parseStellarAccount(account: string): string | null {
  const parts = account.split(':')
  const address = parts[parts.length - 1]
  return address && /^G[A-Z2-7]{55}$/.test(address) ? address : null
}

export function addressFromSession(session: WcSession | null | undefined): string | null {
  const accounts = session?.namespaces?.stellar?.accounts || []
  for (const account of accounts) {
    const address = parseStellarAccount(account)
    if (address) return address
  }
  return null
}

function extractUri(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.startsWith('wc:')) return payload
  if (payload && typeof payload === 'object' && 'uri' in payload) {
    const uri = (payload as { uri?: unknown }).uri
    if (typeof uri === 'string' && uri.startsWith('wc:')) return uri
  }
  return null
}

function rememberUri(uri: string): void {
  if (!uri || lastDisplayUri === uri) return
  lastDisplayUri = uri
  uriListeners.forEach((listener) => {
    try {
      listener(uri)
    } catch {
      // ignore
    }
  })
}

export function getLastWalletConnectUri(): string | null {
  return lastDisplayUri
}

/** Subscribe to pairing URI (for enabling Open Freighter once ready). */
export function onWalletConnectUri(listener: (uri: string) => void): () => void {
  uriListeners.add(listener)
  if (lastDisplayUri) listener(lastDisplayUri)
  return () => {
    uriListeners.delete(listener)
  }
}

export function freighterDeepLink(wcUri: string): string {
  return `${FREIGHTER_MOBILE_NATIVE}?uri=${encodeURIComponent(wcUri)}`
}

function launchFreighter(wcUri: string): void {
  if (typeof window === 'undefined') return
  const deepLink = freighterDeepLink(wcUri)
  // User-gesture friendly: try custom scheme without unloading the SPA when possible.
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = deepLink
  document.body.appendChild(iframe)
  window.setTimeout(() => {
    try {
      document.body.removeChild(iframe)
    } catch {
      // ignore
    }
  }, 2000)
  // Fallback for browsers that ignore iframe custom schemes.
  window.setTimeout(() => {
    window.location.href = deepLink
  }, 400)
}

/** Open Freighter immediately if URI exists; otherwise wait until it does. */
export async function openFreighterMobile(timeoutMs = 25_000): Promise<boolean> {
  if (typeof window === 'undefined') return false

  if (lastDisplayUri) {
    launchFreighter(lastDisplayUri)
    return true
  }

  // Provider may already have set .uri even if our event listener missed it.
  const fromProvider = extractUri(providerSingleton?.uri)
  if (fromProvider) {
    rememberUri(fromProvider)
    launchFreighter(fromProvider)
    return true
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      unsub()
      window.clearInterval(poll)
      window.clearTimeout(timer)
      resolve(ok)
    }

    const unsub = onWalletConnectUri((uri) => {
      launchFreighter(uri)
      finish(true)
    })

    const poll = window.setInterval(() => {
      const uri = extractUri(providerSingleton?.uri)
      if (uri) {
        rememberUri(uri)
        launchFreighter(uri)
        finish(true)
      }
    }, 250)

    const timer = window.setTimeout(() => finish(false), timeoutMs)
  })
}

async function initWalletConnect(): Promise<{
  provider: WcProvider
  modal: AppKitModal
}> {
  if (providerSingleton && modalSingleton) {
    return { provider: providerSingleton, modal: modalSingleton }
  }
  if (initPromise) return initPromise

  initPromise = (async () => {
    const projectId = getWalletConnectProjectId()
    if (!projectId) {
      throw new Error(
        'Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (free at https://dashboard.walletconnect.com/) to connect Freighter Mobile.',
      )
    }

    const [{ UniversalProvider }, { createAppKit }, networks] = await Promise.all([
      import('@walletconnect/universal-provider'),
      import('@reown/appkit/core'),
      import('@reown/appkit/networks'),
    ])

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://prizevault.app'

    const provider = (await UniversalProvider.init({
      projectId,
      metadata: {
        name: 'PrizeVault',
        description: 'Stellar hackathon prize escrow — dual-approval payouts on testnet',
        url: origin,
        icons: [`${origin}/favicon.ico`],
      },
    })) as unknown as WcProvider

    // Capture URI for the lifetime of this provider (AppKit also listens).
    provider.on('display_uri', (...args: unknown[]) => {
      const uri = extractUri(args[0]) ?? extractUri(args)
      if (uri) rememberUri(uri)
    })

    const modal = createAppKit({
      projectId,
      networks: [networks.mainnet],
      universalProvider: provider as never,
      manualWCControl: true,
      featuredWalletIds: [FREIGHTER_WALLET_ID],
      includeWalletIds: [FREIGHTER_WALLET_ID],
    }) as AppKitModal

    providerSingleton = provider
    modalSingleton = modal
    return { provider, modal }
  })()

  try {
    return await initPromise
  } catch (err) {
    initPromise = null
    throw err
  }
}

export async function connectWalletConnect(): Promise<string> {
  const { provider, modal } = await initWalletConnect()
  lastDisplayUri = null

  const onDisplayUri = (...args: unknown[]) => {
    const uri = extractUri(args[0]) ?? extractUri(args)
    if (uri) rememberUri(uri)
  }
  provider.on('display_uri', onDisplayUri)

  const mobile = isLikelyMobileDevice()
  // On phones, skip the QR-only AppKit sheet — we deep-link Freighter instead.
  if (!mobile) {
    modal.open()
  }

  const connectPromise = provider.connect({
    namespaces: {
      stellar: {
        methods: [...STELLAR_METHODS],
        chains: [STELLAR_CHAIN, 'stellar:pubnet'],
        events: ['accountsChanged'],
      },
    },
  })

  if (mobile) {
    // Wait briefly for pairing URI, then try auto-open (may be blocked without gesture).
    const started = Date.now()
    while (!lastDisplayUri && Date.now() - started < 8_000) {
      const uri = extractUri(provider.uri)
      if (uri) {
        rememberUri(uri)
        break
      }
      await new Promise((r) => setTimeout(r, 150))
    }
    if (lastDisplayUri) {
      launchFreighter(lastDisplayUri)
    }
  }

  try {
    const session = await connectPromise

    if (!session) {
      throw new Error('WalletConnect connection failed or was cancelled')
    }

    const address = addressFromSession(session)
    if (!address) {
      throw new Error('Freighter Mobile did not return a Stellar address')
    }

    try {
      await provider.request(
        {
          method: 'stellar_signMessage',
          params: { message: CONNECT_CHALLENGE },
        },
        STELLAR_CHAIN,
      )
    } catch {
      // Session address is enough if message sign is unsupported.
    }

    return address
  } finally {
    try {
      provider.off?.('display_uri', onDisplayUri)
      provider.removeListener?.('display_uri', onDisplayUri)
    } catch {
      // ignore
    }
    try {
      modal.close()
    } catch {
      // ignore
    }
  }
}

export async function signWithWalletConnect(xdr: string): Promise<string> {
  const { provider } = await initWalletConnect()
  if (!provider.session) {
    throw new Error('WalletConnect session expired. Connect your wallet again.')
  }

  const result = (await provider.request(
    {
      method: 'stellar_signXDR',
      params: { xdr },
    },
    STELLAR_CHAIN,
  )) as { signedXDR?: string }

  if (!result?.signedXDR) {
    throw new Error('Freighter Mobile did not return a signed transaction')
  }
  return result.signedXDR
}

export async function disconnectWalletConnect(): Promise<void> {
  if (!providerSingleton) return
  try {
    await providerSingleton.disconnect()
  } catch {
    // ignore
  }
}

export function getWalletConnectAddress(): string | null {
  if (!providerSingleton?.session) return null
  return addressFromSession(providerSingleton.session)
}
