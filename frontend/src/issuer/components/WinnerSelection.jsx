import React, { useState, useMemo } from 'react'

const STORAGE_KEY = 'prize_vault_hackathons'

function getHackathons() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (_) {}
  return []
}

const PRIZE_TIERS = [
  { value: '1st', label: '1st Place' },
  { value: '2nd', label: '2nd Place' },
  { value: '3rd', label: '3rd Place' },
  { value: 'special', label: 'Special Prize' },
]

export default function WinnerSelection({ hackathonId, userWallet, onSave }) {
  const [winners, setWinners] = useState({})
  const [saved, setSaved] = useState(false)

  const hackathons = useMemo(() => getHackathons(), [])
  const myHackathons = hackathons.filter(
    (h) => h.organizerAddress?.toLowerCase() === userWallet?.toLowerCase()
  )
  const hackathon = hackathonId
    ? hackathons.find((h) => h.id === hackathonId)
    : myHackathons[0]
  const participants = hackathon?.participants || []

  const handleToggleWinner = (id, checked) => {
    if (!checked) {
      setWinners((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      return
    }
    const participant = participants.find((x) => x.id === id)
    const existingPayoutAddress = participant?.payoutAddress || ''
    setWinners((prev) => ({
      ...prev,
      [id]: prev[id] || {
        prizeTier: '',
        payoutAddress: existingPayoutAddress,
        prizeAmount: 0,
      },
    }))
  }

  const handleUpdateWinner = (id, field, value) => {
    setWinners((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }))
  }

  const handleSave = () => {
    const winnerList = Object.entries(winners).map(([participantId, data]) => {
      const p = participants.find((x) => x.id === participantId)
      return {
        id: participantId,
        name: p?.name,
        team: p?.team,
        prizeTier: data.prizeTier,
        payoutAddress: data.payoutAddress,
        prizeAmount: Number(data.prizeAmount) || 0,
      }
    })

    try {
      const stored = getHackathons()
      const updated = stored.map((h) =>
        h.id === hackathon?.id
          ? { ...h, winners: winnerList, winnersSelected: winnerList.length > 0 }
          : h
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setSaved(true)
      onSave?.()
    } catch (_) {}
  }

  return (
    <div className="winner-selection">
      <div className="table-header">
        <h2>Select Winners</h2>
        {hackathon && <span className="muted">{hackathon.name}</span>}
      </div>

      {myHackathons.length > 1 && !hackathonId && (
        <select
          className="filter-select"
          value={hackathon?.id || ''}
          onChange={() => {}}
        >
          {myHackathons.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      )}

      <div className="table-wrapper">
        <table className="student-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Name / Team</th>
              <th>Project</th>
              <th>Prize Tier</th>
              <th>Payout Address</th>
              <th>Prize (XLM)</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={!!winners[p.id]}
                    onChange={(e) => handleToggleWinner(p.id, e.target.checked)}
                  />
                </td>
                <td>
                  <strong>{p.name}</strong>
                  {p.team && <div className="muted">{p.team}</div>}
                </td>
                <td>{p.project || '-'}</td>
                <td>
                  {winners[p.id] && (
                    <select
                      value={winners[p.id]?.prizeTier || ''}
                      onChange={(e) =>
                        handleUpdateWinner(p.id, 'prizeTier', e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      {PRIZE_TIERS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  {winners[p.id] && (
                    <input
                      type="text"
                      placeholder="Stellar address (G...)"
                      value={winners[p.id]?.payoutAddress || ''}
                      onChange={(e) =>
                        handleUpdateWinner(p.id, 'payoutAddress', e.target.value)
                      }
                      className="input-inline"
                    />
                  )}
                </td>
                <td>
                  {winners[p.id] && (
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={winners[p.id]?.prizeAmount || ''}
                      onChange={(e) =>
                        handleUpdateWinner(
                          p.id,
                          'prizeAmount',
                          e.target.value
                        )
                      }
                      className="input-inline input-number"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="winner-actions">
        <button type="button" className="btn-primary" onClick={handleSave}>
          Save Winners
        </button>
        {saved && <span className="success-message">Winners saved</span>}
      </div>
    </div>
  )
}
