import React from 'react'
import SharedHeader from '../../components/SharedHeader'

export default function Header({ organizerName, walletAddress, stats }) {
  return (
    <>
      <SharedHeader activeTab="issuer" />
      <div className="organizer-sub-header">
        <div className="organizer-sub-header-content">
          <div className="organizer-info">
            <h1 className="organizer-name">{organizerName || 'Organizer'}</h1>
            <div className="did-card">
              <span className="did-label">Wallet Address</span>
              <code className="did-value">{walletAddress || '0x...'}</code>
              <button 
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(walletAddress)}
                title="Copy DID"
              >
                📋
              </button>
            </div>
          </div>
          <div className="quick-stats">
            <div className="stat-card">
              <span className="stat-label">Hackathons</span>
              <span className="stat-value">{stats?.hackathons || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Participants</span>
              <span className="stat-value stat-active">{stats?.participants || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Pending Payouts</span>
              <span className="stat-value stat-revoked">{stats?.pendingPayouts || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
