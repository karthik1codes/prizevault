import React, { useMemo, useState } from 'react'
import { requestAccess, signTransaction } from '@stellar/freighter-api'
import {
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  Operation,
  Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk'
import Icon from '../../components/Icon'
import AddressChip from '../../components/AddressChip'
import { savePayoutProposals } from '../../utils/payoutProposalsStorage'
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from '../../constants/escrow'
import { hackathonBelongsToOrganizerPortal } from '../../utils/organizerPortalFilter'
import { broadcastHackathonsDatasetChanged } from '../../utils/hackathonSync'
import { appendIssuerAuditLog } from '../../utils/issuerAuditLog'
import { useHackathons, usePayoutProposals } from '../../hooks/useHackathons'
import { formatDate, formatXlm, stellarTxUrl } from '../../utils/format'

const STORAGE_KEY = 'prize_vault_hackathons'
const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const STELLAR_SERVER = new Horizon.Server(HORIZON_URL)

function getHackathons() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (_) {}
  return []
}

function formatStellarSubmitError(error) {
  if (!(error instanceof Error)) return 'Failed to execute payout on testnet.'
  const data = error?.response?.data
  const codes = data?.extras?.result_codes
  if (codes) {
    const txCode = codes.transaction_result_code || codes.transaction
    const opCodes = codes.operations || codes.operation_result_codes
    const detail = [txCode, opCodes ? JSON.stringify(opCodes) : ''].filter(Boolean).join(' - ')
    return detail ? `${error.message} (${detail})` : error.message
  }
  return error.message
}

function winnersTotal(proposal) {
  return (proposal.winners || []).reduce((s, w) => s + (Number(w.prizeAmount) || 0), 0)
}

/** propose -> approve -> execute, so the 2-of-2 cycle is legible at a glance. */
function ProposalSteps({ proposal }) {
  const steps = [
    { label: 'Proposed', done: !!proposal.organizerApproved },
    { label: 'Sponsor approved', done: !!proposal.sponsorApproved },
    { label: 'Released', done: proposal.status === 'executed' },
  ]
  const currentIndex = steps.findIndex((s) => !s.done)

  return (
    <ol className="pv-steps">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className={`pv-step ${step.done ? 'is-done' : i === currentIndex ? 'is-current' : ''}`.trim()}
        >
          <span className="pv-step__marker">
            {step.done ? <Icon name="check" size={12} /> : i + 1}
          </span>
          <span className="pv-step__label">{step.label}</span>
          {i < steps.length - 1 ? <span className="pv-step__line" /> : null}
        </li>
      ))}
    </ol>
  )
}

