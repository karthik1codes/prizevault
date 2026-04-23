import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from '../constants/escrow'

/**
 * Hackathons created in the organizer portal use DEFAULT_ORGANIZER_ESCROW_ADDRESS.
 * If the user connected a different wallet (e.g. sponsor while browsing issuer UI),
 * we still show those hackathons. Also include hackathons where organizerAddress
 * exactly matches the connected session wallet.
 */
export function hackathonBelongsToOrganizerPortal(
  hackathon: { organizerAddress?: string },
  sessionWallet: string | null | undefined,
): boolean {
  const o = hackathon.organizerAddress?.toLowerCase()
  if (!o) return false
  const d = DEFAULT_ORGANIZER_ESCROW_ADDRESS.toLowerCase()
  const w = (sessionWallet || '').toLowerCase()
  if (o === d) return true
  if (w && o === w) return true
  return false
}
