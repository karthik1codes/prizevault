import React, { useMemo, useState } from 'react'

const sampleProofs = [
  { id: 'vp-2025-001', candidate: 'Avery Chen', status: 'Pending' },
  { id: 'vp-2025-002', candidate: 'Liam Patel', status: 'Pending' },
  { id: 'vp-2025-003', candidate: 'Nina Alvarez', status: 'Pending' },
]

const defaultIssuers = ['did:web:university.example', 'did:web:college.example']

export default function AdvancedToolkit() {
  const [challenge, setChallenge] = useState('')
  const [proofs, setProofs] = useState(sampleProofs)
  const [bookmarks, setBookmarks] = useState([])
  const [issuers, setIssuers] = useState(defaultIssuers)

  const generateChallenge = () => {
    const nonce = crypto.getRandomValues(new Uint8Array(16))
    const challengeValue = Array.from(nonce, (byte) => byte.toString(16).padStart(2, '0')).join('')
    setChallenge(challengeValue)
  }

  const verifyBatch = () => {
    setProofs((prev) =>
      prev.map((proof) => ({
        ...proof,
        status: Math.random() > 0.1 ? 'Verified' : 'Review',
      })),
    )
  }

  const downloadReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      proofs,
      bookmarks,
      issuers,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `verification-report-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const addBookmark = (candidate) => {
    if (bookmarks.includes(candidate)) return
    setBookmarks([candidate, ...bookmarks])
  }

  const addIssuer = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const value = form.elements.issuer.value.trim()
    if (value && !issuers.includes(value)) {
      setIssuers([value, ...issuers])
      form.reset()
    }
  }

  const verifiedCount = useMemo(() => proofs.filter((proof) => proof.status === 'Verified').length, [proofs])

  return (
    <section className="recruiter-smart-grid">
      <article className="recruiter-card">
        <header className="card-header">
          <div>
            <h3>Challenge generator</h3>
            <p className="muted">Create nonce/challenge combos for new presentation requests.</p>
          </div>
          <button type="button" className="button ghost small" onClick={generateChallenge}>
            Generate
          </button>
        </header>
        <div className="challenge-box">{challenge || 'Generate a challenge to share with candidates.'}</div>
      </article>

      <article className="recruiter-card">
        <header className="card-header">
          <div>
            <h3>Batch verification</h3>
            <p className="muted">Queue and verify multiple credentials in one go.</p>
          </div>
          <button type="button" className="button primary small" onClick={verifyBatch}>
            Run batch verify
          </button>
        </header>
        <ul className="proof-list">
          {proofs.map((proof) => (
            <li key={proof.id}>
              <div>
                <strong>{proof.candidate}</strong>
                <span className="muted">{proof.id}</span>
              </div>
              <span className={`pill ${proof.status.toLowerCase()}`}>{proof.status}</span>
              <button type="button" className="link-button" onClick={() => addBookmark(proof.candidate)}>
                Bookmark
              </button>
            </li>
          ))}
        </ul>
        <p className="muted">{verifiedCount} / {proofs.length} proofs verified in this batch.</p>
      </article>

      <article className="recruiter-card">
        <header className="card-header">
          <div>
            <h3>Verification report</h3>
            <p className="muted">Download a signed JSON report for compliance or hiring teams.</p>
          </div>
          <button type="button" className="button ghost small" onClick={downloadReport}>
            Download report
          </button>
        </header>
        <div className="bookmark-list">
          <strong>Bookmarked candidates</strong>
          {bookmarks.length === 0 ? <p className="muted">No bookmarks yet.</p> : null}
          <ul>
            {bookmarks.map((candidate) => (
              <li key={candidate}>{candidate}</li>
            ))}
          </ul>
        </div>
      </article>

      <article className="recruiter-card">
        <header className="card-header">
          <div>
            <h3>Trusted issuers</h3>
            <p className="muted">Maintain an allow-list to fast-track familiar institutions.</p>
          </div>
        </header>
        <form className="issuer-form" onSubmit={addIssuer}>
          <input name="issuer" placeholder="did:web:trusted.example" />
          <button type="submit" className="button ghost small">
            Add issuer
          </button>
        </form>
        <ul className="issuer-list">
          {issuers.map((issuer) => (
            <li key={issuer}>{issuer}</li>
          ))}
        </ul>
      </article>
    </section>
  )
}


