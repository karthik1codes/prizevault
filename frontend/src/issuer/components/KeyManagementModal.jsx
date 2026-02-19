import React, { useState } from 'react'

export default function KeyManagementModal({ isOpen, onClose, keys, onRotate }) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleExportBBS = () => {
    const bbsKey = keys?.find((k) => k.type === 'BBS+')
    if (bbsKey) {
      navigator.clipboard.writeText(bbsKey.publicKey)
      alert('BBS+ public key copied to clipboard!')
    }
  }

  const handleRotate = async () => {
    if (!confirm('Are you sure you want to rotate keys? This will generate new keys.')) return
    setLoading(true)
    try {
      await onRotate()
      alert('Keys rotated successfully!')
    } catch (error) {
      console.error('Failed to rotate keys:', error)
      alert('Failed to rotate keys')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>DID Key Management</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="keys-list">
            {keys && keys.length > 0 ? (
              keys.map((key, index) => (
                <div key={index} className="key-item">
                  <div className="key-header">
                    <span className="key-type">{key.type}</span>
                    {key.type === 'BBS+' && (
                      <button className="btn-small" onClick={handleExportBBS}>
                        Export Public Key
                      </button>
                    )}
                  </div>
                  <div className="key-details">
                    <div className="key-row">
                      <span className="key-label">Public Key:</span>
                      <code className="key-value">{key.publicKey}</code>
                    </div>
                    {key.txHash && (
                      <div className="key-row">
                        <span className="key-label">Published:</span>
                        <a
                          href={`https://amoy.polygonscan.com/tx/${key.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Transaction
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No keys found</p>
            )}
          </div>

          <div className="key-actions">
            <button
              className="btn-primary"
              onClick={handleRotate}
              disabled={loading}
            >
              {loading ? 'Rotating...' : 'Rotate Keys'}
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

