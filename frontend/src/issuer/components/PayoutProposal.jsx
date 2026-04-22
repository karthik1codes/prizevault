import React, { useState, useMemo, useEffect } from 'react'
import { getPayoutProposals, savePayoutProposals } from '../../utils/payoutProposalsStorage'
import { ESCROW_APP_ID } from '../../constants/escrow'

const STORAGE_KEY = 'prize_vault_hackathons'

function getHackathons() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (_) {}
  return []
}

export default function PayoutProposal({ hackathonId, userWallet, onExecute }) {
  const [proposals, setProposals] = useState([])

  useEffect(() => {
    setProposals(getPayoutProposals())
  }, [])

  const hackathons = useMemo(() => getHackathons(), [])
  const myHackathons = hackathons.filter(
    (h) => h.organizerAddress?.toLowerCase() === userWallet?.toLowerCase()
  )
  const hackathon = hackathonId
    ? hackathons.find((h) => h.id === hackathonId)
    : myHackathons[0]

  const eligibleHackathons = myHackathons.filter(
    (h) => h.winnersSelected && h.winners?.length > 0
  )

  const handleCreateProposal = (h) => {
    const now = new Date().toISOString()
    const proposal = {
      id: `prop_${h.id}_${Date.now()}`,
      hackathonId: h.id,
      hackathonName: h.name,
      createdAt: now,
      status: 'awaiting_sponsor',
      organizerApproved: true,
      sponsorApproved: false,
      winners: h.winners || [],
      eventEndDate: h.endDate,
    }
    const updated = [proposal, ...proposals]
    setProposals(updated)
    savePayoutProposals(updated)

    try {
      const stored = getHackathons()
      const updatedHackathons = stored.map((x) =>
        x.id === h.id ? { ...x, payoutProposed: true } : x
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHackathons))
    } catch (_) {}
  }

  const handleExecutePayout = (proposal) => {
    const updated = proposals.map((p) =>
      p.id === proposal.id ? { ...p, status: 'executed', txHash: '0xmock...' } : p
    )
    setProposals(updated)
    savePayoutProposals(updated)
    onExecute?.(proposal)
  }

  // Build winners JSON for Stellar release script. Prize amounts in XLM.
  const getReleaseAppWinnersJson = (p) => {
    const winners = (p.winners || []).filter((w) => w.payoutAddress && (w.prizeAmount || 0) > 0)
    return JSON.stringify(
      winners.map((w) => ({
        address: w.payoutAddress.trim(),
        amountXlm: Number(w.prizeAmount || 0),
      }))
    )
  }

  const getReleaseAppWinnersForCopy = (p) => getReleaseAppWinnersJson(p)

  const displayProposals = proposals.filter((p) =>
    myHackathons.some((h) => h.id === p.hackathonId)
  )

  const getStatusBadge = (p) => {
    if (p.status === 'executed') return <span className="status-badge badge-issued">Executed</span>
    if (p.organizerApproved && p.sponsorApproved)
      return <span className="status-badge badge-verified">Both Approved</span>
    return <span className="status-badge badge-pending">Awaiting Sponsor</span>
  }

  return (
    <div className="payout-proposal">
      <div className="table-header">
        <h2>Payout Proposals</h2>
        <p className="muted">
          Create a payout proposal after the event timeline ends. Both organizer and sponsor must approve before execution.
        </p>
      </div>

      {eligibleHackathons.length === 0 ? (
        <p className="muted">No hackathons with selected winners. Select winners first.</p>
      ) : (
        <section className="create-proposal-section">
          <h3>Create Payout Proposal</h3>
          {eligibleHackathons
            .filter((h) => !h.payoutProposed && !proposals.some((p) => p.hackathonId === h.id))
            .map((h) => (
              <div key={h.id} className="proposal-card">
                <div>
                  <strong>{h.name}</strong>
                  <span className="muted"> – Event ended: {h.endDate}</span>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleCreateProposal(h)}
                >
                  Create Payout Proposal
                </button>
              </div>
            ))}
        </section>
      )}

      <section className="proposals-list">
        <h3>Proposals</h3>
        {displayProposals.length === 0 ? (
          <p className="muted">No payout proposals yet.</p>
        ) : (
          <div className="proposal-cards">
            {displayProposals.map((p) => (
              <div key={p.id} className="proposal-card full">
                <div className="proposal-header">
                  <h4>{p.hackathonName}</h4>
                  {getStatusBadge(p)}
                </div>
                <div className="proposal-body">
                  <p>Event end date: {p.eventEndDate}</p>
                  <p>Winners: {p.winners?.length || 0}</p>
                  <p>Total: {p.winners?.reduce((s, w) => s + (w.prizeAmount || 0), 0)} XLM</p>
                </div>
                {p.organizerApproved && p.sponsorApproved && p.status !== 'executed' && (
                  <div className="execute-payout-app">
                    <p className="muted" style={{ marginBottom: '0.5rem' }}>
                      Escrow contract <strong>{ESCROW_APP_ID}</strong>: run from project root with SPONSOR_SECRET_KEY, ORGANIZER_SECRET_KEY and STELLAR_HORIZON_URL set.
                    </p>
                    <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Winners (set WINNERS_JSON then run release flow script):</p>
                    <pre className="release-command" style={{ fontSize: '0.7rem', overflow: 'auto', maxWidth: '100%', padding: '0.5rem', background: '#1a1a1a', borderRadius: 4 }}>
                      {getReleaseAppWinnersForCopy(p)}
                    </pre>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        navigator.clipboard?.writeText(getReleaseAppWinnersForCopy(p))
                        alert('Winners JSON copied. Use it with the Stellar release flow.')
                      }}
                    >
                      Copy JSON &amp; run release-app
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ marginLeft: '0.5rem' }}
                      onClick={() => handleExecutePayout(p)}
                    >
                      Mark as Executed
                    </button>
                  </div>
                )}
                {p.status === 'executed' && (
                  <a
                    href="https://testnet.algoexplorer.io"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    View on Stellar Explorer
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
