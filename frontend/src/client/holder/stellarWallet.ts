/**
 * Stellar wallet adapter — Freighter extension (desktop) or Freighter Mobile (WalletConnect).
 */
export { default } from '../wallet'
export {
  connectWallet,
  disconnectWallet,
  ensureWalletAddress,
  reconnectWalletSession,
  signTransactionXdr,
  isWalletConnectConfigured,
  getWalletConnectProjectId,
} from '../wallet'
export { openFreighterMobile, getLastWalletConnectUri, isLikelyMobileDevice, onWalletConnectUri } from '../wallet/walletConnect'
