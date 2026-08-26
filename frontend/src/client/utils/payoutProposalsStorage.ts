/**
 * Single source of truth for payout proposals (manual flow: persist + sponsor approval).
 * Proposal shape: { id, hackathonId, hackathonName, createdAt, status, organizerApproved, sponsorApproved, winners, eventEndDate, txHash? }
 */

import { broadcastHackathonsDatasetChanged } from './hackathonSync'

export const PROPOSALS_STORAGE_KEY = 'prize_vault_payout_proposals'

export function getPayoutProposals(): Record<string, unknown>[] {
  try {
    const stored = localStorage.getItem(PROPOSALS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (_) {}
  return []
}

/**
 * Persists and announces the change. Notifying here rather than at each call
 * site means a sponsor approval always reaches the organizer console -- the
 * sponsor path used to save silently, so the other surface only noticed via a
 * 2-second poll.
 */
export function savePayoutProposals(proposals: Record<string, unknown>[]): void {
  try {
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals))
  } catch (_) {
    return
  }
  try {
    window.dispatchEvent(new CustomEvent('prize_vault_hackathons_changed'))
    broadcastHackathonsDatasetChanged()
  } catch (_) {
    // Notification is best-effort; the write already succeeded.
  }
}
