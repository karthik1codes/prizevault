import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { hackathonBelongsToOrganizerPortal } from '../../utils/organizerPortalFilter'
import { broadcastHackathonsDatasetChanged } from '../../utils/hackathonSync'

const STORAGE_KEY = 'prize_vault_hackathons'

function getHackathons() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (_) {}
  return []
}

function saveHackathons(hackathons) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hackathons))
  } catch (_) {}
}

export default function ParticipantManager({ hackathonId, sessionWallet, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedHackathon, setSelectedHackathon] = useState(hackathonId || null)
  const [hackathons, setHackathons] = useState([])

  const refreshData = useCallback(() => {
    setHackathons(getHackathons())
  }, [])

  useEffect(() => {
    refreshData()
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === null) refreshData()
    }
    window.addEventListener('prize_vault_hackathons_changed', refreshData)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('prize_vault_hackathons_changed', refreshData)
      window.removeEventListener('storage', onStorage)
    }
  }, [refreshData])

  useEffect(() => {
    if (hackathonId) setSelectedHackathon(hackathonId)
  }, [hackathonId])

  const myHackathons = useMemo(
    () => hackathons.filter((h) => hackathonBelongsToOrganizerPortal(h, sessionWallet)),
    [hackathons, sessionWallet],
  )

  const currentHack = hackathonId || selectedHackathon || myHackathons[0]?.id

  const currentHackathon = useMemo(
    () => hackathons.find((x) => x.id === currentHack),
    [hackathons, currentHack]
  )

  const participants = useMemo(() => {
    const list = currentHackathon?.participants || []
    if (!searchTerm) return list
    const s = searchTerm.toLowerCase()
    return list.filter(
      (p) =>
        p.name?.toLowerCase().includes(s) ||
        p.team?.toLowerCase().includes(s) ||
        p.track?.toLowerCase().includes(s) ||
        p.project?.toLowerCase().includes(s) ||
        p.payoutAddress?.toLowerCase().includes(s)
    )
  }, [currentHackathon, searchTerm])

  const handleStatusChange = (participantId, newStatus) => {
    const updated = hackathons.map((h) => {
      if (h.id !== currentHack) return h
      return {
        ...h,
        participants: (h.participants || []).map((p) =>
          p.id === participantId ? { ...p, status: newStatus } : p
        ),
      }
    })
    saveHackathons(updated)
    window.dispatchEvent(new CustomEvent('prize_vault_hackathons_changed'))
    broadcastHackathonsDatasetChanged()
    setHackathons(updated)
  }

  const getStatusBadge = (status) => {
    const map = {
      registered: { class: 'badge-pending', text: 'Registered' },
      shortlisted: { class: 'badge-verified', text: 'Shortlisted' },
      winner: { class: 'badge-issued', text: 'Winner' },
    }
    const b = map[status] || map.registered
    return <span className={`status-badge ${b.class}`}>{b.text}</span>
  }

  return (
    <div className="participant-manager">
      <div className="table-header">
        <h2>Participants</h2>
        <div className="table-header-actions">
          {myHackathons.length > 1 && (
            <select
              value={currentHack || ''}
              onChange={(e) => setSelectedHackathon(e.target.value)}
              className="filter-select"
            >
              <option value="">Select hackathon</option>
              {myHackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Search by name, team, track, or wallet..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {currentHackathon && (
        <div className="participant-summary" style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span className="muted">
            Total: <strong style={{ color: '#f1f5f9' }}>{currentHackathon.participants?.length || 0}</strong>
          </span>
          <span className="muted">
            Registered: <strong style={{ color: '#f59e0b' }}>{(currentHackathon.participants || []).filter((p) => p.status === 'registered').length}</strong>
          </span>
          <span className="muted">
            Shortlisted: <strong style={{ color: '#10b981' }}>{(currentHackathon.participants || []).filter((p) => p.status === 'shortlisted').length}</strong>
          </span>
          <span className="muted">
            Winners: <strong style={{ color: '#3b82f6' }}>{(currentHackathon.participants || []).filter((p) => p.status === 'winner').length}</strong>
          </span>
        </div>
      )}

      <div className="table-wrapper">
        <table className="student-table">
          <thead>
            <tr>
              <th>Name / Team</th>
              <th>Project</th>
              <th>Track</th>
              <th>Wallet Address</th>
              <th>Registration Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">
                  {currentHackathon
                    ? 'No participants registered yet. They will appear here once they register from the Holder Wallet.'
                    : 'Select a hackathon to view its participants.'}
                </td>
              </tr>
            ) : (
              participants.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    {p.team && <div className="muted">{p.team}</div>}
                  </td>
                  <td>{p.project || '-'}</td>
                  <td>{p.track || '-'}</td>
                  <td className="wallet-cell">
                    {p.payoutAddress && p.payoutAddress.length >= 10
                      ? <code title={p.payoutAddress} style={{ fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => { navigator.clipboard?.writeText(p.payoutAddress); }}>{p.payoutAddress.slice(0, 8)}…{p.payoutAddress.slice(-6)}</code>
                      : <span className="muted">-</span>}
                  </td>
                  <td>
                    {p.registeredAt
                      ? new Date(p.registeredAt).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>{getStatusBadge(p.status)}</td>
                  <td>
                    {p.status === 'registered' && (
                      <button
                        type="button"
                        className="btn-small"
                        onClick={() => handleStatusChange(p.id, 'shortlisted')}
                      >
                        Shortlist
                      </button>
                    )}
                    {p.status === 'shortlisted' && (
                      <button
                        type="button"
                        className="btn-small"
                        onClick={() => onNavigate?.('winners', currentHack)}
                      >
                        Mark Winner
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
