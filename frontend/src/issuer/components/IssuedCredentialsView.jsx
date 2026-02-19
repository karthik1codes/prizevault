import React, { useState, useEffect } from 'react'

export default function IssuedCredentialsView({ credentials, onView, onRevoke }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeRemaining, setTimeRemaining] = useState({})

  // Calculate time remaining for each credential
  const calculateTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires - now
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  // Update time remaining every second
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = {}
      credentials.forEach((cred) => {
        if (cred.expiresAt) {
          remaining[cred.id] = calculateTimeRemaining(cred.expiresAt)
        }
      })
      setTimeRemaining(remaining)
    }, 1000)

    return () => clearInterval(interval)
  }, [credentials])

  const filteredCredentials = credentials.filter((cred) => {
    const subject = cred.credentialSubject || {}
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      cred.id?.toLowerCase().includes(searchLower) ||
      subject.name?.toLowerCase().includes(searchLower) ||
      subject.rollNo?.toLowerCase().includes(searchLower) ||
      subject.degree?.toLowerCase().includes(searchLower) ||
      subject.college?.toLowerCase().includes(searchLower) ||
      subject.email?.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === 'all' || cred.revoked === (statusFilter === 'revoked')
    return matchesSearch && matchesStatus
  })

  return (
    <div className="issued-credentials-view">
      <div className="view-header">
        <h2>Issued Credentials</h2>
        <div className="view-controls">
          <input
            type="text"
            placeholder="Search credentials..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      <div className="credentials-grid">
        {filteredCredentials.length === 0 ? (
          <p className="empty-state">No credentials found</p>
        ) : (
          filteredCredentials.map((cred) => {
            const subject = cred.credentialSubject || {}
            return (
              <div key={cred.id} className="credential-card-new">
                <div className="card-header">
                  <h3>{subject.name || 'Unknown'}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${cred.revoked ? 'badge-revoked' : 'badge-active'}`}>
                      {cred.revoked ? 'Revoked' : 'Active'}
                    </span>
                    {cred.expiresAt && !cred.revoked && (
                      <span className="status-badge badge-expiring" title={`Expires at: ${new Date(cred.expiresAt).toLocaleString()}`}>
                        ⏱️ {timeRemaining[cred.id] || calculateTimeRemaining(cred.expiresAt) || 'Expired'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  <p><strong>ID:</strong> <code>{cred.id}</code></p>
                  {subject.rollNo && <p><strong>Roll No:</strong> {subject.rollNo}</p>}
                  {subject.degree && <p><strong>Degree:</strong> {subject.degree}</p>}
                  {subject.college && <p><strong>College:</strong> {subject.college}</p>}
                  {subject.cgpa && <p><strong>CGPA:</strong> {subject.cgpa}</p>}
                  {subject.age && <p><strong>Age:</strong> {subject.age}</p>}
                  <p><strong>Issued:</strong> {new Date(cred.issueDate || Date.now()).toLocaleDateString()}</p>
                  {cred.txHash && (
                    <p>
                      <strong>Tx:</strong>{' '}
                      <a
                        href={`https://amoy.polygonscan.com/tx/${cred.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {cred.txHash.slice(0, 10)}...
                      </a>
                    </p>
                  )}
                </div>
                <div className="card-actions">
                  <button className="btn-action btn-view" onClick={() => onView(cred)}>
                    View
                  </button>
                  {!cred.revoked && (
                    <button className="btn-action btn-revoke" onClick={() => onRevoke(cred)}>
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

