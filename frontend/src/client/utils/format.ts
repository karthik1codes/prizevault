/**
 * Shared display formatting. Every surface renders dates, XLM amounts and event
 * identity through these so the four apps never disagree on presentation.
 */

/** 1 XLM = 10,000,000 stroops. */
export const STROOPS_PER_XLM = 10_000_000

export function formatXlm(value: unknown, opts: { withUnit?: boolean } = {}): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return opts.withUnit ? '0 XLM' : '0'
  // Prize amounts are whole numbers in practice; keep decimals only when real.
  const text = n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 7,
  })
  return opts.withUnit ? `${text} XLM` : text
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d
}

/** "14 Mar 2026" — unambiguous across locales, no leading weekday noise. */
export function formatDate(value: unknown): string {
  const d = toDate(value)
  if (!d) return '--'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(value: unknown): string {
  const d = toDate(value)
  if (!d) return '--'
  return `${formatDate(d)}, ${d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

/** "14 - 16 Mar 2026", collapsing the shared month/year. */
export function formatDateRange(start: unknown, end: unknown): string {
  const a = toDate(start)
  const b = toDate(end)
  if (!a && !b) return 'Dates to be announced'
  if (!a) return formatDate(b)
  if (!b) return formatDate(a)

  const sameYear = a.getFullYear() === b.getFullYear()
  const sameMonth = sameYear && a.getMonth() === b.getMonth()

  if (sameMonth) {
    if (a.getDate() === b.getDate()) return formatDate(a)
    return `${a.getDate()} - ${formatDate(b)}`
  }
  if (sameYear) {
    return `${a.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${formatDate(b)}`
  }
  return `${formatDate(a)} - ${formatDate(b)}`
}

/** "in 5 days" / "3 days ago" / "today". */
export function formatRelative(value: unknown): string {
  const d = toDate(value)
  if (!d) return ''
  const dayMs = 86_400_000
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfTarget = new Date(d)
  startOfTarget.setHours(0, 0, 0, 0)
  const days = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / dayMs)

  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days > 0) return days < 30 ? `in ${days} days` : `in ${Math.round(days / 30)} months`
  const past = Math.abs(days)
  return past < 30 ? `${past} days ago` : `${Math.round(past / 30)} months ago`
}

/**
 * Derives the live status from dates when the stored `status` is missing or
 * stale. Organizers rarely update it by hand, so dates are the better source.
 */
export type EventStatus = 'upcoming' | 'live' | 'completed'

export function deriveStatus(hackathon: {
  startDate?: unknown
  endDate?: unknown
  status?: unknown
}): EventStatus {
  const start = toDate(hackathon?.startDate)
  const end = toDate(hackathon?.endDate)
  const now = Date.now()

  if (start && end) {
    // End date is a calendar day; treat the whole day as still live.
    const endOfEnd = new Date(end)
    endOfEnd.setHours(23, 59, 59, 999)
    if (now < start.getTime()) return 'upcoming'
    if (now > endOfEnd.getTime()) return 'completed'
    return 'live'
  }

  const stored = String(hackathon?.status || '')
  if (stored === 'upcoming' || stored === 'live' || stored === 'completed') return stored
  return 'upcoming'
}

export const STATUS_META: Record<EventStatus, { label: string; badge: string }> = {
  live: { label: 'Live now', badge: 'pv-badge--success' },
  upcoming: { label: 'Upcoming', badge: 'pv-badge--accent' },
  completed: { label: 'Completed', badge: '' },
}

/**
 * Stable cover gradient + initials for an event, derived from its name so the
 * same event always looks the same without anyone uploading artwork.
 */
const COVER_HUES = [214, 258, 190, 152, 24, 340, 280, 42]

export function eventCover(name: unknown): { background: string; initials: string } {
  const text = String(name || 'Event').trim() || 'Event'

  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100_000
  }
  const hue = COVER_HUES[hash % COVER_HUES.length]
  const hue2 = (hue + 26) % 360

  return {
    background: `linear-gradient(135deg, hsl(${hue} 62% 46%), hsl(${hue2} 58% 34%))`,
    initials: text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join(''),
  }
}

/** Total prize pool, tolerating both `prizePool.total` and a bare number. */
export function prizeTotal(hackathon: { prizePool?: unknown }): number {
  const pool = hackathon?.prizePool as { total?: unknown } | number | undefined
  if (typeof pool === 'number') return Number.isFinite(pool) ? pool : 0
  const total = Number((pool as { total?: unknown })?.total)
  return Number.isFinite(total) ? total : 0
}

export function prizeCurrency(hackathon: { prizePool?: unknown }): string {
  const pool = hackathon?.prizePool as { currency?: unknown } | undefined
  const currency = pool?.currency
  return currency ? String(currency) : 'XLM'
}

/** On-chain balance when synced; otherwise sponsor-reported funding. */
export function escrowBalanceXlm(hackathon: {
  onChainBalanceXlm?: unknown
  sponsorFundingXlm?: unknown
  sponsorAddress?: unknown
}): number {
  const sponsorFunding = Number(hackathon.sponsorFundingXlm ?? 0)
  const hasSponsor = Boolean(String(hackathon.sponsorAddress || '').trim())

  // Per-hackathon sponsor funding is authoritative in production (Supabase column).
  if (hasSponsor && Number.isFinite(sponsorFunding) && sponsorFunding > 0) {
    return sponsorFunding
  }

  const onChain = Number(hackathon.onChainBalanceXlm ?? 0)
  if (Number.isFinite(onChain) && onChain > 0) return onChain

  return Number.isFinite(sponsorFunding) ? sponsorFunding : 0
}

/** True when a sponsor has funded at least the full declared prize pool. */
export function isEscrowFullyFunded(hackathon: {
  prizePool?: unknown
  onChainBalanceXlm?: unknown
  sponsorFundingXlm?: unknown
  sponsorAddress?: unknown
  sponsorFunded?: unknown
}): boolean {
  if (hackathon.sponsorFunded === true) return true

  const hasSponsor = Boolean(String(hackathon.sponsorAddress || '').trim())
  if (!hasSponsor) return false

  const total = prizeTotal(hackathon)
  const balance = escrowBalanceXlm(hackathon)
  if (balance <= 0) return false
  if (total <= 0) return true
  return balance >= total
}

/** Normalize funding flags when loading from cache or API. */
export function enrichHackathonFunding<T extends {
  prizePool?: unknown
  onChainBalanceXlm?: unknown
  sponsorFundingXlm?: unknown
  sponsorAddress?: unknown
  sponsorFunded?: unknown
}>(hackathon: T): T {
  if (hackathon.sponsorFunded === true) return hackathon
  if (isEscrowFullyFunded(hackathon)) {
    return { ...hackathon, sponsorFunded: true }
  }
  return hackathon
}

export function participantCount(hackathon: {
  participants?: unknown
  participantCount?: unknown
}): number {
  if (Array.isArray(hackathon?.participants)) return hackathon.participants.length
  const n = Number(hackathon?.participantCount)
  return Number.isFinite(n) ? n : 0
}

/** Stellar Expert testnet links — this app is Stellar-only. */
export function stellarTxUrl(hash: unknown): string {
  return `https://stellar.expert/explorer/testnet/tx/${String(hash || '')}`
}

export function stellarAccountUrl(address: unknown): string {
  return `https://stellar.expert/explorer/testnet/account/${String(address || '')}`
}
