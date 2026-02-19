import React, { useState, useEffect } from 'react'

export default function TwoFASetup() {
  const [twoFAStatus, setTwoFAStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [setupSecret, setSetupSecret] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [setupStep, setSetupStep] = useState('status') // 'status', 'setup', 'verify', 'enabled'
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  useEffect(() => {
    check2FAStatus()
  }, [])

  const check2FAStatus = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/2fa/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'demo-key' },
      })
      
      if (response.ok) {
        const result = await response.json()
        setTwoFAStatus(result)
        if (result.enabled) {
          setSetupStep('enabled')
        } else {
          setSetupStep('status')
        }
      } else {
        throw new Error('Failed to check 2FA status')
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error)
      setError('Failed to check 2FA status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'demo-key' },
        body: JSON.stringify({
          issuerName: 'MVJ College of Engineering',
          accountName: 'issuer@mvjcollege.edu',
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to setup 2FA')
      }
      
      const result = await response.json()
      setSetupSecret(result)
      setSetupStep('verify')
      setSuccess('2FA secret generated. Please scan the QR code with your authenticator app.')
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      setError(error.message || 'Failed to setup 2FA. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      // First verify the code matches the secret
      const verifyResponse = await fetch('/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'demo-key' },
        body: JSON.stringify({
          token: verificationCode,
          secret: setupSecret.secret,
        }),
      })
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json()
        throw new Error(errorData.error || 'Invalid verification code')
      }
      
      const verifyResult = await verifyResponse.json()
      
      if (!verifyResult.success) {
        throw new Error('Invalid verification code. Please check your authenticator app.')
      }
      
      // Code is valid - enable 2FA
      const enableResponse = await fetch('/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'demo-key' },
        body: JSON.stringify({
          secret: setupSecret.secret,
          token: verificationCode,
          backupCodes: setupSecret.backupCodes,
        }),
      })
      
      if (!enableResponse.ok) {
        const errorData = await enableResponse.json()
        throw new Error(errorData.error || 'Failed to enable 2FA')
      }
      
      const enableResult = await enableResponse.json()
      setBackupCodes(enableResult.backupCodes || setupSecret.backupCodes || [])
      setSetupStep('enabled')
      setSuccess('2FA has been enabled successfully!')
      setVerificationCode('')
      await check2FAStatus()
    } catch (error) {
      console.error('Error verifying/enabling 2FA:', error)
      setError(error.message || 'Failed to verify code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will remove security protection for credential revocation.')) {
      return
    }

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter your 2FA code to disable 2FA')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'demo-key' },
        body: JSON.stringify({
          token: verificationCode,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to disable 2FA')
      }
      
      setSetupStep('status')
      setSuccess('2FA has been disabled successfully')
      setVerificationCode('')
      await check2FAStatus()
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      setError(error.message || 'Failed to disable 2FA. Please check your code and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGetBackupCodes = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter your 2FA code to view backup codes')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/2fa/backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'demo-key' },
        body: JSON.stringify({
          token: verificationCode,
          regenerate: false,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get backup codes')
      }
      
      const result = await response.json()
      setBackupCodes(result.backupCodes || [])
      setShowBackupCodes(true)
      setVerificationCode('')
    } catch (error) {
      console.error('Error getting backup codes:', error)
      setError(error.message || 'Failed to get backup codes. Please check your code and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="two-fa-setup">
      <h2>Two-Factor Authentication (2FA)</h2>
      <p className="muted" style={{ marginBottom: '2rem' }}>
        Enable 2FA to require authentication codes when revoking credentials. This adds an extra layer of security to prevent unauthorized revocations.
      </p>

      {error && (
        <div style={{
          padding: '1rem',
          background: '#3a1a1a',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          color: '#ef4444',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          background: '#1a3a2a',
          border: '1px solid #10b981',
          borderRadius: '6px',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      {loading && setupStep === 'status' && (
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          <p>Checking 2FA status...</p>
        </div>
      )}

      {!loading && setupStep === 'status' && (
        <div style={{ padding: '2rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
          {twoFAStatus?.enabled ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem' }}>✅</span>
                <div>
                  <h3 style={{ margin: 0 }}>2FA is Enabled</h3>
                  <p className="muted" style={{ margin: '0.25rem 0 0 0' }}>
                    Enabled on {twoFAStatus.enabledAt ? new Date(twoFAStatus.enabledAt).toLocaleDateString() : 'unknown date'}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  className="button secondary"
                  onClick={() => setSetupStep('disable')}
                  style={{ flex: 1 }}
                >
                  Disable 2FA
                </button>
                <button
                  className="button ghost"
                  onClick={() => setSetupStep('backup')}
                  style={{ flex: 1 }}
                >
                  View Backup Codes
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem' }}>🔒</span>
                <div>
                  <h3 style={{ margin: 0 }}>2FA is Not Enabled</h3>
                  <p className="muted" style={{ margin: '0.25rem 0 0 0' }}>
                    Enable 2FA to protect credential revocation operations
                  </p>
                </div>
              </div>
              
              <button
                className="button primary"
                onClick={handleSetup}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Enable 2FA
              </button>
            </>
          )}
        </div>
      )}

      {setupStep === 'verify' && setupSecret && (
        <div style={{ padding: '2rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ marginTop: 0 }}>Step 1: Scan QR Code</h3>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
          </p>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '1rem',
            background: '#fff',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            {setupSecret.qrCode && (
              <img 
                src={setupSecret.qrCode} 
                alt="2FA QR Code" 
                style={{ maxWidth: '256px', width: '100%', height: 'auto' }}
              />
            )}
          </div>

          <div style={{ 
            padding: '1rem', 
            background: '#1a2a3a', 
            borderRadius: '6px', 
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Can't scan?</strong>
            <p style={{ margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              Manual entry secret: <code style={{ color: '#60a5fa' }}>{setupSecret.secret}</code>
            </p>
          </div>

          <h3 style={{ marginTop: '2rem' }}>Step 2: Verify Code</h3>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Enter the 6-digit code from your authenticator app to complete setup
          </p>

          <div className="form-group">
            <label>Verification Code</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setVerificationCode(value)
                setError('')
              }}
              placeholder="000000"
              maxLength="6"
              style={{
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                textAlign: 'center',
                padding: '0.75rem',
              }}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              className="button secondary"
              onClick={() => {
                setSetupStep('status')
                setSetupSecret(null)
                setVerificationCode('')
              }}
              style={{ flex: 1 }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="button primary"
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              style={{ flex: 1 }}
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {setupStep === 'enabled' && (
        <div style={{ padding: '2rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2rem' }}>✅</span>
            <div>
              <h3 style={{ margin: 0, color: '#10b981' }}>2FA Enabled Successfully!</h3>
              <p className="muted" style={{ margin: '0.25rem 0 0 0' }}>
                Two-factor authentication is now active for credential revocation
              </p>
            </div>
          </div>

          {backupCodes && backupCodes.length > 0 && (
            <div style={{
              padding: '1.5rem',
              background: '#1a2a3a',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ marginTop: 0, color: '#60a5fa' }}>⚠️ Backup Codes</h4>
              <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                Save these backup codes in a secure location. You can use them to revoke credentials if you lose access to your authenticator app. Each code can only be used once.
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem',
                padding: '1rem',
                background: '#0a0a0a',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}>
                {backupCodes.map((code, index) => (
                  <div key={index} style={{ padding: '0.5rem', textAlign: 'center' }}>
                    {code}
                  </div>
                ))}
              </div>
              
              <button
                className="button ghost small"
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join('\n'))
                  alert('Backup codes copied to clipboard!')
                }}
                style={{ marginTop: '1rem' }}
              >
                Copy All Codes
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="button secondary"
              onClick={() => {
                setSetupStep('status')
                setBackupCodes([])
                check2FAStatus()
              }}
              style={{ flex: 1 }}
            >
              Done
            </button>
            <button
              className="button ghost"
              onClick={() => setSetupStep('disable')}
              style={{ flex: 1 }}
            >
              Disable 2FA
            </button>
          </div>
        </div>
      )}

      {setupStep === 'disable' && (
        <div style={{ padding: '2rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ marginTop: 0, color: '#ef4444' }}>Disable 2FA</h3>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Enter your 2FA code to disable two-factor authentication. This will remove security protection for credential revocation.
          </p>

          <div className="form-group">
            <label>2FA Code</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setVerificationCode(value)
                setError('')
              }}
              placeholder="000000"
              maxLength="6"
              style={{
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                textAlign: 'center',
                padding: '0.75rem',
              }}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              className="button secondary"
              onClick={() => {
                setSetupStep('status')
                setVerificationCode('')
                setError('')
              }}
              style={{ flex: 1 }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="button danger"
              onClick={handleDisable}
              disabled={loading || verificationCode.length !== 6}
              style={{ flex: 1 }}
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      )}

      {setupStep === 'backup' && (
        <div style={{ padding: '2rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ marginTop: 0 }}>View Backup Codes</h3>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Enter your 2FA code to view your backup codes
          </p>

          {!showBackupCodes ? (
            <>
              <div className="form-group">
                <label>2FA Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setVerificationCode(value)
                    setError('')
                  }}
                  placeholder="000000"
                  maxLength="6"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1.5rem',
                    letterSpacing: '0.5rem',
                    textAlign: 'center',
                    padding: '0.75rem',
                  }}
                  disabled={loading}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  className="button secondary"
                  onClick={() => {
                    setSetupStep('status')
                    setVerificationCode('')
                    setError('')
                  }}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="button primary"
                  onClick={handleGetBackupCodes}
                  disabled={loading || verificationCode.length !== 6}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Loading...' : 'View Backup Codes'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                padding: '1.5rem',
                background: '#1a2a3a',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ marginTop: 0, color: '#60a5fa' }}>Backup Codes</h4>
                <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Use these codes if you lose access to your authenticator app. Each code can only be used once.
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem',
                  padding: '1rem',
                  background: '#0a0a0a',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}>
                  {backupCodes.map((code, index) => (
                    <div key={index} style={{ padding: '0.5rem', textAlign: 'center' }}>
                      {code}
                    </div>
                  ))}
                </div>
                
                <button
                  className="button ghost small"
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join('\n'))
                    alert('Backup codes copied to clipboard!')
                  }}
                  style={{ marginTop: '1rem' }}
                >
                  Copy All Codes
                </button>
              </div>

              <button
                className="button primary"
                onClick={() => {
                  setSetupStep('status')
                  setShowBackupCodes(false)
                  setBackupCodes([])
                  setVerificationCode('')
                }}
                style={{ width: '100%' }}
              >
                Done
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

