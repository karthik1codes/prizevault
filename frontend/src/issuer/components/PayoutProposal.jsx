import React, { useState, useMemo, useEffect } from 'react'
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
import { getPayoutProposals, savePayoutProposals } from '../../utils/payoutProposalsStorage'
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from '../../constants/escrow'
import { hackathonBelongsToOrganizerPortal } from '../../utils/organizerPortalFilter'
import { broadcastHackathonsDatasetChanged } from '../../utils/hackathonSync'

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
    const detail = [txCode, opCodes ? JSON.stringify(opCodes) : ''].filter(Boolean).join(' · ')
    return detail ? `${error.message} (${detail})` : error.message
  }
  return error.message
}

export default function PayoutProposal({ hackathonId, sessionWallet, onExecute }) {
  const [proposals, setProposals] = useState([])
  const [isExecutingId, setIsExecutingId] = useState(null)
  const [executeError, setExecuteError] = useState('')

  useEffect(() => {
    const load = () => setProposals(getPayoutProposals())
    load()
    window.addEventListener('prize_vault_hackathons_changed', load)
    return () => window.removeEventListener('prize_vault_hackathons_changed', load)
  }, [])

  const hackathons = useMemo(() => getHackathons(), [])
  const myHackathons = hackathons.filter((h) =>
    hackathonBelongsToOrganizerPortal(h, sessionWallet),
  )
  const hackathon = hackathonId
    ? hackathons.find((h) => h.id === hackathonId)
    : myHackathons[0]

  const eligibleHackathons = myHackathons.filter(
    (h) => h.winnersSelected && h.winners?.length > 0
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
    const updated = [proposal, ...proposals]
    setProposals(updated)
    savePayoutProposals(updated)

    try {
      const stored = getHackathons()
      const updatedHackathons = stored.map((x) =>
        x.id === h.id ? { ...x, payoutProposed: true } : x
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHackathons))
      window.dispatchEvent(new CustomEvent('prize_vault_hackathons_changed'))
      broadcastHackathonsDatasetChanged()
    } catch (_) {}
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

      /** Organizer dashboard: prizes always send from the hackathon organizer account → winners (sponsor only approves). */
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
          })
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
          : p
      )
      setProposals(updated)
      savePayoutProposals(updated)
      onExecute?.(proposal)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Execute payout failed', error)
      setExecuteError(formatStellarSubmitError(error))
    } finally {
      setIsExecutingId(null)
    }
  }

  // Build winners JSON for Stellar release script. Prize amounts in XLM.
  const getReleaseAppWinnersJson = (p) => {
    const winners = (p.winners || []).filter((w) => w.payoutAddress && (w.prizeAmount || 0) > 0)
    return JSON.stringify(
      winners.map((w) => ({
        address: w.payoutAddress.trim(),
        amountXlm: Number(w.prizeAmount || 0),
      }))
    )
  }

  const getReleaseAppWinnersForCopy = (p) => getReleaseAppWinnersJson(p)

  const displayProposals = proposals.filter((p) =>
    myHackathons.some((h) => h.id === p.hackathonId)
  )

  const getStatusBadge = (p) => {
    if (p.status === 'executed') return <span className="status-badge badge-issued">Executed</span>
    if (p.organizerApproved && p.sponsorApproved)
      return <span className="status-badge badge-verified">Both Approved</span>
    return <span className="status-badge badge-pending">Awaiting Sponsor</span>
  }

  return (
    <div className="payout-proposal">
      <div className="table-header">
        <h2>Payout Proposals</h2>
        <p className="muted">
          Create a payout proposal after the event timeline ends. Both organizer and sponsor must approve before execution.
        </p>
      </div>

      {eligibleHackathons.length === 0 ? (
        <p className="muted">No hackathons with selected winners. Select winners first.</p>
      ) : (
        <section className="create-proposal-section">
          <h3>Create Payout Proposal</h3>
          {eligibleHackathons
            .filter((h) => !h.payoutProposed && !proposals.some((p) => p.hackathonId === h.id))
            .map((h) => (
              <div key={h.id} className="proposal-card">
                <div>
                  <strong>{h.name}</strong>
                  <span className="muted"> – Event ended: {h.endDate}</span>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleCreateProposal(h)}
                >
                  Create Payout Proposal
                </button>
              </div>
            ))}
        </section>
      )}

      <section className="proposals-list">
        <h3>Proposals</h3>
        {displayProposals.length === 0 ? (
          <p className="muted">No payout proposals yet.</p>
        ) : (
          <div className="proposal-cards">
            {displayProposals.map((p) => {
              const hackForProposal = getHackathons().find((h) => h.id === p.hackathonId)
              const organizerHint =
                (hackForProposal?.organizerAddress || '').trim() || DEFAULT_ORGANIZER_ESCROW_ADDRESS
              return (
              <div key={p.id} className="proposal-card full">
                <div className="proposal-header">
                  <h4>{p.hackathonName}</h4>
                  {getStatusBadge(p)}
                </div>
                <div className="proposal-body">
                  <p>Event end date: {p.eventEndDate}</p>
                  <p>Winners: {p.winners?.length || 0}</p>
                  <p>Total: {p.winners?.reduce((s, w) => s + (w.prizeAmount || 0), 0)} XLM</p>
                </div>
                {p.organizerApproved && p.sponsorApproved && p.status !== 'executed' && (
                  <div className="execute-payout-app">
                    <p className="muted" style={{ marginBottom: '0.5rem' }}>
                      Both approvals complete. Click execute and approve in Freighter when prompted to sign for the
                      organizer prize account ({organizerHint.slice(0, 6)}…{organizerHint.slice(-4)}).
                      XLM is sent from that account to each winner&apos;s payout address below.
                    </p>
                    <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Winners (set WINNERS_JSON then run release flow script):</p>
                    <pre className="release-command" style={{ fontSize: '0.7rem', overflow: 'auto', maxWidth: '100%', padding: '0.5rem', background: '#1a1a1a', borderRadius: 4 }}>
                      {getReleaseAppWinnersForCopy(p)}
                    </pre>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        navigator.clipboard?.writeText(getReleaseAppWinnersForCopy(p))
                        alert('Winners JSON copied. Use it with the Stellar release flow.')
                      }}
                    >
                      Copy JSON &amp; run release-app
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ marginLeft: '0.5rem' }}
                      onClick={() => handleExecutePayout(p)}
                      disabled={isExecutingId === p.id}
                    >
                      {isExecutingId === p.id ? 'Executing...' : 'Execute Payout On Testnet'}
                    </button>
                  </div>
                )}
                {p.status === 'executed' && (
                  <a
                    href={p.txHash ? `https://stellar.expert/explorer/testnet/tx/${p.txHash}` : 'https://stellar.expert/explorer/testnet'}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    View on Stellar Explorer
                  </a>
                )}
              </div>
            )
            })}
          </div>
        )}
        {executeError && <p className="error-text">{executeError}</p>}
      </section>
    </div>
  )
}
