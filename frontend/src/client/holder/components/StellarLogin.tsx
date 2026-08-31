import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import Icon from '../../components/Icon'
import stellarWallet, {
  isWalletConnectConfigured,
  openFreighterMobile,
  onWalletConnectUri,
} from '../stellarWallet'
import { AppRole, clearManualConnectRequirement } from '../../utils/authSession'
import { holderSessionUrl } from '../../constants/qrWallets'
import { isValidStellarAddress } from '../../constants/escrow'

interface StellarLoginProps {
  onConnect: (address: string) => void
  onError?: (error: string) => void
  desiredRole?: AppRole | null
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
  const [openingFreighter, setOpeningFreighter] = useState(false)
  const [uriReady, setUriReady] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [sessionQr, setSessionQr] = useState('')
  const mobile = isLikelyMobile()
  const wcReady = isWalletConnectConfigured()
  const role: AppRole = desiredRole || 'participant'

  useEffect(() => {
    if (!isConnecting || !mobile) {
      setUriReady(false)
      return
    }
    return onWalletConnectUri(() => setUriReady(true))
  }, [isConnecting, mobile])

  useEffect(() => {
    const addr = manualAddress.trim().toUpperCase()
    if (!isValidStellarAddress(addr)) {
      setSessionQr('')
      return
    }
    let cancelled = false
    const url = holderSessionUrl(role, addr)
    QRCode.toDataURL(url, { width: 200, margin: 1 })
      .then((qr) => {
        if (!cancelled) setSessionQr(qr)
      })
      .catch(() => {
        if (!cancelled) setSessionQr('')
      })
    return () => {
      cancelled = true
    }
  }, [manualAddress, role])

  const handleConnect = async () => {
    setConnectError('')
    setUriReady(false)
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
                    ? 'Wallet connect timed out. Tap Open Freighter app, approve in Freighter (Testnet), and try again.'
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
      setOpeningFreighter(false)
    }
  }

  const handleOpenFreighter = async () => {
    setConnectError('')
    setOpeningFreighter(true)
    try {
      const ok = await openFreighterMobile(25_000)
      if (!ok) {
        setConnectError(
          'Still waiting for WalletConnect. Keep this tab open, tap Connect again, then tap Open Freighter app as soon as it says Ready.',
        )
      }
    } finally {
      setOpeningFreighter(false)
    }
  }

  const handleManualContinue = () => {
    setConnectError('')
    const addr = manualAddress.trim().toUpperCase()
    if (!isValidStellarAddress(addr)) {
      const msg = 'Enter a valid Stellar G-address (56 characters starting with G).'
      setConnectError(msg)
      onError?.(msg)
      return
    }
    clearManualConnectRequirement()
    onConnect(addr)
  }

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
                ? 'This session uses whatever wallet you connect. Tap Connect, wait until Open Freighter says Ready, then Approve in Freighter (Testnet).'
                : 'Mobile needs WalletConnect. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, redeploy, then connect again.'
              : 'Connect Freighter to use your own address for this browser session. No demo wallets are hard-coded.'}
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
            onClick={() => void handleOpenFreighter()}
            disabled={openingFreighter}
          >
            {openingFreighter ? (
              <>
                <span className="pv-btn__spinner" />
                Opening Freighter…
              </>
            ) : uriReady ? (
              'Open Freighter app (Ready)'
            ) : (
              'Open Freighter app (waiting for link…)'
            )}
          </button>
          <p className="pv-muted" style={{ fontSize: 'var(--pv-text-sm)', textAlign: 'center' }}>
            {uriReady
              ? 'Link ready — tap the button above, then Approve in Freighter.'
              : 'Preparing WalletConnect link… keep this tab open.'}
          </p>
        </>
      ) : null}

      <div className="pv-card pv-card--flat">
        <div className="pv-card__body pv-stack">
          <p style={{ fontWeight: 'var(--pv-weight-semibold)' }}>Or use an address for this session</p>
          <p className="pv-muted" style={{ fontSize: 'var(--pv-text-sm)' }}>
            Paste your Stellar G-address to browse as that account without Freighter (UI session
            only — on-chain escrow API still uses server keys).
          </p>
          <input
            type="text"
            className="pv-input"
            placeholder="G..."
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value.trim())}
            autoComplete="off"
            spellCheck={false}
            aria-label="Stellar wallet address"
          />
          <button
            type="button"
            className="pv-btn pv-btn--secondary pv-btn--block"
            onClick={handleManualContinue}
            disabled={isConnecting}
          >
            Continue with this address
          </button>
          {sessionQr ? (
            <div className="pv-row" style={{ alignItems: 'center', gap: 'var(--pv-space-7)' }}>
              <img
                src={sessionQr}
                alt="QR deep link for this session wallet"
                width={120}
                height={120}
                style={{
                  borderRadius: 'var(--pv-radius-md)',
                  background: '#fff',
                  padding: 8,
                  border: '1px solid var(--pv-border)',
                  flex: 'none',
                }}
              />
              <p className="pv-muted" style={{ fontSize: 'var(--pv-text-sm)' }}>
                Scan on another device to open the same role + wallet session link.
              </p>
            </div>
          ) : null}
        </div>
      </div>

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
