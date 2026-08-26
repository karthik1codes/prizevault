import React, { useEffect, useMemo, useState } from 'react'
import { ensureWalletAddress } from './wallet'
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
import { useEscrow } from './hooks/useEscrow'
import {
  fundEscrowContractWithFreighter,
  getContractXlmBalanceXlm,
  getEscrowContractId,
} from './utils/sorobanFund'
import EscrowOverviewPanel from './recruiter/views/EscrowOverviewPanel'
import FundingPanel from './recruiter/views/FundingPanel'
import ReleaseApprovalsPanel from './recruiter/views/ReleaseApprovalsPanel'
import BudgetSummaryPanel from './recruiter/views/BudgetSummaryPanel'
import ActivityHistoryPanel from './recruiter/views/ActivityHistoryPanel'
import SponsorProfilePanel from './recruiter/views/SponsorProfilePanel'
import './styles/index.css'

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
  const { approvePayout } = useEscrow()

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
        const contractId = getEscrowContractId()
        return {
          id: h.id,
          name: h.name,
          /** Prize XLM for execute_release is held on the Soroban escrow contract. */
          escrowAddress: contractId,
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
    const simulator = senderAddress || DEFAULT_ORGANIZER_ESCROW_ADDRESS
    try {
      const onChainBalanceXlm = await getContractXlmBalanceXlm(simulator)
      const updatedHackathons = hackathons.map((h) =>
        h.id === escrowId
          ? { ...h, onChainBalanceXlm, escrowAddress: getEscrowContractId() }
          : h,
      )
      saveHackathonsToStorage(updatedHackathons)
      setHackathons(updatedHackathons)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to sync Soroban escrow balance', error)
    }
  }

  useEffect(() => {
    if (selectedEscrowId) {
      syncEscrowOnChainState(selectedEscrowId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEscrowId, senderAddress])

  const handleFund = async ({ escrowId, amount }) => {
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return
    }
    const hackRow = hackathons.find((h) => h.id === escrowId)
    if (!hackRow) return

    const contractId = getEscrowContractId()
    setFundingError('')
    setIsFunding(true)
    try {
      await ensureWalletAddress()

      const { txHash } = await fundEscrowContractWithFreighter({
        sponsorAddress: senderAddress,
        amountXlm: numericAmount,
        contractId,
      })

      const updatedHackathons = hackathons.map((h) =>
        h.id === escrowId
          ? {
              ...h,
              sponsorFundingXlm: Number(h.sponsorFundingXlm || 0) + numericAmount,
              sponsorAddress: senderAddress,
              organizerAddress:
                hackRow.organizerAddress?.trim() || DEFAULT_ORGANIZER_ESCROW_ADDRESS,
              escrowAddress: contractId,
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
          title: 'Soroban escrow funded',
          description: `Transferred ${numericAmount} XLM (SAC) into contract for ${hackRow.name}.`,
          txHash,
        },
        ...prev,
      ])
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Funding transaction failed', error)
      setFundingError(
        error instanceof Error ? error.message : 'Funding failed on Stellar testnet.',
      )
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

      const onChainId = Number(proposal.onChainProposalId)
      if (!Number.isFinite(onChainId)) {
        throw new Error(
          'Proposal is missing onChainProposalId. Ask the organizer to re-propose via the on-chain API.',
        )
      }

      const chainResult = await approvePayout(onChainId)
      if (!chainResult.success) {
        throw new Error(chainResult.error || 'approve_release failed on-chain')
      }

      const updatedProposals = proposals.map((p) =>
        p.id === releaseId
          ? {
              ...p,
              sponsorApproved: true,
              approveTxHash: chainResult.txHash,
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
          title: 'Sponsor approval on-chain',
          description: `approve_release (#${onChainId}) for ${proposal.hackathonName}. Tx ${chainResult.txHash.slice(0, 10)}… — organizer can execute.`,
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

          <div id="workspace" className="pv-responsive-grid">
            <EscrowOverviewPanel
              escrows={escrows}
              selectedEscrowId={selectedEscrowId}
              onSelectEscrow={setSelectedEscrowId}
            />
            <FundingPanel
              selectedEscrow={selectedEscrow}
              onFund={handleFund}
              fundingDestinationAddress={getEscrowContractId()}
              displaySenderAddress={senderAddress}
              onSyncOnChain={() => selectedEscrowId && syncEscrowOnChainState(selectedEscrowId)}
              isFunding={isFunding}
              fundingError={fundingError}
            />
          </div>

          <div className="pv-responsive-grid">
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

export default SponsorConsole
export { SponsorConsole }
