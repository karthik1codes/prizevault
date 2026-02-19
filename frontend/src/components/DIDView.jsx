import React, { useState } from 'react'
import './DIDView.css'
import './shared.css'

function DIDView() {
  const [did, setDid] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [didMethod, setDidMethod] = useState('key')
  const [copySuccess, setCopySuccess] = useState(false)
  const [didGeneratedAt, setDidGeneratedAt] = useState(null)

  // Generate a DID based on the selected method
  const generateDID = async () => {
    setIsGenerating(true)
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      let generatedDID = ''
      
      if (didMethod === 'key') {
        // Generate did:key format
        // In a real implementation, this would use a cryptographic library
        const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
        const multibase = 'z' + randomBytes
        generatedDID = `did:key:${multibase}`
      } else if (didMethod === 'web') {
        // Generate did:web format
        const randomId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
        generatedDID = `did:web:example.com:${randomId}`
      } else if (didMethod === 'ethr') {
        // Generate did:ethr format (Ethereum-based)
        const randomAddress = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(20)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
        generatedDID = `did:ethr:${randomAddress}`
      }
      
      setDid(generatedDID)
      setDidGeneratedAt(new Date())
    } catch (error) {
      console.error('Error generating DID:', error)
      alert('Failed to generate DID. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    if (did) {
      navigator.clipboard.writeText(did)
        .then(() => {
          setCopySuccess(true)
          setTimeout(() => setCopySuccess(false), 2000)
        })
        .catch(err => {
          console.error('Failed to copy:', err)
          setCopySuccess(false)
        })
    }
  }

  const clearDID = () => {
    setDid('')
  }

  return (
    <section className="did-view">
      <div className="did-card">
        <div className="did-header">
          <h2 className="did-title">Create DID</h2>
          <p className="did-subtitle">Generate a Decentralized Identifier</p>
        </div>
        
        <div className="did-content">
          <div className="did-method-selector">
            <label htmlFor="did-method">DID Method:</label>
            <select 
              id="did-method"
              value={didMethod} 
              onChange={(e) => setDidMethod(e.target.value)}
              className="did-select"
              disabled={!!did}
            >
              <option value="key">did:key</option>
              <option value="web">did:web</option>
              <option value="ethr">did:ethr</option>
            </select>
          </div>

          {did ? (
            <div className="did-result">
              <div className="did-label">Generated DID:</div>
              <div className="did-string-container">
                <code className="did-string">{did}</code>
                <div className="did-actions">
                  <button 
                    className="btn btn-secondary btn-small" 
                    onClick={copyToClipboard}
                    title="Copy to clipboard"
                  >
                    {copySuccess ? '✓ Copied!' : '📋 Copy'}
                  </button>
                  <button 
                    className="btn btn-text btn-small" 
                    onClick={clearDID}
                    title="Clear"
                  >
                    ✕ Clear
                  </button>
                </div>
              </div>
              <div className="did-info">
                <span className="did-method-badge">{didMethod}</span>
                <span className="did-timestamp">
                  Generated: {didGeneratedAt ? didGeneratedAt.toLocaleString() : 'Just now'}
                </span>
              </div>
            </div>
          ) : (
            <div className="did-empty">
              <div className="did-icon">🔑</div>
              <p className="did-message">Click the button below to generate a new DID</p>
            </div>
          )}

          <button 
            className="btn btn-primary btn-generate" 
            onClick={generateDID}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Create DID'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default DIDView

