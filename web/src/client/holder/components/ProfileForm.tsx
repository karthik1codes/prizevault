import React, { useState } from 'react'
import Icon from '../../components/Icon'
import { UserProfile, UserRole } from '../../types/holder'

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void
}

const ROLES: { value: Exclude<UserRole, null>; label: string; desc: string; icon: string }[] = [
  {
    value: 'participant',
    label: 'Participant',
    desc: 'Register for events and receive prize payouts',
    icon: 'users',
  },
  {
    value: 'organizer',
    label: 'Organizer',
    desc: 'Run events, pick winners, propose payouts',
    icon: 'calendar',
  },
  {
    value: 'sponsor',
    label: 'Sponsor',
    desc: 'Fund prize pools and co-approve releases',
    icon: 'wallet',
  },
]

export default function ProfileForm({ onSubmit }: ProfileFormProps) {
  const [name, setName] = useState('')
  const [college, setCollege] = useState('')
  const [usn, setUsn] = useState('')
  const [role, setRole] = useState<UserRole>(null)
  const [submitted, setSubmitted] = useState(false)

  const nameError = !name.trim() ? 'Enter your name.' : ''
  const roleError = !role ? 'Choose how you are taking part.' : ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (nameError || roleError || !role) return
    onSubmit({
      name: name.trim(),
      college: college.trim() || undefined,
      usn: usn.trim() || undefined,
      role,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="pv-form-stack" noValidate>
      <div className="pv-field">
        <label className="pv-field__label" htmlFor="profile-name">
          Name <span className="pv-field__required">*</span>
        </label>
        <input
          id="profile-name"
          type="text"
          className="pv-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          autoComplete="name"
          maxLength={120}
          aria-invalid={submitted && nameError ? 'true' : undefined}
          aria-describedby={submitted && nameError ? 'err-profile-name' : undefined}
        />
        {submitted && nameError ? (
          <span className="pv-field__error" id="err-profile-name" role="alert">
            <Icon name="alert" size={12} />
            {nameError}
          </span>
        ) : null}
      </div>

      <div className="pv-form-grid">
        <div className="pv-field">
          <label className="pv-field__label" htmlFor="profile-college">
            College or organization
          </label>
          <input
            id="profile-college"
            type="text"
            className="pv-input"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="Optional"
            autoComplete="organization"
            maxLength={120}
          />
        </div>
        <div className="pv-field">
          <label className="pv-field__label" htmlFor="profile-usn">
            USN
          </label>
          <input
            id="profile-usn"
            type="text"
            className="pv-input"
            value={usn}
            onChange={(e) => setUsn(e.target.value)}
            placeholder="Optional"
            autoComplete="off"
            maxLength={40}
          />
        </div>
      </div>

      <fieldset className="pv-field">
        <legend className="pv-field__label" style={{ marginBottom: 'var(--pv-space-4)' }}>
          I am a <span className="pv-field__required">*</span>
        </legend>
        <div className="pv-stack pv-stack--sm">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className="pv-check"
              style={{
                padding: 'var(--pv-space-5) var(--pv-space-6)',
                border: `1px solid ${role === r.value ? 'var(--pv-accent-fill)' : 'var(--pv-border)'}`,
                borderRadius: 'var(--pv-radius-md)',
                background: role === r.value ? 'var(--pv-accent-soft)' : 'var(--pv-surface)',
                alignItems: 'center',
              }}
            >
              <input
                type="radio"
                name="role"
                checked={role === r.value}
                onChange={() => setRole(r.value)}
              />
              <span className="pv-check__text">
                <span style={{ fontWeight: 'var(--pv-weight-semibold)' }}>{r.label}</span>
                <span className="pv-check__desc">{r.desc}</span>
              </span>
              <span style={{ marginLeft: 'auto', color: 'var(--pv-text-muted)' }}>
                <Icon name={r.icon} size={16} />
              </span>
            </label>
          ))}
        </div>
        {submitted && roleError ? (
          <span className="pv-field__error" role="alert" style={{ marginTop: 'var(--pv-space-4)' }}>
            <Icon name="alert" size={12} />
            {roleError}
          </span>
        ) : null}
      </fieldset>

      <button type="submit" className="pv-btn pv-btn--primary pv-btn--lg pv-btn--block">
        Continue
        <Icon name="arrowRight" size={15} />
      </button>
    </form>
  )
}
