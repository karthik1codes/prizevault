// Defly Wallet Browser Extension API Types

interface DeflyWalletConnectResult {
  accounts: string[]
}

interface DeflyWallet {
  connect(): Promise<DeflyWalletConnectResult>
  disconnect(): Promise<void>
  accounts: string[]
  isConnected: boolean
}

declare global {
  interface Window {
    deflyWallet?: DeflyWallet
  }
}

export {}
