import React, { useMemo, useState } from 'react'
import { useHolderWallet } from '../context/HolderContext'
import { formatDateTime, truncate } from '../utils/ui'
import { tryParseJSON } from '../utils/crypto'

const credentialCategories = ['Degree', 'Student ID', 'Certificate', 'Transcript', 'Other']

function InboxRow({ item, onAccept, onReject }) {
  return (
    <article className={`module-card inbox-card status-${item.status}`}>
      <header className="module-card-header">
        <div>
          <h3>{item.parsed.type?.slice?.(-1)?.[0] || 'Verifiable Credential'}</h3>
          <p className="muted">{truncate(item.parsed?.issuer, 18)}</p>
        </div>
        <div className="tag">{item.status}</div>
      </header>
      <dl className="details-grid">
        <div>
          <dt>Received</dt>
          <dd>{formatDateTime(item.receivedAt)}</dd>
        </div>
        <div>
          <dt>Holder</dt>
          <dd>{item.parsed?.credentialSubject?.id || 'Unknown holder'}</dd>
        </div>
        <div>
          <dt>Valid from</dt>
          <dd>{formatDateTime(item.parsed?.validFrom || item.parsed?.issuanceDate)}</dd>
        </div>
        {item.anchor && item.anchor.txHash && (
          <div>
            <dt>Blockchain Anchor</dt>
            <dd>
              <a
                href={`https://amoy.polygonscan.com/tx/${item.anchor.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#77dbff', textDecoration: 'underline' }}
              >
                🔗 Block #{item.anchor.blockNumber}
              </a>
            </dd>
          </div>
        )}
      </dl>
      {item.status === 'pending' ? (
        <div className="button-row">
          <button type="button" className="button ghost" onClick={() => onReject(item.id)}>
            Reject
          </button>
          <button type="button" className="button primary" onClick={() => onAccept(item.id)}>
            Accept
          </button>
        </div>
      ) : null}
      <details className="json-view">
        <summary>View JSON</summary>
        <pre>{JSON.stringify(item.parsed, null, 2)}</pre>
      </details>
    </article>
  )
}

export default function CredentialInbox() {
  const { state, enqueueCredential, acceptCredential, rejectCredential } = useHolderWallet()
  const [credentialInput, setCredentialInput] = useState('')
  const [category, setCategory] = useState(credentialCategories[0])
  const [error, setError] = useState('')

  const pending = useMemo(() => state.inbox.filter((item) => item.status === 'pending'), [state.inbox])

  const handleSubmit = () => {
    setError('')
    const parsed = tryParseJSON(credentialInput)
    if (!parsed) {
      setError('Invalid JSON payload. Please verify the credential structure.')
      return
    }
    if (!parsed.proof?.type) {
      setError('Credential missing a proof section. Ensure issuer signature is included.')
      return
    }
    enqueueCredential(parsed, 'manual')
    setCredentialInput('')
  }

  return (
    <section className="module-section" id="module-inbox">
      <header className="module-heading">
        <h2>Credential Inbox</h2>
        <p>Review offers from issuers, inspect proofs, and decide whether to store the credential.</p>
      </header>

      <div className="panel-grid">
        <div className="panel">
          <h3>Paste credential</h3>
          <p className="muted">Drop in a signed W3C VC JSON payload received by DIDComm or email.</p>
          <textarea
            value={credentialInput}
            onChange={(event) => setCredentialInput(event.target.value)}
            rows={8}
            placeholder={`{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "UniversityDegreeCredential"],
  ...
}`}
          />
          {error ? <div className="error-text">{error}</div> : null}
          <div className="button-row">
            <button type="button" className="button primary" onClick={handleSubmit}>
              Save to inbox
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>Auto-categorize</h3>
          <p className="muted">Assign default category when accepting the credential into the vault.</p>
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {credentialCategories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <div className="alert info">
            {pending.length > 0 ? `${pending.length} credential(s) waiting in inbox.` : 'Inbox is empty.'}
          </div>
        </div>
      </div>

      <div className="cards-grid">
        {state.inbox.length === 0 ? (
          <div className="empty-state">
            <p>No credentials received yet. Paste a VC JSON payload to simulate incoming data.</p>
          </div>
        ) : (
          state.inbox.map((item) => (
            <InboxRow
              key={item.id}
              item={item}
              onAccept={(id) => acceptCredential(id, category)}
              onReject={(id) => rejectCredential(id, 'Student rejected credential')}
            />
          ))
        )}
      </div>
    </section>
  )
}


