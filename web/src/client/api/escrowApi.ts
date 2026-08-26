/**
 * Frontend client for PrizeVault Soroban escrow API.
 * Same-origin `/api` under Next.js (`npm run dev` in web/), or Vite proxy to :3000.
 */

export type EscrowApiResponse = {
  success: boolean
  txHash: string
  error: string
}

export type EscrowPayout = {
  winner_address: string
  /** Integer stroops as string (1 XLM = 10_000_000). */
  amount: string
}

function apiBase(): string {
  // Next.js (client)
  try {
    const next = (process.env as { NEXT_PUBLIC_API_BASE_URL?: string }).NEXT_PUBLIC_API_BASE_URL
    if (next) return next.replace(/\/$/, '')
  } catch {
    // ignore
  }
  // Vite
  try {
    const vite = (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env
      ?.VITE_API_BASE_URL
    if (vite) return vite.replace(/\/$/, '')
  } catch {
    // ignore
  }
  return ''
}

export async function postEscrow(
  path: string,
  body: Record<string, unknown>,
): Promise<EscrowApiResponse> {
  let response: Response
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Network error reaching PrizeVault API (is Next.js / the API server running?)'
    return { success: false, txHash: '', error: message }
  }

  let data: Partial<EscrowApiResponse> = {}
  try {
    data = (await response.json()) as Partial<EscrowApiResponse>
  } catch {
    return {
      success: false,
      txHash: '',
      error: `Invalid JSON from API (HTTP ${response.status})`,
    }
  }

  return {
    success: Boolean(data.success),
    txHash: typeof data.txHash === 'string' ? data.txHash : '',
    error: typeof data.error === 'string' ? data.error : response.ok ? '' : `HTTP ${response.status}`,
  }
}

/** Convert XLM (number or decimal string) to stroops string for the contract. */
export function xlmToStroops(xlm: number | string): string {
  const raw = String(xlm).trim()
  if (!raw || Number.isNaN(Number(raw))) {
    throw new Error(`Invalid XLM amount: ${xlm}`)
  }
  const negative = raw.startsWith('-')
  const unsigned = negative ? raw.slice(1) : raw
  const [wholePart, fracPart = ''] = unsigned.split('.')
  const whole = wholePart.replace(/\D/g, '') || '0'
  const frac = (fracPart.replace(/\D/g, '') + '0000000').slice(0, 7)
  const stroops = BigInt(whole) * 10_000_000n + BigInt(frac)
  if (negative && stroops !== 0n) {
    throw new Error('Amount must be non-negative')
  }
  return stroops.toString()
}

/**
 * Allocate a numeric on-chain proposal id (fits Soroban u64 / JS safe integer).
 * Stored on the local proposal as `onChainProposalId`.
 */
export function allocateOnChainProposalId(): number {
  return Date.now()
}
