import React, { useState, useMemo, useEffect } from 'react'
import { Hackathon, Participant } from '../../types/hackathon'
import { getHackathonsFromStorage } from '../utils/roleDetection'
import { getProfileForWallet } from '../utils/userProfileStorage'

const REGISTERED_KEY = 'registered_hackathons'

interface ParticipantDashboardProps {
  userWallet: string | null
  onNavigate?: (view: string, params?: Record<string, unknown>) => void
}

export default function ParticipantDashboard({ userWallet, onNavigate }: ParticipantDashboardProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [registeredHackathons, setRegisteredHackathons] = useState<string[]>([])
  const [registeringId, setRegisteringId] = useState<string | null>(null)

  useEffect(() => {
    setHackathons(getHackathonsFromStorage())
    try {
      const stored = localStorage.getItem(REGISTERED_KEY)
      if (stored) setRegisteredHackathons(JSON.parse(stored))
    } catch (_) {
      // ignore
    }
  }, [])

  const myParticipations = useMemo(() => {
    if (!userWallet) return []
    return hackathons.filter((h) => {
      const isParticipant = h.participants?.some(
        (p) => p.payoutAddress?.toLowerCase() === userWallet.toLowerCase()
      )
      return isParticipant || registeredHackathons.includes(h.id)
    })
  }, [hackathons, userWallet, registeredHackathons])

  const availableHackathons = useMemo(() => {
    if (!userWallet) return []
    return hackathons.filter(
      (h) =>
        (h.status === 'upcoming' || h.status === 'live') &&
        !registeredHackathons.includes(h.id) &&
        !h.participants?.some((p) => p.payoutAddress?.toLowerCase() === userWallet.toLowerCase())
    )
  }, [hackathons, userWallet, registeredHackathons])

  const handleRegister = async (hackathonId: string) => {
    if (!userWallet) {
      alert('Please connect your wallet first')
      return
    }
    setRegisteringId(hackathonId)
    try {
      const profileName = getProfileForWallet(userWallet)?.name ?? 'You'
      const newParticipant: Participant = {
        id: `p_${userWallet.slice(0, 8)}`,
        name: profileName,
        registeredAt: new Date().toISOString().split('T')[0],
        status: 'registered',
        payoutAddress: userWallet,
      }
      const updated = hackathons.map((h) => {
        if (h.id === hackathonId) {
          return {
            ...h,
            participants: [...(h.participants ?? []), newParticipant],
            participantCount: (h.participantCount ?? 0) + 1,
          }
        }
        return h
      })
      const storageKey = 'prize_vault_hackathons'
      localStorage.setItem(storageKey, JSON.stringify(updated))
      setHackathons(updated)
      const newRegistered = [...registeredHackathons, hackathonId]
      setRegisteredHackathons(newRegistered)
      localStorage.setItem(REGISTERED_KEY, JSON.stringify(newRegistered))
      alert('Successfully registered for hackathon!')
    } catch (error) {
      console.error('Registration failed:', error)
      alert('Registration failed. Please try again.')
    } finally {
      setRegisteringId(null)
    }
  }

  const isWinner = (hackathon: Hackathon): boolean => {
    if (!userWallet || !hackathon.winners) return false
    return hackathon.winners.some(
      (w) => w.payoutAddress?.toLowerCase() === userWallet.toLowerCase()
    )
  }

  return (
    <div className="participant-dashboard">
      <div className="dashboard-header">
        <h1>Participant Dashboard</h1>
        <p className="muted">View your hackathon registrations and prizes</p>
      </div>

      {!userWallet && (
        <div className="alert alert-warning">
          Please connect your Stellar wallet to view participant features.
        </div>
      )}

      {userWallet && (
        <>
          <section className="my-participations-section">
            <h2>My Hackathons</h2>
            {myParticipations.length === 0 ? (
              <p className="muted">You haven&apos;t registered for any hackathons yet.</p>
            ) : (
              <div className="hackathon-cards">
                {myParticipations.map((hackathon) => {
                  const winner = isWinner(hackathon)
                  const participant = hackathon.participants?.find(
                    (p) => p.payoutAddress?.toLowerCase() === userWallet.toLowerCase()
                  )
                  return (
                    <div key={hackathon.id} className="hackathon-card">
                      <div className="card-header">
                        <h3>{hackathon.name}</h3>
                        <span className={`badge badge-${hackathon.status}`}>{hackathon.status}</span>
                        {winner && <span className="badge badge-winner">Winner!</span>}
                      </div>
                      <div className="card-body">
                        <p>
                          <strong>Status:</strong> {participant?.status ?? 'registered'}
                        </p>
                        {winner && (
                          <div className="winner-info">
                            <p>
                              <strong>Prize:</strong>{' '}
                              {hackathon.winners?.find(
                                (w) => w.payoutAddress?.toLowerCase() === userWallet.toLowerCase()
                              )?.prizeAmount ?? 0}{' '}
                              {hackathon.prizePool.currency}
                            </p>
                            <p>
                              <strong>Tier:</strong>{' '}
                              {hackathon.winners?.find(
                                (w) => w.payoutAddress?.toLowerCase() === userWallet.toLowerCase()
                              )?.prizeTier ?? 'N/A'}
                            </p>
                          </div>
                        )}
                        <p>
                          <strong>Dates:</strong> {hackathon.startDate} to {hackathon.endDate}
                        </p>
                        {participant?.project && (
                          <p>
                            <strong>Project:</strong> {participant.project}
                          </p>
                        )}
                        {participant?.team && (
                          <p>
                            <strong>Team:</strong> {participant.team}
                          </p>
                        )}
                        <div className="card-actions">
                          <button
                            type="button"
                            className="btn btn-small btn-view-status"
                            onClick={() => onNavigate?.('participant', { hackathonId: hackathon.id })}
                          >
                            View Status
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="available-hackathons-section">
            <h2>Available Hackathons</h2>
            {availableHackathons.length === 0 ? (
              <p className="muted">No hackathons available for registration.</p>
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
                        <strong>Prize Pool:</strong> {hackathon.prizePool.total}{' '}
                        {hackathon.prizePool.currency}
                      </p>
                      <p>
                        <strong>Participants:</strong> {hackathon.participants?.length || 0}
                      </p>
                      <p>
                        <strong>Dates:</strong> {hackathon.startDate} to {hackathon.endDate}
                      </p>
                      {hackathon.description && <p>{hackathon.description}</p>}
                      <div className="card-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-register"
                          disabled={registeringId === hackathon.id}
                          onClick={() => handleRegister(hackathon.id)}
                        >
                          {registeringId === hackathon.id ? 'Registering…' : 'Register for Free'}
                        </button>
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
