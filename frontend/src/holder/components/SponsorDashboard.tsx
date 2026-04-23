import React, { useState, useMemo, useEffect } from 'react'
import { Hackathon } from '../../types/hackathon'
import { getHackathonsFromStorage, saveHackathonsToStorage } from '../utils/roleDetection'
import { getPayoutProposals, savePayoutProposals } from '../../utils/payoutProposalsStorage'
import { ESCROW_APP_ID } from '../../constants/escrow'
import { subscribeHackathonsDatasetChanged } from '../../utils/hackathonSync'

interface SponsorDashboardProps {
  userWallet: string | null
  onNavigate?: (view: string, params?: Record<string, unknown>) => void
}

export default function SponsorDashboard({ userWallet, onNavigate }: SponsorDashboardProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [proposals, setProposals] = useState<Record<string, unknown>[]>([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const loadHackathons = () => setHackathons(getHackathonsFromStorage())

  useEffect(() => {
    const reloadAll = () => {
      loadHackathons()
      setProposals(getPayoutProposals())
    }
    reloadAll()
    return subscribeHackathonsDatasetChanged(reloadAll, ['prize_vault_payout_proposals'])
  }, [])

  useEffect(() => {
    setProposals(getPayoutProposals())
    const interval = setInterval(() => {
      setProposals(getPayoutProposals())
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const myHackathons = useMemo(() => {
    if (!userWallet) return []
    return hackathons.filter(
      (h) => h.sponsorAddress?.toLowerCase() === userWallet.toLowerCase()
    )
  }, [hackathons, userWallet])

  const availableHackathons = useMemo(() => {
    if (!userWallet) return []
    return hackathons.filter(
      (h) =>
        h.sponsorAddress?.toLowerCase() !== userWallet.toLowerCase() &&
        (h.status === 'upcoming' || h.status === 'live')
    )
  }, [hackathons, userWallet])

  const proposalsAwaitingMyApproval = useMemo(() => {
    if (!userWallet) return []
    return proposals.filter(
      (p) =>
        p.organizerApproved &&
        !p.sponsorApproved &&
        p.status !== 'executed'
    )
  }, [proposals, userWallet])

  const handleContribute = async (hackathonId: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    setLoading(true)
    try {
      const updated = hackathons.map((h) => {
        if (h.id === hackathonId) {
          return {
            ...h,
            prizePool: {
              ...h.prizePool,
              total: h.prizePool.total + parseFloat(amount),
            },
            sponsorAddress: userWallet || h.sponsorAddress,
          }
        }
        return h
      })
      saveHackathonsToStorage(updated)
      setHackathons(updated)
      setAmount('')
      const hack = updated.find((h) => h.id === hackathonId)
      alert(`Contributed ${amount} ${hack?.prizePool.currency ?? 'XLM'} to prize pool`)
    } catch (error) {
      console.error('Transaction failed:', error)
      alert('Transaction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePayout = (proposalId: string) => {
    setLoading(true)
    try {
      const updated = proposals.map((p) =>
        p.id === proposalId ? { ...p, sponsorApproved: true } : p
      )
      savePayoutProposals(updated)
      setProposals(updated)
    } catch (error) {
      console.error('Approval failed:', error)
      alert('Approval failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sponsor-dashboard">
      <div className="dashboard-header">
        <h1>Sponsor Dashboard</h1>
        <p className="muted">Manage your hackathon contributions and approvals</p>
      </div>

      {!userWallet && (
        <div className="alert alert-warning">
          Please connect your Stellar wallet to view sponsor features.
        </div>
      )}

      {userWallet && (
        <>
          <section className="available-hackathons-section">
            <h2>Hackathons you can contribute to</h2>
            <p className="muted" style={{ marginBottom: '1rem' }}>
              Contribute to prize pools from this page. For on-chain lock (escrow contract {ESCROW_APP_ID}), run from project root: <code>npm run deposit -- --amount=&lt;xlm&gt;</code> (env: SPONSOR_SECRET_KEY, STELLAR_HORIZON_URL).
            </p>
            {availableHackathons.length === 0 ? (
              <p className="muted">No upcoming hackathons available for sponsorship.</p>
            ) : (
              <div className="hackathon-cards">
                {availableHackathons.map((hackathon) => (
                  <div key={hackathon.id} className="hackathon-card">
                    <div className="card-header">
                      <h3>{hackathon.name}</h3>
                      <span className={`badge badge-${hackathon.status}`}>{hackathon.status}</span>
                    </div>
                    <div className="card-body">
                      <p>
                        <strong>Current Prize Pool:</strong> {hackathon.prizePool.total}{' '}
                        {hackathon.prizePool.currency}
                      </p>
                      <p>
                        <strong>Participants:</strong> {hackathon.participants?.length || 0}
                      </p>
                      <p>
                        <strong>Dates:</strong> {hackathon.startDate} to {hackathon.endDate}
                      </p>
                      <div className="contribute-section">
                        <input
                          type="number"
                          placeholder="Amount (XLM)"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="input-inline"
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleContribute(hackathon.id)}
                          disabled={loading || !amount}
                        >
                          Contribute
                        </button>
                      </div>
                      <div className="card-actions">
                        <button
                          type="button"
                          className="btn btn-small btn-view-status"
                          onClick={() => onNavigate?.('sponsor', { hackathonId: hackathon.id })}
                        >
                          View Details
                        </button>
                        <a
                          href={`https://lora.algokit.io/testnet/application/${ESCROW_APP_ID}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-small"
                        >
                          View on Stellar Lab
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pending prize releases – mirrors Proposals cards from Organizer page */}
          <section className="pending-prize-releases-section">
            <h2>Pending prize releases</h2>
            <p className="muted" style={{ marginBottom: '1rem' }}>
              Approve payouts once organizers have selected winners. Both organizer and sponsor must approve before execution.
            </p>
            {proposalsAwaitingMyApproval.length === 0 ? (
              <p className="muted">No payout proposals awaiting your approval.</p>
            ) : (
              <div className="proposal-cards">
                {proposalsAwaitingMyApproval.map((p: Record<string, unknown>) => {
                  const winners = (p.winners as { prizeAmount?: number; payoutAddress?: string; name?: string }[] | undefined) ?? []
                  const totalAlgo = winners.reduce((s, w) => s + (w.prizeAmount || 0), 0)
                  return (
                    <div key={String(p.id)} className="proposal-card full">
                      <div className="proposal-header">
                        <strong>{String(p.hackathonName)}</strong>
                      </div>
                      <div className="proposal-body">
                        <p>Event end date: {String(p.eventEndDate)}</p>
                        <p>Winners: {winners.length}</p>
                        <p>Total: {totalAlgo} XLM</p>
                      </div>
                      <div className="proposal-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleApprovePayout(String(p.id))}
                          disabled={loading}
                        >
                          Approve release
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="my-hackathons-section">
            <h2>My Sponsored Hackathons</h2>
            {myHackathons.length === 0 ? (
              <p className="muted">You have not sponsored any hackathons yet.</p>
            ) : (
              <div className="hackathon-cards">
                {myHackathons.map((hackathon) => (
                  <div key={hackathon.id} className="hackathon-card">
                    <div className="card-header">
                      <h3>{hackathon.name}</h3>
                      <span className={`badge badge-${hackathon.status}`}>{hackathon.status}</span>
                    </div>
                    <div className="card-body">
                      <p>
                        <strong>Prize Pool:</strong> {hackathon.prizePool.total}{' '}
                        {hackathon.prizePool.currency}
                      </p>
                      <p>
                        <strong>Participants:</strong> {hackathon.participants?.length || 0}
                      </p>
                      <p>
                        <strong>Dates:</strong> {hackathon.startDate} to {hackathon.endDate}
                      </p>
                      {hackathon.escrowAddress && (
                        <p>
                          <strong>Escrow:</strong>{' '}
                          <code style={{ fontSize: '0.75rem' }}>
                            {hackathon.escrowAddress.slice(0, 8)}...{hackathon.escrowAddress.slice(-6)}
                          </code>
                        </p>
                      )}
                      <div className="card-actions">
                        <button
                          type="button"
                          className="btn btn-small btn-view-status"
                          onClick={() => onNavigate?.('sponsor', { hackathonId: hackathon.id })}
                        >
                          View Details
                        </button>
                        <a
                          href={`https://lora.algokit.io/testnet/application/${ESCROW_APP_ID}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-small"
                        >
                          View on Lora
                        </a>
                        {hackathon.winnersSelected && !hackathon.payoutProposed && (
                          <button
                            type="button"
                            className="btn btn-small btn-primary"
                            onClick={() => onNavigate?.('payouts', { hackathonId: hackathon.id })}
                          >
                            Review Payout
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
