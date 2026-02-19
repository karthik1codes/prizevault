import React, { useState } from 'react'

export default function IssueCredentialModal({ isOpen, onClose, student, onIssue }) {
  const [template, setTemplate] = useState('degree')
  const [fields, setFields] = useState({
    name: student?.name || '',
    email: student?.email || '',
    program: '',
    year: '',
    gpa: '',
  })
  const [evidenceCID, setEvidenceCID] = useState('')
  const [proofType, setProofType] = useState('BBS+')
  const [previewVC, setPreviewVC] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleFieldChange = (key, value) => {
    setFields({ ...fields, [key]: value })
  }

  const generatePreview = () => {
    const vc = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'DegreeCredential'],
      issuer: {
        id: 'did:ethr:0x...',
      },
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: student?.did || 'did:example:student',
        ...fields,
      },
      evidence: evidenceCID ? [{ id: `ipfs://${evidenceCID}` }] : [],
      proof: {
        type: proofType,
      },
    }
    setPreviewVC(vc)
  }

  const handleIssue = async () => {
    setLoading(true)
    try {
      // Use /issue-anchored endpoint for blockchain-anchored credentials
      const response = await fetch('/issue-anchored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holderDid: student?.did || `did:example:${student?.id || 'student'}`,
          type: template === 'degree' ? 'DegreeCredential' : template === 'certificate' ? 'CertificateCredential' : 'IDCredential',
          claims: {
            name: fields.name,
            email: fields.email,
            program: fields.program,
            year: fields.year,
            gpa: fields.gpa,
            ...fields, // Include all other fields
          },
          evidence: evidenceCID ? {
            cid: evidenceCID,
          } : undefined,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // Handle response format: { success: true, credential: {...}, anchor: {...} }
      if (result.success && result.credential) {
        // Format the credential for the frontend
        const vc = {
          ...result.credential,
          txHash: result.anchor?.txHash,
          blockNumber: result.anchor?.blockNumber,
          anchor: result.anchor,
        }
        onIssue(vc)
        onClose()
      } else {
        throw new Error('Invalid response format from server')
      }
    } catch (error) {
      console.error('Failed to issue credential:', error)
      alert(`Failed to issue credential: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Issue Credential</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Template</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="degree">Degree</option>
              <option value="certificate">Certificate</option>
              <option value="id">ID Card</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={fields.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={fields.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Program</label>
              <input
                type="text"
                value={fields.program}
                onChange={(e) => handleFieldChange('program', e.target.value)}
                placeholder="BSc Computer Science"
              />
            </div>
            <div className="form-group">
              <label>Year</label>
              <input
                type="text"
                value={fields.year}
                onChange={(e) => handleFieldChange('year', e.target.value)}
                placeholder="2024"
              />
            </div>
          </div>

          <div className="form-group">
            <label>GPA</label>
            <input
              type="text"
              value={fields.gpa}
              onChange={(e) => handleFieldChange('gpa', e.target.value)}
              placeholder="3.8"
            />
          </div>

          <div className="form-group">
            <label>Evidence CID (IPFS)</label>
            <input
              type="text"
              value={evidenceCID}
              onChange={(e) => setEvidenceCID(e.target.value)}
              placeholder="QmXxxx..."
            />
          </div>

          <div className="form-group">
            <label>Proof Type</label>
            <select value={proofType} onChange={(e) => setProofType(e.target.value)}>
              <option value="BBS+">BBS+</option>
              <option value="Ed25519">Ed25519</option>
              <option value="EcdsaSecp256k1">EcdsaSecp256k1</option>
            </select>
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={generatePreview}>
              Preview VC
            </button>
          </div>

          {previewVC && (
            <div className="vc-preview">
              <h3>VC Preview</h3>
              <pre>{JSON.stringify(previewVC, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleIssue} disabled={loading}>
            {loading ? 'Issuing...' : 'Issue Credential'}
          </button>
        </div>
      </div>
    </div>
  )
}

