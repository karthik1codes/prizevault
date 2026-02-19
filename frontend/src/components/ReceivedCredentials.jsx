import React, { useState, useEffect } from 'react'
import { 
  getStoredCredentials, 
  addCredential, 
  removeCredential,
  getStorageStats 
} from '../services/storageService'
import ReceiveVCModal from './ReceiveVCModal'
import PresentVCModal from './PresentVCModal'
import './ReceivedCredentials.css'
import './shared.css'

function ReceivedCredentials() {
  const [receivedVCs, setReceivedVCs] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPresentModalOpen, setIsPresentModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [expandedVC, setExpandedVC] = useState(null)
  const [storageStats, setStorageStats] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [credentialStatuses, setCredentialStatuses] = useState({}) // { credentialId: { status: 'active'|'revoked'|'checking'|'error', revokedAt?, reason? } }
  const [checkingStatuses, setCheckingStatuses] = useState(false)

  // Load credentials from storage on mount
  useEffect(() => {
    loadCredentials()
    updateStorageStats()
  }, [])

  // Check credential statuses when credentials change
  useEffect(() => {
    if (receivedVCs.length > 0) {
      checkAllCredentialStatuses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receivedVCs.length]) // Only check when count changes, not on every render

  const loadCredentials = () => {
    try {
      const stored = getStoredCredentials()
      
      // If no stored credentials, initialize with sample data (first time only)
      if (stored.length === 0) {
        const sampleVCs = [
          {
            "@context": [
              "https://www.w3.org/2018/credentials/v1",
              "https://www.w3.org/2018/credentials/examples/v1"
            ],
            "id": "http://example.edu/credentials/3732",
            "type": ["VerifiableCredential", "UniversityDegreeCredential"],
            "issuer": {
              "id": "did:example:76e12ec712ebc6f1c221ebfeb1f",
              "name": "MVJ College of Engineering"
            },
            "issuanceDate": "2024-01-15T10:00:00Z",
            "credentialSubject": {
              "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
              "degree": {
                "type": "BachelorDegree",
                "name": "Bachelor of Science in Computer Science"
              },
              "college": "College of Engineering"
            },
            "proof": {
              "type": "Ed25519Signature2020",
              "created": "2024-01-15T10:00:00Z",
              "verificationMethod": "did:example:76e12ec712ebc6f1c221ebfeb1f#keys-1",
              "proofPurpose": "assertionMethod",
              "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjJp7467zuiq5L9z2m1Xv8GM4q2yrjF2nX5b7q"
            }
          },
          {
            "@context": [
              "https://www.w3.org/2018/credentials/v1"
            ],
            "id": "http://example.gov/credentials/3733",
            "type": ["VerifiableCredential", "IdentityCredential"],
            "issuer": {
              "id": "did:web:example.gov",
              "name": "Government Agency"
            },
            "issuanceDate": "2024-02-20T14:30:00Z",
            "credentialSubject": {
              "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
              "name": "John Doe",
              "dateOfBirth": "1990-01-01",
              "nationality": "US"
            },
            "proof": {
              "type": "JsonWebSignature2020",
              "created": "2024-02-20T14:30:00Z",
              "verificationMethod": "did:web:example.gov#keys-1",
              "proofPurpose": "assertionMethod",
              "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..signature"
            }
          },
          {
            "@context": [
              "https://www.w3.org/2018/credentials/v1"
            ],
            "id": "http://example.org/credentials/3734",
            "type": ["VerifiableCredential", "ProfessionalLicense"],
            "issuer": {
              "id": "did:ethr:0x1234567890123456789012345678901234567890",
              "name": "Professional Licensing Board"
            },
            "issuanceDate": "2024-03-10T09:15:00Z",
            "expirationDate": "2025-03-10T09:15:00Z",
            "credentialSubject": {
              "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
              "licenseType": "Medical License",
              "licenseNumber": "MD-12345",
              "status": "Active"
            },
            "proof": {
              "type": "EthereumEip712Signature2021",
              "created": "2024-03-10T09:15:00Z",
              "verificationMethod": "did:ethr:0x1234567890123456789012345678901234567890#controller",
              "proofPurpose": "assertionMethod",
              "proofValue": "0xabc123def456..."
            }
          }
        ]
        
        // Save sample data to storage
        sampleVCs.forEach(vc => {
          try {
            addCredential(vc)
          } catch (err) {
            console.error('Error adding sample VC:', err)
          }
        })
        
        setReceivedVCs(sampleVCs)
      } else {
        setReceivedVCs(stored)
      }
    } catch (error) {
      console.error('Error loading credentials:', error)
      setReceivedVCs([])
    }
  }

  const updateStorageStats = () => {
    try {
      const stats = getStorageStats()
      setStorageStats(stats)
    } catch (error) {
      console.error('Error getting storage stats:', error)
    }
  }

  const handleReceiveVC = async (vc) => {
    try {
      const success = addCredential(vc)
      if (success) {
        loadCredentials()
        updateStorageStats()
        alert('Credential received and stored successfully!')
      } else {
        throw new Error('Failed to save credential')
      }
    } catch (error) {
      console.error('Error receiving credential:', error)
      alert(`Failed to receive credential: ${error.message}`)
      throw error
    }
  }

  const handleDeleteVC = (vcId) => {
    if (deleteConfirm === vcId) {
      try {
        const success = removeCredential(vcId)
        if (success) {
          loadCredentials()
          updateStorageStats()
          setDeleteConfirm(null)
          if (expandedVC !== null) {
            setExpandedVC(null)
          }
        } else {
          alert('Failed to delete credential')
        }
      } catch (error) {
        console.error('Error deleting credential:', error)
        alert('Failed to delete credential')
      }
    } else {
      setDeleteConfirm(vcId)
      // Note: In production, store timeoutId in useRef and cleanup in useEffect
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const toggleExpand = (index) => {
    setExpandedVC(expandedVC === index ? null : index)
    setDeleteConfirm(null)
  }

  const copyToClipboard = (text, vcId) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedId(vcId)
        setTimeout(() => setCopiedId(null), 2000)
      })
      .catch(err => {
        console.error('Failed to copy:', err)
        alert('Failed to copy to clipboard')
      })
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const getCredentialType = (vc) => {
    if (Array.isArray(vc.type)) {
      return vc.type.find(t => t !== 'VerifiableCredential') || vc.type[0]
    }
    return vc.type || 'Unknown'
  }

  // Extract credential ID for status check (handle different ID formats)
  const extractCredentialId = (vc) => {
    if (!vc.id) return null
    // If ID is a URL, extract the last part (UUID)
    if (vc.id.includes('/')) {
      return vc.id.split('/').pop()
    }
    // If ID contains a colon, extract the part after the last colon
    if (vc.id.includes(':')) {
      return vc.id.split(':').pop()
    }
    return vc.id
  }

  // Check status for a single credential
  const checkCredentialStatus = async (vc) => {
    const credentialId = extractCredentialId(vc)
    if (!credentialId) return { vcId: vc.id, status: { status: 'unknown', error: 'No credential ID' } }

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
          // Credential not found in issuer's storage - might be external
          return { vcId: vc.id, status: { status: 'unknown', error: 'Not found in issuer registry' } }
        }
        throw new Error(`Status check failed: ${response.status}`)
      }

      const data = await response.json()
      return {
        vcId: vc.id,
        status: {
          status: data.status || 'active',
          revokedAt: data.revokedAt || null,
          reason: data.reason || null
        }
      }
    } catch (error) {
      console.error(`Error checking status for credential ${credentialId}:`, error)
      return { vcId: vc.id, status: { status: 'error', error: error.message } }
    }
  }

  // Check status for all credentials
  const checkAllCredentialStatuses = async () => {
    if (checkingStatuses || receivedVCs.length === 0) return

    setCheckingStatuses(true)
    
    // Set all to checking state first
    const initialCheckingStatuses = {}
    receivedVCs.forEach(vc => {
      if (vc.id) {
        initialCheckingStatuses[vc.id] = { status: 'checking' }
      }
    })
    setCredentialStatuses(prev => ({ ...prev, ...initialCheckingStatuses }))
    
    try {
      // Check statuses in parallel
      const statusPromises = receivedVCs.map(vc => checkCredentialStatus(vc))
      const results = await Promise.all(statusPromises)
      
      // Update statuses
      const newStatuses = {}
      results.forEach(({ vcId, status }) => {
        if (vcId && status) {
          newStatuses[vcId] = status
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
  const getCredentialStatus = (vc) => {
    const status = credentialStatuses[vc.id]
    if (!status) return { status: 'unknown', display: 'Unknown' }
    
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

  return (
    <section className="received-credentials">
      <div className="received-credentials-card">
        <div className="received-credentials-header">
          <div>
            <h2 className="received-credentials-title">Received Credentials</h2>
            {storageStats && (
              <div className="storage-info">
                <span className="storage-size">{storageStats.storageSizeKB} KB</span>
              </div>
            )}
          </div>
          <div className="header-actions">
            <div className="received-credentials-count">
              {receivedVCs.length} {receivedVCs.length === 1 ? 'Credential' : 'Credentials'}
            </div>
            {receivedVCs.length > 0 && (
              <>
                <button 
                  className="btn btn-text btn-small"
                  onClick={checkAllCredentialStatuses}
                  disabled={checkingStatuses}
                  title="Refresh status"
                >
                  {checkingStatuses ? '⏳ Checking...' : '🔄 Refresh Status'}
                </button>
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => setIsPresentModalOpen(true)}
                >
                  📤 Present Credential
                </button>
              </>
            )}
            <button 
              className="btn btn-primary btn-small"
              onClick={() => setIsModalOpen(true)}
            >
              + Receive VC
            </button>
          </div>
        </div>

        <div className="received-credentials-content">
          {receivedVCs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p className="empty-message">No received credentials yet</p>
              <button 
                className="btn btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                Receive Your First Credential
              </button>
            </div>
          ) : (
            <div className="vc-list">
              {receivedVCs.map((vc, index) => (
                <div key={vc.id || index} className="vc-item">
                  <div className="vc-item-header" onClick={() => toggleExpand(index)}>
                    <div className="vc-item-info">
                      <div className="vc-type-header">
                        <h3 className="vc-type">{getCredentialType(vc)}</h3>
                        {(() => {
                          const statusInfo = getCredentialStatus(vc)
                          return (
                            <span className={`vc-status-badge vc-status-${statusInfo.status}`}>
                              {statusInfo.status === 'checking' && '⏳'}
                              {statusInfo.status === 'active' && '✓'}
                              {statusInfo.status === 'revoked' && '✗'}
                              {statusInfo.status === 'error' && '⚠'}
                              {statusInfo.status === 'unknown' && '?'}
                              <span className="vc-status-text">{statusInfo.display}</span>
                            </span>
                          )
                        })()}
                      </div>
                      <div className="vc-meta">
                        <span className="vc-issuer">
                          Issuer: {vc.issuer?.name || vc.issuer?.id || 'Unknown'}
                        </span>
                        <span className="vc-date">
                          Issued: {formatDate(vc.issuanceDate)}
                        </span>
                        {vc.receivedAt && (
                          <span className="vc-received">
                            Received: {formatDate(vc.receivedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="vc-item-actions">
                      <button
                        className="btn btn-text btn-small"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(JSON.stringify(vc, null, 2), vc.id)
                        }}
                        title="Copy JSON"
                      >
                        {copiedId === vc.id ? '✓ Copied' : '📋 Copy'}
                      </button>
                      <button
                        className={`btn btn-text btn-small btn-delete ${deleteConfirm === vc.id ? 'confirm' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteVC(vc.id)
                        }}
                        title={deleteConfirm === vc.id ? 'Click again to confirm' : 'Delete credential'}
                      >
                        {deleteConfirm === vc.id ? '✓ Confirm' : '🗑️ Delete'}
                      </button>
                      <span className="vc-expand-icon">
                        {expandedVC === index ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>

                  {expandedVC === index && (
                    <div className="vc-item-body">
                      <div className="vc-json-container">
                        <pre className="vc-json">
                          <code>{JSON.stringify(vc, null, 2)}</code>
                        </pre>
                      </div>
                      <div className="vc-details">
                        <div className="vc-detail-item">
                          <label>Credential ID:</label>
                          <code className="vc-detail-value">{vc.id}</code>
                        </div>
                        {vc.expirationDate && (
                          <div className="vc-detail-item">
                            <label>Expiration Date:</label>
                            <span className="vc-detail-value">{formatDate(vc.expirationDate)}</span>
                          </div>
                        )}
                        <div className="vc-detail-item">
                          <label>Proof Type:</label>
                          <span className="vc-detail-value">{vc.proof?.type || 'N/A'}</span>
                        </div>
                        {vc.storedAt && (
                          <div className="vc-detail-item">
                            <label>Stored At:</label>
                            <span className="vc-detail-value">{formatDate(vc.storedAt)}</span>
                          </div>
                        )}
                        {(() => {
                          const statusInfo = getCredentialStatus(vc)
                          if (statusInfo.status === 'revoked') {
                            return (
                              <>
                                <div className="vc-detail-item">
                                  <label>Status:</label>
                                  <span className="vc-detail-value vc-status-revoked-text">Revoked</span>
                                </div>
                                {statusInfo.revokedAt && (
                                  <div className="vc-detail-item">
                                    <label>Revoked At:</label>
                                    <span className="vc-detail-value">{formatDate(statusInfo.revokedAt)}</span>
                                  </div>
                                )}
                                {statusInfo.reason && (
                                  <div className="vc-detail-item">
                                    <label>Revocation Reason:</label>
                                    <span className="vc-detail-value">{statusInfo.reason}</span>
                                  </div>
                                )}
                              </>
                            )
                          }
                          if (statusInfo.status === 'active') {
                            return (
                              <div className="vc-detail-item">
                                <label>Status:</label>
                                <span className="vc-detail-value vc-status-active-text">Active</span>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReceiveVCModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReceive={handleReceiveVC}
      />
      <PresentVCModal
        isOpen={isPresentModalOpen}
        onClose={() => setIsPresentModalOpen(false)}
      />
    </section>
  )
}

export default ReceivedCredentials
