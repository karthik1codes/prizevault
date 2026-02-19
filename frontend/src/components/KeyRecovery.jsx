import React, { useState } from 'react'
import './KeyRecovery.css'
import './shared.css'

function KeyRecovery() {
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const [seedPhrase, setSeedPhrase] = useState('')
  const [recoveryMode, setRecoveryMode] = useState('seed') // 'seed' or 'social'
  const [trustedContacts, setTrustedContacts] = useState([])
  const [newContact, setNewContact] = useState({ name: '', did: '' })
  const [copied, setCopied] = useState(false)
  const [verified, setVerified] = useState(false)

  // Generate a mock seed phrase (in production, this would be cryptographically secure)
  const generateSeedPhrase = () => {
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actual', 'adapt',
      'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice'
    ]
    
    const phrase = []
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * words.length)
      phrase.push(words[randomIndex])
    }
    return phrase.join(' ')
  }

  const handleGenerateSeed = () => {
    const phrase = generateSeedPhrase()
    setSeedPhrase(phrase)
    setShowSeedPhrase(true)
    setVerified(false)
  }

  const copySeedPhrase = () => {
    if (seedPhrase) {
      navigator.clipboard.writeText(seedPhrase)
        .then(() => {
          setCopied(true)
          // Note: In production, store timeoutId in useRef and cleanup in useEffect
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(err => {
          console.error('Failed to copy:', err)
        })
    }
  }

  const handleAddTrustedContact = () => {
    if (newContact.name && newContact.did) {
      setTrustedContacts([...trustedContacts, { ...newContact, id: Date.now() }])
      setNewContact({ name: '', did: '' })
    }
  }

  const handleRemoveContact = (id) => {
    setTrustedContacts(trustedContacts.filter(contact => contact.id !== id))
  }

  const handleVerify = () => {
    setVerified(true)
  }

  return (
    <section className="key-recovery">
      <div className="key-recovery-card">
        <div className="key-recovery-header">
          <div>
            <h2 className="key-recovery-title">🔐 Key Recovery & Backup</h2>
            <p className="key-recovery-subtitle">
              Secure your digital identity with seed phrase backup or social recovery
            </p>
          </div>
        </div>

        {/* Recovery Mode Selector */}
        <div className="recovery-mode-selector">
          <button
            className={`mode-tab ${recoveryMode === 'seed' ? 'active' : ''}`}
            onClick={() => setRecoveryMode('seed')}
          >
            📝 Seed Phrase Backup
          </button>
          <button
            className={`mode-tab ${recoveryMode === 'social' ? 'active' : ''}`}
            onClick={() => setRecoveryMode('social')}
          >
            👥 Social Recovery
          </button>
        </div>

        {recoveryMode === 'seed' ? (
          <div className="seed-phrase-section">
            <div className="security-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <h3>Critical Security Information</h3>
                <ul>
                  <li>Never share your seed phrase with anyone</li>
                  <li>Store it in a secure, offline location</li>
                  <li>Never store it digitally or take screenshots</li>
                  <li>If lost, you cannot recover your identity</li>
                </ul>
              </div>
            </div>

            {!showSeedPhrase ? (
              <div className="seed-phrase-setup">
                <div className="setup-icon">🔑</div>
                <h3>Generate Seed Phrase</h3>
                <p className="setup-description">
                  A seed phrase is a 12-word recovery phrase that gives you full control over your digital identity.
                  Keep it safe and never share it with anyone.
                </p>
                <button className="btn btn-primary btn-large" onClick={handleGenerateSeed}>
                  Generate Seed Phrase
                </button>
              </div>
            ) : (
              <div className="seed-phrase-display">
                <div className="seed-phrase-header">
                  <h3>Your Recovery Seed Phrase</h3>
                  <button className="btn-link" onClick={() => setShowSeedPhrase(false)}>
                    Hide
                  </button>
                </div>
                
                <div className="seed-phrase-words">
                  {seedPhrase.split(' ').map((word, index) => (
                    <div key={index} className="seed-word">
                      <span className="word-number">{index + 1}</span>
                      <span className="word-text">{word}</span>
                    </div>
                  ))}
                </div>

                <div className="seed-phrase-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={copySeedPhrase}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleVerify}
                    disabled={verified}
                  >
                    {verified ? '✓ Verified' : 'I Have Backed Up'}
                  </button>
                </div>

                {verified && (
                  <div className="verification-success">
                    <span className="success-icon">✓</span>
                    <span>Great! Your seed phrase has been verified. Keep it safe!</span>
                  </div>
                )}

                <div className="backup-instructions">
                  <h4>📋 Backup Instructions</h4>
                  <ol>
                    <li>Write down all 12 words in the exact order shown</li>
                    <li>Store the written copy in a secure, physical location (safe, vault, etc.)</li>
                    <li>Consider making multiple copies stored in different secure locations</li>
                    <li>Never store your seed phrase digitally or online</li>
                    <li>Test your backup by attempting to restore from it (in a test environment)</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="social-recovery-section">
            <div className="social-recovery-info">
              <div className="info-icon">👥</div>
              <div className="info-content">
                <h3>Social Key Recovery</h3>
                <p>
                  Social recovery allows you to recover your identity using trusted contacts instead of a seed phrase.
                  This is more user-friendly but requires setting up trusted contacts.
                </p>
              </div>
            </div>

            <div className="trusted-contacts-setup">
              <h4>Trusted Contacts</h4>
              <p className="setup-hint">
                Add 3-5 trusted contacts who can help you recover your identity if you lose access.
                They will need to approve recovery requests.
              </p>

              <div className="add-contact-form">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contact Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="DID (did:key:...)"
                  value={newContact.did}
                  onChange={(e) => setNewContact({ ...newContact, did: e.target.value })}
                />
                <button 
                  className="btn btn-primary"
                  onClick={handleAddTrustedContact}
                  disabled={!newContact.name || !newContact.did}
                >
                  Add Contact
                </button>
              </div>

              {trustedContacts.length > 0 && (
                <div className="trusted-contacts-list">
                  {trustedContacts.map((contact) => (
                    <div key={contact.id} className="contact-item">
                      <div className="contact-info">
                        <span className="contact-name">{contact.name}</span>
                        <code className="contact-did">{contact.did}</code>
                      </div>
                      <button
                        className="btn btn-text btn-small"
                        onClick={() => handleRemoveContact(contact.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="recovery-threshold">
                <label>Recovery Threshold</label>
                <div className="threshold-info">
                  <span>Require {Math.ceil(trustedContacts.length * 0.6)} of {trustedContacts.length} contacts to approve recovery</span>
                  {trustedContacts.length < 3 && (
                    <span className="threshold-warning">⚠️ Add at least 3 contacts for secure recovery</span>
                  )}
                </div>
              </div>

              {trustedContacts.length >= 3 && (
                <div className="setup-complete">
                  <button className="btn btn-primary btn-large">
                    ✓ Complete Social Recovery Setup
                  </button>
                </div>
              )}
            </div>

            <div className="recovery-process-info">
              <h4>How Social Recovery Works</h4>
              <div className="process-steps">
                <div className="process-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h5>Setup</h5>
                    <p>Add trusted contacts who can help you recover your identity</p>
                  </div>
                </div>
                <div className="process-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h5>Recovery Request</h5>
                    <p>If you lose access, initiate a recovery request</p>
                  </div>
                </div>
                <div className="process-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h5>Approval</h5>
                    <p>Your trusted contacts approve the recovery request</p>
                  </div>
                </div>
                <div className="process-step">
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <h5>Recovery</h5>
                    <p>Once threshold is met, your identity is recovered</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default KeyRecovery

