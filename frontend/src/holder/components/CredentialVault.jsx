import React, { useMemo, useState } from 'react'
import { useHolderWallet } from '../context/HolderContext'
import { formatDateTime, truncate } from '../utils/ui'

function CredentialCard({ credential, isSelected, onSelect }) {
  return (
    <button type="button" className={`credential-card ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(credential)}>
      <div className="card-header">
        <h3>{credential.title}</h3>
        <span className={`status-pill status-${credential.revocationStatus || credential.status}`}>{credential.status}</span>
      </div>
      <div className="meta">
        <span>Issuer: {truncate(credential.issuer, 20)}</span>
        <span>Issued: {formatDateTime(credential.issuanceDate)}</span>
      </div>
      <div className="tags">
        <span className="tag">{credential.category || 'Uncategorized'}</span>
        <span className="tag subtle">{credential.linkedDocuments?.length || 0} docs</span>
      </div>
    </button>
  )
}

function CredentialDetail({ credential, onDelete, onCheckRevocation }) {
  if (!credential) {
    return (
      <div className="detail-placeholder">
        <p>Select a credential to view details, linked documents, and metadata.</p>
      </div>
    )
  }

  const subjectEntries = Object.entries(credential.subject || {})
  const evidenceEntries = Object.entries(credential.evidence || {})

  return (
    <div className="credential-detail">
      <header className="detail-header">
        <div>
          <h3>{credential.title}</h3>
          <p className="muted">{credential.raw?.id || credential.id}</p>
        </div>
        <div className="button-row">
          <button type="button" className="button ghost" onClick={() => onCheckRevocation(credential.id)}>
            Refresh status
          </button>
          <button type="button" className="button danger" onClick={() => onDelete(credential.id)}>
            Delete local copy
          </button>
        </div>
      </header>
      <section>
        <h4>Metadata</h4>
        <dl className="detail-grid">
          <div>
            <dt>Issuer</dt>
            <dd>{credential.issuer}</dd>
          </div>
          <div>
            <dt>Issued</dt>
            <dd>{formatDateTime(credential.issuanceDate)}</dd>
          </div>
          <div>
            <dt>Received</dt>
            <dd>{formatDateTime(credential.receivedAt)}</dd>
          </div>
          <div>
            <dt>Revocation status</dt>
            <dd>
              <span className={`status-pill status-${credential.revocationStatus}`}>
                {credential.revocationStatus || 'unknown'}
              </span>
              {credential.lastRevocationCheck ? (
                <small className="muted">Checked {formatDateTime(credential.lastRevocationCheck)}</small>
              ) : null}
            </dd>
          </div>
          {credential.anchor && credential.anchor.txHash && (
            <div>
              <dt>Blockchain Anchor</dt>
              <dd>
                <a
                  href={credential.anchor.explorerUrl || `https://amoy.polygonscan.com/tx/${credential.anchor.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#77dbff', textDecoration: 'underline' }}
                >
                  🔗 View on PolygonScan (Block #{credential.anchor.blockNumber})
                </a>
                <br />
                <small className="muted">Tx: {truncate(credential.anchor.txHash, 20)}</small>
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section>
        <h4>Credential subject</h4>
        {subjectEntries.length === 0 ? (
          <p className="muted">No subject claims available.</p>
        ) : (
          <ul className="claims-list">
            {subjectEntries.map(([key, value]) => (
              <li key={key}>
                <span className="label">{key}</span>
                <span>{typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4>Evidence</h4>
        {evidenceEntries.length === 0 ? (
          <p className="muted">No evidence metadata stored.</p>
        ) : (
          <ul className="claims-list">
            {evidenceEntries.map(([key, value]) => (
              <li key={key}>
                <span className="label">{key}</span>
                <span>{typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="json-view">
        <summary>Show raw JSON</summary>
        <pre>{JSON.stringify(credential.raw, null, 2)}</pre>
      </details>
    </div>
  )
}

export default function CredentialVault() {
  const { state, deleteCredential, checkRevocation } = useHolderWallet()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredCredentials = useMemo(() => {
    return state.credentials.filter((credential) => {
      const matchesSearch =
        credential.title.toLowerCase().includes(search.toLowerCase()) ||
        credential.issuer?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        filterStatus === 'all' ||
        credential.status === filterStatus ||
        credential.revocationStatus === filterStatus ||
        (filterStatus === 'revoked' && credential.revocationStatus === 'revoked')
      return matchesSearch && matchesStatus
    })
  }, [state.credentials, search, filterStatus])

  const handleSelect = (credential) => {
    setSelected(credential)
  }

  return (
    <section className="module-section" id="module-vault">
      <header className="module-heading">
        <h2>Credential Vault</h2>
        <p>Search, inspect, and manage encrypted verifiable credentials.</p>
      </header>

      <div className="toolbar">
        <div className="field">
          <span>Search</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Issuer or credential name" />
        </div>
        <div className="field">
          <span>Status</span>
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="vault-layout">
        <div className="vault-list">
          {filteredCredentials.length === 0 ? (
            <div className="empty-state">
              <p>Vault is empty. Accept a credential from the inbox to get started.</p>
            </div>
          ) : (
            filteredCredentials.map((credential) => (
              <CredentialCard
                key={credential.id}
                credential={credential}
                isSelected={selected?.id === credential.id}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
        <CredentialDetail credential={selected} onDelete={deleteCredential} onCheckRevocation={checkRevocation} />
      </div>
    </section>
  )
}


