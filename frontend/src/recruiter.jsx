import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from './constants/escrow'
import SharedHeader from './components/SharedHeader'
import {
  clearActiveSession,
  getActiveSession,
  hasRequiredRole,
  requireManualConnect,
} from './utils/authSession'
import { resolveSessionWithQrBootstrap } from './utils/qrSession'
import { getPayoutProposals, savePayoutProposals } from './utils/payoutProposalsStorage'
import '../styles.css'
import './index.css'
import './recruiter.css'

const HACKATHON_STORAGE_KEY = 'prize_vault_hackathons'

function getHackathonsFromStorage() {
  try {
    const stored = localStorage.getItem(HACKATHON_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (_) {
    return []
  }
}

function saveHackathonsToStorage(hackathons) {
  try {
    localStorage.setItem(HACKATHON_STORAGE_KEY, JSON.stringify(hackathons))
  } catch (_) {}
}

function EscrowOverviewPanel({ escrows, selectedEscrowId, onSelectEscrow }) {
  return (
    <section className="recruiter-card">
      <div className="card-header">
        <div>
          <h3>Prize escrows</h3>
          <p className="muted">All hackathon prize pools this sponsor is funding on Stellar.</p>
        </div>
      </div>
      <div className="status-grid">
        {escrows.map((escrow) => (
          <button
            key={escrow.id}
            type="button"
            className={`status-tile${
              selectedEscrowId === escrow.id ? ' status-tile--active' : ''
            }`}
            onClick={() => onSelectEscrow(escrow.id)}
          >
            <div className="label">{escrow.status}</div>
            <div style={{ fontWeight: 600 }}>{escrow.name}</div>
            <p className="muted" style={{ marginTop: 4, fontSize: '0.8rem' }}>
              {escrow.escrowAddress.slice(0, 6)}…{escrow.escrowAddress.slice(-4)}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}

function FundingPanel({ selectedEscrow, onFund, asaHoldings, senderAddress, onSyncOnChain }) {
  const [amount, setAmount] = useState('')

  if (!selectedEscrow) {
    return (
      <section className="recruiter-card">
        <div className="card-header">
          <div>
            <h3>Fund prize pool</h3>
            <p className="muted">Select an escrow on the left to fund its prize.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="recruiter-card">
      <div className="card-header">
        <div>
          <h3>Fund prize pool</h3>
          <p className="muted">
            Deposit XLM or Stellar assets into the escrow for{' '}
            <strong>{selectedEscrow.name}</strong>.
          </p>
        </div>
      </div>
      <p className="muted">
        Current balance:{' '}
        <strong>
          {selectedEscrow.balanceAlgo} XLM
          {selectedEscrow.assetId ? ` · ASA #${selectedEscrow.assetId}` : ''}
        </strong>
      </p>
      <p className="muted" style={{ marginTop: 8, fontSize: '0.85rem' }}>
        On-chain ASA balances for this escrow:
      </p>
      {asaHoldings && asaHoldings.length > 0 ? (
        <ul className="candidate-list" style={{ marginTop: 8 }}>
          {asaHoldings.map((asset) => (
            <li key={asset.assetId}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">ASA #{asset.assetId}</span>
                <strong>{asset.amount}</strong>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginTop: 4, fontSize: '0.8rem' }}>
          No ASA tokens detected yet for this escrow on chain.
        </p>
      )}
      <div
        className="muted"
        style={{ marginTop: 8, fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <span>
          Escrow address:{' '}
          <code>
            {selectedEscrow.escrowAddress.slice(0, 8)}…
            {selectedEscrow.escrowAddress.slice(-6)}
          </code>
        </span>
        <button
          type="button"
          className="button ghost small"
          style={{ paddingInline: 10 }}
          onClick={async () => {
            try {
              if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(selectedEscrow.escrowAddress)
              } else {
                const textarea = document.createElement('textarea')
                textarea.value = selectedEscrow.escrowAddress
                textarea.style.position = 'fixed'
                textarea.style.opacity = '0'
                document.body.appendChild(textarea)
                textarea.focus()
                textarea.select()
                document.execCommand('copy')
                document.body.removeChild(textarea)
              }
            } catch {
              // eslint-disable-next-line no-alert
              alert('Unable to copy address, please copy it manually.')
            }
          }}
        >
          Copy
        </button>
      </div>
      <p className="muted" style={{ marginTop: 4, fontSize: '0.8rem' }}>
        Sender address to use in Stellar wallet:{' '}
        <code>
          {senderAddress.slice(0, 8)}…
          {senderAddress.slice(-6)}
        </code>
      </p>
      <button
        type="button"
        className="button ghost small"
        style={{ marginTop: 10 }}
        onClick={onSyncOnChain}
      >
        Sync balances from chain
      </button>
      <form
        className="issuer-form"
        style={{ marginTop: 16 }}
        onSubmit={(e) => {
          e.preventDefault()
          if (!amount) return
          onFund({
            escrowId: selectedEscrow.id,
            amount,
          })
          setAmount('')
        }}
      >
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Amount in XLM"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit" className="button primary small">
          Fund escrow
        </button>
      </form>
    </section>
  )
}

function ReleaseApprovalsPanel({ pendingReleases, onApprove }) {
  return (
    <section className="recruiter-card">
      <div className="card-header">
        <div>
          <h3>Pending prize releases</h3>
          <p className="muted">Approve payouts once organizers have selected winners.</p>
        </div>
      </div>
      {pendingReleases.length === 0 ? (
        <p className="muted">No pending releases. Winners will appear here once proposed.</p>
      ) : (
        <ul className="candidate-list">
          {pendingReleases.map((item) => (
            <li key={item.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{item.hackathon}</strong>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    Winner:{' '}
                    {item.winnerAddress && item.winnerAddress !== 'N/A'
                      ? `${item.winnerAddress.slice(0, 10)}…${item.winnerAddress.slice(-6)}`
                      : 'Not specified'}
                  </div>
                </div>
                <span className="pill pending">{item.amountLabel}</span>
              </div>
              <div className="chip-row">
                <span className="chip">{item.organizerState || 'Organizer selected winners'}</span>
                <span className="chip">{item.sponsorState || 'Waiting on sponsor'}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                {item.canApprove ? (
                  <button
                    type="button"
                    className="button primary small"
                    onClick={() => onApprove(item.id)}
                  >
                    Approve release
                  </button>
                ) : (
                  <p className="muted" style={{ fontSize: '0.85rem' }}>
                    Organizer has selected winners. Waiting for organizer to create payout proposal.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function BudgetSummaryPanel({ stats }) {
  return (
    <section className="recruiter-card">
      <div className="card-header">
        <div>
          <h3>Budget overview</h3>
          <p className="muted">How much this sponsor has committed, locked, and released.</p>
        </div>
      </div>
      <div className="status-grid">
        <div className="status-tile ok">
          <span className="label">Committed</span>
          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{stats.committed} XLM</div>
          <p className="muted" style={{ marginTop: 4 }}>
            Across all active hackathons
          </p>
        </div>
        <div className="status-tile warn">
          <span className="label">Locked in escrow</span>
          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{stats.locked} XLM</div>
          <p className="muted" style={{ marginTop: 4 }}>
            Awaiting winners / approvals
          </p>
        </div>
        <div className="status-tile">
          <span className="label">Released</span>
          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{stats.released} XLM</div>
          <p className="muted" style={{ marginTop: 4 }}>
            Paid out to winners on Stellar
          </p>
        </div>
      </div>
    </section>
  )
}

function ActivityHistoryPanel({ activities }) {
  return (
    <section className="recruiter-card">
      <div className="card-header">
        <div>
          <h3>Activity history</h3>
          <p className="muted">Recent funding, approvals, and releases for this sponsor.</p>
        </div>
      </div>
      {activities.length === 0 ? (
        <p className="muted">No recent activity yet.</p>
      ) : (
        <div className="log-list">
          {activities.map((item) => (
            <article key={item.id}>
              <span className="timestamp">{item.timestamp}</span>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <p className="muted" style={{ marginTop: 4 }}>
                {item.description}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function SponsorProfilePanel({ sponsorName, defaultWallet }) {
  return (
    <section className="recruiter-card">
      <div className="card-header">
        <div>
          <h3>Sponsor profile</h3>
          <p className="muted">Basic profile and default payout wallet for this sponsor.</p>
        </div>
      </div>
      <ul className="bookmark-list issuer-list">
        <li>
          <strong>Organization</strong>
          <p className="muted">{sponsorName}</p>
        </li>
        <li>
          <strong>Default wallet</strong>
          <p className="muted">
            <code>
              {defaultWallet.slice(0, 10)}…
              {defaultWallet.slice(-6)}
            </code>
          </p>
        </li>
        <li>
          <strong>Network</strong>
          <p className="muted">Stellar Testnet (configurable in backend)</p>
        </li>
      </ul>
    </section>
  )
}

function SponsorDashboard() {
  useEffect(() => {
    resolveSessionWithQrBootstrap()
  }, [])

  useEffect(() => {
    if (!hasRequiredRole('sponsor')) {
      window.location.href = '/holder'
    }
  }, [])

  const activeSession = getActiveSession()
  const senderAddress = activeSession?.wallet || 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
  const handleDisconnect = () => {
    clearActiveSession()
    requireManualConnect()
    window.location.href = '/holder'
  }
  const [hackathons, setHackathons] = useState([])
  const [proposals, setProposals] = useState([])
  const [selectedEscrowId, setSelectedEscrowId] = useState(null)
  const [activities, setActivities] = useState([])

  const sponsorName = 'Hackathon Sponsor Inc.'
  const defaultWallet = senderAddress

  useEffect(() => {
    const refresh = () => {
      setHackathons(getHackathonsFromStorage())
      setProposals(getPayoutProposals())
    }
    refresh()
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [])

  const escrows = useMemo(
    () =>
      hackathons.map((h) => {
        const balance = Number(h.sponsorFundingXlm || 0)
        return {
          id: h.id,
          name: h.name,
          escrowAddress: h.escrowAddress || h.organizerAddress || DEFAULT_ORGANIZER_ESCROW_ADDRESS,
          status: balance > 0 ? 'Funded' : 'Awaiting top-up',
          balanceAlgo: balance,
          assetId: null,
        }
      }),
    [hackathons]
  )

  useEffect(() => {
    if (!escrows.length) {
      setSelectedEscrowId(null)
      return
    }
    if (!selectedEscrowId || !escrows.some((e) => e.id === selectedEscrowId)) {
      setSelectedEscrowId(escrows[0].id)
    }
  }, [escrows, selectedEscrowId])

  const pendingReleases = useMemo(
    () => {
      const approvals = proposals
        .filter((p) => p.organizerApproved && !p.sponsorApproved && p.status !== 'executed')
        .map((p) => ({
          id: p.id,
          hackathon: p.hackathonName,
          winnerAddress: p.winners?.[0]?.payoutAddress || 'N/A',
          amountLabel: `${(p.winners || []).reduce((sum, w) => sum + Number(w.prizeAmount || 0), 0)} XLM`,
          organizerState: 'Organizer approved',
          sponsorState: 'Waiting on sponsor',
          canApprove: true,
        }))

      const proposalsByHackathon = new Set(approvals.map((x) => x.hackathon))
      const selectedWinnersOnly = hackathons
        .filter((h) => h.winnersSelected && Array.isArray(h.winners) && h.winners.length > 0)
        .filter((h) => !proposalsByHackathon.has(h.name))
        .map((h) => ({
          id: `winner_only_${h.id}`,
          hackathon: h.name,
          winnerAddress: h.winners?.[0]?.payoutAddress || 'N/A',
          amountLabel: `${(h.winners || []).reduce((sum, w) => sum + Number(w.prizeAmount || 0), 0)} XLM`,
          organizerState: 'Winners selected',
          sponsorState: 'Proposal pending',
          canApprove: false,
        }))

      return [...approvals, ...selectedWinnersOnly]
    },
    [proposals, hackathons]
  )

  const budgetStats = useMemo(() => {
    const committed = escrows.reduce((sum, e) => sum + e.balanceAlgo, 0)
    const locked = escrows.filter((e) => e.status !== 'Released').reduce((sum, e) => sum + e.balanceAlgo, 0)
    const released = proposals
      .filter((p) => p.status === 'executed')
      .reduce(
        (sum, p) =>
          sum + (p.winners || []).reduce((inner, w) => inner + Number(w.prizeAmount || 0), 0),
        0
      )
    return {
      committed,
      locked,
      released,
    }
  }, [escrows, proposals])

  const selectedEscrow = escrows.find((e) => e.id === selectedEscrowId) ?? null

  const handleFund = ({ escrowId, amount }) => {
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return
    }
    const updatedHackathons = hackathons.map((h) =>
      h.id === escrowId
        ? {
            ...h,
            sponsorFundingXlm: Number(h.sponsorFundingXlm || 0) + numericAmount,
            sponsorAddress: senderAddress,
          }
        : h
    )
    saveHackathonsToStorage(updatedHackathons)
    setHackathons(updatedHackathons)
    setActivities((prev) => [
      {
        id: `act_fund_${Date.now()}`,
        timestamp: 'Just now',
        title: 'Escrow funded',
        description: `Added ${numericAmount} XLM to ${selectedEscrow?.name || 'escrow'}.`,
      },
      ...prev,
    ])
  }

  const handleApproveRelease = (releaseId) => {
    const updatedProposals = proposals.map((p) =>
      p.id === releaseId ? { ...p, sponsorApproved: true, status: 'approved' } : p
    )
    savePayoutProposals(updatedProposals)
    setProposals(updatedProposals)
    const release = pendingReleases.find((r) => r.id === releaseId)
    setActivities((prev) => [
      {
        id: `act_approve_${Date.now()}`,
        timestamp: 'Just now',
        title: 'Release approved',
        description: `Approved payout proposal for ${release?.hackathon || 'hackathon'}.`,
      },
      ...prev,
    ])
  }

  return (
    <div className="recruiter-page">
      <div className="recruiter-backdrop" aria-hidden />
      <SharedHeader activeTab="recruiter" />
      <div className="recruiter-sub-header">
        <div className="recruiter-sub-header-content">
          <div>
            <h1>Sponsor Prize Console</h1>
            <p>
              Lock hackathon prizes in Stellar escrows and release them only when both organizer and sponsor agree on
              the winner.
            </p>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="button ghost" onClick={handleDisconnect}>
              Disconnect Wallet
            </button>
          </div>
        </div>
      </div>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-eyebrow">Prize funds, trust-first.</span>
            <h2>Fund once, release only with dual approval across every hackathon you sponsor.</h2>
            <p>
              Create and monitor escrow accounts for each event, fund them in XLM, and approve winner payouts in a
              single atomic group—fully transparent on-chain.
            </p>
            <div className="hero-actions">
              <a href="#workspace" className="button primary">
                View all escrows
              </a>
              <a href="#approvals" className="button ghost">
                See pending payouts
              </a>
            </div>
          </div>
          <aside className="hero-panel">
            <div className="hero-card">
              <h3>What this console manages</h3>
              <ul>
                <li>Smart-contract escrow creation per hackathon</li>
                <li>Sponsor deposits into escrow (XLM / Stellar assets)</li>
                <li>Organizer + sponsor approval tracking</li>
                <li>Atomic prize releases to winners</li>
                <li>Budget and activity history per sponsor</li>
              </ul>
            </div>
          </aside>
        </section>

        <div className="sponsor-layout-row" id="workspace">
          <section className="workspace">
            <EscrowOverviewPanel
              escrows={escrows}
              selectedEscrowId={selectedEscrowId}
              onSelectEscrow={setSelectedEscrowId}
            />
            <FundingPanel
              selectedEscrow={selectedEscrow}
              onFund={handleFund}
              asaHoldings={[]}
              senderAddress={senderAddress}
              onSyncOnChain={() => {
                setHackathons(getHackathonsFromStorage())
                setProposals(getPayoutProposals())
              }}
            />
          </section>

          <section className="recruiter-smart-grid" id="approvals">
            <ReleaseApprovalsPanel pendingReleases={pendingReleases} onApprove={handleApproveRelease} />
            <BudgetSummaryPanel stats={budgetStats} />
          </section>

          <section className="ai-grid">
            <ActivityHistoryPanel activities={activities} />
            <SponsorProfilePanel sponsorName={sponsorName} defaultWallet={defaultWallet} />
          </section>
        </div>

        <section className="cta">
          <h2>Ready to sponsor hackathons with on-chain guarantees?</h2>
          <p>
            Pair this sponsor console with the organizer portal and Stellar agent scripts to get end‑to‑end transparent
            prize flows.
          </p>
          <div className="cta-actions">
            <a href="/issuer" className="button primary">
              View organizer tools
            </a>
            <a href="/dashboard" className="button ghost">
              Back to overview
            </a>
          </div>
        </section>
      </main>

      <footer className="recruiter-footer">
        <p>Sponsor console blueprint • Stellar hackathon prize escrows.</p>
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SponsorDashboard />
  </React.StrictMode>,
)

