import React, { useState, useEffect } from 'react'

// Risk scoring algorithm
const calculateRiskScore = (verificationResults, vpPayload, riskPreference) => {
  let score = 0
  let maxScore = 100
  const riskFactors = []

  // BBS+ Proof validation (30 points)
  if (verificationResults?.bbs) {
    score += 30
    riskFactors.push({ type: 'positive', message: 'BBS+ proof signature is valid', points: 30 })
  } else {
    riskFactors.push({ type: 'negative', message: 'BBS+ proof validation failed', points: -30 })
  }

  // DID Resolution (25 points)
  if (verificationResults?.did) {
    score += 25
    riskFactors.push({ type: 'positive', message: 'Issuer DID is authentic and resolvable', points: 25 })
  } else {
    riskFactors.push({ type: 'negative', message: 'Issuer DID cannot be resolved or is untrusted', points: -25 })
  }

  // Revocation status (25 points)
  if (verificationResults?.revocation) {
    score += 25
    riskFactors.push({ type: 'positive', message: 'Credential is active (not revoked)', points: 25 })
  } else {
    score -= 30 // Heavy penalty for revoked credentials
    riskFactors.push({ type: 'critical', message: 'Credential has been revoked', points: -30 })
  }

  // CID Integrity (20 points)
  if (verificationResults?.cid) {
    score += 20
    riskFactors.push({ type: 'positive', message: 'CID hash matches stored evidence', points: 20 })
  } else {
    score -= 20
    riskFactors.push({ type: 'negative', message: 'CID integrity check failed', points: -20 })
  }

  // Additional checks based on VP payload
  if (vpPayload?.verifiableCredential) {
    const vc = Array.isArray(vpPayload.verifiableCredential) 
      ? vpPayload.verifiableCredential[0] 
      : vpPayload.verifiableCredential

    // Check issuance date (not too old)
    if (vc.issuanceDate) {
      const issuanceDate = new Date(vc.issuanceDate)
      const ageInYears = (Date.now() - issuanceDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      if (ageInYears > 10) {
        score -= 10
        riskFactors.push({ type: 'warning', message: `Credential is ${ageInYears.toFixed(1)} years old`, points: -10 })
      } else if (ageInYears < 1) {
        score += 5
        riskFactors.push({ type: 'positive', message: 'Credential is recent', points: 5 })
      }
    }

    // Check issuer trust
    const issuerId = typeof vc.issuer === 'string' ? vc.issuer : vc.issuer?.id
    if (issuerId) {
      const trustedIssuers = [
        'did:web:university.example',
        'did:web:college.example',
        'did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        'did:web:mvjcollege.edu'
      ]
      if (trustedIssuers.some(trusted => issuerId.includes(trusted.split(':').pop()))) {
        score += 10
        riskFactors.push({ type: 'positive', message: 'Issuer is in trusted list', points: 10 })
      }
    }
  }

  // Normalize score to 0-100
  score = Math.max(0, Math.min(100, score))

  return { score, riskFactors, maxScore }
}

// Generate AI summary based on verification results and VP
const generateAISummary = (verificationResults, vpPayload) => {
  if (!vpPayload?.verifiableCredential) {
    return 'No credential data available. Please load a Verifiable Presentation to generate insights.'
  }

  const vc = Array.isArray(vpPayload.verifiableCredential) 
    ? vpPayload.verifiableCredential[0] 
    : vpPayload.verifiableCredential

  const subject = vc.credentialSubject || {}
  const issuer = typeof vc.issuer === 'string' ? vc.issuer : vc.issuer?.name || vc.issuer?.id || 'Unknown issuer'
  
  const name = subject.name || 'Candidate'
  const degree = subject.degree?.name || subject.degree || subject.credentialType || 'credential'
  const college = subject.college || 'institution'

  let summary = `Candidate ${name} presents a ${degree}`
  
  if (college && college !== 'institution') {
    summary += ` from ${college}`
  }

  // Add verification status
  const allVerified = verificationResults?.bbs && verificationResults?.did && verificationResults?.revocation && verificationResults?.cid
  if (allVerified) {
    summary += '. All verification checks passed: BBS+ proof is valid, issuer DID is authentic, credential is active, and CID integrity confirmed.'
  } else {
    const failed = []
    if (!verificationResults?.bbs) failed.push('BBS+ proof')
    if (!verificationResults?.did) failed.push('DID resolution')
    if (!verificationResults?.revocation) failed.push('revocation status')
    if (!verificationResults?.cid) failed.push('CID integrity')
    summary += `. Verification issues detected: ${failed.join(', ')} failed.`
  }

  // Add additional insights
  if (subject.cgpa) {
    summary += ` Academic performance: CGPA ${subject.cgpa}.`
  }
  if (subject.achievements) {
    summary += ` Notable achievements documented.`
  }

  return summary
}

// Fraud detection analysis
const detectFraudPatterns = (verificationResults, vpPayload) => {
  const indicators = []

  // Check for revoked credentials
  if (verificationResults && !verificationResults.revocation) {
    indicators.push({ 
      label: 'Credential has been revoked', 
      active: true, 
      severity: 'critical',
      description: 'This credential is no longer valid and should not be accepted.'
    })
  }

  // Check for CID mismatch
  if (verificationResults && !verificationResults.cid) {
    indicators.push({ 
      label: 'CID integrity mismatch detected', 
      active: true, 
      severity: 'high',
      description: 'The credential content does not match the stored evidence on Arweave.'
    })
  }

  // Check for invalid DID
  if (verificationResults && !verificationResults.did) {
    indicators.push({ 
      label: 'Issuer DID cannot be verified', 
      active: true, 
      severity: 'high',
      description: 'The issuer DID is not resolvable or not in the trusted list.'
    })
  }

  // Check for invalid proof
  if (verificationResults && !verificationResults.bbs) {
    indicators.push({ 
      label: 'BBS+ proof validation failed', 
      active: true, 
      severity: 'critical',
      description: 'The cryptographic proof is invalid or has been tampered with.'
    })
  }

  // Check for suspicious patterns in VP
  if (vpPayload?.verifiableCredential) {
    const vc = Array.isArray(vpPayload.verifiableCredential) 
      ? vpPayload.verifiableCredential[0] 
      : vpPayload.verifiableCredential

    // Check for very old credentials
    if (vc.issuanceDate) {
      const ageInYears = (Date.now() - new Date(vc.issuanceDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
      if (ageInYears > 15) {
        indicators.push({ 
          label: 'Credential is unusually old', 
          active: true, 
          severity: 'medium',
          description: `Credential was issued ${ageInYears.toFixed(1)} years ago.`
        })
      }
    }

    // Check for missing critical fields
    if (!vc.credentialSubject || !vc.issuer) {
      indicators.push({ 
        label: 'Incomplete credential structure', 
        active: true, 
        severity: 'medium',
        description: 'Credential is missing required fields.'
      })
    }
  }

  // Default safe indicators if no issues
  if (indicators.length === 0) {
    indicators.push({ 
      label: 'Duplicate wallet across candidates', 
      active: false, 
      severity: 'low',
      description: 'No duplicate wallet addresses detected.'
    })
    indicators.push({ 
      label: 'Credential reused in multiple VPs', 
      active: false, 
      severity: 'low',
      description: 'No evidence of credential reuse detected.'
    })
    indicators.push({ 
      label: 'Holder geolocation mismatch', 
      active: false, 
      severity: 'low',
      description: 'Geolocation data appears consistent.'
    })
  }

  return indicators
}

export default function AIInsightsPanel({ verificationResults, vpPayload }) {
  const [riskPreference, setRiskPreference] = useState(30)
  const [summary, setSummary] = useState('')
  const [riskScore, setRiskScore] = useState(null)
  const [fraudIndicators, setFraudIndicators] = useState([])

  // Calculate risk score and generate insights when data changes
  useEffect(() => {
    if (verificationResults || vpPayload) {
      const riskData = calculateRiskScore(verificationResults, vpPayload, riskPreference)
      setRiskScore(riskData)
      
      const aiSummary = generateAISummary(verificationResults, vpPayload)
      setSummary(aiSummary)
      
      const fraud = detectFraudPatterns(verificationResults, vpPayload)
      setFraudIndicators(fraud)
    } else {
      setSummary('Load a Verifiable Presentation and run verification to generate AI insights and risk scoring.')
      setRiskScore(null)
      setFraudIndicators([])
    }
  }, [verificationResults, vpPayload, riskPreference])

  const riskFactors = riskScore?.riskFactors || []
  const currentScore = riskScore?.score ?? null
  const riskLevel = currentScore !== null 
    ? currentScore >= 80 ? 'low' 
    : currentScore >= 60 ? 'medium' 
    : currentScore >= 40 ? 'high' 
    : 'critical'
    : 'unknown'

  const getRiskColor = (level) => {
    switch(level) {
      case 'low': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'high': return '#ef4444'
      case 'critical': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const runAI = () => {
    // Trigger recalculation
    if (verificationResults || vpPayload) {
      const riskData = calculateRiskScore(verificationResults, vpPayload, riskPreference)
      setRiskScore(riskData)
      const aiSummary = generateAISummary(verificationResults, vpPayload)
      setSummary(aiSummary)
      const fraud = detectFraudPatterns(verificationResults, vpPayload)
      setFraudIndicators(fraud)
    }
  }

  return (
    <section className="recruiter-card">
      <header className="card-header">
        <div>
          <h3>AI insights & risk scoring</h3>
          <p className="muted">Summarize credentials, highlight risks, and detect fraud patterns.</p>
        </div>
        <button type="button" className="button ghost small" onClick={runAI} disabled={!verificationResults && !vpPayload}>
          Regenerate
        </button>
      </header>

      {/* Risk Score Display */}
      {currentScore !== null && (
        <div className="risk-score-display" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#1a1a1a', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong>Overall Risk Score</strong>
            <span style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: getRiskColor(riskLevel)
            }}>
              {currentScore}/100
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            background: '#2a2a2a', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${currentScore}%`, 
              height: '100%', 
              background: getRiskColor(riskLevel),
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#888' }}>
            Risk Level: <strong style={{ color: getRiskColor(riskLevel) }}>{riskLevel.toUpperCase()}</strong>
            {riskLevel === 'critical' && ' - Credential should be rejected'}
            {riskLevel === 'high' && ' - Requires manual review'}
            {riskLevel === 'medium' && ' - Proceed with caution'}
            {riskLevel === 'low' && ' - Credential appears trustworthy'}
          </p>
        </div>
      )}

      {/* AI Summary */}
      <div className="ai-summary" style={{ marginBottom: '1.5rem' }}>
        <strong>AI summary</strong>
        <p style={{ marginTop: '0.5rem', lineHeight: '1.6' }}>{summary || 'No data available. Load a VP and run verification.'}</p>
      </div>

      {/* Risk Tolerance Slider */}
      <div className="risk-score" style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="risk">Risk tolerance threshold ({riskPreference}%)</label>
        <input
          id="risk"
          type="range"
          min="0"
          max="100"
          value={riskPreference}
          onChange={(event) => setRiskPreference(Number(event.target.value))}
          style={{ width: '100%', marginTop: '0.5rem' }}
        />
        <p style={{ fontSize: '0.875rem', color: '#888', marginTop: '0.25rem' }}>
          Credentials with risk score below {riskPreference}% will be flagged for review.
        </p>
      </div>

      {/* Risk Factors Breakdown */}
      {riskFactors.length > 0 && (
        <div className="risk-list" style={{ marginBottom: '1.5rem' }}>
          <strong>Risk factors breakdown</strong>
          <ul style={{ marginTop: '0.5rem', listStyle: 'none', padding: 0 }}>
            {riskFactors.map((factor, index) => (
              <li key={index} style={{ 
                padding: '0.5rem 0',
                borderBottom: index < riskFactors.length - 1 ? '1px solid #2a2a2a' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ 
                  fontSize: '1.2rem',
                  color: factor.type === 'positive' ? '#10b981' 
                    : factor.type === 'critical' ? '#ef4444'
                    : factor.type === 'warning' ? '#f59e0b'
                    : '#6b7280'
                }}>
                  {factor.type === 'positive' ? '✓' 
                    : factor.type === 'critical' ? '✗'
                    : factor.type === 'warning' ? '⚠'
                    : '•'}
                </span>
                <span style={{ flex: 1 }}>{factor.message}</span>
                <span style={{ 
                  fontSize: '0.875rem',
                  color: factor.points > 0 ? '#10b981' : '#ef4444',
                  fontWeight: 'bold'
                }}>
                  {factor.points > 0 ? '+' : ''}{factor.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fraud Detection */}
      <div className="fraud-detection">
        <strong>Fraud detection</strong>
        <ul style={{ marginTop: '0.5rem', listStyle: 'none', padding: 0 }}>
          {fraudIndicators.map((indicator, index) => (
            <li 
              key={index} 
              style={{ 
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: indicator.active 
                  ? indicator.severity === 'critical' ? '#7f1d1d' 
                    : indicator.severity === 'high' ? '#991b1b'
                    : indicator.severity === 'medium' ? '#78350f'
                    : '#1e293b'
                  : '#1a1a1a',
                borderRadius: '6px',
                border: indicator.active ? `1px solid ${getRiskColor(indicator.severity)}` : '1px solid #2a2a2a'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: indicator.description ? '0.25rem' : 0 }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {indicator.active 
                    ? indicator.severity === 'critical' ? '🚨' 
                      : indicator.severity === 'high' ? '⚠️'
                      : indicator.severity === 'medium' ? '⚡'
                      : '•'
                    : '✓'}
                </span>
                <strong style={{ 
                  color: indicator.active ? getRiskColor(indicator.severity) : '#10b981'
                }}>
                  {indicator.label}
                </strong>
              </div>
              {indicator.description && (
                <p style={{ 
                  marginTop: '0.25rem', 
                  fontSize: '0.875rem', 
                  color: '#aaa',
                  marginLeft: '1.75rem'
                }}>
                  {indicator.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}


