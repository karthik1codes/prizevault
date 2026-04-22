import React, { useEffect, useState } from 'react'
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from '../../constants/escrow'

const STORAGE_KEY = 'prize_vault_hackathons'

export default function OrganizerHackathonList({ userWallet, onNavigate }) {
  const [hackathons, setHackathons] = useState([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : []
      setHackathons(parsed.filter((h) => !(h.id === 'hack_001' && h.name === "RIFT '26")))
    } catch (_) {
      setHackathons([])
    }
  }, [])

  const myHackathons = hackathons.filter(
    (h) => h.organizerAddress?.toLowerCase() === (userWallet || DEFAULT_ORGANIZER_ESCROW_ADDRESS)?.toLowerCase()
  )

  return (
    <div className="organizer-hackathon-list">
      <div className="table-header">
        <h2>My Hackathons</h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onNavigate?.('create-hackathon')}
        >
          Create Hackathon
        </button>
      </div>

      {myHackathons.length === 0 ? (
        <p className="muted">No hackathons yet. Create one to get started.</p>
      ) : (
        <div className="hackathon-cards">
          {myHackathons.map((h) => (
            <div key={h.id} className="hackathon-card">
              <div className="hackathon-card-header">
                <h4>{h.name}</h4>
                <span className={`status-badge badge-${h.status}`}>{h.status}</span>
              </div>
              <div className="hackathon-card-body">
                <p>
                  <strong>Dates:</strong> {h.startDate} – {h.endDate}
                </p>
                <p>
                  <strong>Prize pool:</strong> {h.prizePool?.total || 0} {h.prizePool?.currency || 'XLM'}
                </p>
                <p className="escrow-row">
                  <strong>Escrow:</strong>{' '}
                  <code className="did-cell-small escrow-address" title={h.escrowAddress}>
                    {h.escrowAddress && h.escrowAddress.length > 24
                      ? `${h.escrowAddress.slice(0, 12)}…${h.escrowAddress.slice(-10)}`
                      : h.escrowAddress}
                  </code>
                </p>
                <p>
                  <strong>Participants:</strong> {h.participants?.length || 0}
                </p>
              </div>
              <div className="hackathon-card-actions">
                <button
                  type="button"
                  className="btn-small"
                  onClick={() => onNavigate?.('participants', h.id)}
                >
                  Manage Participants
                </button>
                <button
                  type="button"
                  className="btn-small"
                  onClick={() => onNavigate?.('winners', h.id)}
                >
                  Select Winners
                </button>
                <button
                  type="button"
                  className="btn-small"
                  onClick={() => onNavigate?.('payouts', h.id)}
                >
                  Create Payout
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
