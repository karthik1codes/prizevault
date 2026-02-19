import React from 'react'
import { useAccount } from 'wagmi'
import WalletConnector from './WalletConnector'
import './Header.css'
import './shared.css'

function Header() {
  const { address, isConnected } = useAccount()
  const displayName = isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'User'
  const avatarLabel =
    isConnected && address ? address.replace('0x', '').slice(0, 1).toUpperCase() : 'U'

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1 className="header-title">DID Issuer</h1>
          <span className="header-subtitle">Credential Management System</span>
        </div>
        <div className="header-right">
          <WalletConnector />
          <div className="user-info">
            <div className="user-avatar">{avatarLabel}</div>
            <span className="user-name">{displayName}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
