/**
 * Single source of truth for payout proposals (manual flow: persist + sponsor approval).
 * Proposal shape: { id, hackathonId, hackathonName, createdAt, status, organizerApproved, sponsorApproved, winners, eventEndDate, txHash? }
 */

export const PROPOSALS_STORAGE_KEY = 'prize_vault_payout_proposals'

export function getPayoutProposals(): Record<string, unknown>[] {
  try {
    const stored = localStorage.getItem(PROPOSALS_STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (_) {}
  return []
}

export function savePayoutProposals(proposals: Record<string, unknown>[]): void {
  try {
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals))
  } catch (_) {}
}
