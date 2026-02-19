import React, { useMemo, useState } from 'react'
import { useHolderWallet } from '../context/HolderContext'
import { formatDateTime, truncate } from '../utils/ui'

export default function DocumentUpload() {
  const { state, encryptAndStoreDocument } = useHolderWallet()
  const [file, setFile] = useState(null)
  const [credentialId, setCredentialId] = useState('')
  const [description, setDescription] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')

  const credentialOptions = useMemo(
    () => state.credentials.map((credential) => ({ id: credential.id, title: credential.title })),
    [state.credentials],
  )

  const documents = state.documents

  const handleUpload = async () => {
    if (!file) {
      setError('Select a file to encrypt and upload.')
      return
    }
    setError('')
    setStatusMessage('Encrypting document…')
    
    try {
      const result = await encryptAndStoreDocument({
        file,
        credentialId: credentialId || undefined,
        description,
      })
      
      // Determine upload status based on storage mode
      const isSimulated = state.settings.ipfs.mode === 'simulate'
      const isUploaded = result.storage?.uploaded || (!isSimulated && state.settings.ipfs.endpoint && result.storage?.result)
      
      if (isUploaded && result.ipfsUrl) {
        setStatusMessage(`✓ Successfully uploaded to IPFS! View at: ${result.ipfsUrl}`)
      } else if (isUploaded) {
        setStatusMessage(`✓ Successfully uploaded to IPFS! CID: ${result.cid}`)
      } else if (isSimulated) {
        setStatusMessage(`✓ Encrypted and stored locally (simulated). CID: ${result.cid}`)
      } else if (state.settings.ipfs.mode === 'client' && !state.settings.ipfs.endpoint) {
        setStatusMessage(`✓ Encrypted (IPFS not configured). CID: ${result.cid}`)
      } else {
        setStatusMessage(`✓ Encrypted and stored. CID: ${result.cid}`)
      }
      
      setFile(null)
      setDescription('')
      setCredentialId('')
      
      // Clear status message after 5 seconds
      setTimeout(() => setStatusMessage(''), 5000)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to encrypt and upload document')
      setStatusMessage('')
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000)
    }
  }

  return (
    <section className="module-section" id="module-documents">
      <header className="module-heading">
        <h2>Encrypted Document Upload</h2>
        <p>Encrypt student documents locally and record immutable IPFS references.</p>
      </header>

      <div className="panel-grid">
        <div className="panel upload-panel">
          <h3>Upload artifact</h3>
          <p className="muted">Supported: PDF, PNG, JPG. Maximum size limited by browser memory.</p>
          <label className="field">
            <span>Select file</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          <label className="field">
            <span>Linked credential (optional)</span>
            <select value={credentialId} onChange={(event) => setCredentialId(event.target.value)}>
              <option value="">—</option>
              {credentialOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Description</span>
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="E.g. Official transcript" />
          </label>
          <div className="button-row">
            <button type="button" className="button primary" onClick={handleUpload}>
              Encrypt &amp; upload
            </button>
          </div>
          {statusMessage ? <div className="alert success">{statusMessage}</div> : null}
          {error ? <div className="error-text">{error}</div> : null}
          {file ? (
            <div className="file-preview">
              <span>{file.name}</span>
              <span className="muted">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          ) : null}
        </div>

        <div className="panel">
          <h3>Storage Configuration</h3>
          <div style={{ padding: '0.75rem', background: '#1a1a1a', borderRadius: '6px', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="muted">IPFS Mode:</span>
              <strong style={{ color: state.settings.ipfs.mode === 'client' ? '#10b981' : '#f59e0b' }}>
                {state.settings.ipfs.mode === 'client' ? 'Client Upload' : 'Simulate'}
              </strong>
            </div>
            {state.settings.ipfs.mode === 'client' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="muted">Endpoint:</span>
                  <strong style={{ fontSize: '0.875rem', color: '#fff' }}>
                    {state.settings.ipfs.endpoint || 'Not configured'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="muted">Authentication:</span>
                  <strong style={{ color: state.settings.ipfs.token ? '#10b981' : '#f59e0b' }}>
                    {state.settings.ipfs.token ? 'Configured' : 'Not set'}
                  </strong>
                </div>
              </>
            ) : (
              <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Documents are encrypted locally but not uploaded to IPFS.
              </p>
            )}
          </div>
          <p className="muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {state.settings.ipfs.mode === 'client' 
              ? 'Documents will be encrypted and uploaded to IPFS via the configured endpoint (Filebase/web3.storage/IPFS).'
              : 'Configure IPFS storage in Security settings to enable real uploads via Filebase or other IPFS pinning services.'}
          </p>
          <a 
            href="#module-security" 
            className="button ghost small" 
            style={{ marginTop: '0.75rem', display: 'inline-block' }}
          >
            Configure IPFS Settings
          </a>
        </div>
      </div>

      <div className="table">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>CID</th>
              <th>IPFS URL</th>
              <th>Status</th>
              <th>Linked credential</th>
              <th>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">No documents encrypted yet.</div>
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="cell-main">
                      <strong>{doc.name}</strong>
                      <span className="muted">{doc.description}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: '0.875rem' }}>
                    {truncate(doc.cid, 16)}
                  </td>
                  <td>
                    {doc.ipfsUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <a
                          href={doc.ipfsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#60a5fa',
                            textDecoration: 'underline',
                            fontSize: '0.875rem',
                            wordBreak: 'break-all'
                          }}
                          title={doc.ipfsUrl}
                        >
                          🔗 View on IPFS
                        </a>
                        {doc.ipfsGateways && doc.ipfsGateways.length > 1 && (
                          <details style={{ fontSize: '0.75rem' }}>
                            <summary style={{ cursor: 'pointer', color: '#888' }}>
                              {doc.ipfsGateways.length} gateways
                            </summary>
                            <div style={{ marginTop: '0.25rem', padding: '0.5rem', background: '#1a1a1a', borderRadius: '4px' }}>
                              {doc.ipfsGateways.map((gateway, idx) => (
                                <div key={idx} style={{ marginBottom: '0.25rem' }}>
                                  <a
                                    href={gateway}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#60a5fa', fontSize: '0.75rem', wordBreak: 'break-all' }}
                                  >
                                    {gateway.replace('https://', '').split('/')[0]}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ) : (
                      <span className="muted" style={{ fontSize: '0.875rem' }}>
                        {doc.cid?.startsWith('pseudo-') ? 'Simulated' : 'N/A'}
                      </span>
                    )}
                  </td>
                  <td>
                    {doc.storage?.uploaded ? (
                      <span style={{ color: '#10b981', fontSize: '0.875rem' }}>✓ Uploaded</span>
                    ) : doc.storage?.mode === 'simulate' ? (
                      <span style={{ color: '#f59e0b', fontSize: '0.875rem' }}>Simulated</span>
                    ) : (
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Local</span>
                    )}
                  </td>
                  <td>{doc.credentialId ? credentialOptions.find((opt) => opt.id === doc.credentialId)?.title : '—'}</td>
                  <td>{formatDateTime(doc.uploadedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}


