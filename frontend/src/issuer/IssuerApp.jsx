import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import StudentTable from './components/StudentTable'
import IssueCredentialModal from './components/IssueCredentialModal'
import IssuedCredentialsView from './components/IssuedCredentialsView'
import RevokedCredentialsView from './components/RevokedCredentialsView'
import CredentialDetailModal from './components/CredentialDetailModal'
import KeyManagementModal from './components/KeyManagementModal'
import RevokeModal from './components/RevokeModal'
import BulkUploadScreen from './components/BulkUploadScreen'
import AuditLogPage from './components/AuditLogPage'
import TwoFASetup from './components/TwoFASetup'
import './issuerApp.css'

// Local storage key for credentials
const STORAGE_KEY = 'issuer_credentials'
const EXPIRATION_TIME_MS = 5 * 60 * 1000 // 5 minutes in milliseconds

// Utility functions for localStorage with expiration
const saveCredentialsToStorage = (credentials) => {
  try {
    // Only add expiration to credentials that don't have it yet
    const credentialsWithExpiration = credentials.map((cred) => {
      if (cred.expiresAt) {
        // Already has expiration, keep it
        return cred
      }
      // New credential, add expiration
      return {
        ...cred,
        storedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + EXPIRATION_TIME_MS).toISOString(),
      }
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentialsWithExpiration))
    console.log(`✅ Saved ${credentialsWithExpiration.length} credentials to localStorage (expires in 5 minutes)`)
  } catch (error) {
    console.error('Error saving credentials to localStorage:', error)
  }
}

const loadCredentialsFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }

    const credentials = JSON.parse(stored)
    const now = new Date()

    // Filter out expired credentials
    const validCredentials = credentials.filter((cred) => {
      if (!cred.expiresAt) return false
      const expiresAt = new Date(cred.expiresAt)
      return expiresAt > now
    })

    // If some credentials expired, update storage
    if (validCredentials.length !== credentials.length) {
      const expiredCount = credentials.length - validCredentials.length
      console.log(`⚠️ Removed ${expiredCount} expired credential(s) from storage`)
      saveCredentialsToStorage(validCredentials)
    }

    return validCredentials
  } catch (error) {
    console.error('Error loading credentials from localStorage:', error)
    return []
  }
}

const addCredentialToStorage = (credential) => {
  const existing = loadCredentialsFromStorage()
  const updated = [...existing, credential]
  saveCredentialsToStorage(updated)
  return updated
}

const addCredentialsToStorage = (newCredentials) => {
  const existing = loadCredentialsFromStorage()
  const updated = [...existing, ...newCredentials]
  saveCredentialsToStorage(updated)
  return updated
}

