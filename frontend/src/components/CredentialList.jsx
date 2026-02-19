import React, { useState, useEffect } from 'react'
import './CredentialList.css'
import './shared.css'

function CredentialList() {
  const [credentials] = useState([
    {
      id: '1',
      type: 'Education Credential',
      issuer: 'MVJ College of Engineering',
      issueDate: '2024-01-15',
      status: 'Active',
      holder: 'John Doe'
    },
    {
      id: '2',
      type: 'Professional License',
      issuer: 'Professional Board',
      issueDate: '2024-02-20',
      status: 'Active',
      holder: 'Jane Smith'
    },
    {
      id: '3',
      type: 'Identity Verification',
      issuer: 'Government Agency',
      issueDate: '2024-03-10',
      status: 'Revoked',
      holder: 'Bob Johnson'
    }
  ])

  const [credentialStatuses, setCredentialStatuses] = useState({})
  const [checkingStatuses, setCheckingStatuses] = useState(false)

  // Check credential statuses on mount
  useEffect(() => {
    if (credentials.length > 0) {
      checkAllCredentialStatuses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Extract credential ID for status check
  const extractCredentialId = (credential) => {
    if (!credential.id) return null
    // Handle different ID formats
    if (credential.id.includes('/')) {
      return credential.id.split('/').pop()
    }
    if (credential.id.includes(':')) {
      return credential.id.split(':').pop()
    }
    return credential.id
  }

  // Check status for a single credential
  const checkCredentialStatus = async (credential) => {
    const credentialId = extractCredentialId(credential)
    if (!credentialId) return { credId: credential.id, status: { status: 'unknown' } }

    try {
      const API_URL = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${API_URL}/status/${credentialId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return { credId: credential.id, status: { status: 'unknown', error: 'Not found' } }
        }
        throw new Error(`Status check failed: ${response.status}`)
      }

      const data = await response.json()
      return {
        credId: credential.id,
        status: {
          status: data.status || 'active',
          revokedAt: data.revokedAt || null,
          reason: data.reason || null
        }
      }
    } catch (error) {
      console.error(`Error checking status for credential ${credentialId}:`, error)
      return { credId: credential.id, status: { status: 'error', error: error.message } }
    }
  }

  // Check status for all credentials
  const checkAllCredentialStatuses = async () => {
    if (checkingStatuses || credentials.length === 0) return

    setCheckingStatuses(true)
    
    // Set all to checking state first
    const checkingStates = {}
    credentials.forEach(cred => {
      if (cred.id) {
        checkingStates[cred.id] = { status: 'checking' }
      }
    })
    setCredentialStatuses(prev => ({ ...prev, ...checkingStates }))
    
    try {
      const statusPromises = credentials.map(cred => checkCredentialStatus(cred))
      const results = await Promise.all(statusPromises)
      
      const newStatuses = {}
      results.forEach(({ credId, status }) => {
        if (credId && status) {
          newStatuses[credId] = status
        }
      })

      setCredentialStatuses(prev => ({ ...prev, ...newStatuses }))
    } catch (error) {
      console.error('Error checking credential statuses:', error)
    } finally {
      setCheckingStatuses(false)
    }
  }

  // Get status for a credential
  const getCredentialStatus = (credential) => {
    const status = credentialStatuses[credential.id]
    if (!status) {
      // Fallback to hardcoded status if available
      return credential.status 
        ? { status: credential.status.toLowerCase(), display: credential.status }
        : { status: 'unknown', display: 'Unknown' }
    }
    
    if (status.status === 'checking') {
      return { status: 'checking', display: 'Checking...' }
    }
    
    if (status.status === 'error') {
      return { status: 'error', display: 'Error' }
    }
    
    if (status.status === 'revoked') {
      return { status: 'revoked', display: 'Revoked', revokedAt: status.revokedAt, reason: status.reason }
    }
    
    if (status.status === 'active') {
      return { status: 'active', display: 'Active' }
    }
    
    return { status: 'unknown', display: 'Unknown' }
  }

  const getStatusClass = (status) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'active') return 'status-active'
    if (statusLower === 'revoked') return 'status-revoked'
    if (statusLower === 'checking') return 'status-checking'
    if (statusLower === 'error') return 'status-error'
    return 'status-unknown'
  }

  return (
    <section className="credential-list">
        <div className="credential-list-header">
          <h2 className="credential-list-title">Issued Credentials</h2>
          <div className="credential-list-header-actions">
            {credentials.length > 0 && (
              <button 
                className="btn btn-text btn-small"
                onClick={checkAllCredentialStatuses}
                disabled={checkingStatuses}
                title="Refresh status"
              >
                {checkingStatuses ? '⏳' : '🔄'}
              </button>
            )}
            <button className="btn btn-primary">Issue New Credential</button>
          </div>
        </div>
      
      <div className="credential-list-content">
        {credentials.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <p className="empty-message">No credentials issued yet</p>
            <button className="btn btn-primary">Issue Your First Credential</button>
          </div>
        ) : (
          <div className="credentials-grid">
            {credentials.map((credential) => {
              const statusInfo = getCredentialStatus(credential)
              return (
                <div key={credential.id} className="credential-card">
                  <div className="credential-header">
                    <h3 className="credential-type">{credential.type}</h3>
                    <span className={`credential-status ${getStatusClass(statusInfo.status)}`}>
                      {statusInfo.status === 'checking' && '⏳'}
                      {statusInfo.status === 'active' && '✓'}
                      {statusInfo.status === 'revoked' && '✗'}
                      {statusInfo.status === 'error' && '⚠'}
                      {statusInfo.status === 'unknown' && '?'}
                      <span className="status-text">{statusInfo.display}</span>
                    </span>
                  </div>
                <div className="credential-body">
                  <div className="credential-field">
                    <label>Issuer:</label>
                    <span>{credential.issuer}</span>
                  </div>
                  <div className="credential-field">
                    <label>Holder:</label>
                    <span>{credential.holder}</span>
                  </div>
                  <div className="credential-field">
                    <label>Issue Date:</label>
                    <span>{credential.issueDate}</span>
                  </div>
                </div>
                <div className="credential-footer">
                  <button className="btn btn-text">View Details</button>
                  {statusInfo.status === 'active' && (
                    <button className="btn btn-text">Revoke</button>
                  )}
                  {statusInfo.status === 'revoked' && statusInfo.reason && (
                    <span className="revocation-reason" title={statusInfo.reason}>
                      Revoked: {statusInfo.reason}
                    </span>
                  )}
                </div>
              </div>
            )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default CredentialList

