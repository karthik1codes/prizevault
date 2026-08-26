import React, { useState } from 'react'
import Icon from '../../components/Icon'
import AddressChip from '../../components/AddressChip'
import { formatXlm } from '../../utils/format'

export default function FundingPanel({
  selectedEscrow,
  onFund,
  fundingDestinationAddress,
  displaySenderAddress,
  onSyncOnChain,
  isFunding,
  fundingError,
}) {
  const [amount, setAmount] = useState('')

  if (!selectedEscrow) {
    return (
      <section className="pv-card">
        <div className="pv-card__header">
          <div>
            <h3 className="pv-card__title">Fund prize pool</h3>
            <p className="pv-card__subtitle">Pick an escrow to fund it</p>
          </div>
        </div>
        <div className="pv-empty">
          <span className="pv-empty__icon">
            <Icon name="send" size={20} />
          </span>
          <p className="pv-empty__text">Select a prize escrow to send XLM into its custody account.</p>
        </div>
      </section>
    )
  }

  const numeric = Number(amount)
  const canSubmit = !isFunding && amount !== '' && Number.isFinite(numeric) && numeric > 0

  return (
    <section className="pv-card">
      <div className="pv-card__header">
        <div>
          <h3 className="pv-card__title">Fund prize pool</h3>
          <p className="pv-card__subtitle">{selectedEscrow.name}</p>
        </div>
        <div className="pv-card__actions">
          <button type="button" className="pv-btn pv-btn--ghost pv-btn--sm" onClick={onSyncOnChain}>
            <Icon name="refresh" size={14} />
            Sync from chain
          </button>
        </div>
      </div>

      <div className="pv-card__body">
        <div className="pv-stat" style={{ marginBottom: 'var(--pv-space-7)' }}>
          <span className="pv-stat__label">
            <Icon name="wallet" size={12} />
            On-chain balance
          </span>
          <span className="pv-stat__value">
            {formatXlm(selectedEscrow.balanceAlgo)}
            <span className="pv-stat__unit">XLM</span>
          </span>
        </div>

        <dl className="pv-dl" style={{ marginBottom: 'var(--pv-space-7)' }}>
          <div className="pv-dl__item">
            <dt className="pv-dl__key">Destination (organizer custody)</dt>
            <dd className="pv-dl__val">
              <AddressChip
                address={fundingDestinationAddress}
                label="destination address"
                lead={8}
                tail={8}
              />
            </dd>
          </div>
          <div className="pv-dl__item">
            <dt className="pv-dl__key">Signing wallet (yours)</dt>
            <dd className="pv-dl__val">
              <AddressChip address={displaySenderAddress} label="your wallet" lead={8} tail={8} />
            </dd>
          </div>
        </dl>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSubmit) return
            onFund({ escrowId: selectedEscrow.id, amount })
            setAmount('')
          }}
        >
          <div className="pv-field">
            <label className="pv-field__label" htmlFor="fund-amount">
              Amount to send
            </label>
            <div className="pv-input-group">
              <input
                id="fund-amount"
                type="number"
                min="0"
                step="any"
                className="pv-input"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isFunding}
              />
              <span className="pv-input-group__affix">XLM</span>
            </div>
            <span className="pv-field__hint">
              Freighter will ask you to sign a real payment on Stellar testnet.
            </span>
          </div>

          <button
            type="submit"
            className="pv-btn pv-btn--primary"
            disabled={!canSubmit}
            style={{ marginTop: 'var(--pv-space-6)' }}
          >
            {isFunding ? (
              <>
                <span className="pv-btn__spinner" />
                Submitting on testnet
              </>
            ) : (
              <>
                <Icon name="send" size={15} />
                Fund escrow
              </>
            )}
          </button>
        </form>

        {fundingError ? (
          <div
            className="pv-alert pv-alert--danger"
            role="alert"
            aria-live="assertive"
            style={{ marginTop: 'var(--pv-space-7)' }}
          >
            <span className="pv-alert__icon">
              <Icon name="alert" size={16} />
            </span>
            <div className="pv-alert__content">
              <p className="pv-alert__title">Funding failed</p>
              <p className="pv-alert__text" style={{ overflowWrap: 'anywhere' }}>
                {fundingError}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
