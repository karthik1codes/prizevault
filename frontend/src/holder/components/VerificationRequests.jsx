import React, { useMemo, useState } from 'react'
import { useHolderWallet } from '../context/HolderContext'
import { generateRandomId, tryParseJSON } from '../utils/crypto'
import { formatDateTime } from '../utils/ui'

export default function VerificationRequests() {
  const { state, addRequest, updateRequest } = useHolderWallet()
  const [requestInput, setRequestInput] = useState('')
  const [error, setError] = useState('')

  const pendingRequests = useMemo(() => state.requests.filter((request) => request.status !== 'handled'), [state.requests])

  const handleSubmit = () => {
    setError('')
    const parsed = tryParseJSON(requestInput)
    if (!parsed || !parsed.challenge) {
      setError('Invalid request payload. Must include a challenge.')
      return
    }
    const request = {
      id: parsed.id || generateRandomId('request'),
      requester: parsed.requester || 'Unknown verifier',
      challenge: parsed.challenge,
      requiredFields: parsed.requiredFields || [],
      optionalFields: parsed.optionalFields || [],
      purpose: parsed.purpose || 'General verification',
      status: 'pending',
      receivedAt: new Date().toISOString(),
    }
    addRequest(request)
    setRequestInput('')
  }

  const markHandled = (requestId, proofId) => {
    updateRequest(requestId, { status: 'handled', handledAt: new Date().toISOString(), proofId })
  }

  return (
    <section className="module-section" id="module-requests">
      <header className="module-heading">
        <h2>Verification Requests</h2>
        <p>Inspect verifier challenges, review requested attributes, and confirm before sharing proofs.</p>
      </header>

      <div className="panel-grid">
        <div className="panel">
          <h3>Paste request</h3>
          <textarea
            value={requestInput}
            onChange={(event) => setRequestInput(event.target.value)}
            rows={6}
            placeholder={`{
  "id": "req-123",
  "requester": "Recruiter DID",
  "challenge": "nonce-xyz",
  "requiredFields": ["credentialSubject.name"],
  "optionalFields": ["credentialSubject.major"],
  "purpose": "Verify enrollment"
}`}
          />
          {error ? <div className="error-text">{error}</div> : null}
          <button type="button" className="button primary" onClick={handleSubmit}>
            Save request
          </button>
        </div>

        <div className="panel">
          <h3>Pending</h3>
          <p className="muted">{pendingRequests.length} request(s) awaiting response.</p>
        </div>
      </div>

      <div className="cards-grid">
        {state.requests.length === 0 ? (
          <div className="empty-state">
            <p>No verifier requests yet.</p>
          </div>
        ) : (
          state.requests.map((request) => (
            <article key={request.id} className="module-card request-card">
              <header className="module-card-header">
                <div>
                  <h3>{request.requester}</h3>
                  <p className="muted">{request.purpose}</p>
                </div>
                <span className="tag">{request.status === 'handled' ? 'Completed' : 'Pending'}</span>
              </header>
              <div className="detail-grid">
                <div>
                  <span className="label">Challenge</span>
                  <span>{request.challenge}</span>
                </div>
                <div>
                  <span className="label">Received</span>
                  <span>{formatDateTime(request.receivedAt)}</span>
                </div>
              </div>
              <div className="request-fields">
                <div>
                  <span className="label">Required</span>
                  <ul>
                    {request.requiredFields.length ? request.requiredFields.map((field) => <li key={field}>{field}</li>) : <li>None</li>}
                  </ul>
                </div>
                <div>
                  <span className="label">Optional</span>
                  <ul>
                    {request.optionalFields.length ? request.optionalFields.map((field) => <li key={field}>{field}</li>) : <li>None</li>}
                  </ul>
                </div>
              </div>
              {request.status !== 'handled' ? (
                <div className="button-row">
                  <button type="button" className="button secondary" onClick={() => markHandled(request.id, null)}>
                    Mark handled
                  </button>
                </div>
              ) : (
                <p className="muted">Handled {formatDateTime(request.handledAt)}</p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  )
}


