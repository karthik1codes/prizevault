export type AppRole = 'participant' | 'sponsor' | 'organizer'

const SESSION_KEY = 'prize_vault_active_session'

interface ActiveSession {
  wallet: string
  role: AppRole
  updatedAt: string
}

export function setActiveSession(wallet: string, role: AppRole): void {
  try {
    const data: ActiveSession = {
      wallet: wallet.trim(),
      role,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch (_) {
    // ignore
  }
}

export function getActiveSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.wallet || !parsed?.role) return null
    return parsed as ActiveSession
  } catch (_) {
    return null
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch (_) {
    // ignore
  }
}

export function hasRequiredRole(required: AppRole): boolean {
  const session = getActiveSession()
  return !!session && session.role === required
}
