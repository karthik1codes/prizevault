import { Hackathon, Participant } from '../../types/hackathon'
import { getHackathonsFromStorage } from './roleDetection'
import { getProfileForWallet } from './userProfileStorage'
import {
  PRIZE_VAULT_HACKATHONS_KEY,
  REGISTERED_HACKATHONS_KEY,
  broadcastHackathonsDatasetChanged,
} from '../../utils/hackathonSync'

/** Ids this browser has registered, used as a fallback when the roster is stale. */
export function getRegisteredIds(): string[] {
  try {
    const raw = localStorage.getItem(REGISTERED_HACKATHONS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function isRegistered(hackathon: Hackathon, wallet: string | null): boolean {
  if (!wallet) return false
  const onRoster = hackathon.participants?.some(
    (p) => p.payoutAddress?.toLowerCase() === wallet.toLowerCase(),
  )
  return Boolean(onRoster) || getRegisteredIds().includes(hackathon.id)
}

export type RegisterResult = { ok: true } | { ok: false; reason: string }

/**
 * Registers the connected wallet for a hackathon.
 *
 * Re-reads storage immediately before writing rather than trusting a React
 * snapshot, so a registration from another tab is not silently overwritten.
 */
export function registerForHackathon(hackathonId: string, wallet: string | null): RegisterResult {
  if (!wallet) return { ok: false, reason: 'Connect your wallet before registering.' }

  const current = getHackathonsFromStorage()
  const target = current.find((h) => h.id === hackathonId)
  if (!target) return { ok: false, reason: 'That event no longer exists.' }
  if (isRegistered(target, wallet)) return { ok: false, reason: 'You are already registered.' }

  const profile = getProfileForWallet(wallet)
  const participant: Participant = {
    // Wallet-derived so re-registering cannot create a duplicate row.
    id: `p_${wallet.slice(0, 8)}`,
    name: profile?.name ?? 'Participant',
    registeredAt: new Date().toISOString(),
    status: 'registered',
    payoutAddress: wallet,
  }

  const updated = current.map((h) => {
    if (h.id !== hackathonId) return h
    const participants = [...(h.participants ?? []), participant]
    return { ...h, participants, participantCount: participants.length }
  })

  try {
    localStorage.setItem(PRIZE_VAULT_HACKATHONS_KEY, JSON.stringify(updated))
    const ids = getRegisteredIds()
    if (!ids.includes(hackathonId)) {
      localStorage.setItem(REGISTERED_HACKATHONS_KEY, JSON.stringify([...ids, hackathonId]))
    }
    window.dispatchEvent(new CustomEvent('prize_vault_hackathons_changed'))
    broadcastHackathonsDatasetChanged()
    return { ok: true }
  } catch {
    return { ok: false, reason: 'Could not save. Browser storage may be full or blocked.' }
  }
}