export default function PayoutProposal({ hackathonId, sessionWallet, onExecute }) {
  const { hackathons } = useHackathons()
  const { proposals, reload: reloadProposals } = usePayoutProposals()
  const [isExecutingId, setIsExecutingId] = useState(null)
  const [executeError, setExecuteError] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const myHackathons = useMemo(
    () => hackathons.filter((h) => hackathonBelongsToOrganizerPortal(h, sessionWallet)),
    [hackathons, sessionWallet],
  )

  const eligible = myHackathons.filter((h) => h.winnersSelected && h.winners?.length > 0)
  const readyToPropose = eligible.filter(
    (h) => !h.payoutProposed && !proposals.some((p) => p.hackathonId === h.id),
  )
  const displayProposals = proposals.filter((p) =>
    myHackathons.some((h) => h.id === p.hackathonId),
  )

  const handleCreateProposal = (h) => {
    const now = new Date().toISOString()
    const proposal = {
      id: `prop_${h.id}_${Date.now()}`,
      hackathonId: h.id,
      hackathonName: h.name,
      createdAt: now,
      status: 'awaiting_sponsor',
      organizerApproved: true,
      sponsorApproved: false,
      winners: h.winners || [],
      eventEndDate: h.endDate,
    }
    savePayoutProposals([proposal, ...proposals])

    try {
      const stored = getHackathons()
      const updatedHackathons = stored.map((x) =>
        x.id === h.id ? { ...x, payoutProposed: true } : x,
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHackathons))
      window.dispatchEvent(new CustomEvent('prize_vault_hackathons_changed'))
      broadcastHackathonsDatasetChanged()
      appendIssuerAuditLog({
        action: 'create_payout',
        hackathonId: h.id,
        details: `Payout proposal created for ${h.name} covering ${h.winners?.length || 0} winner(s).`,
        wallet: sessionWallet,
      })
    } catch (_) {}
    reloadProposals()
  }

  const handleExecutePayout = async (proposal) => {
    setExecuteError('')
    setIsExecutingId(proposal.id)
    try {
      const hackathonsNow = getHackathons()
      const hack = hackathonsNow.find((h) => h.id === proposal.hackathonId)
      if (!hack) {
        throw new Error('Hackathon not found for this payout proposal.')
      }

      /** Organizer dashboard: prizes always send from the hackathon organizer account -> winners (sponsor only approves). */
      const organizerPayoutSource = (
        (hack.organizerAddress || '').trim() || DEFAULT_ORGANIZER_ESCROW_ADDRESS
      ).trim()
      if (!organizerPayoutSource) {
        throw new Error('Hackathon is missing organizerAddress for payout.')
      }

      const access = await requestAccess()
      if (access.error) {
        throw new Error(access.error)
      }

      /** Always debit the organizer prize account; Freighter signs via `address` (may differ from UI-selected key). */
      const payoutSourceAddress = organizerPayoutSource

      const winners = (proposal.winners || [])
        .filter((w) => w?.payoutAddress && Number(w?.prizeAmount || 0) > 0)
        .map((w) => ({
          payoutAddress: w.payoutAddress.trim(),
          prizeAmount: Number(w.prizeAmount || 0),
        }))

      if (!winners.length) {
        throw new Error('No valid winners with payout amounts found.')
      }

      const sourceAccount = await STELLAR_SERVER.loadAccount(payoutSourceAddress)
      const fee = await STELLAR_SERVER.fetchBaseFee().catch(() => BASE_FEE)
      const builder = new TransactionBuilder(sourceAccount, {
        fee: String(fee || BASE_FEE),
        networkPassphrase: Networks.TESTNET,
      })

      winners.forEach((winner) => {
        builder.addOperation(
          Operation.payment({
            destination: winner.payoutAddress,
            asset: Asset.native(),
            amount: Number(winner.prizeAmount).toFixed(7).replace(/\.?0+$/, ''),
          }),
        )
      })

      const tx = builder.setTimeout(180).build()
      const signed = await signTransaction(tx.toXDR(), {
        networkPassphrase: Networks.TESTNET,
        network: 'TESTNET',
        address: payoutSourceAddress,
      })

      if (signed.error || !signed.signedTxXdr) {
        throw new Error(signed.error || 'Failed to sign payout transaction in Freighter.')
      }

      const signedTx = new Transaction(signed.signedTxXdr, Networks.TESTNET)
      const submitResult = await STELLAR_SERVER.submitTransaction(signedTx)

      const updated = proposals.map((p) =>
        p.id === proposal.id
          ? {
              ...p,
              status: 'executed',
              txHash: submitResult.hash,
              executedAt: new Date().toISOString(),
            }
          : p,
      )
      savePayoutProposals(updated)
      reloadProposals()
      appendIssuerAuditLog({
        action: 'execute',
        hackathonId: proposal.hackathonId,
        txHash: submitResult.hash,
        details: `Payout executed for ${proposal.hackathonName}; ${winners.length} winner(s) paid.`,
        wallet: sessionWallet,
      })
      onExecute?.(proposal)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Execute payout failed', error)
      setExecuteError(formatStellarSubmitError(error))
    } finally {
      setIsExecutingId(null)
    }
  }

  /** Winners JSON for the Stellar release script. Prize amounts in XLM. */
  const getReleaseAppWinnersJson = (p) => {
    const winners = (p.winners || []).filter((w) => w.payoutAddress && (w.prizeAmount || 0) > 0)
    return JSON.stringify(
      winners.map((w) => ({
        address: w.payoutAddress.trim(),
        amountXlm: Number(w.prizeAmount || 0),
      })),
    )
  }

  const copyJson = (p) => {
    navigator.clipboard?.writeText(getReleaseAppWinnersJson(p))
    setCopiedId(p.id)
    window.setTimeout(() => setCopiedId(null), 1800)
  }

  const statusBadge = (p) => {
    if (p.status === 'executed') {
      return (
        <span className="pv-badge pv-badge--success">
          <Icon name="check" size={12} />
          Released
        </span>
      )
    }
    if (p.organizerApproved && p.sponsorApproved) {
      return <span className="pv-badge pv-badge--accent">Both approved</span>
    }
    return <span className="pv-badge pv-badge--warning">Awaiting sponsor</span>
  }

  return (
    <div className="pv-stack pv-stack--lg">
      {readyToPropose.length > 0 ? (
        <section className="pv-card">
          <div className="pv-card__header">
            <div>
              <h3 className="pv-card__title">Ready to propose</h3>
              <p className="pv-card__subtitle">
                Winners are chosen. Proposing sends it to the sponsor for co-approval.
              </p>
            </div>
          </div>
          <div className="pv-card__body pv-card__body--flush">
            {readyToPropose.map((h) => (
              <div
                className="pv-row pv-row--between"
                key={h.id}
                style={{
                  padding: 'var(--pv-space-6) var(--pv-space-7)',
                  borderBottom: '1px solid var(--pv-border-subtle)',
                }}
              >
                <div>
                  <span className="pv-table__primary">{h.name}</span>
                  <span className="pv-table__sub">
                    Ended {formatDate(h.endDate)} &middot; {h.winners?.length || 0} winner
                    {h.winners?.length === 1 ? '' : 's'} &middot;{' '}
                    {formatXlm((h.winners || []).reduce((s, w) => s + (Number(w.prizeAmount) || 0), 0))}{' '}
                    XLM
                  </span>
                </div>
                <button
                  type="button"
                  className="pv-btn pv-btn--primary pv-btn--sm"
                  onClick={() => handleCreateProposal(h)}
                >
                  <Icon name="send" size={14} />
                  Create proposal
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {executeError ? (
        <div className="pv-alert pv-alert--danger" role="alert" aria-live="assertive">
          <span className="pv-alert__icon">
            <Icon name="alert" size={16} />
          </span>
          <div className="pv-alert__content">
            <p className="pv-alert__title">Payout failed</p>
            <p className="pv-alert__text" style={{ overflowWrap: 'anywhere' }}>
              {executeError}
            </p>
          </div>
          <button
            type="button"
            className="pv-btn pv-btn--ghost pv-btn--xs pv-btn--icon"
            onClick={() => setExecuteError('')}
            aria-label="Dismiss error"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ) : null}

      <section className="pv-stack">
        {displayProposals.length === 0 ? (
          <div className="pv-card">
            <div className="pv-empty">
              <span className="pv-empty__icon">
                <Icon name="send" size={20} />
              </span>
              <h3 className="pv-empty__title">No payout proposals yet</h3>
              <p className="pv-empty__text">
                {eligible.length === 0
                  ? 'Select winners for a completed event first, then propose the payout here.'
                  : 'Use "Create proposal" above to send a payout to the sponsor for approval.'}
              </p>
            </div>
          </div>
        ) : (
          displayProposals.map((p) => {
            const hackForProposal = hackathons.find((h) => h.id === p.hackathonId)
            const organizerHint =
              (hackForProposal?.organizerAddress || '').trim() || DEFAULT_ORGANIZER_ESCROW_ADDRESS
            const bothApproved = p.organizerApproved && p.sponsorApproved
            const total = winnersTotal(p)

            return (
              <article className="pv-card" key={p.id}>
                <div className="pv-card__header">
                  <div>
                    <h3 className="pv-card__title">{p.hackathonName}</h3>
                    <p className="pv-card__subtitle">
                      Event ended {formatDate(p.eventEndDate)} &middot; proposed{' '}
                      {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <div className="pv-card__actions">{statusBadge(p)}</div>
                </div>

                <div className="pv-card__body">
                  <ProposalSteps proposal={p} />

                  <div className="pv-table-wrap" style={{ marginTop: 'var(--pv-space-8)' }}>
                    <table className="pv-table">
                      <thead>
                        <tr>
                          <th scope="col">Winner</th>
                          <th scope="col">Tier</th>
                          <th scope="col">Payout address</th>
                          <th scope="col" className="pv-table__num">
                            Amount (XLM)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(p.winners || []).map((w, i) => (
                          <tr key={`${p.id}-${w.id || i}`}>
                            <td>
                              <span className="pv-table__primary">{w.name || 'Winner'}</span>
                              {w.team ? <span className="pv-table__sub">{w.team}</span> : null}
                            </td>
                            <td>
                              <span className="pv-badge">{w.prizeTier || '--'}</span>
                            </td>
                            <td>
                              <AddressChip address={w.payoutAddress} label="payout address" />
                            </td>
                            <td className="pv-table__num">{formatXlm(w.prizeAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} style={{ fontWeight: 'var(--pv-weight-semibold)' }}>
                            Total
                          </td>
                          <td
                            className="pv-table__num"
                            style={{ fontWeight: 'var(--pv-weight-semibold)' }}
                          >
                            {formatXlm(total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {bothApproved && p.status !== 'executed' ? (
                    <div className="pv-alert pv-alert--accent" style={{ marginTop: 'var(--pv-space-8)' }}>
                      <span className="pv-alert__icon">
                        <Icon name="info" size={16} />
                      </span>
                      <div className="pv-alert__content">
                        <p className="pv-alert__title">Both approvals complete</p>
                        <p className="pv-alert__text">
                          Executing debits the organizer prize account and pays every winner in one
                          transaction. Freighter will ask you to sign for{' '}
                          <AddressChip address={organizerHint} label="organizer account" />.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="pv-card__footer" style={{ justifyContent: 'space-between' }}>
                  {p.status === 'executed' ? (
                    <>
                      <span className="pv-muted">
                        Released {p.executedAt ? formatDate(p.executedAt) : ''}
                      </span>
                      <a
                        href={p.txHash ? stellarTxUrl(p.txHash) : 'https://stellar.expert/explorer/testnet'}
                        target="_blank"
                        rel="noreferrer"
                        className="pv-btn pv-btn--secondary pv-btn--sm"
                      >
                        View on Stellar Expert
                        <Icon name="external" size={13} />
                      </a>
                    </>
                  ) : bothApproved ? (
                    <>
                      <button
                        type="button"
                        className="pv-btn pv-btn--ghost pv-btn--sm"
                        onClick={() => copyJson(p)}
                      >
                        <Icon name={copiedId === p.id ? 'check' : 'copy'} size={14} />
                        {copiedId === p.id ? 'Copied' : 'Copy winners JSON'}
                      </button>
                      <button
                        type="button"
                        className="pv-btn pv-btn--primary pv-btn--sm"
                        onClick={() => handleExecutePayout(p)}
                        disabled={isExecutingId === p.id}
                      >
                        {isExecutingId === p.id ? (
                          <>
                            <span className="pv-btn__spinner" />
                            Executing
                          </>
                        ) : (
                          <>
                            <Icon name="send" size={14} />
                            Execute payout on testnet
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <span className="pv-muted">
                      Waiting for the sponsor to co-approve in the sponsor console.
                    </span>
                  )}
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
