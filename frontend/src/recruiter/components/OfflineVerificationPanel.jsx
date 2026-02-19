import React from 'react'

export default function OfflineVerificationPanel() {
  return (
    <section className="recruiter-card">
      <header className="card-header">
        <div>
          <h3>Offline QR verification</h3>
          <p className="muted">Run verifications in low-connectivity environments like job fairs.</p>
        </div>
      </header>
      <ol className="offline-steps">
        <li>Download verifier keys and cached revocation registry before the event.</li>
        <li>Switch kiosk mode ON to disable network calls and rely on local cache.</li>
        <li>Scan QR codes, verify BBS+ proofs, and mark results for upload.</li>
        <li>When back online, sync logs, update revocation checks, and regenerate AI summaries.</li>
      </ol>
      <p className="muted">
        Offline mode stores verification receipts locally with timestamped signatures. Once synced, audit reports merge
        with the main dashboard so hiring leads have a continuous record.
      </p>
    </section>
  )
}


