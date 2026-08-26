import {
  AppRole,
  clearManualConnectRequirement,
  getActiveSession,
  setActiveSession,
} from './authSession'
import { ROLE_WALLET_MAP } from '../constants/qrWallets'

function isValidStellarAddress(value: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(value)
}

function normalizeRole(roleRaw: string | null): AppRole | null {
  if (!roleRaw) return null
  const role = roleRaw.toLowerCase().trim()
  if (role === 'participant' || role === 'sponsor' || role === 'organizer') {
    return role
  }
  return null
}

/**
 * Accepts QR deep-link query params and stores session:
 * - role: participant | sponsor | organizer
 * - wallet: Stellar public key (G...)
 *
 * Example:
 * /holder?role=participant&wallet=G...
 */
export function bootstrapSessionFromQrParams(): { role: AppRole; wallet: string } | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const role = normalizeRole(params.get('role'))
  const fallbackByRole = role ? ROLE_WALLET_MAP[role] || '' : ''
  const wallet = (params.get('wallet') || params.get('address') || fallbackByRole || '').trim()
  if (!role || !wallet || !isValidStellarAddress(wallet)) return null

  setActiveSession(wallet, role)
  clearManualConnectRequirement()

  // Keep URL clean after bootstrap.
  const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`
  window.history.replaceState({}, '', cleanUrl)

  return { role, wallet }
}

export function resolveSessionWithQrBootstrap(): { role: AppRole; wallet: string } | null {
  const fromQr = bootstrapSessionFromQrParams()
  if (fromQr) return fromQr
  const current = getActiveSession()
  if (!current) return null
  return { role: current.role, wallet: current.wallet }
}
