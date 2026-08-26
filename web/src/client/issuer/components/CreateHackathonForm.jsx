import React, { useState } from 'react'
import Icon from '../../components/Icon'
import AddressChip from '../../components/AddressChip'
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from '../../constants/escrow'
import { broadcastHackathonsDatasetChanged } from '../../utils/hackathonSync'
import { appendIssuerAuditLog } from '../../utils/issuerAuditLog'

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
    return true
  } catch (_) {
    return false
  }
}

/** Field-level errors so each message renders next to the input it belongs to. */
function validate({ name, startDate, endDate, prizeTotal }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Give the event a name.'
  if (!startDate) errors.startDate = 'Pick a start date.'
  if (!endDate) errors.endDate = 'Pick an end date.'
  if (startDate && endDate && endDate < startDate) {
    errors.endDate = 'End date cannot be before the start date.'
  }
  const total = parseFloat(prizeTotal)
  if (prizeTotal === '' || Number.isNaN(total) || total < 0) {
    errors.prizeTotal = 'Enter a prize pool of 0 or more.'
  }
  return errors
}

export default function CreateHackathonForm({ userWallet: _userWallet, onSave, onCancel }) {
  /** Locked to the organizer/escrow destination -- never the connected wallet. */
  const organizerEscrowAddress = DEFAULT_ORGANIZER_ESCROW_ADDRESS

  const [values, setValues] = useState({
    name: '',
    startDate: '',
    endDate: '',
    prizeTotal: '',
    prizeCurrency: 'XLM',
    description: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [saveError, setSaveError] = useState('')

  const set = (field) => (e) => {
    const value = e.target.value
    setValues((prev) => ({ ...prev, [field]: value }))
    if (submitted) {
      setErrors(validate({ ...values, [field]: value }))
    }
  }

  const showError = (field) => (submitted && errors[field] ? errors[field] : '')

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setSaveError('')

    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const organizerEscrow = organizerEscrowAddress.trim()
    const newHackathon = {
      id: `hack_${Date.now()}`,
      name: values.name.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      prizePool: {
        total: parseFloat(values.prizeTotal),
        currency: values.prizeCurrency || 'XLM',
        locked: true,
      },
      organizerAddress: organizerEscrow,
      sponsorAddress: '',
      escrowAddress: organizerEscrow,
      status: 'upcoming',
      participantCount: 0,
      participants: [],
      winnersSelected: false,
      payoutProposed: false,
      description: values.description.trim() || undefined,
    }

    const ok = saveHackathons([...getStoredHackathons(), newHackathon])
    if (!ok) {
      setSaveError('Could not save. Browser storage may be full or blocked.')
      return
    }

    window.dispatchEvent(new CustomEvent('prize_vault_hackathons_changed'))
    broadcastHackathonsDatasetChanged()
    appendIssuerAuditLog({
      action: 'create',
      hackathonId: newHackathon.id,
      details: `Created hackathon ${newHackathon.name} with a ${newHackathon.prizePool.total} ${newHackathon.prizePool.currency} prize pool.`,
    })
    onSave?.(newHackathon.id)
  }

  const errorCount = submitted ? Object.keys(errors).length : 0

  return (
    <form className="pv-card" onSubmit={handleSubmit} noValidate>
      <div className="pv-card__header">
        <div>
          <h3 className="pv-card__title">Event details</h3>
          <p className="pv-card__subtitle">
            Prize pool and escrow both use the organizer address below.
          </p>
        </div>
      </div>

      <div className="pv-card__body">
        <div className="pv-form-stack">
          <div className="pv-field">
            <label className="pv-field__label" htmlFor="create-hack-name">
              Event name <span className="pv-field__required">*</span>
            </label>
            <input
              id="create-hack-name"
              type="text"
              className="pv-input"
              value={values.name}
              onChange={set('name')}
              placeholder="e.g. Cepheus 2026"
              maxLength={120}
              aria-invalid={showError('name') ? 'true' : undefined}
              aria-describedby={showError('name') ? 'err-name' : undefined}
            />
            {showError('name') ? (
              <span className="pv-field__error" id="err-name" role="alert">
                <Icon name="alert" size={12} />
                {showError('name')}
              </span>
            ) : null}
          </div>

          <div className="pv-form-grid">
            <div className="pv-field">
              <label className="pv-field__label" htmlFor="create-hack-start">
                Start date <span className="pv-field__required">*</span>
              </label>
              <input
                id="create-hack-start"
                type="date"
                className="pv-input"
                value={values.startDate}
                onChange={set('startDate')}
                aria-invalid={showError('startDate') ? 'true' : undefined}
                aria-describedby={showError('startDate') ? 'err-start' : undefined}
              />
              {showError('startDate') ? (
                <span className="pv-field__error" id="err-start" role="alert">
                  <Icon name="alert" size={12} />
                  {showError('startDate')}
                </span>
              ) : null}
            </div>

            <div className="pv-field">
              <label className="pv-field__label" htmlFor="create-hack-end">
                End date <span className="pv-field__required">*</span>
              </label>
              <input
                id="create-hack-end"
                type="date"
                className="pv-input"
                value={values.endDate}
                min={values.startDate || undefined}
                onChange={set('endDate')}
                aria-invalid={showError('endDate') ? 'true' : undefined}
                aria-describedby={showError('endDate') ? 'err-end' : undefined}
              />
              {showError('endDate') ? (
                <span className="pv-field__error" id="err-end" role="alert">
                  <Icon name="alert" size={12} />
                  {showError('endDate')}
                </span>
              ) : null}
            </div>
          </div>

          <div className="pv-form-grid">
            <div className="pv-field">
              <label className="pv-field__label" htmlFor="create-hack-prize-total">
                Prize pool <span className="pv-field__required">*</span>
              </label>
              <div className="pv-input-group">
                <input
                  id="create-hack-prize-total"
                  type="number"
                  min="0"
                  step="any"
                  className="pv-input"
                  value={values.prizeTotal}
                  onChange={set('prizeTotal')}
                  placeholder="0"
                  aria-invalid={showError('prizeTotal') ? 'true' : undefined}
                  aria-describedby={showError('prizeTotal') ? 'err-prize' : undefined}
                />
                <span className="pv-input-group__affix">{values.prizeCurrency}</span>
              </div>
              {showError('prizeTotal') ? (
                <span className="pv-field__error" id="err-prize" role="alert">
                  <Icon name="alert" size={12} />
                  {showError('prizeTotal')}
                </span>
              ) : (
                <span className="pv-field__hint">
                  Total across all prize tiers. You assign per-winner amounts later.
                </span>
              )}
            </div>

            <div className="pv-field">
              <label className="pv-field__label" htmlFor="create-hack-prize-currency">
                Currency
              </label>
              <select
                id="create-hack-prize-currency"
                className="pv-select"
                value={values.prizeCurrency}
                onChange={set('prizeCurrency')}
              >
                <option value="XLM">XLM</option>
              </select>
              <span className="pv-field__hint">Only native XLM is supported today.</span>
            </div>
          </div>

          <div className="pv-field">
            <label className="pv-field__label" htmlFor="create-hack-desc">
              Description
            </label>
            <textarea
              id="create-hack-desc"
              className="pv-textarea"
              value={values.description}
              onChange={set('description')}
              placeholder="One or two lines that participants will see on the event card."
              rows={3}
              maxLength={500}
            />
            <span className="pv-field__hint">
              {values.description.length}/500 characters
            </span>
          </div>

          <div className="pv-field">
            <span className="pv-field__label">Organizer / escrow address</span>
            <div>
              <AddressChip
                address={organizerEscrowAddress}
                label="organizer escrow address"
                full
              />
            </div>
            <span className="pv-field__hint">
              Locked to the organizer wallet so a sponsor cannot accidentally fund their own
              account.
            </span>
          </div>
        </div>
      </div>

      {errorCount > 0 || saveError ? (
        <div
          className="pv-alert pv-alert--danger"
          role="alert"
          aria-live="polite"
          style={{ margin: '0 var(--pv-space-7) var(--pv-space-7)' }}
        >
          <span className="pv-alert__icon">
            <Icon name="alert" size={16} />
          </span>
          <div className="pv-alert__content">
            <p className="pv-alert__title">
              {saveError
                ? 'Could not create the event'
                : `Fix ${errorCount} field${errorCount === 1 ? '' : 's'} to continue`}
            </p>
            {saveError ? <p className="pv-alert__text">{saveError}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="pv-card__footer">
        <button type="button" className="pv-btn pv-btn--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="pv-btn pv-btn--primary">
          <Icon name="plus" size={15} />
          Create hackathon
        </button>
      </div>
    </form>
  )
}
