/**
 * Loaded only after user clicks "Connect Defly Wallet".
 * Isolates @blockshake/defly-connect so the holder page can render without it.
 */
import DeflyLogin from './components/DeflyLogin'

interface DeflyConnectBlockProps {
  onConnect: (address: string) => void
  onError?: (error: string) => void
}

export default function DeflyConnectBlock({ onConnect, onError }: DeflyConnectBlockProps) {
  return <DeflyLogin onConnect={onConnect} onError={onError} />
}
