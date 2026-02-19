/**
 * Singleton Defly Wallet Connect instance using @blockshake/defly-connect SDK.
 * Uses WalletConnect so it works with Defly mobile app and compatible extensions.
 */
import { DeflyWalletConnect } from '@blockshake/defly-connect'

const deflyWallet = new DeflyWalletConnect({
  chainId: 416002, // Algorand TestNet – use 416001 for MainNet, 4160 for all
  shouldShowSignTxnToast: true,
})

export default deflyWallet
