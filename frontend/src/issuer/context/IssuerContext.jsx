import React, { createContext, useCallback, useContext, useMemo, useReducer, useState } from 'react'
import { generateRandomId } from '../../holder/utils/crypto'

const IssuerContext = createContext(null)

const initialState = {
  stats: {
    issuedTotal: 42,
    activeCredentials: 38,
    revokedCredentials: 4,
  },
  students: [
    {
      id: 'stu_01',
      name: 'Aria Fernandez',
      email: 'aria.fernandez@example.edu',
      program: 'BSc Computer Science',
      cohort: '2025',
      status: 'pending',
      submittedDocs: ['Transcript PDF', 'Government ID'],
      notes: 'Awaiting registrar confirmation.',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'stu_02',
      name: 'Malik Osei',
      email: 'malik.osei@example.edu',
      program: 'MBA Blockchain Strategy',
      cohort: '2024',
      status: 'pending',
      submittedDocs: ['Letter of enrollment'],
      notes: 'Requires additional proof of internship.',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'stu_03',
      name: 'Jia Li',
      email: 'jia.li@example.edu',
      program: 'MSc Data Science',
      cohort: '2023',
      status: 'verified',
      submittedDocs: ['Transcript PDF', 'Capstone approval letter'],
      notes: 'Approved by admissions.',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
  issuedCredentials: [
    {
      id: 'cred_9001',
      studentId: 'stu_03',
      studentName: 'Jia Li',
      type: 'Master of Science in Data Science',
      issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      status: 'active',
      txHash: '0x6b1a9f6c239af3b892ec4fa1cb64a8d4da5f8342e023e123f0b5d6893ffab221',
      proofType: 'BBS+',
      evidenceCid: 'bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku',
    },
  ],
  auditLog: [
    {
      id: 'log_1',
      actor: 'Registrar Admin',
      action: 'Issued credential',
      target: 'Jia Li',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      meta: {
        credentialId: 'cred_9001',
        txHash: '0x6b1a9f6c239af3b892ec4fa1cb64a8d4da5f8342e023e123f0b5d6893ffab221',
      },
    },
    {
      id: 'log_2',
      actor: 'Compliance Bot',
      action: 'Synced revocation registry',
      target: 'Polygon Mumbai',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      meta: { revokedCount: 4 },
    },
  ],
  didProfile: {
    did: 'did:web:issuer.example.edu',
    publicKey: '0x04c5b0201d70335a62a3d2e2bb4fde963a4a87442d1ea9b69a8f2e86f1b1d93cb869ce5b1e0d4e7f79b05b4ef1d9afd9ec6b815eda5d75fd7f7cbe7f0eef63e61c',
    bbsKey: 'BBS12-1Q2W3E4R5T6Y7U8I9O0P',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    lastRotated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
}

function issuerReducer(state, action) {
  switch (action.type) {
    case 'VERIFY_STUDENT': {
      const students = state.students.map((student) =>
        student.id === action.payload.studentId
          ? {
              ...student,
              status: 'verified',
              lastUpdated: new Date().toISOString(),
              notes: action.payload.notes ?? student.notes,
            }
          : student,
      )
      return { ...state, students }
    }
    case 'ATTACH_STUDENT_DOCUMENT': {
      const students = state.students.map((student) =>
        student.id === action.payload.studentId
          ? {
              ...student,
              submittedDocs: Array.from(new Set([...(student.submittedDocs || []), action.payload.document])),
              lastUpdated: new Date().toISOString(),
            }
          : student,
      )
      return { ...state, students }
    }
    case 'ISSUE_CREDENTIAL': {
      const issuedCredentials = [action.payload.credential, ...state.issuedCredentials]
      const stats = {
        ...state.stats,
        issuedTotal: state.stats.issuedTotal + 1,
        activeCredentials: state.stats.activeCredentials + 1,
      }
      return { ...state, issuedCredentials, stats }
    }
    case 'REVOKE_CREDENTIAL': {
      const issuedCredentials = state.issuedCredentials.map((credential) =>
        credential.id === action.payload.credentialId
          ? {
              ...credential,
              status: 'revoked',
              revokedAt: new Date().toISOString(),
              revokeReason: action.payload.reason,
            }
          : credential,
      )
      const stats = {
        ...state.stats,
        activeCredentials: Math.max(state.stats.activeCredentials - 1, 0),
        revokedCredentials: state.stats.revokedCredentials + 1,
      }
      return { ...state, issuedCredentials, stats }
    }
    case 'ROTATE_KEYS': {
      const didProfile = {
        ...state.didProfile,
        publicKey: action.payload.publicKey,
        bbsKey: action.payload.bbsKey,
        lastRotated: new Date().toISOString(),
      }
      return { ...state, didProfile }
    }
    case 'APPEND_LOG': {
      return { ...state, auditLog: [action.payload.log, ...state.auditLog] }
    }
    default:
      return state
  }
}

export function IssuerProvider({ children }) {
  const [state, dispatch] = useReducer(issuerReducer, initialState)
  const [uiState, setUiState] = useState({
    revokeModal: { open: false, credentialId: null },
  })

  const logEvent = useCallback((actor, action, target, meta) => {
    dispatch({
      type: 'APPEND_LOG',
      payload: {
        log: {
          id: generateRandomId('log'),
          actor,
          action,
          target,
          meta,
          timestamp: new Date().toISOString(),
        },
      },
    })
  }, [])

  const verifyStudent = useCallback(
    (studentId, notes) => {
      dispatch({ type: 'VERIFY_STUDENT', payload: { studentId, notes } })
      logEvent('Registrar Admin', 'Verified student identity', studentId, { notes })
    },
    [logEvent],
  )

  const attachStudentDocument = useCallback(
    (studentId, document) => {
      dispatch({ type: 'ATTACH_STUDENT_DOCUMENT', payload: { studentId, document } })
      logEvent('Registrar Admin', 'Uploaded verification document', studentId, { document })
    },
    [logEvent],
  )

  const issueCredential = useCallback(
    ({ studentId, credentialType, proofType, evidenceCid }) => {
      const student = state.students.find((item) => item.id === studentId)
      if (!student) throw new Error('Student not found')
      const credential = {
        id: generateRandomId('cred'),
        studentId,
        studentName: student.name,
        type: credentialType,
        issuedAt: new Date().toISOString(),
        status: 'active',
        txHash: `0x${crypto.getRandomValues(new Uint8Array(32)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')}`,
        proofType,
        evidenceCid,
      }
      dispatch({ type: 'ISSUE_CREDENTIAL', payload: { credential } })
      logEvent('Registrar Admin', 'Issued credential', student.name, {
        credentialId: credential.id,
        proofType,
        cid: evidenceCid,
      })
      return credential
    },
    [logEvent, state.students],
  )

  const openRevokeModal = useCallback((credentialId) => {
    setUiState((prev) => ({
      ...prev,
      revokeModal: { open: true, credentialId },
    }))
  }, [])

  const closeRevokeModal = useCallback(() => {
    setUiState((prev) => ({
      ...prev,
      revokeModal: { open: false, credentialId: null },
    }))
  }, [])

  const revokeCredential = useCallback(
    (credentialId, reason, actor = 'Registrar Admin') => {
      dispatch({ type: 'REVOKE_CREDENTIAL', payload: { credentialId, reason } })
      logEvent(actor, 'Revoked credential', credentialId, { reason })
      closeRevokeModal()
    },
    [closeRevokeModal, logEvent],
  )

  const rotateKeys = useCallback(() => {
    const newPublicKey = `0x${crypto
      .getRandomValues(new Uint8Array(64))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')}`
    const newBbsKey = `BBS-${crypto.getRandomValues(new Uint8Array(4)).reduce(
      (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
      '',
    )}`.toUpperCase()
    dispatch({
      type: 'ROTATE_KEYS',
      payload: {
        publicKey: newPublicKey,
        bbsKey: newBbsKey,
      },
    })
    logEvent('Security Bot', 'Rotated issuer keys', state.didProfile.did, { bbsKey: newBbsKey })
  }, [logEvent, state.didProfile.did])

  const value = useMemo(
    () => ({
      state,
      uiState,
      verifyStudent,
      attachStudentDocument,
      issueCredential,
      openRevokeModal,
      closeRevokeModal,
      revokeCredential,
      rotateKeys,
    }),
    [state, uiState, verifyStudent, attachStudentDocument, issueCredential, openRevokeModal, closeRevokeModal, revokeCredential, rotateKeys],
  )

  return <IssuerContext.Provider value={value}>{children}</IssuerContext.Provider>
}

export function useIssuer() {
  const context = useContext(IssuerContext)
  if (!context) throw new Error('useIssuer must be used within IssuerProvider')
  return context
}


