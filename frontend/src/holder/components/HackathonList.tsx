import React, { useState, useMemo, useEffect } from 'react'
import { Hackathon, Participant } from '../../types/hackathon'
import { UserRole } from '../../types/holder'
import { getHackathonsFromStorage } from '../utils/roleDetection'
import { getProfileForWallet } from '../utils/userProfileStorage'

const REGISTERED_KEY = 'registered_hackathons'

interface HackathonListProps {
  userWallet: string | null
  userRole: UserRole
  onNavigate?: (view: string, params?: any) => void
}

export default function HackathonList({ userWallet, userRole, onNavigate }: HackathonListProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all')
  const [registeringId, setRegisteringId] = useState<string | null>(null)
  const [registeredIds, setRegisteredIds] = useState<string[]>([])

  useEffect(() => {
    const stored = getHackathonsFromStorage()
    setHackathons(stored)
    try {
      const reg = localStorage.getItem(REGISTERED_KEY)
      if (reg) setRegisteredIds(JSON.parse(reg))
    } catch {
      // ignore
    }
  }, [])

  const filteredHackathons = useMemo(() => {
    if (filter === 'all') return hackathons
    return hackathons.filter((h) => h.status === filter)
  }, [hackathons, filter])

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
      const newRegistered = [...registeredIds, hackathonId]
      setRegisteredIds(newRegistered)
      localStorage.setItem(REGISTERED_KEY, JSON.stringify(newRegistered))
      alert('Successfully registered for hackathon!')
    } catch (error) {
      console.error('Registration failed:', error)
      alert('Registration failed. Please try again.')
    } finally {
      setRegisteringId(null)
    }
  }

  const getActionButton = (hackathon: Hackathon) => {
    if (!userWallet) return null

    switch (userRole) {
      case 'sponsor':
        if (hackathon.sponsorAddress?.toLowerCase() === userWallet.toLowerCase()) {
          return (
            <button
              type="button"
              className="btn btn-small"
              onClick={() => onNavigate?.('sponsor', { hackathonId: hackathon.id })}
            >
              View Details
            </button>
          )
        }
        return (
          <button
            type="button"
            className="btn btn-small btn-primary"
            onClick={() => onNavigate?.('sponsor', { hackathonId: hackathon.id })}
          >
            Contribute
          </button>
        )
      
      case 'organizer':
        if (hackathon.organizerAddress?.toLowerCase() === userWallet.toLowerCase()) {
          return (
            <button
              type="button"
              className="btn btn-small"
              onClick={() => onNavigate?.('organizer', { hackathonId: hackathon.id })}
            >
              Manage
            </button>
          )
        }
        return null
      
      case 'participant': {
        const isRegistered =
          hackathon.participants?.some(
            (p) => p.payoutAddress?.toLowerCase() === userWallet.toLowerCase()
          ) || registeredIds.includes(hackathon.id)
        if (isRegistered) {
          return (
            <button
              type="button"
              className="btn btn-small btn-view-status"
              onClick={() => onNavigate?.('participant', { hackathonId: hackathon.id })}
            >
              View Status
            </button>
          )
        }
        if (hackathon.status === 'upcoming' || hackathon.status === 'live') {
          const busy = registeringId === hackathon.id
          return (
            <button
              type="button"
              className="btn btn-small btn-register"
              disabled={busy}
              onClick={() => handleRegister(hackathon.id)}
            >
              {busy ? 'Registering…' : 'Register'}
            </button>
          )
        }
        return null
      }
      
      default:
        return null
    }
  }

  return (
    <div className="hackathon-list">
      <div className="dashboard-header">
        <h1>Upcoming Hackathons</h1>
        <p className="muted">Discover and participate in hackathons</p>
      </div>

      {/* Filter Tabs - interactive All / Upcoming / Live / Completed */}
      <div className="filter-tabs" role="tablist" aria-label="Filter hackathons by status">
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'all'}
          aria-pressed={filter === 'all'}
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'upcoming'}
          aria-pressed={filter === 'upcoming'}
          className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'live'}
          aria-pressed={filter === 'live'}
          className={`filter-tab ${filter === 'live' ? 'active' : ''}`}
          onClick={() => setFilter('live')}
        >
          Live
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'completed'}
          aria-pressed={filter === 'completed'}
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {/* Hackathon Cards */}
      {filteredHackathons.length === 0 ? (
        <p className="muted">No hackathons found.</p>
      ) : (
        <div className="hackathon-cards">
          {filteredHackathons.map((hackathon) => (
            <div key={hackathon.id} className="hackathon-card">
              <div className="card-header">
                <h3>{hackathon.name}</h3>
                <span className={`badge badge-${hackathon.status}`}>
                  {hackathon.status}
                </span>
              </div>
              <div className="card-body">
                <p><strong>Prize Pool:</strong> {hackathon.prizePool.total} {hackathon.prizePool.currency}</p>
                <p><strong>Participants:</strong> {hackathon.participants?.length || 0}</p>
                <p><strong>Dates:</strong> {hackathon.startDate} to {hackathon.endDate}</p>
                {hackathon.description && <p className="description">{hackathon.description}</p>}
                <div
                  className={`card-actions${userRole === 'participant' ? ' card-actions--participant' : ''}`}
                >
                  {getActionButton(hackathon)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
