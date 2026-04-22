import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import stellarWallet from '../stellarWallet'

interface StellarLoginProps {
  onConnect: (address: string) => void
  onError?: (error: string) => void
}

export default function StellarLogin({ onConnect, onError }: StellarLoginProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [appQr, setAppQr] = useState('')
  const [connectError, setConnectError] = useState('')

  useEffect(() => {
    stellarWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length > 0) {
          setIsConnected(true)
          onConnect(accounts[0])
        }
      })
      .catch(() => {})

    const buildQr = async () => {
      try {
        const currentUrl = window.location.href
        const qr = await QRCode.toDataURL(currentUrl, {
          width: 200,
          margin: 1,
        })
        setAppQr(qr)
      } catch (err) {
        console.error('Failed to render QR code:', err)
      }
    }

    buildQr()
  }, [onConnect])

  const handleConnect = async () => {
    setConnectError('')
    setIsConnecting(true)
    try {
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
            Mobile connect: scan this QR on your phone, open this page, then connect with your Stellar wallet there.
          </p>
          <img
            src={appQr}
            alt="QR code to open this app on mobile"
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
