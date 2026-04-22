/**
 * Loaded only after user clicks "Connect Stellar Wallet".
 */
import StellarLogin from './components/StellarLogin'
import { AppRole } from '../utils/authSession'

interface StellarConnectBlockProps {
  onConnect: (address: string) => void
  onError?: (error: string) => void
  desiredRole?: AppRole | null
}

export default function StellarConnectBlock({ onConnect, onError, desiredRole }: StellarConnectBlockProps) {
  return <StellarLogin onConnect={onConnect} onError={onError} desiredRole={desiredRole} />
}
