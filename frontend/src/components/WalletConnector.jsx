import React from 'react'
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi'
import { polygonMumbai } from 'wagmi/chains'
import './WalletConnector.css'
import './shared.css'

const TARGET_CHAIN_ID = polygonMumbai.id

function formatAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function WalletConnector() {
  const { address, isConnecting, isConnected } = useAccount()
  const { connect, connectors, pendingConnector, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { chain } = useNetwork()
  const { switchNetwork, isLoading: switchingNetwork, pendingChainId } = useSwitchNetwork({
    chainId: TARGET_CHAIN_ID,
  })

  const metamaskConnector = connectors.find((connector) => connector.id === 'metaMask')
  const metamaskReady = metamaskConnector?.ready

  const handleConnect = () => {
    if (metamaskConnector) {
      connect({ connector: metamaskConnector })
    }
  }

  const needsNetworkSwitch = isConnected && chain?.id !== TARGET_CHAIN_ID

  if (!metamaskConnector) {
    return (
      <a
        className="btn btn-primary wallet-link"
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
      >
        Install MetaMask
      </a>
    )
  }

  if (!metamaskReady) {
    return (
      <a
        className="btn btn-primary wallet-link"
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
      >
        Enable MetaMask
      </a>
    )
  }

  return (
    <div className="wallet-connector">
      {!isConnected && (
        <button
          className="btn btn-primary"
          onClick={handleConnect}
          disabled={isConnecting && pendingConnector?.id === metamaskConnector.id}
        >
          {isConnecting && pendingConnector?.id === metamaskConnector.id ? 'Connecting…' : 'Connect Wallet'}
        </button>
      )}

      {isConnected && (
        <>
          <span className="wallet-pill success">MetaMask</span>
          <button className="btn btn-secondary" onClick={() => disconnect()}>
            {formatAddress(address)}
          </button>
        </>
      )}

      {needsNetworkSwitch && (
        <button
          className="btn btn-tertiary"
          onClick={() => switchNetwork?.(TARGET_CHAIN_ID)}
          disabled={!switchNetwork || switchingNetwork || pendingChainId === TARGET_CHAIN_ID}
        >
          {switchingNetwork && pendingChainId === TARGET_CHAIN_ID ? 'Switching…' : 'Switch to Polygon'}
        </button>
      )}

      {error && <span className="wallet-error">{error.message}</span>}
    </div>
  )
}

export default WalletConnector

