import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import SharedHeader from './components/SharedHeader'
import '../styles.css'
import './index.css'
import './metamask.css'
import foxLogo from './assets/metamask-fox.svg'

function shorten(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function MetaMaskDemo() {
  const [username, setUsername] = useState('')
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState(false)
  const [chainId, setChainId] = useState(null)

  // Get MetaMask provider specifically (handles multiple wallet scenarios)
  // STRICTLY filters for MetaMask only - rejects all other wallets
  const getMetaMaskProvider = () => {
    if (typeof window === 'undefined') {
      console.log('Window is undefined')
      return null
    }
    
    const ethereum = window.ethereum
    
    if (!ethereum) {
      console.log('window.ethereum is not available')
      return null
    }
    
    // If multiple wallets are installed, providers is an array
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      console.log('Multiple wallet providers detected, searching for MetaMask ONLY...')
      // STRICTLY find MetaMask - must have isMetaMask === true
      const metamaskProvider = ethereum.providers.find(provider => {
        // Must be MetaMask and NOT any other wallet
        return provider.isMetaMask === true && 
               !provider.isCoinbaseWallet && 
               !provider.isBraveWallet && 
               !provider.isTokenPocket &&
               !provider.isTrust &&
               !provider.isImToken &&
               !provider.isOneInch
      })
      
      if (metamaskProvider) {
        console.log('✅ MetaMask provider found and verified (no other wallet)')
        return metamaskProvider
      }
      console.log('❌ MetaMask not found in providers array - other wallets detected')
      return null
    }
    
    // Single provider - STRICTLY verify it's MetaMask
    if (ethereum.isMetaMask === true) {
      // Double-check it's not another wallet masquerading
      if (ethereum.isCoinbaseWallet || ethereum.isBraveWallet || ethereum.isTokenPocket) {
        console.log('❌ Provider claims to be MetaMask but is actually another wallet')
        return null
      }
      console.log('✅ Single MetaMask provider detected and verified')
      return ethereum
    }
    
    // Reject if it's clearly another wallet
    if (ethereum.isCoinbaseWallet || ethereum.isBraveWallet || ethereum.isTokenPocket || 
        ethereum.isTrust || ethereum.isImToken || ethereum.isOneInch) {
      console.log('❌ Another wallet detected (not MetaMask)')
      return null
    }
    
    // If isMetaMask is not set, we cannot verify it's MetaMask
    // Reject to be safe - user must have MetaMask with proper identification
    console.log('❌ Cannot verify MetaMask - provider does not have isMetaMask flag')
    return null
  }

  // Check if MetaMask is specifically installed (not other wallets)
  const isMetaMaskInstalled = () => {
    return getMetaMaskProvider() !== null
  }

  // Polygon Amoy chain ID (Mumbai deprecated April 2024)
  const POLYGON_AMOY_CHAIN_ID = '0x13882' // 80002 in decimal (Amoy testnet)
  // Mumbai (80001) is deprecated - using Amoy (80002) instead

  // Switch to Polygon Amoy testnet
  const switchToPolygonAmoy = async (provider) => {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_AMOY_CHAIN_ID }],
      })
      return true
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Try to add the chain
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: POLYGON_AMOY_CHAIN_ID,
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc-amoy.polygon.technology'],
                blockExplorerUrls: ['https://amoy.polygonscan.com/'],
              },
            ],
          })
          return true
        } catch (addError) {
          console.error('Error adding Polygon Amoy chain:', addError)
          return false
        }
      } else {
        console.error('Error switching to Polygon Amoy:', switchError)
        return false
      }
    }
  }

  const handleDisconnect = async () => {
    const provider = getMetaMaskProvider()
    
    // EXPLICIT LOGOUT - clear all state and session data
    console.log('User explicitly logging out - clearing session...')
    
    // Clear local state completely
    setWalletConnected(false)
    setWalletAddress('')
    setChainId(null)
    setStatusMessage('info:Wallet disconnected. Click "Connect MetaMask" to login again - the MetaMask popup will appear.')
    setIsConnecting(false)
    
    // Clear all localStorage to end session
    localStorage.removeItem('metamask_connected')
    localStorage.removeItem('metamask_address')
    localStorage.removeItem('metamask_connected_at')
    
    // Note: MetaMask doesn't allow programmatic revocation of permissions
    // However, by always requesting permissions on connect, the popup will show
    console.log('Session ended. Next connection will show MetaMask popup.')
    
    if (provider) {
      try {
        // Just log current permissions for debugging
        const permissions = await provider.request({ 
          method: 'wallet_getPermissions' 
        })
        console.log('Current permissions after logout:', permissions)
        console.log('Note: Next connection will request permissions again, showing popup.')
      } catch (error) {
        console.log('Could not check permissions on logout:', error)
      }
    }
  }

  const handleAccountsChanged = (accounts) => {
    // Keep connection alive - only update account if changed
    // Don't disconnect unless user explicitly logs out
    if (accounts && accounts.length > 0) {
      const newAddress = accounts[0]
      const addressChanged = walletAddress && walletAddress !== newAddress
      
      setWalletAddress(newAddress)
      setWalletConnected(true)
      setStatusMessage(addressChanged ? 'success:Account changed - connection maintained' : 'success:Connection maintained')
      localStorage.setItem('metamask_connected', 'true')
      localStorage.setItem('metamask_address', newAddress)
      localStorage.setItem('metamask_connected_at', new Date().toISOString())
    } else {
      // Only disconnect if user explicitly logged out
      // If accounts array is empty but we're still connected, maintain connection
      // This handles cases where MetaMask is temporarily locked
      if (walletConnected) {
        setStatusMessage('info:MetaMask account temporarily unavailable. Connection will be restored when unlocked.')
        // Don't call handleDisconnect() - maintain session connection
      }
    }
  }

  const handleChainChanged = (chainId) => {
    setChainId(chainId)
    setStatusMessage(`info:Network changed to chain ID: ${chainId}`)
    // Optionally switch back to Polygon Amoy
    const provider = getMetaMaskProvider()
    if (provider && chainId !== POLYGON_AMOY_CHAIN_ID) {
      setStatusMessage('info:Switching to Polygon Amoy testnet...')
      switchToPolygonAmoy(provider)
    }
  }

  const checkConnection = async () => {
    const provider = getMetaMaskProvider()
    if (!provider) return
    
    try {
      // Check if we have a saved connection in localStorage
      const savedConnection = localStorage.getItem('metamask_connected')
      const savedAddress = localStorage.getItem('metamask_address')
      
      // Try to get accounts from MetaMask
      const accounts = await provider.request({ method: 'eth_accounts' })
      
      if (accounts && accounts.length > 0) {
        // MetaMask has accounts - restore connection
        const currentAddress = accounts[0]
        setWalletAddress(currentAddress)
        setWalletConnected(true)
        
        // If address changed, update it
        if (savedAddress && savedAddress !== currentAddress) {
          setStatusMessage('success:MetaMask reconnected - account updated')
        } else {
          setStatusMessage('success:MetaMask connection restored - session maintained')
        }
        
        localStorage.setItem('metamask_connected', 'true')
        localStorage.setItem('metamask_address', currentAddress)
        localStorage.setItem('metamask_connected_at', new Date().toISOString())
        
        // Get current chain ID
        try {
          const currentChainId = await provider.request({ method: 'eth_chainId' })
          setChainId(currentChainId)
        } catch (error) {
          console.error('Error getting chain ID:', error)
        }
      } else if (savedConnection === 'true' && savedAddress) {
        // We have a saved connection but MetaMask doesn't have accounts
        // This might mean MetaMask is locked - maintain connection state
        setWalletAddress(savedAddress)
        setWalletConnected(true)
        setStatusMessage('info:MetaMask connection maintained. Please unlock MetaMask if needed.')
        console.log('Maintaining session connection - MetaMask may be locked')
      }
    } catch (error) {
      console.error('Error checking connection:', error)
      // On error, try to restore from localStorage if we had a connection
      const savedConnection = localStorage.getItem('metamask_connected')
      const savedAddress = localStorage.getItem('metamask_address')
      if (savedConnection === 'true' && savedAddress) {
        setWalletAddress(savedAddress)
        setWalletConnected(true)
        setStatusMessage('info:Connection maintained from previous session')
      }
    }
  }

  // Check if MetaMask is installed and set up listeners
  // This runs on component mount and maintains connection throughout session
  useEffect(() => {
    const provider = getMetaMaskProvider()
    if (provider) {
      setHasMetaMask(true)
      
      // Restore connection from previous session
      checkConnection()
      
      // Set up event listeners to maintain connection
      // accountsChanged: Update account but maintain connection
      provider.on('accountsChanged', handleAccountsChanged)
      
      // chainChanged: Update chain but maintain connection
      provider.on('chainChanged', handleChainChanged)
      
      // disconnect: Only handle if it's a real disconnect event
      // Note: MetaMask doesn't emit 'disconnect' for account changes
      provider.on('disconnect', (error) => {
        console.log('MetaMask disconnect event:', error)
        // Only disconnect if it's a real disconnect, not just account change
        // Maintain session connection for temporary disconnects
        if (error && error.code === 1013) {
          // Provider disconnected - but we'll try to maintain session
          setStatusMessage('info:MetaMask temporarily disconnected. Connection will be restored.')
        }
      })
      
      // Get initial chain ID
      provider.request({ method: 'eth_chainId' })
        .then(setChainId)
        .catch(console.error)
      
      // Set up periodic connection check to maintain session
      const connectionCheckInterval = setInterval(() => {
        const currentProvider = getMetaMaskProvider()
        if (currentProvider) {
          // Check localStorage to see if we should maintain connection
          const savedConnection = localStorage.getItem('metamask_connected')
          if (savedConnection === 'true') {
            // Silently check if connection is still valid
            currentProvider.request({ method: 'eth_accounts' })
              .then(accounts => {
                if (accounts && accounts.length > 0) {
                  // Connection is still valid - update if needed
                  const savedAddress = localStorage.getItem('metamask_address')
                  if (accounts[0] !== savedAddress) {
                    // Account changed - update state
                    setWalletAddress(accounts[0])
                    setWalletConnected(true)
                    localStorage.setItem('metamask_address', accounts[0])
                  }
                }
              })
              .catch(() => {
                // Connection check failed - but maintain session state
                console.log('Connection check failed, but maintaining session')
              })
          }
        }
      }, 30000) // Check every 30 seconds
      
      return () => {
        const currentProvider = getMetaMaskProvider()
        if (currentProvider) {
          currentProvider.removeListener('accountsChanged', handleAccountsChanged)
          currentProvider.removeListener('chainChanged', handleChainChanged)
          currentProvider.removeListener('disconnect', handleDisconnect)
        }
        clearInterval(connectionCheckInterval)
      }
    } else {
      setHasMetaMask(false)
    }
  }, [])

  const connectWallet = async () => {
    // STRICTLY get MetaMask provider only - reject all other wallets
    const provider = getMetaMaskProvider()
    
    // Verify MetaMask is specifically installed (not other wallets)
    if (!provider) {
      setStatusMessage('error:MetaMask extension is not installed or detected. Please install MetaMask extension. Other wallet extensions are not supported.')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    // Double-check it's actually MetaMask before proceeding
    if (!provider.isMetaMask || provider.isCoinbaseWallet || provider.isBraveWallet) {
      setStatusMessage('error:Only MetaMask wallet is supported. Please install MetaMask extension.')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    setIsConnecting(true)
    setStatusMessage('info:Opening MetaMask extension popup... Please approve the connection in the MetaMask popup (not other wallets).')

    try {
      // ALWAYS request permissions explicitly FIRST - this ensures MetaMask popup shows every time
      // wallet_requestPermissions will show the MetaMask popup (not other wallets)
      console.log('Step 1: Requesting permissions from MetaMask ONLY (popup will appear)...')
      console.log('Provider verified as MetaMask:', { 
        isMetaMask: provider.isMetaMask, 
        isCoinbase: provider.isCoinbaseWallet,
        isBrave: provider.isBraveWallet 
      })
      console.log('Current connection state:', { walletConnected, walletAddress })
      
      // This is the key: wallet_requestPermissions ALWAYS shows MetaMask popup
      // It will show either a "Connect" or "Switch Account" popup from MetaMask
      await provider.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      })
      console.log('Step 2: Permissions granted from MetaMask, now getting accounts...')
      
      // Now request accounts from MetaMask - this should return the accounts after permission approval
      console.log('Step 3: Requesting accounts from MetaMask...')
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      })
      
      console.log('Step 4: Accounts received from MetaMask:', accounts)
      
      if (!accounts || accounts.length === 0) {
        setStatusMessage('error:No accounts found. Please unlock MetaMask and try again.')
        setWalletConnected(false)
        setWalletAddress('')
        setChainId(null)
        setIsConnecting(false)
        return
      }

      const connectedAddress = accounts[0]
      console.log('Connected address:', connectedAddress)
      
      // Check if account changed
      const accountChanged = walletAddress && walletAddress !== connectedAddress
      
      // Step 3: Get current chain ID
      let currentChainId
      try {
        currentChainId = await provider.request({ method: 'eth_chainId' })
        console.log('Current chain ID:', currentChainId)
        setChainId(currentChainId)
      } catch (error) {
        console.error('Error getting chain ID:', error)
      }

      // Step 4: Optionally switch to Polygon Amoy (you can make this optional)
      // Uncomment if you want to automatically switch to Polygon Amoy
      // if (currentChainId !== POLYGON_AMOY_CHAIN_ID) {
      //   setStatusMessage('info:Switching to Polygon Amoy testnet...')
      //   await switchToPolygonAmoy(provider)
      // }

      // Step 5: Set connected state
      setWalletAddress(connectedAddress)
      setWalletConnected(true)
      setStatusMessage(accountChanged 
        ? 'success:Account switched successfully! New account verified.' 
        : 'success:MetaMask connected successfully! Account verified.')
      
      // Save username if provided
      if (username) {
        localStorage.setItem('metamask_username', username)
      }
      
      // Save connection state
      localStorage.setItem('metamask_connected', 'true')
      localStorage.setItem('metamask_address', connectedAddress)
      localStorage.setItem('metamask_connected_at', new Date().toISOString())
      
    } catch (error) {
      console.error('Error connecting to MetaMask:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      })
      
      // Handle user rejection
      if (error.code === 4001) {
        setStatusMessage('error:Connection rejected. Please click "Connect MetaMask" again and approve the connection in the MetaMask popup.')
      } 
      // Handle pending request
      else if (error.code === -32002) {
        setStatusMessage('info:Connection request pending. Please check and approve in the MetaMask extension popup.')
      } 
      // Handle other errors
      else if (error.message) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('user rejected') || errorMsg.includes('user denied')) {
          setStatusMessage('error:Connection rejected. Please click "Connect MetaMask" again and approve in the MetaMask extension.')
        } else if (errorMsg.includes('no active wallet') || errorMsg.includes('wallet not found')) {
          setStatusMessage('error:No active wallet found. Please unlock MetaMask extension and try again.')
        } else if (errorMsg.includes('please unlock')) {
          setStatusMessage('error:MetaMask is locked. Please unlock MetaMask extension and try again.')
        } else {
          setStatusMessage(`error:Connection failed: ${error.message}`)
        }
      } else {
        setStatusMessage('error:Connection failed. Please ensure MetaMask is unlocked and try again.')
      }
      
      // Clear connection state on error if not already connected
      if (!walletConnected) {
        setWalletAddress('')
        setChainId(null)
      }
    } finally {
      setIsConnecting(false)
    }
  }

  // Alias for handleConnect to match the pattern
  const handleConnect = connectWallet

  const handleSave = () => {
    if (!username) {
      setStatusMessage('error:Add a username before saving')
      return
    }
    localStorage.setItem('metamask_username', username)
    setStatusMessage(`success:Username ${username} saved for session`)
  }

  // Load saved username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('metamask_username')
    if (savedUsername) {
      setUsername(savedUsername)
    }
  }, [])

  return (
    <div className="metamask-page">
      <div className="global-noise"></div>
      <SharedHeader activeTab="metamask" />
      <div className="metamask-sub-header">
        <div className="metamask-sub-header-content">
          <div>
            <h1>MetaMask Login</h1>
            <p>Connect your MetaMask wallet and authenticate to access the issuer console and credential management tools.</p>
          </div>
        </div>
      </div>
      <main className="metamask-main">
        <section className="metamask-hero">
          <div className="metamask-hero-logo">
            <div className="metamask-logo-badge">
              <img src={foxLogo} alt="MetaMask fox logo" />
            </div>
            <span>MetaMask</span>
          </div>
          <p>
            Simulate the wallet connection flow before launching the full issuer console. Couple a human-friendly
            username with MetaMask authentication for traceability.
          </p>
        </section>

        <section className="metamask-section">
          <div className="metamask-grid">
            <article className="metamask-card primary">
              <h3>Issuer credentials</h3>
              <p className="muted">
                Enter a username and connect MetaMask to unlock credential issuance tools. All data stays local in this
                demo.
              </p>
              <label className="field">
                <span>Username</span>
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="registrar.alex" />
              </label>
              <div className="button-row">
                {!hasMetaMask ? (
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="button primary"
                  >
                    Install MetaMask
                  </a>
                ) : (
                  <>
                    {!walletConnected ? (
                      <button 
                        type="button" 
                        className="button primary" 
                        onClick={handleConnect}
                        disabled={isConnecting}
                      >
                        {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="button primary" 
                        onClick={handleConnect}
                        disabled={isConnecting}
                      >
                        {isConnecting ? 'Reconnecting...' : 'Reconnect MetaMask'}
                      </button>
                    )}
                    <button type="button" className="button secondary" onClick={handleSave}>
                      Save username
                    </button>
                    {walletConnected && (
                      <button type="button" className="button ghost" onClick={handleDisconnect}>
                        Logout
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="metamask-status">
                <span className={`status-dot ${walletConnected ? 'online' : ''}`} />
                <div>
                  <strong>{walletConnected ? 'Wallet connected & verified' : 'Wallet disconnected'}</strong>
                  <p className="muted">
                    {walletConnected ? (
                      <>
                        <span style={{ wordBreak: 'break-all', display: 'block', marginBottom: '4px' }}>
                          {walletAddress}
                        </span>
                        <small style={{ display: 'block', opacity: 0.8 }}>
                          Verified account: {shorten(walletAddress)}
                        </small>
                        {chainId && (
                          <small style={{ display: 'block', opacity: 0.7, marginTop: '4px', fontSize: '0.85rem' }}>
                            Network: {chainId === '0x13882' ? 'Polygon Amoy' : `Chain ID: ${chainId}`}
                            {chainId !== '0x13882' && walletConnected && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const provider = getMetaMaskProvider()
                                  if (provider) {
                                    setStatusMessage('info:Switching to Polygon Amoy testnet...')
                                    await switchToPolygonAmoy(provider)
                                  }
                                }}
                                style={{
                                  marginLeft: '8px',
                                  padding: '2px 8px',
                                  fontSize: '0.75rem',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  cursor: 'pointer'
                                }}
                              >
                                Switch to Polygon Amoy
                              </button>
                            )}
                          </small>
                        )}
                        {localStorage.getItem('metamask_connected_at') && (
                          <small style={{ display: 'block', opacity: 0.6, marginTop: '4px', fontSize: '0.85rem' }}>
                            Connected: {new Date(localStorage.getItem('metamask_connected_at')).toLocaleString()}
                          </small>
                        )}
                      </>
                    ) : hasMetaMask ? (
                      'Click "Connect MetaMask" to open the MetaMask extension and verify your account'
                    ) : (
                      'MetaMask extension not detected. Please install MetaMask.'
                    )}
                  </p>
                </div>
              </div>
              {statusMessage ? (
                <div className={`alert ${statusMessage.startsWith('success:') ? 'success' : statusMessage.startsWith('error:') ? 'error' : 'info'}`}>
                  {statusMessage.replace(/^(success|error|info):/, '')}
                </div>
              ) : null}
            </article>

            <article className="metamask-card outline">
              <h3>What to expect</h3>
              <ul className="metamask-steps">
                <li>Username becomes part of issuance and revocation audit trails.</li>
                <li>
                  MetaMask connection in production requests signature permissions only until you issue or revoke
                  credentials.
                </li>
                <li>Disconnect any time to invalidate the active issuer session.</li>
              </ul>
              <p className="muted">
                Ready to deploy? Wire this flow into your issuer dashboard so every credential action is traceable and
                wallet-backed.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="metamask-footer">
        <p>MetaMask login demo for the Ciphers decentralized credential network.</p>
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MetaMaskDemo />
  </React.StrictMode>,
)


