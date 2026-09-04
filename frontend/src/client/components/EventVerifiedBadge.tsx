import { AwardBadge } from '@/components/ui/award-badge'
import { ESCROW_APP_ID } from '../constants/escrow'
import { isEscrowFullyFunded } from '../utils/format'

type FundedHackathon = {
  escrowAddress?: string
  prizePool?: unknown
  onChainBalanceXlm?: unknown
  sponsorFundingXlm?: unknown
  sponsorAddress?: unknown
  sponsorFunded?: unknown
}

function escrowExplorerUrl(hackathon: FundedHackathon) {
  const contractId = hackathon.escrowAddress || ESCROW_APP_ID
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`
}

export default function EventVerifiedBadge({ hackathon }: { hackathon: FundedHackathon }) {
  if (!isEscrowFullyFunded(hackathon)) return null

  return (
    <div className="pv-event__verified-badge">
      <AwardBadge link={escrowExplorerUrl(hackathon)} />
    </div>
  )
}
