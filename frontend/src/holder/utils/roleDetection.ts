import { UserRole } from '../../types/holder'
import { Hackathon } from '../../types/hackathon'
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from '../../constants/escrow'

const STORAGE_KEY = 'prize_vault_hackathons'

/**
 * Detects user role based on wallet address and hackathon data
 * @param walletAddress - The connected wallet address
 * @param hackathons - Array of hackathons to check against
 * @returns Detected role: 'sponsor', 'organizer', or 'participant'
 */
export function detectUserRole(
  walletAddress: string | null,
  hackathons: Hackathon[] = []
): UserRole {
  if (!walletAddress) return null

  // Load hackathons from localStorage if not provided
  let allHackathons = hackathons
  if (allHackathons.length === 0) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        allHackathons = JSON.parse(stored)
      }
    } catch (_) {
      // Ignore parse errors
    }
  }

  const normalizedAddress = walletAddress.toLowerCase()

  // Check if wallet is an organizer
  const isOrganizer = allHackathons.some(
    (h) => h.organizerAddress?.toLowerCase() === normalizedAddress
  )

  if (isOrganizer) return 'organizer'

  // Check if wallet is a sponsor
  const isSponsor = allHackathons.some(
    (h) => h.sponsorAddress?.toLowerCase() === normalizedAddress
  )

  if (isSponsor) return 'sponsor'

  // Check if wallet is a participant
  const isParticipant = allHackathons.some((h) =>
    h.participants?.some(
      (p) => p.payoutAddress?.toLowerCase() === normalizedAddress
    )
  )

  if (isParticipant) return 'participant'

  // Default to participant if no match (can register for hackathons)
  return 'participant'
}

const DEFAULT_HACKATHONS: Hackathon[] = [
  {
    id: 'hack_001',
    name: "RIFT '26",
    startDate: '2026-02-19',
    endDate: '2026-02-20',
    prizePool: { total: 10000, currency: 'ALGO', locked: true },
    organizerAddress: DEFAULT_ORGANIZER_ESCROW_ADDRESS,
    sponsorAddress: '',
    escrowAddress: DEFAULT_ORGANIZER_ESCROW_ADDRESS,
    status: 'live',
    participantCount: 0,
    participants: [],
    winnersSelected: false,
    payoutProposed: false,
    description: '24-hour hackathon across Bengaluru, Pune, Noida and Lucknow',
  },
]

/**
 * Gets hackathons from localStorage. Seeds default hackathons if storage is empty
 * so sponsor/participant views always have something to show.
 */
export function getHackathonsFromStorage(): Hackathon[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_HACKATHONS))
    return DEFAULT_HACKATHONS
  } catch (_) {
    // Ignore parse errors
  }
  return []
}

/**
 * Saves hackathons to localStorage
 */
export function saveHackathonsToStorage(hackathons: Hackathon[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hackathons))
  } catch (_) {
    // Ignore storage errors
  }
}
