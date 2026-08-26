import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import Icon from '../../components/Icon'
import stellarWallet, {
  isWalletConnectConfigured,
  openFreighterMobile,
} from '../stellarWallet'
import organizerWalletQr from '../../assets/organizer-wallet-qr.png'
import sponsorWalletQr from '../../assets/sponsor-wallet-qr.png'
import participantWalletQr from '../../assets/participant-wallet-qr.png'
import { AppRole, clearManualConnectRequirement } from '../../utils/authSession'
import { ROLE_WALLET_MAP } from '../../constants/qrWallets'

interface StellarLoginProps {
  onConnect: (address: string) => void
  onError?: (error: string) => void
  desiredRole?: AppRole | null
}

function assetUrl(mod: string | { src: string }): string {
  return typeof mod === 'string' ? mod : mod.src
}

const ROLE_QR: Partial<Record<AppRole, string>> = {
  organizer: assetUrl(organizerWalletQr as string | { src: string }),
  sponsor: assetUrl(sponsorWalletQr as string | { src: string }),
  participant: assetUrl(participantWalletQr as string | { src: string }),
}

function isLikelyMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export default function StellarLogin({
  onConnect,
  onError,
  desiredRole = null,
}: StellarLoginProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [generatedQr, setGeneratedQr] = useState('')
  const [connectError, setConnectError] = useState('')
  const mobile = isLikelyMobile()
  const wcReady = isWalletConnectConfigured()

  const role: AppRole = desiredRole || 'participant'
  const walletForRole = ROLE_WALLET_MAP[role] || ROLE_WALLET_MAP.participant || ''
  const walletExplorerUrl = walletForRole
    ? `https://stellar.expert/explorer/public/account/${walletForRole}`
    : ''

  useEffect(() => {
    if (!walletExplorerUrl) return
    let cancelled = false
    QRCode.toDataURL(walletExplorerUrl, { width: 200, margin: 1 })
      .then((qr) => {
        if (!cancelled) setGeneratedQr(qr)
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to render QR code:', err)
      })
    return () => {
      cancelled = true
    }
  }, [walletExplorerUrl])

  const handleConnect = async () => {
    setConnectError('')
    setIsConnecting(true)
    const timeoutMs = mobile || wcReady ? 120_000 : 20_000
    try {
      clearManualConnectRequirement()
      const accounts = await Promise.race([
        stellarWallet.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  mobile
                    ? 'Wallet connect timed out. Open Freighter Mobile, approve the request, and try again.'
                    : 'Wallet connect request timed out. Open Freighter and try again.',
                ),
              ),
            timeoutMs,
          ),
        ),
      ])
      if (accounts && accounts.length > 0) {
        onConnect(accounts[0])
      } else {
        throw new Error('No accounts returned from Stellar wallet')
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to connect to Stellar wallet'
      setConnectError(errorMsg)
      onError?.(errorMsg)
      // eslint-disable-next-line no-console
      console.error('Stellar wallet connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const qrSrc = ROLE_QR[role] || generatedQr

  return (
    <div className="pv-stack pv-stack--lg">
      <div className="pv-alert pv-alert--accent">
        <span className="pv-alert__icon">
          <Icon name="info" size={16} />
        </span>
        <div className="pv-alert__content">
          <p className="pv-alert__text">
            {mobile
              ? wcReady
                ? 'PrizeVault will try to open Freighter Mobile automatically. If you only see a QR code, ignore it and tap Open Freighter app below — then Approve in Freighter (Testnet).'
                : 'Mobile needs WalletConnect. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in Vercel (free at dashboard.walletconnect.com), redeploy, then tap Connect again.'
              : 'Freighter will open and ask you to sign a short testnet message. That signature only confirms which account you control — it moves no funds.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting || (mobile && !wcReady)}
        className="pv-btn pv-btn--primary pv-btn--lg pv-btn--block"
      >
        {isConnecting ? (
          <>
            <span className="pv-btn__spinner" />
            {mobile ? 'Waiting for Freighter Mobile' : 'Waiting for Freighter'}
          </>
        ) : (
          <>
            <Icon name="wallet" size={16} />
            Connect Stellar wallet
          </>
        )}
      </button>

      {isConnecting && mobile && wcReady ? (
        <>
          <button
            type="button"
            className="pv-btn pv-btn--secondary pv-btn--lg pv-btn--block"
            onClick={() => {
              if (!openFreighterMobile()) {
                setConnectError(
                  'Connection link not ready yet — wait 1 second and tap Open Freighter app again.',
                )
              }
            }}
          >
            Open Freighter app
          </button>
          <p className="pv-muted" style={{ fontSize: 'var(--pv-text-sm)', textAlign: 'center' }}>
            Ignore the QR on this phone. Tap <strong>Open Freighter app</strong>, then Approve
            (use Testnet in Freighter).
          </p>
        </>
      ) : null}

      {connectError ? (
        <div className="pv-alert pv-alert--danger" role="alert" aria-live="assertive">
          <span className="pv-alert__icon">
            <Icon name="alert" size={16} />
          </span>
          <div className="pv-alert__content">
            <p className="pv-alert__title">Could not connect</p>
            <p className="pv-alert__text">{connectError}</p>
          </div>
        </div>
      ) : null}

      {qrSrc ? (
        <div className="pv-card pv-card--flat">
          <div className="pv-card__body pv-card__body--tight">
            <div className="pv-row" style={{ alignItems: 'center', gap: 'var(--pv-space-7)' }}>
              <img
                src={qrSrc}
                alt={`QR code for the ${role} Stellar wallet address`}
                width={132}
                height={132}
                style={{
                  borderRadius: 'var(--pv-radius-md)',
                  background: '#fff',
                  padding: 8,
                  border: '1px solid var(--pv-border)',
                  flex: 'none',
                }}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 'var(--pv-weight-semibold)' }}>Continue on your phone</p>
                <p className="pv-muted" style={{ fontSize: 'var(--pv-text-sm)', marginTop: 4 }}>
                  Scan to open the {role} wallet address on Stellar Expert.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <p className="pv-muted" style={{ fontSize: 'var(--pv-text-sm)', textAlign: 'center' }}>
        No wallet yet?{' '}
        <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer">
          Install Freighter
          <Icon name="external" size={12} />
        </a>
        {mobile ? ' (iOS / Android app)' : ' (browser extension)'}
      </p>
    </div>
  )
}
