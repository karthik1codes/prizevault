import React, { useState } from 'react'
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from '../../constants/escrow'

const STORAGE_KEY = 'prize_vault_hackathons'

function getStoredHackathons() {
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

export default function CreateHackathonForm({ userWallet, onSave, onCancel }) {
  const defaultAddress = userWallet || DEFAULT_ORGANIZER_ESCROW_ADDRESS
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [prizeTotal, setPrizeTotal] = useState('')
  const [prizeCurrency, setPrizeCurrency] = useState('ALGO')
  const [description, setDescription] = useState('')
  const [escrowAddress, setEscrowAddress] = useState(defaultAddress)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Name is required.')
      return
    }
    if (!startDate) {
      setError('Start date is required.')
      return
    }
    if (!endDate) {
      setError('End date is required.')
      return
    }
    const total = parseFloat(prizeTotal)
    if (prizeTotal === '' || isNaN(total) || total < 0) {
      setError('Please enter a valid prize pool amount.')
      return
    }
    const organizerEscrow = (escrowAddress || defaultAddress).trim()
    if (!organizerEscrow) {
      setError('Organizer / escrow address is required.')
      return
    }

    const newHackathon = {
      id: `hack_${Date.now()}`,
      name: trimmedName,
      startDate,
      endDate,
      prizePool: { total, currency: prizeCurrency || 'ALGO', locked: true },
      organizerAddress: organizerEscrow,
      sponsorAddress: '',
      escrowAddress: organizerEscrow,
      status: 'upcoming',
      participantCount: 0,
      participants: [],
      winnersSelected: false,
      payoutProposed: false,
      description: description.trim() || undefined,
    }

    const existing = getStoredHackathons()
    saveHackathons([...existing, newHackathon])
    onSave?.()
  }

  return (
    <div className="create-hackathon-form">
      <div className="form-header">
        <h2>Create Hackathon</h2>
        <p className="muted">Add a new hackathon. Prize pool and escrow use the default organizer address.</p>
      </div>
      <form onSubmit={handleSubmit} className="panel">
        <div className="field">
          <label htmlFor="create-hack-name">Name (required)</label>
          <input
            id="create-hack-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. RIFT '26"
            maxLength={120}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="create-hack-start">Start date (required)</label>
            <input
              id="create-hack-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="create-hack-end">End date (required)</label>
            <input
              id="create-hack-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="create-hack-prize-total">Prize pool total</label>
            <input
              id="create-hack-prize-total"
              type="number"
              min="0"
              step="1"
              value={prizeTotal}
              onChange={(e) => setPrizeTotal(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label htmlFor="create-hack-prize-currency">Currency</label>
            <select
              id="create-hack-prize-currency"
              value={prizeCurrency}
              onChange={(e) => setPrizeCurrency(e.target.value)}
            >
              <option value="ALGO">ALGO</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="create-hack-desc">Description (optional)</label>
          <textarea
            id="create-hack-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of the hackathon"
            rows={3}
            maxLength={500}
          />
        </div>
        <div className="field">
          <label htmlFor="create-hack-escrow">Organizer / escrow address</label>
          <input
            id="create-hack-escrow"
            type="text"
            value={escrowAddress}
            onChange={(e) => setEscrowAddress(e.target.value)}
            placeholder={defaultAddress}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="button-row">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create Hackathon
          </button>
        </div>
      </form>
    </div>
  )
}
