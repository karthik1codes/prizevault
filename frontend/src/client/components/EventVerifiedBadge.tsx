import { AwardBadge } from '@/components/ui/award-badge'
import { ESCROW_APP_ID } from '../constants/escrow'
import { isEscrowFullyFunded } from '../utils/format'
import Icon from './Icon'

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
      <a
        className="pv-event__funded-chip"
        href={escrowExplorerUrl(hackathon)}
        target="_blank"
        rel="noreferrer"
        aria-label="Prize pool funded and verified on Stellar"
        title="Funded & verified on-chain"
      >
        <Icon name="shield" size={12} />
        Funded & verified
      </a>
      <AwardBadge link={escrowExplorerUrl(hackathon)} />
    </div>
  )
}
