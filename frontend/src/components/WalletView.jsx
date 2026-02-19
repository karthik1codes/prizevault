import React, { useState } from 'react'
import './WalletView.css'
import './shared.css'

function WalletView() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [copied, setCopied] = useState(false)

  const handleConnect = () => {
    // Placeholder for wallet connection logic
    setWalletConnected(true)
    setWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
  }

  const handleDisconnect = () => {
    setWalletConnected(false)
    setWalletAddress('')
    setCopied(false)
  }

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
        .then(() => {
          setCopied(true)
          // Note: In production, store timeoutId in useRef and cleanup in useEffect
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(err => {
          console.error('Failed to copy:', err)
        })
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <section className="wallet-view">
      <div className="wallet-card">
        <div className="wallet-header">
          <div className="wallet-header-content">
            <h2 className="wallet-title">Wallet</h2>
            <p className="wallet-subtitle">Manage your digital identity</p>
          </div>
          <div className={`wallet-status ${walletConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">{walletConnected ? 'Connected' : 'Not Connected'}</span>
          </div>
        </div>
        
        {walletConnected ? (
          <div className="wallet-info">
            <div className="wallet-address-section">
              <div className="wallet-field-header">
                <label>Wallet Address</label>
                <button 
                  className="btn-copy"
                  onClick={copyAddress}
                  title="Copy full address"
                >
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="address-container">
                <code className="address-text">{formatAddress(walletAddress)}</code>
                <span className="address-full" title={walletAddress}>{walletAddress}</span>
              </div>
            </div>

            <div className="wallet-balance-section">
              <label>Balance</label>
              <div className="balance-container">
                <span className="balance-amount">0.00</span>
                <span className="balance-currency">ETH</span>
              </div>
              <div className="balance-usd">≈ $0.00 USD</div>
            </div>

            <div className="wallet-actions">
              <button className="btn btn-secondary btn-full" onClick={handleDisconnect}>
                Disconnect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="wallet-empty">
            <div className="wallet-icon-container">
              <div className="wallet-icon">🔐</div>
            </div>
            <h3 className="wallet-empty-title">Connect Your Wallet</h3>
            <p className="wallet-message">
              Connect your wallet to manage credentials and interact with the decentralized identity system.
            </p>
            <button className="btn btn-primary btn-full" onClick={handleConnect}>
              <span>Connect Wallet</span>
            </button>
            <div className="wallet-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Secure & Private</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Manage Credentials</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Decentralized</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default WalletView
