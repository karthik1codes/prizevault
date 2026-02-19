import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import SharedHeader from './components/SharedHeader'
import '../styles.css'
import './index.css'
import './recruiter.css'

function EscrowOverviewPanel({ escrows, selectedEscrowId, onSelectEscrow }) {
  return (
    <section className="recruiter-card">
      <div className="card-header">
        <div>
          <h3>Prize escrows</h3>
          <p className="muted">All hackathon prize pools this sponsor is funding on Algorand.</p>
        </div>
      </div>
      <div className="status-grid">
        {escrows.map((escrow) => (
          <button
            key={escrow.id}
            type="button"
            className="status-tile"
            style={{
              borderColor:
                selectedEscrowId === escrow.id ? 'rgba(102, 240, 176, 0.7)' : undefined,
            }}
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

function FundingPanel({ selectedEscrow, onFund }) {
  const [amount, setAmount] = useState('')
  const [assetId, setAssetId] = useState('')

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
            Deposit ALGO or an ASA into the LogicSig escrow for{' '}
            <strong>{selectedEscrow.name}</strong>.
          </p>
        </div>
      </div>
      <p className="muted">
        Current balance:{' '}
        <strong>
          {selectedEscrow.balanceAlgo} ALGO
          {selectedEscrow.assetId ? ` · ASA #${selectedEscrow.assetId}` : ''}
        </strong>
      </p>
      <p className="muted" style={{ marginTop: 8, fontSize: '0.85rem' }}>
        Escrow address:{' '}
        <code>
          {selectedEscrow.escrowAddress.slice(0, 8)}…
          {selectedEscrow.escrowAddress.slice(-6)}
        </code>
      </p>
      <form
        className="issuer-form"
        style={{ marginTop: 16 }}
        onSubmit={(e) => {
          e.preventDefault()
          if (!amount) return
          onFund({
            escrowId: selectedEscrow.id,
            amount,
            assetId: assetId || null,
          })
          setAmount('')
          setAssetId('')
        }}
      >
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Amount in ALGO"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="text"
          placeholder="Optional ASA ID"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
        />
        <button type="submit" className="button primary small">
          Fund escrow
        </button>
      </form>
      <p className="muted" style={{ marginTop: 8, fontSize: '0.8rem' }}>
        In production this form would prepare an unsigned Algorand transaction that your wallet
        signs. Here it is wired to mock data only.
      </p>
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
                    Winner: {item.winnerAddress.slice(0, 10)}…
                    {item.winnerAddress.slice(-6)}
                  </div>
                </div>
                <span className="pill pending">{item.amountLabel}</span>
              </div>
              <div className="chip-row">
                <span className="chip">Organizer approved</span>
                <span className="chip">Waiting on sponsor</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="button primary small"
                  onClick={() => onApprove(item.id)}
                >
                  Approve release
                </button>
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
          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{stats.committed} ALGO</div>
          <p className="muted" style={{ marginTop: 4 }}>
            Across all active hackathons
          </p>
        </div>
        <div className="status-tile warn">
          <span className="label">Locked in escrow</span>
          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{stats.locked} ALGO</div>
          <p className="muted" style={{ marginTop: 4 }}>
            Awaiting winners / approvals
          </p>
        </div>
        <div className="status-tile">
          <span className="label">Released</span>
          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{stats.released} ALGO</div>
          <p className="muted" style={{ marginTop: 4 }}>
            Paid out to winners on Algorand
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
          <p className="muted">Algorand TestNet (configurable in backend)</p>
        </li>
      </ul>
    </section>
  )
}

function SponsorDashboard() {
  const [escrows, setEscrows] = useState([
    {
      id: 'escrow_1',
      name: 'RIFT Bengaluru · Main Prize',
      escrowAddress: 'RIFTALGOTESTNETADDRESS000000000000000000001',
      status: 'Funded',
      balanceAlgo: 10,
      assetId: null,
    },
    {
      id: 'escrow_2',
      name: 'RIFT Pune · Track Prize',
      escrowAddress: 'RIFTALGOTESTNETADDRESS000000000000000000002',
      status: 'Awaiting top-up',
      balanceAlgo: 3,
      assetId: null,
    },
  ])
  const [selectedEscrowId, setSelectedEscrowId] = useState(escrows[0]?.id ?? null)
  const [pendingReleases, setPendingReleases] = useState([
    {
      id: 'rel_1',
      hackathon: 'RIFT Bengaluru',
      winnerAddress: 'WINNERALGOTESTNETADDR0000000000000000001',
      amountLabel: '8 ALGO',
    },
  ])
  const [activities, setActivities] = useState([
    {
      id: 'act_1',
      timestamp: 'Just now',
      title: 'Escrow created for RIFT Bengaluru',
      description: 'LogicSig compiled and escrow address derived for main prize pool.',
    },
  ])

  const sponsorName = 'Hackathon Sponsor Inc.'
  const defaultWallet = 'SPONSORALGOTESTNETADDR0000000000000000003'

  const budgetStats = useMemo(() => {
    const committed = escrows.reduce((sum, e) => sum + e.balanceAlgo, 0)
    const locked = escrows.filter((e) => e.status !== 'Released').reduce((sum, e) => sum + e.balanceAlgo, 0)
    const released = 0
    return {
      committed,
      locked,
      released,
    }
  }, [escrows])

  const selectedEscrow = escrows.find((e) => e.id === selectedEscrowId) ?? null

  const handleFund = ({ escrowId, amount }) => {
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return
    }
    setEscrows((prev) =>
      prev.map((e) =>
        e.id === escrowId ? { ...e, balanceAlgo: e.balanceAlgo + numericAmount, status: 'Funded' } : e,
      ),
    )
    setActivities((prev) => [
      {
        id: `act_${prev.length + 1}`,
        timestamp: 'Just now',
        title: 'Funding simulated',
        description: `Added ${numericAmount} ALGO to ${selectedEscrow?.name || 'escrow'}.`,
      },
      ...prev,
    ])
  }

  const handleApproveRelease = (releaseId) => {
    const release = pendingReleases.find((r) => r.id === releaseId)
    setPendingReleases((prev) => prev.filter((r) => r.id !== releaseId))
    if (release) {
      setActivities((prev) => [
        {
          id: `act_${prev.length + 1}`,
          timestamp: 'Just now',
          title: 'Release approved',
          description: `Approved prize release for ${release.hackathon} to ${release.winnerAddress.slice(
            0,
            10,
          )}….`,
        },
        ...prev,
      ])
    }
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
              Lock hackathon prizes in Algorand escrows and release them only when both organizer and sponsor agree on
              the winner.
            </p>
          </div>
        </div>
      </div>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-eyebrow">Prize funds, trust-first.</span>
            <h2>Fund once, release only with dual approval across every hackathon you sponsor.</h2>
            <p>
              Create and monitor LogicSig escrows for each event, fund them in ALGO, and approve winner payouts in a
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
                <li>LogicSig escrow creation per hackathon</li>
                <li>Sponsor deposits into escrow (ALGO / ASA)</li>
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
            <FundingPanel selectedEscrow={selectedEscrow} onFund={handleFund} />
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
            Pair this sponsor console with the organizer portal and Algorand agent scripts to get end‑to‑end transparent
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
        <p>Sponsor console blueprint • Algorand hackathon prize escrows.</p>
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SponsorDashboard />
  </React.StrictMode>,
)

