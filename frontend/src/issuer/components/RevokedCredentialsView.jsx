import React, { useState } from 'react'

export default function RevokedCredentialsView({ credentials, onView, onUnrevoke }) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter only revoked credentials (handle both boolean true and string 'true')
  const revokedCredentials = credentials.filter((cred) => {
    // Check for revoked flag in multiple possible formats
    return cred.revoked === true || cred.revoked === 'true' || cred.revoked === 1
  })

  const filteredCredentials = revokedCredentials.filter((cred) => {
    const subject = cred.credentialSubject || {}
    const searchLower = searchTerm.toLowerCase()
    return (
      cred.id?.toLowerCase().includes(searchLower) ||
      subject.name?.toLowerCase().includes(searchLower) ||
      subject.rollNo?.toLowerCase().includes(searchLower) ||
      subject.degree?.toLowerCase().includes(searchLower) ||
      subject.college?.toLowerCase().includes(searchLower) ||
      subject.email?.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="revoked-credentials-view">
      <div className="view-header">
        <div>
          <h2>Revoked Credentials</h2>
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            {revokedCredentials.length} credential{revokedCredentials.length !== 1 ? 's' : ''} revoked
          </p>
        </div>
        <div className="view-controls">
          <input
            type="text"
            placeholder="Search revoked credentials..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredCredentials.length === 0 ? (
        <div className="empty-state" style={{ 
          padding: '3rem', 
          textAlign: 'center',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #2a2a2a'
        }}>
          {revokedCredentials.length === 0 ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
              <h3 style={{ marginBottom: '0.5rem' }}>No Revoked Credentials</h3>
              <p className="muted">All issued credentials are currently active.</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ marginBottom: '0.5rem' }}>No Matching Results</h3>
              <p className="muted">Try adjusting your search terms.</p>
            </>
          )}
        </div>
      ) : (
        <div className="credentials-grid">
          {filteredCredentials.map((cred) => {
            const subject = cred.credentialSubject || {}
            return (
              <div key={cred.id} className="credential-card-new" style={{
                border: '1px solid #3a1a1a',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #1a0a0a 100%)',
              }}>
                <div className="card-header">
                  <h3>{subject.name || 'Unknown'}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="status-badge badge-revoked">
                      🚫 Revoked
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <p><strong>ID:</strong> <code style={{ fontSize: '0.875rem', color: '#888' }}>{cred.id}</code></p>
                  {subject.rollNo && <p><strong>Roll No:</strong> {subject.rollNo}</p>}
                  {subject.degree && <p><strong>Degree:</strong> {subject.degree}</p>}
                  {subject.college && <p><strong>College:</strong> {subject.college}</p>}
                  {subject.cgpa && <p><strong>CGPA:</strong> {subject.cgpa}</p>}
                  {subject.email && <p><strong>Email:</strong> {subject.email}</p>}
                  <p><strong>Issued:</strong> {formatDate(cred.issueDate || cred.issuanceDate)}</p>
                  {cred.revokedAt && (
                    <p style={{ color: '#ef4444' }}>
                      <strong>Revoked:</strong> {formatDate(cred.revokedAt)}
                    </p>
                  )}
                  {cred.revocationReason && (
                    <p style={{ color: '#f59e0b', fontSize: '0.875rem' }}>
                      <strong>Reason:</strong> {cred.revocationReason}
                    </p>
                  )}
                  {cred.txHash && (
                    <p>
                      <strong>Tx:</strong>{' '}
                      <a
                        href={`https://amoy.polygonscan.com/tx/${cred.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#60a5fa' }}
                      >
                        {cred.txHash.slice(0, 10)}...
                      </a>
                    </p>
                  )}
                </div>
                <div className="card-actions">
                  <button 
                    className="btn-action btn-view" 
                    onClick={() => onView(cred)}
                    style={{ flex: 1 }}
                  >
                    View Details
                  </button>
                  {onUnrevoke && (
                    <button 
                      className="btn-action" 
                      onClick={() => onUnrevoke(cred)}
                      style={{ 
                        flex: 1,
                        background: '#3a82f6',
                        color: '#fff',
                        border: '1px solid #3a82f6'
                      }}
                    >
                      Unrevoke
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

