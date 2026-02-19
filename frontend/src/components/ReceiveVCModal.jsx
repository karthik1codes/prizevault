import React, { useState } from 'react'
import './ReceiveVCModal.css'
import './shared.css'

function ReceiveVCModal({ isOpen, onClose, onReceive }) {
  const [vcJson, setVcJson] = useState('')
  const [error, setError] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsValidating(true)

    try {
      // Parse and validate JSON
      if (!vcJson.trim()) {
        throw new Error('Please enter a credential JSON')
      }

      const parsedVC = JSON.parse(vcJson)

      // Basic validation
      if (!parsedVC.id) {
        throw new Error('Credential must have an "id" field')
      }

      if (!parsedVC.type) {
        throw new Error('Credential must have a "type" field')
      }

      if (!parsedVC.issuer) {
        throw new Error('Credential must have an "issuer" field')
      }

      if (!parsedVC.credentialSubject) {
        throw new Error('Credential must have a "credentialSubject" field')
      }

      // Call the receive callback
      await onReceive(parsedVC)
      
      // Reset form
      setVcJson('')
      onClose()
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your JSON syntax.')
      } else {
        setError(err.message || 'Failed to receive credential')
      }
    } finally {
      setIsValidating(false)
    }
  }

  const handlePasteExample = () => {
    const exampleVC = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1"
      ],
      "id": "http://example.edu/credentials/" + Date.now(),
      "type": ["VerifiableCredential", "ExampleCredential"],
      "issuer": {
        "id": "did:example:76e12ec712ebc6f1c221ebfeb1f",
        "name": "Example Issuer"
      },
      "issuanceDate": new Date().toISOString(),
      "credentialSubject": {
        "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
        "name": "Example Subject"
      },
      "proof": {
        "type": "Ed25519Signature2020",
        "created": new Date().toISOString(),
        "verificationMethod": "did:example:76e12ec712ebc6f1c221ebfeb1f#keys-1",
        "proofPurpose": "assertionMethod",
        "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjJp7467zuiq5L9z2m1Xv8GM4q2yrjF2nX5b7q"
      }
    }
    setVcJson(JSON.stringify(exampleVC, null, 2))
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Receive Verifiable Credential</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="vc-json">
              Credential JSON
              <button
                type="button"
                className="btn-link"
                onClick={handlePasteExample}
              >
                Paste Example
              </button>
            </label>
            <textarea
              id="vc-json"
              className={`form-textarea ${error ? 'error' : ''}`}
              value={vcJson}
              onChange={(e) => {
                setVcJson(e.target.value)
                setError('')
              }}
              placeholder="Paste or enter the Verifiable Credential JSON here..."
              rows={15}
              required
            />
            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isValidating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isValidating || !vcJson.trim()}
            >
              {isValidating ? 'Validating...' : 'Receive Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReceiveVCModal

