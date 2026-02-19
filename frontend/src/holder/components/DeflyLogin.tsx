import React, { useState, useEffect } from 'react'
import deflyWallet from '../deflyWallet'

interface DeflyLoginProps {
  onConnect: (address: string) => void
  onError?: (error: string) => void
}

export default function DeflyLogin({ onConnect, onError }: DeflyLoginProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Restore session on load (e.g. user refreshed with wallet already connected)
    deflyWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length > 0) {
          setIsConnected(true)
          onConnect(accounts[0])
        }
      })
      .catch(() => {
        // No previous session, ignore
      })

    const handleDisconnect = () => {
      setIsConnected(false)
    }
    deflyWallet.connector?.on('disconnect', handleDisconnect)
    return () => {
      try {
        if (deflyWallet.connector && typeof (deflyWallet.connector as { off?: (e: string, h: () => void) => void }).off === 'function') {
          (deflyWallet.connector as { off: (e: string, h: () => void) => void }).off('disconnect', handleDisconnect)
        }
      } catch (_) {
        // ignore
      }
    }
  }, [onConnect])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const accounts = await deflyWallet.connect()
      if (accounts && accounts.length > 0) {
        setIsConnected(true)
        onConnect(accounts[0])
      } else {
        throw new Error('No accounts returned from Defly wallet')
      }
    } catch (err: unknown) {
      const errorData = err && typeof err === 'object' && 'data' in err ? (err as { data?: { type?: string } }).data : undefined
      if (errorData?.type === 'CONNECT_MODAL_CLOSED') {
        // User closed the modal, no need to show error
        return
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to Defly wallet'
      onError?.(errorMsg)
      console.error('Defly connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await deflyWallet.disconnect()
      setIsConnected(false)
    } catch (error) {
      console.error('Defly disconnect error:', error)
    }
  }

  return (
    <div className="defly-login-container">
      <p className="defly-try-anyway">
        Connect using the Defly Wallet app (scan QR with your phone) or Defly Web Beta extension if supported.
      </p>
      <button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting}
        className="button primary defly-connect-btn"
      >
        {isConnecting ? 'Connecting...' : 'Connect Defly Wallet'}
      </button>
      {isConnected && (
        <button
          type="button"
          onClick={handleDisconnect}
          className="button secondary defly-disconnect-btn"
        >
          Disconnect
        </button>
      )}
      <p className="defly-install-hint">
        Don’t have Defly?{' '}
        <a
          href="https://chromewebstore.google.com/detail/defly-web-beta/lhpblinkecpdphpkjblmdpebjammicdm"
          target="_blank"
          rel="noopener noreferrer"
          className="defly-install-link"
        >
          Install Defly Web Beta (Chrome)
        </a>
        {' '}or use the Defly app on your phone.
      </p>
    </div>
  )
}
