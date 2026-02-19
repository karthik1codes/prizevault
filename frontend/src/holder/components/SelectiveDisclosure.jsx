import React, { useMemo, useState, useEffect } from 'react'
import { useHolderWallet } from '../context/HolderContext'
import { formatDateTime, copyToClipboard, downloadJson } from '../utils/ui'

function FieldSelector({ availableFields, selectedFields, setSelectedFields }) {
  const toggleField = (field) => {
    setSelectedFields((prev) => (prev.includes(field) ? prev.filter((item) => item !== field) : [...prev, field]))
  }

  return (
    <div className="field-selector">
      {availableFields.length === 0 ? (
        <p className="muted">No revealable fields available. Select a credential with subject data.</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="muted" style={{ fontSize: '0.875rem' }}>
              {selectedFields.length} of {availableFields.length} fields selected
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="button ghost small" 
                onClick={() => setSelectedFields([...availableFields])}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                Select All
              </button>
              <button 
                type="button" 
                className="button ghost small" 
                onClick={() => setSelectedFields([])}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                Clear
              </button>
            </div>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '0.75rem' }}>
            {availableFields.map((field) => (
              <label 
                key={field} 
                className="checkbox" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <input 
                  type="checkbox" 
                  checked={selectedFields.includes(field)} 
                  onChange={() => toggleField(field)} 
                />
                <span style={{ flex: 1, fontSize: '0.875rem' }}>{field}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Helper function to extract all field paths from an object (handles nested objects)
function extractFieldPaths(obj, prefix = '', depth = 0, maxDepth = 5) {
  if (depth > maxDepth) return []
  if (!obj || typeof obj !== 'object') return []
  
  const paths = []
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key
    
    if (value === null || value === undefined) {
      // Skip null/undefined values
      continue
    } else if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
      // Recursively extract nested object fields
      const nestedPaths = extractFieldPaths(value, currentPath, depth + 1, maxDepth)
      paths.push(...nestedPaths)
    } else if (Array.isArray(value)) {
      // For arrays, add the array path
      paths.push(currentPath)
    } else {
      // Primitive value
      paths.push(currentPath)
    }
  }
  
  return paths
}

export default function SelectiveDisclosure() {
  const { state, generateProof } = useHolderWallet()
  const [sourceType, setSourceType] = useState('credential') // 'credential' or 'document'
  const [credentialId, setCredentialId] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [challenge, setChallenge] = useState('')
  const [selectedFields, setSelectedFields] = useState([])
  const [proofResult, setProofResult] = useState(null)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const credential = useMemo(() => 
    sourceType === 'credential' 
      ? state.credentials.find((item) => item.id === credentialId)
      : null,
    [state.credentials, credentialId, sourceType]
  )

  const document = useMemo(() => 
    sourceType === 'document'
      ? state.documents.find((item) => item.id === documentId)
      : null,
    [state.documents, documentId, sourceType]
  )
  
  // Extract available fields from credential or document (handles nested objects)
  const availableFields = useMemo(() => {
    if (sourceType === 'credential') {
      if (!credential) {
        return []
      }
      
      const subjectFields = extractFieldPaths(credential.subject || {}, 'credentialSubject')
      const evidenceFields = extractFieldPaths(credential.evidence || {}, 'evidence')
      
      // Also include raw credential fields if available
      const rawSubjectFields = credential.raw?.credentialSubject 
        ? extractFieldPaths(credential.raw.credentialSubject, 'credentialSubject')
        : []
      
      // Combine and deduplicate
      const allFields = [...new Set([...subjectFields, ...evidenceFields, ...rawSubjectFields])]
      return allFields.sort()
    } else if (sourceType === 'document') {
      if (!document) {
        return []
      }
      
      // Create credential-like structure from document
      const documentSubject = {
        id: document.id,
        name: document.name,
        description: document.description,
        size: document.size,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt,
      }
      
      const documentEvidence = {
        cid: document.cid,
        ipfsUrl: document.ipfsUrl,
        hash: document.hash,
        storage: {
          mode: document.storage?.mode,
          endpoint: document.storage?.endpoint,
          uploaded: document.storage?.uploaded,
        },
        encryption: {
          algorithm: document.encryption?.algorithm,
          // Don't expose IV and key in evidence by default
        },
      }
      
      const subjectFields = extractFieldPaths(documentSubject, 'credentialSubject')
      const evidenceFields = extractFieldPaths(documentEvidence, 'evidence')
      
      // Combine and deduplicate
      const allFields = [...new Set([...subjectFields, ...evidenceFields])]
      return allFields.sort()
    }
    
    return []
  }, [credential, document, sourceType])

  // Reset selected fields when credential/document changes
  useEffect(() => {
    setSelectedFields([])
    setProofResult(null)
    setError('')
  }, [credentialId, documentId, sourceType])

  const handleGenerate = async () => {
    setError('')
    setProofResult(null)
    
    if (sourceType === 'credential') {
      if (!credentialId) {
        setError('Select a credential to derive a proof from.')
        return
      }
      if (!credential) {
        setError('Credential not found.')
        return
      }
    } else if (sourceType === 'document') {
      if (!documentId) {
        setError('Select a document to derive a proof from.')
        return
      }
      if (!document) {
        setError('Document not found.')
        return
      }
    }
    
    if (selectedFields.length === 0) {
      setError('Choose at least one field to reveal.')
      return
    }
    
    setIsGenerating(true)
    try {
      const proof = generateProof({ 
        credentialId: sourceType === 'credential' ? credentialId : null,
        documentId: sourceType === 'document' ? documentId : null,
        sourceType,
        fields: selectedFields, 
        challenge 
      })
      setProofResult(proof)
      setError('')
    } catch (err) {
      console.error('Proof generation error:', err)
      setError(err.message || 'Failed to generate proof')
      setProofResult(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async (method = 'clipboard') => {
    if (!proofResult) return
    
    try {
      if (method === 'clipboard') {
        await copyToClipboard(JSON.stringify(proofResult.proofPayload, null, 2))
        setError('Proof copied to clipboard!')
      } else if (method === 'download') {
        downloadJson(`proof-${proofResult.id}.json`, proofResult.proofPayload)
        setError('Proof downloaded!')
      }
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000)
    } catch (err) {
      setError(`Failed to share proof: ${err.message}`)
    }
  }

  const handleSelectAll = () => {
    setSelectedFields([...availableFields])
  }

  const handleDeselectAll = () => {
    setSelectedFields([])
  }

  return (
    <section className="module-section" id="module-selective">
      <header className="module-heading">
        <h2>Selective Disclosure</h2>
        <p>Compose BBS+ derived proofs tailored to verifier presentation requests.</p>
      </header>

      <div className="panel-grid">
        <div className="panel">
          <h3>Select source</h3>
          <label className="field">
            <span>Source type</span>
            <select 
              value={sourceType}
              onChange={(event) => {
                setSourceType(event.target.value)
                setCredentialId('')
                setDocumentId('')
                setProofResult(null)
                setError('')
              }}
            >
              <option value="credential">Credential</option>
              <option value="document">Encrypted Document (IPFS)</option>
            </select>
            <small className="muted" style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem' }}>
              Choose between a verifiable credential or an encrypted document stored on IPFS
            </small>
          </label>

          {sourceType === 'credential' ? (
            <>
              <label className="field" style={{ marginTop: '1rem' }}>
                <span>Credential</span>
                <select 
                  value={credentialId} 
                  onChange={(event) => {
                    setCredentialId(event.target.value)
                    setProofResult(null)
                    setError('')
                  }}
                >
                  <option value="">Choose credential</option>
                  {state.credentials.length === 0 ? (
                    <option value="" disabled>No credentials available</option>
                  ) : (
                    state.credentials.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} - {typeof item.issuer === 'string' ? item.issuer : item.issuer?.name || item.issuer?.id || 'Unknown issuer'}
                      </option>
                    ))
                  )}
                </select>
              </label>
              {credential && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#1a1a1a', borderRadius: '4px', fontSize: '0.875rem' }}>
                  <div><strong>Issuer:</strong> {typeof credential.issuer === 'string' ? credential.issuer : credential.issuer?.name || credential.issuer?.id || 'Unknown'}</div>
                  <div><strong>Issued:</strong> {formatDateTime(credential.issuanceDate)}</div>
                  <div><strong>Fields available:</strong> {availableFields.length}</div>
                </div>
              )}
            </>
          ) : (
            <>
              <label className="field" style={{ marginTop: '1rem' }}>
                <span>Encrypted Document</span>
                <select 
                  value={documentId} 
                  onChange={(event) => {
                    setDocumentId(event.target.value)
                    setProofResult(null)
                    setError('')
                  }}
                >
                  <option value="">Choose document</option>
                  {state.documents.length === 0 ? (
                    <option value="" disabled>No documents available</option>
                  ) : (
                    state.documents.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.ipfsUrl ? '(IPFS)' : '(Local)'} - {item.description || 'No description'}
                      </option>
                    ))
                  )}
                </select>
              </label>
              {document && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#1a1a1a', borderRadius: '4px', fontSize: '0.875rem' }}>
                  <div><strong>Name:</strong> {document.name}</div>
                  <div><strong>Description:</strong> {document.description || 'None'}</div>
                  <div><strong>Size:</strong> {(document.size / 1024).toFixed(1)} KB</div>
                  <div><strong>CID:</strong> {document.cid?.substring(0, 20)}...</div>
                  {document.ipfsUrl && (
                    <div><strong>IPFS URL:</strong> <a href={document.ipfsUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>{document.ipfsUrl.substring(0, 40)}...</a></div>
                  )}
                  <div><strong>Uploaded:</strong> {formatDateTime(document.uploadedAt)}</div>
                  <div><strong>Storage:</strong> {document.storage?.uploaded ? '✓ On IPFS' : document.storage?.mode === 'simulate' ? 'Simulated' : 'Local'}</div>
                  <div><strong>Fields available:</strong> {availableFields.length}</div>
                </div>
              )}
            </>
          )}
          <label className="field" style={{ marginTop: '1rem' }}>
            <span>Verifier challenge / nonce (optional)</span>
            <input 
              value={challenge} 
              onChange={(event) => setChallenge(event.target.value)} 
              placeholder="Enter challenge string from verifier" 
            />
            <small className="muted" style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem' }}>
              Optional: Verifier-provided challenge for proof verification
            </small>
          </label>
        </div>

        <div className="panel">
          <h3>Select fields to reveal</h3>
          <p className="muted" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            Choose which fields from the credential to include in the proof. Only selected fields will be revealed to the verifier.
          </p>
          <FieldSelector 
            availableFields={availableFields} 
            selectedFields={selectedFields} 
            setSelectedFields={setSelectedFields} 
          />
        </div>
      </div>

      <div className="button-row" style={{ marginTop: '1.5rem' }}>
        <button 
          type="button" 
          className="button primary" 
          onClick={handleGenerate}
          disabled={(!credentialId && !documentId) || selectedFields.length === 0 || isGenerating}
        >
          {isGenerating ? 'Generating proof...' : 'Generate derived proof'}
        </button>
        {(credentialId || documentId) && availableFields.length > 0 && (
          <>
            <button 
              type="button" 
              className="button ghost small" 
              onClick={handleSelectAll}
              disabled={selectedFields.length === availableFields.length}
            >
              Select All
            </button>
            <button 
              type="button" 
              className="button ghost small" 
              onClick={handleDeselectAll}
              disabled={selectedFields.length === 0}
            >
              Clear Selection
            </button>
          </>
        )}
      </div>
      
      {error && (
        <div 
          className="alert" 
          style={{ 
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '6px',
            background: error.includes('copied') || error.includes('downloaded') ? '#1a3a2a' : '#3a1a1a',
            border: `1px solid ${error.includes('copied') || error.includes('downloaded') ? '#10b981' : '#ef4444'}`,
            color: error.includes('copied') || error.includes('downloaded') ? '#10b981' : '#ef4444'
          }}
        >
          {error}
        </div>
      )}

      {proofResult ? (
        <div className="module-card proof-card" style={{ marginTop: '1.5rem' }}>
          <header className="module-card-header" style={{ marginBottom: '1rem' }}>
            <div>
              <h3>Derived proof ready</h3>
              <p className="muted">Generated {formatDateTime(proofResult.generatedAt)}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="tag" style={{ fontSize: '0.75rem' }}>
                Nonce: {proofResult.nonce ? proofResult.nonce.substring(0, 12) + '…' : 'N/A'}
              </span>
            </div>
          </header>
          
          <div className="detail-grid" style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '6px' }}>
            <div>
              <span className="label" style={{ display: 'block', marginBottom: '0.25rem', color: '#888' }}>Revealed fields</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {proofResult.revealedFields.map((field, idx) => (
                  <span key={idx} className="tag" style={{ fontSize: '0.75rem' }}>
                    {field}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="label" style={{ display: 'block', marginBottom: '0.25rem', color: '#888' }}>Challenge</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {proofResult.challenge || 'Auto-generated'}
              </span>
            </div>
            {proofResult.proofPayload?.holder && (
              <div>
                <span className="label" style={{ display: 'block', marginBottom: '0.25rem', color: '#888' }}>Holder DID</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {proofResult.proofPayload.holder}
                </span>
              </div>
            )}
          </div>

          <div className="button-row" style={{ marginBottom: '1rem' }}>
            <button 
              type="button" 
              className="button primary" 
              onClick={() => handleShare('clipboard')}
            >
              Copy Proof
            </button>
            <button 
              type="button" 
              className="button secondary" 
              onClick={() => handleShare('download')}
            >
              Download JSON
            </button>
          </div>

          <details className="json-view" style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', padding: '0.75rem', background: '#1a1a1a', borderRadius: '6px', marginBottom: '0.5rem' }}>
              View proof payload (JSON)
            </summary>
            <pre style={{ 
              padding: '1rem', 
              background: '#0a0a0a', 
              borderRadius: '6px', 
              overflow: 'auto',
              maxHeight: '400px',
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}>
              {JSON.stringify(proofResult.proofPayload, null, 2)}
            </pre>
          </details>
        </div>
      ) : (credentialId || documentId) && selectedFields.length > 0 ? (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#1a2a3a', borderRadius: '6px', border: '1px solid #3b82f6' }}>
          <p style={{ margin: 0, color: '#60a5fa' }}>
            Ready to generate proof with {selectedFields.length} selected field{selectedFields.length !== 1 ? 's' : ''}.
            Click "Generate derived proof" to create the presentation.
          </p>
        </div>
      ) : null}
    </section>
  )
}


