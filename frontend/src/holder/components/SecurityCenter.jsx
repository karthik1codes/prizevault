import React, { useState } from 'react'
import { useHolderWallet } from '../context/HolderContext'
import { deriveKeyFromPassphrase, encryptWithKey } from '../utils/crypto'
import { downloadJson } from '../utils/ui'

export default function SecurityCenter() {
  const { state, updateSettings, logEvent } = useHolderWallet()
  const [passphrase, setPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [backupStatus, setBackupStatus] = useState('')
  // Filebase preset endpoints
  const filebaseEndpoints = {
    'filebase-ipfs': 'https://ipfs.filebase.io/api/v0',
    'web3-storage': 'https://w3s.link',
    'pinata': 'https://api.pinata.cloud',
    'custom': '',
  }

  // Determine current preset based on endpoint
  const getCurrentPreset = (endpoint) => {
    if (!endpoint) return 'custom'
    for (const [key, value] of Object.entries(filebaseEndpoints)) {
      if (value && endpoint === value) {
        return key
      }
    }
    return 'custom'
  }

  const [ipfsEndpoint, setIpfsEndpoint] = useState(state.settings.ipfs.endpoint)
  const [ipfsToken, setIpfsToken] = useState(state.settings.ipfs.token)
  const [ipfsMode, setIpfsMode] = useState(state.settings.ipfs.mode)
  const [ipfsStatus, setIpfsStatus] = useState('')
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(() => getCurrentPreset(state.settings.ipfs.endpoint))

  const handlePassphrase = async () => {
    if (!passphrase || passphrase !== confirmPassphrase) {
      setBackupStatus('Passphrases do not match.')
      return
    }
    logEvent('security:passphrase', 'Updated wallet passphrase requirements')
    updateSettings({
      security: {
        ...state.settings.security,
        passphraseSet: true,
      },
    })
    setBackupStatus('Passphrase registered for future backups.')
    setPassphrase('')
    setConfirmPassphrase('')
  }

  const handleBackup = async () => {
    if (!state.settings.security.passphraseSet) {
      setBackupStatus('Set a passphrase before creating encrypted backups.')
      return
    }
    if (!passphrase) {
      setBackupStatus('Enter passphrase to encrypt backup.')
      return
    }
    const data = {
      didProfiles: state.didProfiles,
      credentials: state.credentials,
      documents: state.documents,
      proofs: state.proofs,
      requests: state.requests,
    }
    const encoder = new TextEncoder()
    const { key, salt } = await deriveKeyFromPassphrase(passphrase)
    const { encrypted, iv } = await encryptWithKey(key, encoder.encode(JSON.stringify(data)))
    downloadJson('wallet-backup.json', {
      version: 1,
      salt: Array.from(new Uint8Array(salt)),
      iv: Array.from(new Uint8Array(iv)),
      ciphertext: Array.from(new Uint8Array(encrypted)),
    })
    setBackupStatus('Encrypted backup downloaded.')
    setPassphrase('')
    setConfirmPassphrase('')
    logEvent('security:backup', 'Exported encrypted wallet backup')
  }

  const handleEndpointPreset = (preset) => {
    setSelectedPreset(preset)
    if (preset === 'custom') {
      // Don't clear endpoint when switching to custom, let user edit it
    } else {
      setIpfsEndpoint(filebaseEndpoints[preset])
    }
  }

  const testIpfsConnection = async () => {
    if (!ipfsEndpoint) {
      setIpfsStatus('Error: Endpoint is required')
      return
    }

    if (ipfsMode !== 'client') {
      setIpfsStatus('Set mode to "Client upload" to test connection')
      return
    }

    setIsTestingConnection(true)
    setIpfsStatus('Testing connection...')

    try {
      // Dynamic import to avoid issues if ipfs-http-client is not available
      const { create: createIpfsClient } = await import('ipfs-http-client')
      
      const client = createIpfsClient({
        url: ipfsEndpoint,
        headers: ipfsToken
          ? {
              Authorization: `Bearer ${ipfsToken}`,
            }
          : undefined,
      })

      // Test connection by getting version
      const version = await client.version()
      setIpfsStatus(`✓ Connected successfully! IPFS version: ${version.version}`)
      logEvent('security:ipfs:test', 'IPFS connection test successful', { endpoint: ipfsEndpoint })
    } catch (error) {
      setIpfsStatus(`✗ Connection failed: ${error.message}`)
      logEvent('security:ipfs:test', 'IPFS connection test failed', { error: error.message })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleIpfsSave = () => {
    if (ipfsMode === 'client' && !ipfsEndpoint) {
      setIpfsStatus('Error: Endpoint is required for client mode')
      return
    }

    updateSettings({
      ipfs: {
        endpoint: ipfsEndpoint,
        token: ipfsToken,
        mode: ipfsMode,
      },
    })
    setIpfsStatus('Configuration saved successfully!')
    logEvent('security:ipfs', 'Updated IPFS storage configuration', { 
      mode: ipfsMode, 
      endpoint: ipfsEndpoint ? ipfsEndpoint.substring(0, 30) + '...' : 'none' 
    })
    
    // Clear status after 3 seconds
    setTimeout(() => setIpfsStatus(''), 3000)
  }

  return (
    <section className="module-section" id="module-security">
      <header className="module-heading">
        <h2>Wallet Security &amp; Backup</h2>
        <p>Configure encryption, IPFS storage endpoints, and create encrypted recovery bundles.</p>
      </header>

      <div className="panel-grid">
        <div className="panel">
          <h3>Backup passphrase</h3>
          <label className="field">
            <span>New passphrase</span>
            <input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} />
          </label>
          <label className="field">
            <span>Confirm</span>
            <input type="password" value={confirmPassphrase} onChange={(event) => setConfirmPassphrase(event.target.value)} />
          </label>
          <div className="button-row">
            <button type="button" className="button secondary" onClick={handlePassphrase}>
              Save passphrase
            </button>
            <button type="button" className="button primary" onClick={handleBackup}>
              Encrypted backup
            </button>
          </div>
          {backupStatus ? <div className="alert info">{backupStatus}</div> : null}
        </div>

        <div className="panel">
          <h3>IPFS Storage Configuration</h3>
          <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
            Configure IPFS storage for real document uploads. Filebase and other IPFS pinning services are supported.
          </p>
          
          <label className="field">
            <span>Storage Mode</span>
            <select 
              value={ipfsMode} 
              onChange={(event) => {
                setIpfsMode(event.target.value)
                setIpfsStatus('')
              }}
            >
              <option value="simulate">Simulate (no upload - local only)</option>
              <option value="client">Client upload (Filebase/web3.storage/IPFS)</option>
            </select>
            <small className="muted" style={{ display: 'block', marginTop: '0.25rem' }}>
              {ipfsMode === 'simulate' 
                ? 'Documents are encrypted locally but not uploaded to IPFS' 
                : 'Documents are encrypted and uploaded to IPFS via configured endpoint'}
            </small>
          </label>

          {ipfsMode === 'client' && (
            <>
              <label className="field">
                <span>Endpoint Preset</span>
                <select 
                  onChange={(event) => {
                    handleEndpointPreset(event.target.value)
                    setIpfsStatus('')
                  }}
                  value={selectedPreset}
                >
                  <option value="filebase-ipfs">Filebase IPFS API</option>
                  <option value="web3-storage">Web3.Storage</option>
                  <option value="pinata">Pinata</option>
                  <option value="custom">Custom endpoint</option>
                </select>
                <small className="muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                  Select a preset or choose "Custom" to enter your own endpoint
                </small>
              </label>

              <label className="field">
                <span>IPFS Endpoint URL</span>
                <input 
                  value={ipfsEndpoint} 
                  onChange={(event) => {
                    setIpfsEndpoint(event.target.value)
                    setIpfsStatus('')
                    // If user edits endpoint manually, switch to custom
                    if (selectedPreset !== 'custom') {
                      setSelectedPreset('custom')
                    }
                  }} 
                  placeholder="https://ipfs.filebase.io/api/v0" 
                  disabled={selectedPreset !== 'custom' && filebaseEndpoints[selectedPreset]}
                />
                <small className="muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                  <strong>Filebase:</strong> https://ipfs.filebase.io/api/v0<br/>
                  <strong>Web3.Storage:</strong> https://w3s.link<br/>
                  <strong>Custom IPFS node:</strong> http://localhost:5001/api/v0
                </small>
              </label>

              <label className="field">
                <span>API Token / Bearer Token</span>
                <input
                  value={ipfsToken}
                  onChange={(event) => {
                    setIpfsToken(event.target.value)
                    setIpfsStatus('')
                  }}
                  placeholder="Filebase API key or Bearer token"
                  type="password"
                />
                <small className="muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                  Required for Filebase and most IPFS pinning services. Get your API key from Filebase dashboard.
                </small>
              </label>

              <div className="button-row" style={{ marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="button ghost small" 
                  onClick={testIpfsConnection}
                  disabled={isTestingConnection || !ipfsEndpoint}
                >
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </button>
                <button 
                  type="button" 
                  className="button primary" 
                  onClick={handleIpfsSave}
                  disabled={!ipfsEndpoint}
                >
                  Save Configuration
                </button>
              </div>

              {ipfsStatus && (
                <div 
                  className="alert" 
                  style={{ 
                    marginTop: '1rem',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    background: ipfsStatus.includes('✓') ? '#1a3a2a' : ipfsStatus.includes('✗') ? '#3a1a1a' : '#1a2a3a',
                    border: `1px solid ${ipfsStatus.includes('✓') ? '#10b981' : ipfsStatus.includes('✗') ? '#ef4444' : '#3b82f6'}`,
                    color: ipfsStatus.includes('✓') ? '#10b981' : ipfsStatus.includes('✗') ? '#ef4444' : '#60a5fa'
                  }}
                >
                  {ipfsStatus}
                </div>
              )}

              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#1a1a1a', borderRadius: '6px', fontSize: '0.875rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Current Configuration:</strong>
                <div style={{ color: '#888' }}>
                  <div>Mode: <strong style={{ color: '#fff' }}>{ipfsMode === 'client' ? 'Client Upload' : 'Simulate'}</strong></div>
                  <div>Endpoint: <strong style={{ color: '#fff' }}>{ipfsEndpoint || 'Not set'}</strong></div>
                  <div>Token: <strong style={{ color: '#fff' }}>{ipfsToken ? '••••••••' : 'Not set'}</strong></div>
                </div>
              </div>
            </>
          )}

          {ipfsMode === 'simulate' && (
            <div style={{ marginTop: '1rem' }}>
              <button 
                type="button" 
                className="button secondary" 
                onClick={handleIpfsSave}
              >
                Save Configuration
              </button>
              <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                In simulate mode, documents are encrypted locally but not uploaded to IPFS. 
                Enable "Client upload" mode and configure an endpoint to enable real IPFS uploads.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}


