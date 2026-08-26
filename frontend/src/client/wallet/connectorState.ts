export type WalletConnector = 'freighter' | 'walletconnect'

const CONNECTOR_KEY = 'pv_wallet_connector'
const ADDRESS_KEY = 'pv_wallet_address'

export function getStoredConnector(): WalletConnector | null {
  if (typeof window === 'undefined') return null
  const value = window.sessionStorage.getItem(CONNECTOR_KEY)
  if (value === 'freighter' || value === 'walletconnect') return value
  return null
}

export function setStoredConnector(connector: WalletConnector, address: string): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(CONNECTOR_KEY, connector)
  window.sessionStorage.setItem(ADDRESS_KEY, address)
}

export function getStoredWalletAddress(): string | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(ADDRESS_KEY)
}

export function clearStoredConnector(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(CONNECTOR_KEY)
  window.sessionStorage.removeItem(ADDRESS_KEY)
}
