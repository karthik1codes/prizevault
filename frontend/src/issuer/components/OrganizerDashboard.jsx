import React, { useEffect, useMemo, useState } from 'react'
import { deleteHackathonById } from '../../holder/utils/roleDetection'
import { hackathonBelongsToOrganizerPortal } from '../../utils/organizerPortalFilter'

const STORAGE_KEY = 'prize_vault_hackathons'

function getHackathons() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.filter((h) => !(h.id === 'hack_001' && h.name === "RIFT '26"))
    }
  } catch (_) {}
  return []
}

export default function OrganizerDashboard({ sessionWallet, onNavigate }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === null) bump()
    }
    window.addEventListener('prize_vault_hackathons_changed', bump)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('prize_vault_hackathons_changed', bump)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const hackathons = useMemo(
    () =>
      getHackathons().filter((h) =>
        hackathonBelongsToOrganizerPortal(h, sessionWallet),
      ),
    [tick, sessionWallet],
  )

  const totalParticipants = hackathons.reduce((sum, h) => sum + (h.participants?.length || 0), 0)
  const pendingPayouts = hackathons.filter((h) => h.winnersSelected && !h.payoutProposed).length
  const awaitingApproval = hackathons.filter((h) => h.payoutProposed).length

  return (
    <div className="organizer-dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <div className="dashboard-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigate?.('create-hackathon')}
          >
            Create Hackathon
          </button>
          <a href="/holder" className="btn-secondary">
            View Escrow Wallet
          </a>
        </div>
      </div>

      <div className="pending-actions">
        {hackathons.some((h) => h.winnersSelected && !h.payoutProposed) && (
          <div className="action-card">
            <span className="action-icon">🏆</span>
            <div>
              <strong>Select winners</strong> for completed hackathons
              <button
                type="button"
                className="btn-link"
                onClick={() => onNavigate?.('winners')}
              >
                Go to Select Winners →
              </button>
            </div>
          </div>
        )}
        {awaitingApproval > 0 && (
          <div className="action-card">
            <span className="action-icon">💰</span>
            <div>
              <strong>{awaitingApproval} payout proposal(s)</strong> awaiting sponsor approval
              <button
                type="button"
                className="btn-link"
                onClick={() => onNavigate?.('payouts')}
              >
                View Payouts →
              </button>
            </div>
          </div>
        )}
      </div>

      <section className="my-hackathons-section">
        <h3>My Hackathons</h3>
        {hackathons.length === 0 ? (
          <p className="muted">No hackathons yet. Create one to get started.</p>
        ) : (
          <div className="hackathon-cards">
            {hackathons.map((h) => (
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
                  <button
                    type="button"
                    className="btn-small btn-danger"
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Delete hackathon "${h.name}"? This removes it for sponsors and participants and deletes related proposals.`,
                        )
                      ) {
                        return
                      }
                      deleteHackathonById(h.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
