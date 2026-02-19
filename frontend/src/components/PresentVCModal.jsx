import React, { useState, useEffect } from 'react'
import { getStoredCredentials } from '../services/storageService'
import './PresentVCModal.css'
import './shared.css'

function PresentVCModal({ isOpen, onClose }) {
  const [credentials, setCredentials] = useState([])
  const [selectedCredentialId, setSelectedCredentialId] = useState('')
  const [fieldSelections, setFieldSelections] = useState({}) // { fieldName: { mode: 'include'|'predicate', predicate?: {...} } }
  const [holderDid, setHolderDid] = useState('')
  const [error, setError] = useState('')
  const [isPresenting, setIsPresenting] = useState(false)
  const [presentationResult, setPresentationResult] = useState(null)
  const [expandedFields, setExpandedFields] = useState({})
  const [verificationResult, setVerificationResult] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadCredentials()
      setPresentationResult(null)
      setVerificationResult(null)
      setError('')
      setSelectedCredentialId('')
      setFieldSelections({})
      setExpandedFields({})
    }
  }, [isOpen])

  const loadCredentials = () => {
    try {
      const stored = getStoredCredentials()
      setCredentials(stored)
      
      // Extract holder DID from first credential if available
      if (stored.length > 0) {
        const firstVC = stored[0]
        const subjectId = firstVC.credentialSubject?.id
        if (subjectId) {
          setHolderDid(subjectId)
        }
      }
    } catch (error) {
      console.error('Error loading credentials:', error)
      setError('Failed to load credentials')
    }
  }

  const selectedCredential = credentials.find(vc => vc.id === selectedCredentialId)

  // Recursively extract all fields from credentialSubject, handling nested objects
  const extractFields = (obj, prefix = '') => {
    const fields = []
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'id') continue
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (value === null || value === undefined) {
        fields.push({ key: fullKey, value: null, type: 'null', originalKey: key })
      } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Nested object - add parent and recurse
        fields.push({ key: fullKey, value: value, type: 'object', originalKey: key })
        fields.push(...extractFields(value, fullKey))
      } else if (Array.isArray(value)) {
        fields.push({ key: fullKey, value: value, type: 'array', originalKey: key })
      } else {
        const type = detectFieldType(value)
        fields.push({ key: fullKey, value: value, type: type, originalKey: key })
      }
    }
    return fields
  }

  const detectFieldType = (value) => {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'string') {
      // Check if it's a date string
      if (/^\d{4}-\d{2}-\d{2}/.test(value) || !isNaN(Date.parse(value))) {
        return 'date'
      }
      return 'string'
    }
    if (value instanceof Date) return 'date'
    return 'string'
  }

  const getAvailableFields = () => {
    if (!selectedCredential) return []
    const subject = selectedCredential.credentialSubject || {}
    return extractFields(subject)
  }

  const toggleFieldSelection = (fieldKey) => {
    setFieldSelections(prev => {
      const newSelections = { ...prev }
      if (newSelections[fieldKey]) {
        delete newSelections[fieldKey]
      } else {
        const field = getAvailableFields().find(f => f.key === fieldKey)
        newSelections[fieldKey] = {
          mode: 'include',
          fieldType: field?.type || 'string'
        }
      }
      return newSelections
    })
  }

  const setFieldMode = (fieldKey, mode, predicate = null) => {
    setFieldSelections(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        mode,
        predicate: predicate || prev[fieldKey]?.predicate
      }
    }))
  }

  const updatePredicate = (fieldKey, predicate) => {
    setFieldSelections(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        predicate
      }
    }))
  }

  const selectAllFields = () => {
    const fields = getAvailableFields()
    const newSelections = {}
    fields.forEach(field => {
      if (field.key !== 'id') {
        newSelections[field.key] = {
          mode: 'include',
          fieldType: field.type
        }
      }
    })
    setFieldSelections(newSelections)
  }

  const clearFields = () => {
    setFieldSelections({})
  }

  const getSelectedFieldsCount = () => {
    return Object.keys(fieldSelections).length
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const dob = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsPresenting(true)

    try {
      if (!selectedCredentialId) {
        throw new Error('Please select a credential')
      }

      if (!holderDid.trim()) {
        throw new Error('Please enter a holder DID')
      }

      // Build fields array and predicates object
      const fields = Object.keys(fieldSelections)
      const predicates = {}
      
      Object.entries(fieldSelections).forEach(([fieldKey, selection]) => {
        if (selection.mode === 'predicate' && selection.predicate) {
          predicates[fieldKey] = selection.predicate
        }
      })

      // Call the present API endpoint
      const API_URL = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${API_URL}/present`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentialId: selectedCredentialId,
          holderDid: holderDid.trim(),
          fields: fields.length > 0 ? fields : undefined,
          predicates: Object.keys(predicates).length > 0 ? predicates : undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create presentation')
      }

      const data = await response.json()
      setPresentationResult(data.verifiablePresentation)
    } catch (err) {
      console.error('Error presenting credential:', err)
      setError(err.message || 'Failed to present credential')
    } finally {
      setIsPresenting(false)
    }
  }

  const copyPresentation = () => {
    if (presentationResult) {
      const jsonString = typeof presentationResult === 'string' 
        ? presentationResult 
        : JSON.stringify(presentationResult, null, 2)
      
      navigator.clipboard.writeText(jsonString)
        .then(() => {
          alert('Presentation copied to clipboard!')
        })
        .catch(err => {
          console.error('Failed to copy:', err)
          alert('Failed to copy presentation')
        })
    }
  }

  const verifyPresentation = async () => {
    if (!presentationResult) return

    setIsVerifying(true)
    setError('')
    setVerificationResult(null)

    try {
      // Handle both JWT string and object formats
      // Veramo can return either format depending on proofFormat
      let vpToVerify = presentationResult
      
      // If it's already an object, use it directly
      // If it's a JWT string, send it as-is (backend Veramo will handle it)
      if (typeof presentationResult === 'string') {
        // JWT format - send as string
        vpToVerify = presentationResult
      } else {
        // Object format - send as object
        vpToVerify = presentationResult
      }

      const API_URL = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vp: vpToVerify
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify presentation')
      }

      const data = await response.json()
      setVerificationResult(data)
    } catch (err) {
      console.error('Error verifying presentation:', err)
      setError(err.message || 'Failed to verify presentation')
      setVerificationResult({
        valid: false,
        reasons: [err.message || 'Verification failed']
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleClose = () => {
    setPresentationResult(null)
    setVerificationResult(null)
    setSelectedCredentialId('')
    setFieldSelections({})
    setExpandedFields({})
    setError('')
    onClose()
  }

  const getCredentialType = (vc) => {
    if (Array.isArray(vc.type)) {
      return vc.type.find(t => t !== 'VerifiableCredential') || vc.type[0]
    }
    return vc.type || 'Unknown'
  }

  const toggleFieldExpand = (fieldKey) => {
    setExpandedFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }))
  }

  const formatFieldValue = (value, type) => {
    if (value === null || value === undefined) return 'null'
    if (type === 'date' && typeof value === 'string') {
      try {
        const date = new Date(value)
        return date.toLocaleDateString()
      } catch {
        return value
      }
    }
    if (type === 'object') {
      return JSON.stringify(value, null, 2)
    }
    if (type === 'array') {
      return `[${value.length} items]`
    }
    return String(value)
  }

  if (!isOpen) return null

  const availableFields = getAvailableFields()
  const selectedCount = getSelectedFieldsCount()

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content present-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Present Credential</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        {presentationResult ? (
          <div className="presentation-result">
            <div className="result-header">
              <h3>Verifiable Presentation Created</h3>
              <div className="result-header-actions">
                <button 
                  className="btn btn-secondary btn-small" 
                  onClick={verifyPresentation}
                  disabled={isVerifying}
                >
                  {isVerifying ? 'Verifying...' : '🔍 Verify Presentation'}
                </button>
                <button className="btn btn-primary btn-small" onClick={copyPresentation}>
                  📋 Copy Presentation
                </button>
              </div>
            </div>

            {verificationResult && (
              <div className={`verification-result ${verificationResult.valid ? 'valid' : 'invalid'}`}>
                <div className="verification-status">
                  {verificationResult.valid ? (
                    <>
                      <span className="verification-icon">✅</span>
                      <span className="verification-text">Proof Valid</span>
                    </>
                  ) : (
                    <>
                      <span className="verification-icon">❌</span>
                      <span className="verification-text">Proof Invalid</span>
                    </>
                  )}
                </div>
                {verificationResult.reasons && verificationResult.reasons.length > 0 && (
                  <div className="verification-reasons">
                    <div className="reasons-label">Details:</div>
                    <ul className="reasons-list">
                      {verificationResult.reasons.map((reason, index) => (
                        <li key={index} className="reason-item">
                          {reason.replace(/_/g, ' ').replace(/:/g, ': ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="presentation-json-container">
              <pre className="presentation-json">
                <code>
                  {typeof presentationResult === 'string' 
                    ? presentationResult 
                    : JSON.stringify(presentationResult, null, 2)}
                </code>
              </pre>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => {
                setPresentationResult(null)
                setVerificationResult(null)
              }}>
                Present Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="credential-select">Select Credential *</label>
              <select
                id="credential-select"
                className="form-select"
                value={selectedCredentialId}
                onChange={(e) => {
                  setSelectedCredentialId(e.target.value)
                  setFieldSelections({})
                  setExpandedFields({})
                  // Update holder DID from selected credential
                  const vc = credentials.find(c => c.id === e.target.value)
                  if (vc?.credentialSubject?.id) {
                    setHolderDid(vc.credentialSubject.id)
                  }
                }}
                required
              >
                <option value="">-- Select a credential --</option>
                {credentials.map((vc) => (
                  <option key={vc.id} value={vc.id}>
                    {getCredentialType(vc)} - {vc.issuer?.name || vc.issuer?.id || 'Unknown Issuer'}
                  </option>
                ))}
              </select>
              {credentials.length === 0 && (
                <div className="form-hint">No credentials available. Please receive a credential first.</div>
              )}
            </div>

            {selectedCredential && (
              <>
                <div className="form-group">
                  <label htmlFor="holder-did">Holder DID *</label>
                  <input
                    id="holder-did"
                    type="text"
                    className="form-input"
                    value={holderDid}
                    onChange={(e) => setHolderDid(e.target.value)}
                    placeholder="did:example:123..."
                    required
                  />
                  <div className="form-hint">
                    The DID of the credential holder (usually matches credentialSubject.id)
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Selective Disclosure & Predicates
                    <div className="field-actions">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={selectAllFields}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={clearFields}
                      >
                        Clear All
                      </button>
                    </div>
                  </label>
                  <div className="form-hint">
                    {selectedCount === 0 
                      ? 'Select fields to include or create predicates (e.g., age &gt; 18) without revealing exact values'
                      : `${selectedCount} field(s) selected`}
                  </div>
                  <div className="fields-container">
                    {availableFields.length === 0 ? (
                      <div className="form-hint">No additional fields available for selective disclosure</div>
                    ) : (
                      availableFields.map((field) => {
                        const isSelected = fieldSelections[field.key]
                        const isExpanded = expandedFields[field.key]
                        const selection = fieldSelections[field.key]
                        
                        // Check if this is a nested field that should be hidden if parent is object
                        const isNested = field.key.includes('.')
                        const parentKey = isNested ? field.key.split('.').slice(0, -1).join('.') : null
                        const parentField = parentKey ? availableFields.find(f => f.key === parentKey) : null
                        
                        // Skip nested fields if parent is selected as object
                        if (parentField && fieldSelections[parentField.key]?.mode === 'include') {
                          return null
                        }

                        return (
                          <div key={field.key} className={`field-item ${isSelected ? 'selected' : ''}`}>
                            <div className="field-item-header">
                              <label className="field-checkbox">
                                <input
                                  type="checkbox"
                                  checked={!!isSelected}
                                  onChange={() => toggleFieldSelection(field.key)}
                                />
                                <span className="field-name">{field.originalKey}</span>
                                <span className="field-type-badge">{field.type}</span>
                                {field.type === 'number' && field.originalKey.toLowerCase().includes('age') && (
                                  <span className="field-suggestion">
                                    💡 Can use predicate (e.g., age &gt; 18)
                                  </span>
                                )}
                              </label>
                              {isSelected && (
                                <button
                                  type="button"
                                  className="btn-link btn-expand"
                                  onClick={() => toggleFieldExpand(field.key)}
                                >
                                  {isExpanded ? '▼' : '▶'} Configure
                                </button>
                              )}
                            </div>
                            
                            {!isSelected && (
                              <div className="field-preview">
                                <span className="field-value-preview">
                                  {formatFieldValue(field.value, field.type)}
                                </span>
                              </div>
                            )}

                            {isSelected && isExpanded && (
                              <div className="field-config">
                                <div className="field-mode-selector">
                                  <label className="mode-option">
                                    <input
                                      type="radio"
                                      name={`mode-${field.key}`}
                                      checked={selection.mode === 'include'}
                                      onChange={() => setFieldMode(field.key, 'include')}
                                    />
                                    <span>Include Full Value</span>
                                  </label>
                                  {(field.type === 'number' || field.type === 'date') && (
                                    <label className="mode-option">
                                      <input
                                        type="radio"
                                        name={`mode-${field.key}`}
                                        checked={selection.mode === 'predicate'}
                                      onChange={() => setFieldMode(field.key, 'predicate', {
                                        operator: field.type === 'number' ? 'gt' : 'lt',
                                        value: field.type === 'number' ? 18 : new Date().toISOString().split('T')[0]
                                      })}
                                      />
                                      <span>Use Predicate (Zero-Knowledge)</span>
                                    </label>
                                  )}
                                </div>

                                {selection.mode === 'predicate' && (
                                  <div className="predicate-config">
                                    {field.type === 'number' && (
                                      <>
                                        <div className="predicate-row">
                                          <select
                                            className="predicate-operator"
                                            value={selection.predicate?.operator || 'gt'}
                                            onChange={(e) => updatePredicate(field.key, {
                                              ...selection.predicate,
                                              operator: e.target.value
                                            })}
                                          >
                                            <option value="gt">Greater than (&gt;)</option>
                                            <option value="gte">Greater than or equal (&gt;=)</option>
                                            <option value="lt">Less than (&lt;)</option>
                                            <option value="lte">Less than or equal (&lt;=)</option>
                                            <option value="eq">Equal to (=)</option>
                                          </select>
                                          <input
                                            type="number"
                                            className="predicate-value"
                                            value={selection.predicate?.value || ''}
                                            onChange={(e) => updatePredicate(field.key, {
                                              ...selection.predicate,
                                              operator: selection.predicate?.operator || 'gt',
                                              value: parseFloat(e.target.value) || 0
                                            })}
                                            placeholder="e.g., 18"
                                          />
                                        </div>
                                        {field.originalKey.toLowerCase().includes('age') && (
                                          <div className="predicate-preview">
                                            {selection.predicate?.operator === 'gt' && selection.predicate?.value && (
                                              <span>✓ Will prove: {field.originalKey} &gt; {selection.predicate.value} (without revealing exact value)</span>
                                            )}
                                            {selection.predicate?.operator === 'gte' && selection.predicate?.value && (
                                              <span>✓ Will prove: {field.originalKey} ≥ {selection.predicate.value} (without revealing exact value)</span>
                                            )}
                                            {selection.predicate?.operator === 'lt' && selection.predicate?.value && (
                                              <span>✓ Will prove: {field.originalKey} &lt; {selection.predicate.value} (without revealing exact value)</span>
                                            )}
                                            {selection.predicate?.operator === 'lte' && selection.predicate?.value && (
                                              <span>✓ Will prove: {field.originalKey} ≤ {selection.predicate.value} (without revealing exact value)</span>
                                            )}
                                            {selection.predicate?.operator === 'eq' && selection.predicate?.value && (
                                              <span>✓ Will prove: {field.originalKey} = {selection.predicate.value}</span>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )}
                                    {field.type === 'date' && (
                                      <>
                                        <div className="predicate-row">
                                          <select
                                            className="predicate-operator"
                                            value={selection.predicate?.operator || 'lt'}
                                            onChange={(e) => updatePredicate(field.key, {
                                              ...selection.predicate,
                                              operator: e.target.value
                                            })}
                                          >
                                            <option value="lt">Before (&lt;)</option>
                                            <option value="lte">Before or on (≤)</option>
                                            <option value="gt">After (&gt;)</option>
                                            <option value="gte">After or on (≥)</option>
                                            <option value="eq">On (=)</option>
                                          </select>
                                          <input
                                            type="date"
                                            className="predicate-value"
                                            value={selection.predicate?.value || ''}
                                            onChange={(e) => updatePredicate(field.key, {
                                              ...selection.predicate,
                                              operator: selection.predicate?.operator || 'lt',
                                              value: e.target.value
                                            })}
                                          />
                                        </div>
                                        {field.originalKey.toLowerCase().includes('birth') && (
                                          <div className="predicate-preview">
                                            {selection.predicate?.operator === 'lt' && selection.predicate?.value && (
                                              <span>✓ Will prove: {field.originalKey} &lt; {selection.predicate.value} (age &gt; {calculateAge(selection.predicate.value)} without revealing exact date)</span>
                                            )}
                                            {selection.predicate?.operator === 'lte' && selection.predicate?.value && (
                                              <span>✓ Will prove: {field.originalKey} ≤ {selection.predicate.value} (age ≥ {calculateAge(selection.predicate.value)} without revealing exact date)</span>
                                            )}
                                            {selection.predicate?.operator === 'gt' && selection.predicate?.value && (
                                              <span>✓ Will prove: {field.originalKey} &gt; {selection.predicate.value}</span>
                                            )}
                                            {selection.predicate?.operator === 'gte' && selection.predicate?.value && (
                                              <span>✓ Will prove: {field.originalKey} ≥ {selection.predicate.value}</span>
                                            )}
                                            {selection.predicate?.operator === 'eq' && selection.predicate?.value && (
                                              <span>✓ Will prove: {field.originalKey} = {selection.predicate.value}</span>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}

                                {selection.mode === 'include' && (
                                  <div className="field-include-preview">
                                    <span>Will include: </span>
                                    <code>{formatFieldValue(field.value, field.type)}</code>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            )}

            {error && <div className="form-error">{error}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isPresenting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPresenting || !selectedCredentialId || !holderDid.trim() || credentials.length === 0}
              >
                {isPresenting ? 'Creating Presentation...' : 'Present Credential'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PresentVCModal