export default function IssuerApp() {
  const [activeView, setActiveView] = useState('students')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedCredential, setSelectedCredential] = useState(null)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showCredentialModal, setShowCredentialModal] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)

  // Mock data
  const [issuerName] = useState('MVJ College of Engineering')
  const [issuerDID] = useState('did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
  const [stats, setStats] = useState({ issued: 42, active: 38, revoked: 4 })
  const [students] = useState([
    { id: 'stu_01', name: 'Aria Fernandez', did: 'did:example:aria', rollNo: 'R2024001', status: 'pending', email: 'aria@example.com' },
    { id: 'stu_02', name: 'Malik Osei', did: 'did:example:malik', rollNo: 'R2024002', status: 'verified', email: 'malik@example.com' },
    { id: 'stu_03', name: 'Jia Li', did: 'did:example:jia', rollNo: 'R2024003', status: 'issued', email: 'jia@example.com' },
  ])
  // Load credentials from localStorage on mount
  const [credentials, setCredentials] = useState(() => {
    const stored = loadCredentialsFromStorage()
    // If no stored credentials, use default mock data
    if (stored.length === 0) {
      return [
        {
          id: 'cred_001',
          credentialSubject: { name: 'Jia Li', email: 'jia@example.com' },
          issueDate: new Date().toISOString(),
          revoked: false,
          txHash: '0x1234567890abcdef',
        },
      ]
    }
    return stored
  })
  const [keys] = useState([
    { type: 'BBS+', publicKey: '0xabc123...', txHash: '0xdef456...' },
    { type: 'Ed25519', publicKey: '0x789xyz...', txHash: null },
  ])
  const [auditLogs, setAuditLogs] = useState([
    { timestamp: new Date().toISOString(), action: 'issue', user: 'Admin', credentialId: 'cred_001', details: 'Issued degree credential', txHash: '0x123...' },
    { timestamp: new Date(Date.now() - 86400000).toISOString(), action: 'verify', user: 'Admin', credentialId: null, details: 'Verified student documents' },
  ])

  // Load credentials from localStorage on component mount
  useEffect(() => {
    const stored = loadCredentialsFromStorage()
    if (stored.length > 0) {
      setCredentials(stored)
      // Update stats based on stored credentials
      const active = stored.filter((c) => !c.revoked).length
      const revoked = stored.filter((c) => c.revoked).length
      setStats({ issued: stored.length, active, revoked })
    }
  }, [])

  // Cleanup expired credentials every minute
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const validCredentials = loadCredentialsFromStorage()
      if (validCredentials.length !== credentials.length) {
        setCredentials(validCredentials)
        const active = validCredentials.filter((c) => !c.revoked).length
        const revoked = validCredentials.filter((c) => c.revoked).length
        setStats({ issued: validCredentials.length, active, revoked })
        console.log('🧹 Cleaned up expired credentials')
      }
    }, 60000) // Check every minute

    return () => clearInterval(cleanupInterval)
  }, [credentials.length])

  // Extract students from issued credentials
  const getStudentsFromCredentials = () => {
    const studentMap = new Map()
    
    credentials.forEach((cred) => {
      const subject = cred.credentialSubject || {}
      const rollNo = subject.rollNo || cred.rollNo
      const name = subject.name || cred.name
      
      if (rollNo && name) {
        if (!studentMap.has(rollNo)) {
          studentMap.set(rollNo, {
            id: `stu_${rollNo}`,
            name: name,
            did: subject.id || `did:example:${rollNo}`,
            rollNo: rollNo,
            status: cred.revoked ? 'revoked' : 'issued',
            email: subject.email || cred.email,
            degree: subject.degree || cred.degree,
            college: subject.college || cred.college,
            cgpa: subject.cgpa || cred.cgpa,
            age: subject.age || cred.age,
            credentialId: cred.id,
            issueDate: cred.issueDate,
          })
        }
      }
    })
    
    // Merge with existing students (from mock data)
    const existingStudents = students.filter(s => !studentMap.has(s.rollNo))
    return [...Array.from(studentMap.values()), ...existingStudents]
  }

  const handleViewStudent = (student) => {
    setSelectedStudent(student)
    // Could open a student detail modal here
  }

  const handleVerifyStudent = (student) => {
    // Update student status to verified
    console.log('Verify student:', student)
  }

  const handleIssueCredential = (student) => {
    setSelectedStudent(student)
    setShowIssueModal(true)
  }

  const handleIssueComplete = (vc) => {
    const newCredential = { ...vc, issueDate: new Date().toISOString(), revoked: false }
    const updatedCredentials = [...credentials, newCredential]
    setCredentials(updatedCredentials)
    setStats({ ...stats, issued: stats.issued + 1, active: stats.active + 1 })
    
    // Save to localStorage with expiration
    addCredentialToStorage(newCredential)
    
    // Add audit log entry
    const subject = vc.credentialSubject || {}
    setAuditLogs([
      {
        timestamp: new Date().toISOString(),
        action: 'issue',
        user: issuerName,
        credentialId: vc.id || newCredential.id,
        details: `Issued credential to ${subject.name || 'student'}`,
        txHash: vc.txHash || newCredential.txHash,
      },
      ...auditLogs,
    ])
    
    setShowIssueModal(false)
  }

  const handleViewCredential = (credential) => {
    setSelectedCredential(credential)
    setShowCredentialModal(true)
  }

  const handleRevokeCredential = (credential) => {
    setSelectedCredential(credential)
    setShowRevokeModal(true)
  }

  const handleRevokeComplete = (credential, txHash) => {
    const now = new Date().toISOString()
    const updatedCredentials = credentials.map((c) =>
      c.id === credential.id 
        ? { 
            ...c, 
            revoked: true, 
            revokedAt: now,
            revocationReason: 'Revoked via issuer portal',
            txHash: txHash || c.txHash // Preserve existing txHash if new one not provided
          } 
        : c
    )
    setCredentials(updatedCredentials)
    setStats({ ...stats, revoked: stats.revoked + 1, active: stats.active - 1 })
    
    // Update localStorage
    saveCredentialsToStorage(updatedCredentials)
    
    // Add audit log entry
    const subject = credential.credentialSubject || {}
    setAuditLogs([
      {
        timestamp: now,
        action: 'revoke',
        user: issuerName,
        credentialId: credential.id,
        details: `Revoked credential for ${subject.name || 'student'}`,
        txHash: txHash || 'confirmed',
      },
      ...auditLogs,
    ])
    
    setShowRevokeModal(false)
    setShowCredentialModal(false)
    
    // Force a re-render to update the revoked credentials view
    console.log('✅ Credential revoked:', credential.id)
  }

  const handleUnrevoke = (credential) => {
    const updatedCredentials = credentials.map((c) =>
      c.id === credential.id 
        ? { 
            ...c, 
            revoked: false,
            revokedAt: undefined,
            revocationReason: undefined
          } 
        : c
    )
    setCredentials(updatedCredentials)
    setStats({ ...stats, revoked: stats.revoked - 1, active: stats.active + 1 })
    
    // Update localStorage
    saveCredentialsToStorage(updatedCredentials)
    
    // Add audit log entry
    const subject = credential.credentialSubject || {}
    setAuditLogs([
      {
        timestamp: new Date().toISOString(),
        action: 'unrevoke',
        user: issuerName,
        credentialId: credential.id,
        details: `Unrevoked credential for ${subject.name || 'student'}`,
      },
      ...auditLogs,
    ])
    
    console.log('✅ Credential unrevoked:', credential.id)
  }

  const handleRotateKeys = async () => {
    // Implement key rotation
    console.log('Rotate keys')
  }

  const renderView = () => {
    switch (activeView) {
      case 'students':
        return (
          <StudentTable
            students={getStudentsFromCredentials()}
            onView={handleViewStudent}
            onVerify={handleVerifyStudent}
            onIssue={handleIssueCredential}
          />
        )
      case 'issue':
        return (
          <div className="issue-view">
            <h2>Issue Credential</h2>
            <p>Select a student from the Students tab to issue a credential, or use bulk upload.</p>
            <button className="btn-primary" onClick={() => setActiveView('bulk')}>
              Bulk Upload
            </button>
          </div>
        )
      case 'issued':
        return (
          <IssuedCredentialsView
            credentials={credentials}
            onView={handleViewCredential}
            onRevoke={handleRevokeCredential}
          />
        )
      case 'revoke':
        return (
          <RevokedCredentialsView
            credentials={credentials}
            onView={handleViewCredential}
            onUnrevoke={handleUnrevoke}
          />
        )
      case 'did':
        return (
          <div className="did-view">
            <h2>DID Management</h2>
            <button className="btn-primary" onClick={() => setShowKeyModal(true)}>
              Manage Keys
            </button>
          </div>
        )
      case 'audit':
        return <AuditLogPage logs={auditLogs} />
      case 'settings':
        return (
          <div className="settings-view">
            <TwoFASetup />
          </div>
        )
      case 'bulk':
        return (
          <BulkUploadScreen
            issuerDID={issuerDID}
            issuerName={issuerName}
            onUpload={(results) => {
              // Process uploaded credentials and add them to the credentials list
              if (results.credentials && Array.isArray(results.credentials)) {
                // Credentials already have proper VC JSON structure from BulkUploadScreen
                const newCredentials = results.credentials.map((cred) => ({
                  ...cred,
                  // Ensure credentialSubject exists (it should from generateVerifiableCredential)
                  credentialSubject: cred.credentialSubject || {
                    name: cred.name,
                    age: cred.age,
                    degree: cred.degree,
                    cgpa: cred.cgpa,
                    projectTitle: cred.projectTitle,
                    college: cred.college,
                    rollNo: cred.rollNo,
                    achievements: cred.achievements,
                    experience: cred.experience,
                    contributions: cred.contributions,
                  },
                  // VC JSON is already in cred.vc from generateVerifiableCredential
                  // If not present, generate it
                  vc: cred.vc || {
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    id: cred.id,
                    type: ['VerifiableCredential', 'DegreeCredential'],
                    issuer: {
                      id: issuerDID,
                      name: issuerName
                    },
                    issuanceDate: cred.issueDate,
                    credentialSubject: cred.credentialSubject,
                    proof: {
                      type: 'BbsBlsSignature2020',
                      created: cred.issueDate
                    }
                  }
                }))
                const updatedCredentials = [...credentials, ...newCredentials]
                setCredentials(updatedCredentials)
                setStats({
                  ...stats,
                  issued: stats.issued + newCredentials.length,
                  active: stats.active + newCredentials.length,
                })
                
                // Save to localStorage with expiration
                addCredentialsToStorage(newCredentials)
                
                // Add audit log entry for bulk upload
                const newLogs = newCredentials.map((cred) => {
                  const subject = cred.credentialSubject || {}
                  return {
                    timestamp: new Date().toISOString(),
                    action: 'issue',
                    user: issuerName,
                    credentialId: cred.id,
                    details: `Bulk upload: Issued credential to ${subject.name || 'student'}`,
                    txHash: cred.txHash,
                  }
                })
                setAuditLogs([...newLogs, ...auditLogs])
                
                alert(`Successfully uploaded ${newCredentials.length} credentials with VC JSON! Stored locally for 5 minutes.`)
                setActiveView('issued')
              } else {
                console.log('Upload results:', results)
              }
            }}
          />
        )
      default:
        return <div>View not found</div>
    }
  }

  return (
    <div className="issuer-app">
      <div className="grid-backdrop" aria-hidden />
      <Header issuerName={issuerName} issuerDID={issuerDID} stats={stats} />
      <div className="issuer-layout">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="issuer-content">
          {renderView()}
        </main>
      </div>

      {/* Modals */}
      <IssueCredentialModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        student={selectedStudent}
        onIssue={handleIssueComplete}
      />
      <CredentialDetailModal
        isOpen={showCredentialModal}
        onClose={() => setShowCredentialModal(false)}
        credential={selectedCredential}
        onRevoke={handleRevokeCredential}
        onUnrevoke={handleUnrevoke}
      />
      <KeyManagementModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        keys={keys}
        onRotate={handleRotateKeys}
      />
      <RevokeModal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        credential={selectedCredential}
        onRevoke={handleRevokeComplete}
      />
    </div>
  )
}
