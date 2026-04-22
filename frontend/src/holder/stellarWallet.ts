/**
 * Stellar wallet adapter using Freighter browser wallet.
 */
import { getAddress, isConnected, requestAccess } from '@stellar/freighter-api'

const stellarWallet = {
  connector: null as null,
  async connect(): Promise<string[]> {
    const access = await requestAccess()
    if (access.error) throw new Error(access.error)
    const addrRes = await getAddress()
    if (addrRes.error || !addrRes.address) throw new Error(addrRes.error || 'No Stellar account returned')
    return [addrRes.address]
  },
  async reconnectSession(): Promise<string[]> {
    const connected = await isConnected()
    if (connected.error || !connected.isConnected) return []
    const addrRes = await getAddress()
    if (addrRes.error || !addrRes.address) return []
    return [addrRes.address]
  },
  async disconnect(): Promise<void> {
    return
  },
}

export default stellarWallet
