import React, { useState } from 'react'
import Icon from '../../components/Icon'
import { UserProfile, UserRole } from '../../types/holder'

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void
  /** Role chosen on the gate tabs — still stored on the profile. */
  role: Exclude<UserRole, null>
}

export default function ProfileForm({ onSubmit, role }: ProfileFormProps) {
  const [name, setName] = useState('')
  const [college, setCollege] = useState('')
  const [usn, setUsn] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const nameError = !name.trim() ? 'Enter your name.' : ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (nameError) return
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
        <div className="pv-gate__field">
          <span className="pv-gate__field-icon" aria-hidden>
            <Icon name="users" size={15} />
          </span>
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
        </div>
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
          <div className="pv-gate__field">
            <span className="pv-gate__field-icon" aria-hidden>
              <Icon name="grid" size={15} />
            </span>
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
        </div>
        <div className="pv-field">
          <label className="pv-field__label" htmlFor="profile-usn">
            USN
          </label>
          <div className="pv-gate__field">
            <span className="pv-gate__field-icon" aria-hidden>
              <Icon name="file" size={15} />
            </span>
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
      </div>

      <button type="submit" className="pv-btn pv-btn--primary pv-btn--lg pv-btn--block">
        Continue
        <Icon name="arrowRight" size={15} />
      </button>
    </form>
  )
}
