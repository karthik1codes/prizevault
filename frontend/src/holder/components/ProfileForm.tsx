import React, { useState } from 'react'
import { UserProfile, UserRole } from '../../types/holder'

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'organizer', label: 'Organizer' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'participant', label: 'Participant' },
]

export default function ProfileForm({ onSubmit }: ProfileFormProps) {
  const [name, setName] = useState('')
  const [college, setCollege] = useState('')
  const [usn, setUsn] = useState('')
  const [role, setRole] = useState<UserRole>(null)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Name is required.')
      return
    }
    if (!role) {
      setError('Please select your role (Organizer, Sponsor, or Participant).')
      return
    }
    onSubmit({
      name: trimmedName,
      college: college.trim() || undefined,
      usn: usn.trim() || undefined,
      role,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <div className="field">
        <span>Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          autoComplete="name"
          maxLength={120}
        />
      </div>
      <div className="field">
        <span>College (optional)</span>
        <input
          type="text"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          placeholder="College or institution name"
          autoComplete="organization"
          maxLength={120}
        />
      </div>
      <div className="field">
        <span>USN (optional)</span>
        <input
          type="text"
          value={usn}
          onChange={(e) => setUsn(e.target.value)}
          placeholder="University Seat Number"
          autoComplete="off"
          maxLength={40}
        />
      </div>
      <div className="field">
        <span>I am a</span>
        <div className="role-options">
          {ROLES.map((r) => (
            <label key={r.value} className="radio-label">
              <input
                type="radio"
                name="role"
                checked={role === r.value}
                onChange={() => setRole(r.value)}
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="button-row">
        <button type="submit" className="button primary">
          Continue
        </button>
      </div>
    </form>
  )
}
