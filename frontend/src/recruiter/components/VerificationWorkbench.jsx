import React, { useState } from 'react'

const defaultResults = {
  bbs: false,
  did: false,
  revocation: false,
  cid: false,
}

export default function VerificationWorkbench({ vpPayload, onVerificationComplete }) {
  const [results, setResults] = useState(defaultResults)
  const [log, setLog] = useState([])
  const [isVerifying, setIsVerifying] = useState(false)

  const runVerification = async () => {
    if (!vpPayload) {
      alert('Please load a Verifiable Presentation first')
      return
    }

    setIsVerifying(true)
    
    // Simulate verification process with realistic delays
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newResults = {
      bbs: true,
      did: true,
      revocation: Math.random() > 0.15,
      cid: Math.random() > 0.1,
    }
    
    setResults(newResults)
    
    const logEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: `Verified VC from ${vpPayload?.verifiableCredential?.[0]?.issuer ?? 'unknown issuer'}`,
      results: newResults,
    }
    
    setLog((prev) => [logEntry, ...prev.slice(0, 4)])
    
    // Pass results to parent component for AI insights
    if (onVerificationComplete) {
      onVerificationComplete(newResults)
    }
    
    setIsVerifying(false)
  }

  return (
    <section className="recruiter-card">
      <header className="card-header">
        <div>
          <h3>Verification engine</h3>
          <p className="muted">BBS+ proof validation, DID resolution, revocation check, and CID integrity.</p>
        </div>
        <button 
          type="button" 
          className="button primary small" 
          onClick={runVerification}
          disabled={!vpPayload || isVerifying}
        >
          {isVerifying ? 'Verifying...' : 'Run verification'}
        </button>
      </header>
      <div className="status-grid">
        <div className={`status-tile ${results.bbs ? 'ok' : ''}`}>
          <span className="label">BBS+ proof</span>
          <strong>{results.bbs ? 'Valid' : 'Pending'}</strong>
        </div>
        <div className={`status-tile ${results.did ? 'ok' : ''}`}>
          <span className="label">Issuer DID</span>
          <strong>{results.did ? 'Authentic' : 'Unknown'}</strong>
        </div>
        <div className={`status-tile ${results.revocation ? 'ok' : 'warn'}`}>
          <span className="label">Revocation</span>
          <strong>{results.revocation ? 'Active' : 'Revoked'}</strong>
        </div>
        <div className={`status-tile ${results.cid ? 'ok' : 'warn'}`}>
          <span className="label">CID integrity</span>
          <strong>{results.cid ? 'Match' : 'Mismatch'}</strong>
        </div>
      </div>
      <div className="log-list">
        {log.map((entry) => (
          <article key={entry.id}>
            <span className="timestamp">{new Date(entry.timestamp).toLocaleString()}</span>
            <p>{entry.message}</p>
          </article>
        ))}
      </div>
    </section>
  )
}


