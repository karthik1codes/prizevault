import { useCallback, useEffect, useState } from 'react'
import { Hackathon } from '../types/hackathon'
import { getHackathonsFromStorage } from '../holder/utils/roleDetection'
import { subscribeHackathonsDatasetChanged } from '../utils/hackathonSync'
import { PROPOSALS_STORAGE_KEY, getPayoutProposals } from '../utils/payoutProposalsStorage'

/**
 * Live hackathon list. Re-reads on same-tab CustomEvent, other-tab storage
 * event, BroadcastChannel and bfcache restore -- all handled by
 * subscribeHackathonsDatasetChanged.
 *
 * Replaces the useMemo([]) / manual-listener pattern that was copied into six
 * components, one of which (PayoutProposal) never refreshed at all.
 */
export function useHackathons(filterFn?: (h: Hackathon) => boolean): {
  hackathons: Hackathon[]
  reload: () => void
} {
  const [hackathons, setHackathons] = useState<Hackathon[]>(() => getHackathonsFromStorage())

  const reload = useCallback(() => setHackathons(getHackathonsFromStorage()), [])

  useEffect(() => subscribeHackathonsDatasetChanged(reload), [reload])

  const list = typeof filterFn === 'function' ? hackathons.filter(filterFn) : hackathons
  return { hackathons: list, reload }
}

/** Live payout proposals, kept in sync with the same events. */
export function usePayoutProposals(): {
  proposals: Record<string, unknown>[]
  reload: () => void
} {
  const [proposals, setProposals] = useState<Record<string, unknown>[]>(() => getPayoutProposals())

  const reload = useCallback(() => setProposals(getPayoutProposals()), [])

  useEffect(() => {
    reload()
    return subscribeHackathonsDatasetChanged(reload, [PROPOSALS_STORAGE_KEY])
  }, [reload])

  return { proposals, reload }
}
