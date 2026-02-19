import React, { useState } from 'react'

export default function CredentialDetailModal({ isOpen, onClose, credential, onRevoke, onUnrevoke }) {
  const [showProof, setShowProof] = useState(false)

  if (!isOpen || !credential) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(credential.vc || credential, null, 2))
    alert('VC copied to clipboard!')
  }

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(credential.vc || credential, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `credential-${credential.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Credential Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="credential-info">
            <div className="info-row">
              <span className="info-label">Credential ID:</span>
              <code>{credential.id}</code>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className={`status-badge ${credential.revoked ? 'badge-revoked' : 'badge-active'}`}>
                {credential.revoked ? 'Revoked' : 'Active'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Issued:</span>
              <span>{new Date(credential.issueDate || Date.now()).toLocaleString()}</span>
            </div>
            {credential.txHash && (
              <div className="info-row">
                <span className="info-label">Transaction:</span>
                <a
                  href={`https://amoy.polygonscan.com/tx/${credential.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {credential.txHash.slice(0, 10)}...
                </a>
              </div>
            )}
          </div>

          <div className="credential-details-section">
            <h3>Student Information</h3>
            <div className="details-grid">
              {(credential.credentialSubject || {}).name && (
                <div className="info-row">
                  <span className="info-label">Name:</span>
                  <span>{(credential.credentialSubject || {}).name}</span>
                </div>
              )}
              {(credential.credentialSubject || {}).email && (
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span>{(credential.credentialSubject || {}).email}</span>
                </div>
              )}
              {(credential.credentialSubject || {}).rollNo && (
                <div className="info-row">
                  <span className="info-label">Roll No:</span>
                  <span>{(credential.credentialSubject || {}).rollNo}</span>
                </div>
              )}
              {(credential.credentialSubject || {}).age && (
                <div className="info-row">
                  <span className="info-label">Age:</span>
                  <span>{(credential.credentialSubject || {}).age}</span>
                </div>
              )}
              {(credential.credentialSubject || {}).degree && (
                <div className="info-row">
                  <span className="info-label">Degree:</span>
                  <span>{(credential.credentialSubject || {}).degree}</span>
                </div>
              )}
              {(credential.credentialSubject || {}).college && (
                <div className="info-row">
                  <span className="info-label">College:</span>
                  <span>{(credential.credentialSubject || {}).college}</span>
                </div>
              )}
              {(credential.credentialSubject || {}).cgpa && (
                <div className="info-row">
                  <span className="info-label">CGPA:</span>
                  <span>{(credential.credentialSubject || {}).cgpa}</span>
                </div>
              )}
              {(credential.credentialSubject || {}).projectTitle && (
                <div className="info-row">
                  <span className="info-label">Project Title:</span>
                  <span>{(credential.credentialSubject || {}).projectTitle}</span>
                </div>
              )}
              {(credential.credentialSubject || {}).achievements && (
                <div className="info-row info-row-full">
                  <span className="info-label">Achievements:</span>
                  <span>{(credential.credentialSubject || {}).achievements}</span>
                </div>
              )}
              {(credential.credentialSubject || {}).experience && (
                <div className="info-row info-row-full">
                  <span className="info-label">Experience:</span>
                  <span>{(credential.credentialSubject || {}).experience}</span>
                </div>
              )}
              {(credential.credentialSubject || {}).contributions && (
                <div className="info-row info-row-full">
                  <span className="info-label">Contributions:</span>
                  <span>{(credential.credentialSubject || {}).contributions}</span>
                </div>
              )}
            </div>
          </div>

          <div className="vc-json-section">
            <div className="section-header">
              <h3>Verifiable Credential JSON</h3>
              <div className="section-actions">
                <button className="btn-icon" onClick={handleCopy} title="Copy">
                  📋
                </button>
                <button className="btn-icon" onClick={handleDownload} title="Download">
                  ⬇️
                </button>
                <button
                  className="btn-icon"
                  onClick={() => setShowProof(!showProof)}
                  title="Toggle Proof"
                >
                  {showProof ? '🔒' : '🔓'}
                </button>
              </div>
            </div>
            <pre className="vc-json">
              {JSON.stringify(
                credential.vc || credential,
                (key, value) => {
                  if (key === 'proof' && !showProof) return '[Hidden]'
                  return value
                },
                2
              )}
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {credential.revoked ? (
            <button className="btn-primary" onClick={() => onUnrevoke(credential)}>
              Unrevoke
            </button>
          ) : (
            <button className="btn-danger" onClick={() => onRevoke(credential)}>
              Revoke
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

