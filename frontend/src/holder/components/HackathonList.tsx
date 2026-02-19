import React, { useState, useMemo, useEffect } from 'react'
import { Hackathon } from '../../types/hackathon'
import { UserRole } from '../../types/holder'
import { getHackathonsFromStorage } from '../utils/roleDetection'

interface HackathonListProps {
  userWallet: string | null
  userRole: UserRole
  onNavigate?: (view: string, params?: any) => void
}

export default function HackathonList({ userWallet, userRole, onNavigate }: HackathonListProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all')

  useEffect(() => {
    const stored = getHackathonsFromStorage()
    setHackathons(stored)
  }, [])

  const filteredHackathons = useMemo(() => {
    if (filter === 'all') return hackathons
    return hackathons.filter((h) => h.status === filter)
  }, [hackathons, filter])

  const getActionButton = (hackathon: Hackathon) => {
    if (!userWallet) return null

    switch (userRole) {
      case 'sponsor':
        if (hackathon.sponsorAddress?.toLowerCase() === userWallet.toLowerCase()) {
          return (
            <button
              className="btn btn-small"
              onClick={() => onNavigate?.('sponsor', { hackathonId: hackathon.id })}
            >
              View Details
            </button>
          )
        }
        return (
          <button
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
              className="btn btn-small"
              onClick={() => onNavigate?.('organizer', { hackathonId: hackathon.id })}
            >
              Manage
            </button>
          )
        }
        return null
      
      case 'participant':
        const isRegistered = hackathon.participants?.some(
          (p) => p.payoutAddress?.toLowerCase() === userWallet.toLowerCase()
        )
        if (isRegistered) {
          return (
            <button
              className="btn btn-small"
              onClick={() => onNavigate?.('participant', { hackathonId: hackathon.id })}
            >
              View Status
            </button>
          )
        }
        if (hackathon.status === 'upcoming' || hackathon.status === 'live') {
          return (
            <button
              className="btn btn-small btn-primary"
              onClick={() => onNavigate?.('participant', { hackathonId: hackathon.id })}
            >
              Register
            </button>
          )
        }
        return null
      
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

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`filter-tab ${filter === 'live' ? 'active' : ''}`}
          onClick={() => setFilter('live')}
        >
          Live
        </button>
        <button
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
                <p><strong>Participants:</strong> {hackathon.participantCount}</p>
                <p><strong>Dates:</strong> {hackathon.startDate} to {hackathon.endDate}</p>
                {hackathon.description && <p className="description">{hackathon.description}</p>}
                <div className="card-actions">
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
