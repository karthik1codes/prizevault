import React from 'react'
import SharedHeader from '../../components/SharedHeader'

export default function Header({ issuerName, issuerDID, stats }) {
  return (
    <>
      <SharedHeader activeTab="issuer" />
      <div className="issuer-sub-header">
        <div className="issuer-sub-header-content">
          <div className="issuer-info">
            <h1 className="issuer-name">{issuerName || 'Issuer Admin'}</h1>
            <div className="did-card">
              <span className="did-label">Issuer DID</span>
              <code className="did-value">{issuerDID || 'did:ethr:0x...'}</code>
              <button 
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(issuerDID)}
                title="Copy DID"
              >
                📋
              </button>
            </div>
          </div>
          <div className="quick-stats">
            <div className="stat-card">
              <span className="stat-label">Issued</span>
              <span className="stat-value">{stats?.issued || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Active</span>
              <span className="stat-value stat-active">{stats?.active || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Revoked</span>
              <span className="stat-value stat-revoked">{stats?.revoked || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
