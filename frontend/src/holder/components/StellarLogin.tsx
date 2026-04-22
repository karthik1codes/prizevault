import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import stellarWallet from '../stellarWallet'
import organizerWalletQr from '../../assets/organizer-wallet-qr.png'
import sponsorWalletQr from '../../assets/sponsor-wallet-qr.png'
import participantWalletQr from '../../assets/participant-wallet-qr.png'
import {
  clearManualConnectRequirement,
  AppRole,
  isManualConnectRequired,
} from '../../utils/authSession'
import { ROLE_WALLET_MAP } from '../../constants/qrWallets'

interface StellarLoginProps {
  onConnect: (address: string) => void
  onError?: (error: string) => void
  desiredRole?: AppRole | null
}

export default function StellarLogin({ onConnect, onError, desiredRole = null }: StellarLoginProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [appQr, setAppQr] = useState('')
  const [connectError, setConnectError] = useState('')
  const isOrganizer = desiredRole === 'organizer'
  const isSponsor = desiredRole === 'sponsor'
  const isParticipant = !desiredRole || desiredRole === 'participant'
  const walletForRole = (desiredRole ? ROLE_WALLET_MAP[desiredRole] : '') || ROLE_WALLET_MAP.participant || ''
  const walletExplorerUrl = walletForRole
    ? `https://stellar.expert/explorer/public/account/${walletForRole}`
    : ''

  useEffect(() => {
    if (!isManualConnectRequired()) {
      stellarWallet
        .reconnectSession()
        .then((accounts) => {
          if (accounts.length > 0) {
            setIsConnected(true)
            onConnect(accounts[0])
          }
        })
        .catch(() => {})
    }

    const buildQr = async () => {
      try {
        // Encode a browser URL so Google Lens opens directly to the Stellar account page.
        const qrPayload = walletExplorerUrl
        const qr = await QRCode.toDataURL(qrPayload, {
          width: 200,
          margin: 1,
        })
        setAppQr(qr)
      } catch (err) {
        console.error('Failed to render QR code:', err)
      }
    }

    buildQr()
  }, [onConnect, desiredRole, walletExplorerUrl])

  const handleConnect = async () => {
    setConnectError('')
    setIsConnecting(true)
    try {
      clearManualConnectRequirement()
      const accounts = await Promise.race([
        stellarWallet.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Wallet connect request timed out. Open Freighter and try again.')), 20000),
        ),
      ])
      if (accounts && accounts.length > 0) {
        setIsConnected(true)
        onConnect(accounts[0])
      } else {
        throw new Error('No accounts returned from Stellar wallet')
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to Stellar wallet'
      setConnectError(errorMsg)
      onError?.(errorMsg)
      console.error('Stellar wallet connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await stellarWallet.disconnect()
      setIsConnected(false)
    } catch (error) {
      console.error('Stellar wallet disconnect error:', error)
    }
  }

  return (
    <div className="wallet-login-container">
      <p className="wallet-try-anyway">
        Connect using Freighter browser extension (desktop), or scan QR to continue on phone.
      </p>
      <button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting}
        className="button primary wallet-connect-btn"
      >
        {isConnecting ? 'Connecting...' : 'Connect Stellar Wallet'}
      </button>
      {connectError && (
        <p className="wallet-install-hint" style={{ color: '#ff9ba5', marginTop: 10 }}>
          {connectError}
        </p>
      )}
      {isConnected && (
        <button
          type="button"
          onClick={handleDisconnect}
          className="button secondary wallet-disconnect-btn"
        >
          Disconnect
        </button>
      )}
      {appQr && (
        <div style={{ marginTop: 16 }}>
          <p className="wallet-install-hint" style={{ marginBottom: 10 }}>
            Mobile wallet address QR ({desiredRole || 'participant'}): scan with Google Lens to open the wallet address page.
          </p>
          <img
            src={isOrganizer ? organizerWalletQr : isSponsor ? sponsorWalletQr : isParticipant ? participantWalletQr : appQr}
            alt="QR code for Stellar wallet address"
            style={{ width: 180, height: 180, borderRadius: 12, background: '#fff', padding: 8 }}
          />
        </div>
      )}
      <p className="wallet-install-hint">
        Don’t have Freighter?{' '}
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="wallet-install-link"
        >
          Install Freighter
        </a>
        {' '}and create/connect your Stellar account.
      </p>
    </div>
  )
}
