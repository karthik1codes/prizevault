import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'prize_vault_hackathons'

function getMockHackathons() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (_) {}
  return [
    {
      id: 'hack_001',
      name: 'RIFT \'26',
      startDate: '2026-02-19',
      endDate: '2026-02-20',
      prizePool: { total: 10000, currency: 'ALGO', locked: true },
      organizerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      sponsorAddress: '0x1234567890abcdef',
      escrowAddress: '0xescrow001...',
      status: 'live',
      participantCount: 150,
      description: '24-hour hackathon across Bengaluru, Pune, Noida and Lucknow',
    },
  ]
}

function initMockData() {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getMockHackathons()))
    }
  } catch (_) {}
}

export default function OrganizerHackathonList({ userWallet, onNavigate }) {
  const [hackathons, setHackathons] = useState([])

  useEffect(() => {
    initMockData()
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      setHackathons(stored ? JSON.parse(stored) : getMockHackathons())
    } catch (_) {
      setHackathons(getMockHackathons())
    }
  }, [])

  const myHackathons = hackathons.filter(
    (h) => h.organizerAddress?.toLowerCase() === (userWallet || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')?.toLowerCase()
  )

  return (
    <div className="organizer-hackathon-list">
      <div className="table-header">
        <h2>My Hackathons</h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {}}
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
                  <strong>Prize pool:</strong> {h.prizePool?.total || 0} {h.prizePool?.currency || 'ALGO'}
                </p>
                <p>
                  <strong>Escrow:</strong>{' '}
                  <code className="did-cell-small">{h.escrowAddress}</code>
                </p>
                <p>
                  <strong>Participants:</strong> {h.participantCount || 0}
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
