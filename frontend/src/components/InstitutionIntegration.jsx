import React, { useState, useEffect } from 'react'
import { getStoredCredentials } from '../services/storageService'
import './InstitutionIntegration.css'
import './shared.css'

function InstitutionIntegration() {
  const [institutions, setInstitutions] = useState([
    {
      id: 'inst-a',
      name: 'Institution A',
      description: 'University & Education Services',
      icon: '🏛️',
      apiUrl: 'https://api.institution-a.edu',
      connected: false,
      credentialsCount: 0,
      lastSync: null,
      status: 'disconnected'
    },
    {
      id: 'inst-b',
      name: 'Institution B',
      description: 'Healthcare & Medical Records',
      icon: '🏥',
      apiUrl: 'https://api.institution-b.health',
      connected: false,
      credentialsCount: 0,
      lastSync: null,
      status: 'disconnected'
    },
    {
      id: 'inst-c',
      name: 'Institution C',
      description: 'Government & Identity Services',
      icon: '🏛️',
      apiUrl: 'https://api.institution-c.gov',
      connected: false,
      credentialsCount: 0,
      lastSync: null,
      status: 'disconnected'
    },
    {
      id: 'inst-d',
      name: 'Institution D',
      description: 'Professional Licensing Board',
      icon: '📜',
      apiUrl: 'https://api.institution-d.org',
      connected: false,
      credentialsCount: 0,
      lastSync: null,
      status: 'disconnected'
    }
  ])

  const [connecting, setConnecting] = useState(null)
  const [syncing, setSyncing] = useState(null)

  useEffect(() => {
    // Update credential counts from stored credentials
    updateCredentialCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  const updateCredentialCounts = () => {
    try {
      const stored = getStoredCredentials()
      setInstitutions(prev => prev.map(inst => {
        // Count credentials from this institution
        const count = stored.filter(vc => {
          const issuerId = vc.issuer?.id || vc.issuer
          return issuerId && (
            issuerId.includes(inst.id) ||
            issuerId.includes(inst.name.toLowerCase().replace(/\s+/g, '-'))
          )
        }).length
        
        return { ...inst, credentialsCount: count }
      }))
    } catch (error) {
      console.error('Error updating credential counts:', error)
    }
  }

  const handleConnect = async (institutionId) => {
    setConnecting(institutionId)
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setInstitutions(prev => prev.map(inst => 
      inst.id === institutionId
        ? { 
            ...inst, 
            connected: true, 
            status: 'connected',
            lastSync: new Date().toISOString()
          }
        : inst
    ))
    
    setConnecting(null)
    
    // Simulate fetching credentials from institution
    simulateCredentialSync(institutionId)
  }

  const handleDisconnect = (institutionId) => {
    setInstitutions(prev => prev.map(inst => 
      inst.id === institutionId
        ? { 
            ...inst, 
            connected: false, 
            status: 'disconnected',
            lastSync: null
          }
        : inst
    ))
  }

  const simulateCredentialSync = async (institutionId) => {
    setSyncing(institutionId)
    
    // Simulate syncing credentials
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update last sync time
    setInstitutions(prev => prev.map(inst => 
      inst.id === institutionId
        ? { ...inst, lastSync: new Date().toISOString() }
        : inst
    ))
    
    // Update credential counts
    updateCredentialCounts()
    
    setSyncing(null)
  }

  const handleSync = async (institutionId) => {
    if (syncing === institutionId) return
    await simulateCredentialSync(institutionId)
  }

  const formatLastSync = (dateString) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return 'Unknown'
    }
  }

  const connectedCount = institutions.filter(inst => inst.connected).length

  return (
    <section className="institution-integration">
      <div className="institution-integration-card">
        <div className="institution-integration-header">
          <div>
            <h2 className="institution-integration-title">Institution Connections</h2>
            <p className="institution-integration-subtitle">
              Connect to external institutions to receive and manage credentials across platforms
            </p>
          </div>
          <div className="connection-summary">
            <span className="connection-count">
              {connectedCount} {connectedCount === 1 ? 'Connected' : 'Connected'}
            </span>
          </div>
        </div>

        <div className="institutions-grid">
          {institutions.map((institution) => (
            <div 
              key={institution.id} 
              className={`institution-card ${institution.connected ? 'connected' : ''}`}
            >
              <div className="institution-card-header">
                <div className="institution-icon">{institution.icon}</div>
                <div className="institution-info">
                  <h3 className="institution-name">{institution.name}</h3>
                  <p className="institution-description">{institution.description}</p>
                </div>
                <div className={`institution-status ${institution.status}`}>
                  <span className="status-dot"></span>
                  <span className="status-text">
                    {institution.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>

              <div className="institution-stats">
                <div className="stat-item">
                  <span className="stat-label">Credentials:</span>
                  <span className="stat-value">{institution.credentialsCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Last Sync:</span>
                  <span className="stat-value">{formatLastSync(institution.lastSync)}</span>
                </div>
              </div>

              <div className="institution-actions">
                {institution.connected ? (
                  <>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleSync(institution.id)}
                      disabled={syncing === institution.id}
                    >
                      {syncing === institution.id ? '⏳ Syncing...' : '🔄 Sync Now'}
                    </button>
                    <button
                      className="btn btn-text btn-small"
                      onClick={() => handleDisconnect(institution.id)}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleConnect(institution.id)}
                    disabled={connecting === institution.id}
                  >
                    {connecting === institution.id ? '⏳ Connecting...' : '🔗 Connect'}
                  </button>
                )}
              </div>

              {institution.connected && (
                <div className="institution-details">
                  <div className="detail-item">
                    <span className="detail-label">API Endpoint:</span>
                    <code className="detail-value">{institution.apiUrl}</code>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Protocol:</span>
                    <span className="detail-value">DIDComm v2.0</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Credential Format:</span>
                    <span className="detail-value">W3C Verifiable Credentials</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="interoperability-info">
          <div className="info-header">
            <span className="info-icon">🌐</span>
            <h3>Interoperability Features</h3>
          </div>
          <div className="info-features">
            <div className="info-feature">
              <span className="feature-icon">✓</span>
              <span>Cross-platform credential exchange</span>
            </div>
            <div className="info-feature">
              <span className="feature-icon">✓</span>
              <span>Standard W3C Verifiable Credentials</span>
            </div>
            <div className="info-feature">
              <span className="feature-icon">✓</span>
              <span>DID-based identity verification</span>
            </div>
            <div className="info-feature">
              <span className="feature-icon">✓</span>
              <span>Decentralized credential management</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InstitutionIntegration

