import { CONNECT_CHALLENGE } from './freighterExtension'

/** Freighter listing in WalletConnect / Reown Explorer (featured row). */
export const FREIGHTER_WALLET_ID =
  '997a355c8f682468706a76cff1b004a7115f505fb962dac54b6e9b442dd1c380'

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
  session?: WcSession | null
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

export function getWalletConnectProjectId(): string {
  return (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '').trim()
}

export function isWalletConnectConfigured(): boolean {
  return getWalletConnectProjectId().length > 0
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

    const modal = createAppKit({
      projectId,
      networks: [networks.mainnet],
      universalProvider: provider as never,
      manualWCControl: true,
      featuredWalletIds: [FREIGHTER_WALLET_ID],
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

  modal.open()
  try {
    const session = await provider.connect({
      namespaces: {
        stellar: {
          methods: [...STELLAR_METHODS],
          chains: [STELLAR_CHAIN, 'stellar:pubnet'],
          events: ['accountsChanged'],
        },
      },
    })

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
