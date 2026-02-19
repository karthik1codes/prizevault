import React from 'react'
import { useHolderWallet } from '../context/HolderContext'
import { formatDateTime } from '../utils/ui'

export default function AuditTrail() {
  const { state } = useHolderWallet()
  const events = state.auditLog

  return (
    <section className="module-section" id="module-audit">
      <header className="module-heading">
        <h2>Audit Trail</h2>
        <p>Local-only log of credential, document, and proof activity.</p>
      </header>
      <div className="timeline">
        {events.length === 0 ? (
          <div className="empty-state">
            <p>No activity logged yet.</p>
          </div>
        ) : (
          events.map((event) => (
            <article key={event.id} className="timeline-item">
              <div className="timeline-dot" />
              <div>
                <h3>{event.message}</h3>
                <p className="muted">{event.type}</p>
                <span className="timestamp">{formatDateTime(event.createdAt)}</span>
                {event.meta ? (
                  <details className="json-view">
                    <summary>Metadata</summary>
                    <pre>{JSON.stringify(event.meta, null, 2)}</pre>
                  </details>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}


