/**
 * Loaded only after user clicks "Connect Stellar Wallet".
 */
import StellarLogin from './components/StellarLogin'

interface StellarConnectBlockProps {
  onConnect: (address: string) => void
  onError?: (error: string) => void
}

export default function StellarConnectBlock({ onConnect, onError }: StellarConnectBlockProps) {
  return <StellarLogin onConnect={onConnect} onError={onError} />
}
