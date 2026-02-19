import { UserRole } from '../../types/holder'
import { Hackathon } from '../../types/hackathon'

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

/**
 * Gets hackathons from localStorage
 */
export function getHackathonsFromStorage(): Hackathon[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
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
