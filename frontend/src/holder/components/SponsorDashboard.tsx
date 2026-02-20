import React, { useState, useMemo, useEffect } from 'react'
import { Hackathon } from '../../types/hackathon'
import { getHackathonsFromStorage, saveHackathonsToStorage } from '../utils/roleDetection'
import { getPayoutProposals, savePayoutProposals } from '../../utils/payoutProposalsStorage'

interface SponsorDashboardProps {
  userWallet: string | null
  onNavigate?: (view: string, params?: Record<string, unknown>) => void
}

export default function SponsorDashboard({ userWallet, onNavigate }: SponsorDashboardProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [proposals, setProposals] = useState<Record<string, unknown>[]>([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setHackathons(getHackathonsFromStorage())
  }, [])

  useEffect(() => {
    setProposals(getPayoutProposals())
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
        hackathons.some(
          (h) =>
            h.id === p.hackathonId &&
            h.sponsorAddress?.toLowerCase() === userWallet.toLowerCase()
        )
    )
  }, [proposals, hackathons, userWallet])

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
      alert(`Contributed ${amount} ${hack?.prizePool.currency ?? 'ALGO'} to prize pool`)
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
          Please connect your Defly wallet to view sponsor features.
        </div>
      )}

      {userWallet && (
        <>
          <section className="available-hackathons-section">
            <h2>Hackathons you can contribute to</h2>
            <p className="muted" style={{ marginBottom: '1rem' }}>
              Contribute to prize pools only from this page. Select a hackathon below and enter the amount to fund.
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
                        <strong>Participants:</strong> {hackathon.participantCount}
                      </p>
                      <p>
                        <strong>Dates:</strong> {hackathon.startDate} to {hackathon.endDate}
                      </p>
                      <div className="contribute-section">
                        <input
                          type="number"
                          placeholder="Amount"
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="payout-proposals-section">
            <h2>Payout proposals awaiting your approval</h2>
            <p className="muted" style={{ marginBottom: '1rem' }}>
              Approve payout proposals for hackathons you sponsor. Organizer can execute after both approve.
            </p>
            {proposalsAwaitingMyApproval.length === 0 ? (
              <p className="muted">No payout proposals awaiting your approval.</p>
            ) : (
              <div className="hackathon-cards">
                {proposalsAwaitingMyApproval.map((p: Record<string, unknown>) => (
                  <div key={String(p.id)} className="hackathon-card">
                    <div className="card-header">
                      <h3>{String(p.hackathonName)}</h3>
                      <span className="badge badge-pending">Awaiting Sponsor</span>
                    </div>
                    <div className="card-body">
                      <p><strong>Event end:</strong> {String(p.eventEndDate)}</p>
                      <p><strong>Winners:</strong> {(p.winners as unknown[])?.length ?? 0}</p>
                      <p>
                        <strong>Total:</strong>{' '}
                        {(p.winners as { prizeAmount?: number }[] || [])
                          .reduce((s, w) => s + (w.prizeAmount || 0), 0)}{' '}
                        ALGO
                      </p>
                      <div className="pending-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleApprovePayout(String(p.id))}
                          disabled={loading}
                        >
                          Approve Payout
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                        <strong>Participants:</strong> {hackathon.participantCount}
                      </p>
                      <p>
                        <strong>Dates:</strong> {hackathon.startDate} to {hackathon.endDate}
                      </p>
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
