import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
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
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from './constants/escrow'
import SharedHeader from './components/SharedHeader'
import Icon from './components/Icon'
import {
  clearActiveSession,
  getActiveSession,
  hasRequiredRole,
  requireManualConnect,
} from './utils/authSession'
import { resolveSessionWithQrBootstrap } from './utils/qrSession'
import { getPayoutProposals, savePayoutProposals } from './utils/payoutProposalsStorage'
import {
  broadcastHackathonsDatasetChanged,
  subscribeHackathonsDatasetChanged,
} from './utils/hackathonSync'
import EscrowOverviewPanel from './recruiter/views/EscrowOverviewPanel'
import FundingPanel from './recruiter/views/FundingPanel'
import ReleaseApprovalsPanel from './recruiter/views/ReleaseApprovalsPanel'
import BudgetSummaryPanel from './recruiter/views/BudgetSummaryPanel'
import ActivityHistoryPanel from './recruiter/views/ActivityHistoryPanel'
import SponsorProfilePanel from './recruiter/views/SponsorProfilePanel'
import './styles/index.css'

const HACKATHON_STORAGE_KEY = 'prize_vault_hackathons'
const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const STELLAR_SERVER = new Horizon.Server(HORIZON_URL)

function toStellarAmount(value) {
  const fixed = Number(value).toFixed(7)
  return fixed.replace(/\.?0+$/, '')
}

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
    window.dispatchEvent(new CustomEvent('prize_vault_hackathons_changed'))
    broadcastHackathonsDatasetChanged()
  } catch (_) {}
}

