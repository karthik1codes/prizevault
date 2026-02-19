import React, { useState, useMemo, useEffect } from 'react'

const STORAGE_KEY = 'prize_vault_hackathons'

function getHackathons() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (_) {}
  return []
}

const MOCK_PARTICIPANTS = [
  { id: 'p1', name: 'Aria Fernandez', team: 'Team Alpha', project: 'AI Dashboard', track: 'AI/ML', registeredAt: '2026-02-15', status: 'registered' },
  { id: 'p2', name: 'Malik Osei', team: 'DevNinjas', project: 'Blockchain Explorer', track: 'Web3', registeredAt: '2026-02-16', status: 'shortlisted' },
  { id: 'p3', name: 'Jia Li', team: 'CodeCraft', project: 'Health App', track: 'Health Tech', registeredAt: '2026-02-17', status: 'winner' },
  { id: 'p4', name: 'Emma Watson', team: 'Innovators', project: 'EdTech Platform', track: 'Education', registeredAt: '2026-02-18', status: 'registered' },
]

export default function ParticipantManager({ hackathonId, userWallet, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedHackathon, setSelectedHackathon] = useState(hackathonId || null)

  const hackathons = useMemo(() => getHackathons(), [])
  const myHackathons = hackathons.filter(
    (h) => h.organizerAddress?.toLowerCase() === userWallet?.toLowerCase()
  )
  const currentHack = hackathonId || selectedHackathon || myHackathons[0]?.id

  useEffect(() => {
    if (hackathonId) setSelectedHackathon(hackathonId)
  }, [hackathonId])

  const participants = useMemo(() => {
    if (!currentHack) return []
    const h = hackathons.find((x) => x.id === currentHack)
    return (h?.participants || MOCK_PARTICIPANTS).filter((p) => {
      const s = searchTerm.toLowerCase()
      return (
        !s ||
        p.name?.toLowerCase().includes(s) ||
        p.team?.toLowerCase().includes(s) ||
        p.track?.toLowerCase().includes(s) ||
        p.project?.toLowerCase().includes(s)
      )
    })
  }, [currentHack, hackathons, searchTerm])

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
            placeholder="Search by name, team, or track..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="student-table">
          <thead>
            <tr>
              <th>Name / Team</th>
              <th>Project</th>
              <th>Track</th>
              <th>Registration Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  No participants found
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
                        onClick={() => {}}
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