function SponsorConsole() {
  useEffect(() => {
    resolveSessionWithQrBootstrap()
  }, [])

  useEffect(() => {
    if (!hasRequiredRole('sponsor')) {
      window.location.href = '/holder'
    }
  }, [])

  const activeSession = getActiveSession()
  const senderAddress =
    activeSession?.wallet || 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'

  const handleDisconnect = () => {
    clearActiveSession()
    requireManualConnect()
    window.location.href = '/holder'
  }

  const [hackathons, setHackathons] = useState([])
  const [proposals, setProposals] = useState([])
  const [selectedEscrowId, setSelectedEscrowId] = useState(null)
  const [activities, setActivities] = useState([])
  const [isFunding, setIsFunding] = useState(false)
  const [fundingError, setFundingError] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [approveError, setApproveError] = useState('')

  const sponsorName = 'Hackathon Sponsor Inc.'
  const defaultWallet = senderAddress

  // savePayoutProposals now announces its own writes, so the 2-second poll the
  // original ran forever is no longer needed to notice cross-surface approvals.
  useEffect(() => {
    const refresh = () => {
      setHackathons(getHackathonsFromStorage())
      setProposals(getPayoutProposals())
    }
    refresh()
    return subscribeHackathonsDatasetChanged(refresh, ['prize_vault_payout_proposals'])
  }, [])

  const escrows = useMemo(
    () =>
      hackathons.map((h) => {
        const balance = Number(h.onChainBalanceXlm ?? h.sponsorFundingXlm ?? 0)
        const prizeCustody = (
          h.escrowAddress?.trim() ||
          h.organizerAddress?.trim() ||
          DEFAULT_ORGANIZER_ESCROW_ADDRESS
        ).trim()
        return {
          id: h.id,
          name: h.name,
          /** On-chain XLM for payouts is held on the organizer prize account after sponsor funding. */
          escrowAddress: prizeCustody,
          status: balance > 0 ? 'Funded' : 'Awaiting top-up',
          balanceAlgo: balance,
        }
      }),
    [hackathons],
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

  const pendingReleases = useMemo(() => {
    const approvals = proposals
      .filter((p) => p.organizerApproved && !p.sponsorApproved && p.status !== 'executed')
      .map((p) => ({
        id: p.id,
        hackathon: p.hackathonName,
        winners: p.winners || [],
        total: (p.winners || []).reduce((sum, w) => sum + Number(w.prizeAmount || 0), 0),
        organizerState: 'Organizer approved',
        sponsorState: 'Waiting on you',
        canApprove: true,
      }))

    const proposalsByHackathon = new Set(approvals.map((x) => x.hackathon))
    const selectedWinnersOnly = hackathons
      .filter((h) => h.winnersSelected && Array.isArray(h.winners) && h.winners.length > 0)
      .filter((h) => !proposalsByHackathon.has(h.name))
      .map((h) => ({
        id: `winner_only_${h.id}`,
        hackathon: h.name,
        winners: h.winners || [],
        total: (h.winners || []).reduce((sum, w) => sum + Number(w.prizeAmount || 0), 0),
        organizerState: 'Winners selected',
        sponsorState: 'Proposal pending',
        canApprove: false,
      }))

    return [...approvals, ...selectedWinnersOnly]
  }, [proposals, hackathons])

  const budgetStats = useMemo(() => {
    const committed = escrows.reduce((sum, e) => sum + e.balanceAlgo, 0)
    const locked = escrows
      .filter((e) => e.status !== 'Released')
      .reduce((sum, e) => sum + e.balanceAlgo, 0)
    const released = proposals
      .filter((p) => p.status === 'executed')
      .reduce(
        (sum, p) =>
          sum + (p.winners || []).reduce((inner, w) => inner + Number(w.prizeAmount || 0), 0),
        0,
      )
    return { committed, locked, released }
  }, [escrows, proposals])

  const selectedEscrow = escrows.find((e) => e.id === selectedEscrowId) ?? null
  const actionableCount = pendingReleases.filter((r) => r.canApprove).length

  const syncEscrowOnChainState = async (escrowId) => {
    const hack = hackathons.find((h) => h.id === escrowId)
    if (!hack) return
    const custodyAddress = (
      hack.escrowAddress?.trim() ||
      hack.organizerAddress?.trim() ||
      DEFAULT_ORGANIZER_ESCROW_ADDRESS
    ).trim()
    if (!custodyAddress) return
    try {
      const account = await STELLAR_SERVER.loadAccount(custodyAddress)
      const nativeBalance = account.balances.find((b) => b.asset_type === 'native')
      const onChainBalanceXlm = Number(nativeBalance?.balance || 0)
      const updatedHackathons = hackathons.map((h) =>
        h.id === escrowId ? { ...h, onChainBalanceXlm } : h,
      )
      saveHackathonsToStorage(updatedHackathons)
      setHackathons(updatedHackathons)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to sync on-chain balance', error)
    }
  }

  useEffect(() => {
    if (selectedEscrowId) {
      syncEscrowOnChainState(selectedEscrowId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEscrowId])

  const handleFund = async ({ escrowId, amount }) => {
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return
    }
    const hackRow = hackathons.find((h) => h.id === escrowId)
    if (!hackRow) return
    const organizerCustody = (
      hackRow.organizerAddress?.trim() || DEFAULT_ORGANIZER_ESCROW_ADDRESS
    ).trim()
    if (!organizerCustody) return

    setFundingError('')
    setIsFunding(true)
    try {
      if (organizerCustody.toLowerCase() === senderAddress.toLowerCase()) {
        throw new Error(
          'Connected wallet matches the organizer prize account. Connect the sponsor wallet so XLM can be sent into organizer custody.',
        )
      }

      const access = await requestAccess()
      if (access.error) {
        throw new Error(access.error)
      }

      const sourceAccount = await STELLAR_SERVER.loadAccount(senderAddress)
      const fee = await STELLAR_SERVER.fetchBaseFee().catch(() => BASE_FEE)
      const tx = new TransactionBuilder(sourceAccount, {
        fee: String(fee || BASE_FEE),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: organizerCustody,
            asset: Asset.native(),
            amount: toStellarAmount(numericAmount),
          }),
        )
        .setTimeout(120)
        .build()

      const signed = await signTransaction(tx.toXDR(), {
        networkPassphrase: Networks.TESTNET,
        address: senderAddress,
      })

      if (signed.error || !signed.signedTxXdr) {
        throw new Error(signed.error || 'Failed to sign transaction in Freighter')
      }

      const signedTx = new Transaction(signed.signedTxXdr, Networks.TESTNET)
      const submitResult = await STELLAR_SERVER.submitTransaction(signedTx)

      const updatedHackathons = hackathons.map((h) =>
        h.id === escrowId
          ? {
              ...h,
              sponsorFundingXlm: Number(h.sponsorFundingXlm || 0) + numericAmount,
              sponsorAddress: senderAddress,
              organizerAddress:
                hackRow.organizerAddress?.trim() || DEFAULT_ORGANIZER_ESCROW_ADDRESS,
              escrowAddress: organizerCustody,
            }
          : h,
      )
      saveHackathonsToStorage(updatedHackathons)
      setHackathons(updatedHackathons)
      await syncEscrowOnChainState(escrowId)

      setActivities((prev) => [
        {
          id: `act_fund_${Date.now()}`,
          timestamp: 'Just now',
          icon: 'send',
          tone: 'success',
          title: 'Escrow funded on Stellar testnet',
          description: `Sent ${numericAmount} XLM to ${hackRow.name} (organizer custody).`,
          txHash: submitResult.hash,
        },
        ...prev,
      ])
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Funding transaction failed', error)
      setFundingError(error instanceof Error ? error.message : 'Funding failed on Stellar testnet.')
    } finally {
      setIsFunding(false)
    }
  }

  const handleApproveRelease = async (releaseId) => {
    setApproveError('')
    setIsApproving(true)
    try {
      const proposal = proposals.find((p) => p.id === releaseId)
      if (!proposal) {
        throw new Error('Payout proposal not found.')
      }

      const updatedProposals = proposals.map((p) =>
        p.id === releaseId
          ? {
              ...p,
              sponsorApproved: true,
              status: p.organizerApproved ? 'approved' : p.status,
            }
          : p,
      )
      savePayoutProposals(updatedProposals)
      setProposals(updatedProposals)
      setActivities((prev) => [
        {
          id: `act_approve_${Date.now()}`,
          timestamp: 'Just now',
          icon: 'checkCircle',
          tone: 'success',
          title: 'Sponsor approval recorded',
          description: `Approved the payout for ${proposal.hackathonName}. The organizer can now execute the release.`,
        },
        ...prev,
      ])
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Payout approval failed', error)
      setApproveError(error instanceof Error ? error.message : 'Approval failed.')
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <div className="pv-shell pv-app">
      <a className="pv-skip-link" href="#console">
        Skip to content
      </a>

      <SharedHeader activeTab="recruiter" subtitle="Sponsor" />

      <div className="pv-container pv-container--wide" style={{ paddingTop: 'var(--pv-space-8)' }}>
        <div className="pv-page-header">
          <div className="pv-page-header__text">
            <h1 className="pv-page-header__title">Sponsor console</h1>
            <p className="pv-page-header__desc">
              Fund prize pools in XLM and co-approve winner payouts. Nothing is released without both
              your approval and the organizer&apos;s.
            </p>
          </div>
          <div className="pv-page-header__actions">
            {actionableCount > 0 ? (
              <a href="#approvals" className="pv-btn pv-btn--primary pv-btn--sm">
                <Icon name="clock" size={14} />
                {actionableCount} awaiting you
              </a>
            ) : null}
            <button
              type="button"
              className="pv-btn pv-btn--secondary pv-btn--sm"
              onClick={handleDisconnect}
            >
              <Icon name="logout" size={14} />
              Disconnect
            </button>
          </div>
        </div>
      </div>

      <main
        className="pv-container pv-container--wide"
        id="console"
        style={{ paddingBottom: 'var(--pv-space-13)' }}
      >
        <div className="pv-stack pv-stack--lg">
          <BudgetSummaryPanel stats={budgetStats} />

          <section className="pv-section" id="approvals">
            <ReleaseApprovalsPanel
              pendingReleases={pendingReleases}
              onApprove={handleApproveRelease}
              isApproving={isApproving}
              approveError={approveError}
            />
          </section>

          <div
            id="workspace"
            style={{
              display: 'grid',
              gap: 'var(--pv-space-7)',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              alignItems: 'start',
            }}
          >
            <EscrowOverviewPanel
              escrows={escrows}
              selectedEscrowId={selectedEscrowId}
              onSelectEscrow={setSelectedEscrowId}
            />
            <FundingPanel
              selectedEscrow={selectedEscrow}
              onFund={handleFund}
              fundingDestinationAddress={
                selectedEscrow?.escrowAddress || DEFAULT_ORGANIZER_ESCROW_ADDRESS
              }
              displaySenderAddress={senderAddress}
              onSyncOnChain={() => selectedEscrowId && syncEscrowOnChainState(selectedEscrowId)}
              isFunding={isFunding}
              fundingError={fundingError}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gap: 'var(--pv-space-7)',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              alignItems: 'start',
            }}
          >
            <ActivityHistoryPanel activities={activities} />
            <SponsorProfilePanel sponsorName={sponsorName} defaultWallet={defaultWallet} />
          </div>
        </div>
      </main>

      <footer className="pv-footer">
        <div className="pv-footer__inner">
          <span>Stellar hackathon prize escrows · sponsor console.</span>
          <ul className="pv-footer__links">
            <li>
              <a href="/issuer">Organizer tools</a>
            </li>
            <li>
              <a href="/">Overview</a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SponsorConsole />
  </React.StrictMode>,
)
