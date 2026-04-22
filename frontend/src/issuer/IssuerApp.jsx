import React, { useState, useEffect } from 'react'
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from '../constants/escrow'
import {
  clearActiveSession,
  getActiveSession,
  hasRequiredRole,
  requireManualConnect,
} from '../utils/authSession'
import { resolveSessionWithQrBootstrap } from '../utils/qrSession'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import OrganizerDashboard from './components/OrganizerDashboard'
import ParticipantManager from './components/ParticipantManager'
import WinnerSelection from './components/WinnerSelection'
import PayoutProposal from './components/PayoutProposal'
import OrganizerHackathonList from './components/OrganizerHackathonList'
import CreateHackathonForm from './components/CreateHackathonForm'
import AuditLogPage from './components/AuditLogPage'
import TwoFASetup from './components/TwoFASetup'
import Timeline from './components/Timeline'
import { getIssuerAuditLogs } from '../utils/issuerAuditLog'
import './issuerApp.css'

const HACKATHON_STORAGE_KEY = 'prize_vault_hackathons'

function getHackathons() {
  try {
    const stored = localStorage.getItem(HACKATHON_STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (_) {}
  return []
}

function initHackathonData() {
  try {
    const existing = localStorage.getItem(HACKATHON_STORAGE_KEY)
    if (!existing) {
      localStorage.setItem(HACKATHON_STORAGE_KEY, JSON.stringify([]))
    } else {
      const parsed = JSON.parse(existing)
      const fixed = parsed.map((h) => ({
        ...h,
        participants: h.participants || [],
        participantCount: h.participants?.length || 0,
      })).filter((h) => !(h.id === 'hack_001' && h.name === "RIFT '26"))
      localStorage.setItem(HACKATHON_STORAGE_KEY, JSON.stringify(fixed))
    }
  } catch (_) {}
}

export default function IssuerApp() {
  useEffect(() => {
    resolveSessionWithQrBootstrap()
  }, [])

  useEffect(() => {
    if (!hasRequiredRole('organizer')) {
      window.location.href = '/holder'
    }
  }, [])

  initHackathonData()
  const [activeView, setActiveView] = useState('dashboard')
  const [navigateParam, setNavigateParam] = useState(null)

  const organizerName = 'Organizer'
  const session = getActiveSession()
  const walletAddress = session?.wallet || DEFAULT_ORGANIZER_ESCROW_ADDRESS

  const handleDisconnect = () => {
    clearActiveSession()
    requireManualConnect()
    window.location.href = '/holder'
  }

  const hackathons = getHackathons()
  const myHackathons = hackathons.filter(
    (h) => h.organizerAddress?.toLowerCase() === walletAddress?.toLowerCase()
  )
  const totalParticipants = myHackathons.reduce((sum, h) => sum + (h.participants?.length || 0), 0)
  const pendingPayouts = myHackathons.filter((h) => h.winnersSelected && !h.payoutProposed).length
  const awaitingApproval = myHackathons.filter((h) => h.payoutProposed).length

  const [stats, setStats] = useState({
    hackathons: myHackathons.length,
    participants: totalParticipants,
    pendingPayouts,
  })

  const [auditLogs, setAuditLogs] = useState([])

  useEffect(() => {
    const hackathonsData = getHackathons()
    const myH = hackathonsData.filter(
      (h) => h.organizerAddress?.toLowerCase() === walletAddress?.toLowerCase()
    )
    const parts = myH.reduce((sum, h) => sum + (h.participants?.length || 0), 0)
    const pending = myH.filter((h) => h.winnersSelected && !h.payoutProposed).length
    const awaiting = myH.filter((h) => h.payoutProposed).length
    setStats({
      hackathons: myH.length,
      participants: parts,
      pendingPayouts: pending,
    })
  }, [activeView])

  useEffect(() => {
    const refreshLogs = () => setAuditLogs(getIssuerAuditLogs())
    refreshLogs()
    window.addEventListener('prize_vault_audit_logs_updated', refreshLogs)
    return () => window.removeEventListener('prize_vault_audit_logs_updated', refreshLogs)
  }, [])

  const handleNavigate = (view, param) => {
    setActiveView(view)
    setNavigateParam(param)
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <OrganizerDashboard
            userWallet={walletAddress}
            onNavigate={handleNavigate}
          />
        )
      case 'participants':
        return (
          <ParticipantManager
            hackathonId={navigateParam}
            userWallet={walletAddress}
            onNavigate={handleNavigate}
          />
        )
      case 'winners':
        return (
          <WinnerSelection
            hackathonId={navigateParam}
            userWallet={walletAddress}
            onSave={() => handleNavigate('payouts')}
          />
        )
      case 'payouts':
        return (
          <PayoutProposal
            hackathonId={navigateParam}
            userWallet={walletAddress}
          />
        )
      case 'hackathons':
        return (
          <OrganizerHackathonList
            userWallet={walletAddress}
            onNavigate={handleNavigate}
          />
        )
      case 'create-hackathon':
        return (
          <CreateHackathonForm
            userWallet={walletAddress}
            onSave={() => handleNavigate('hackathons')}
            onCancel={() => handleNavigate('hackathons')}
          />
        )
      case 'timeline':
        return <Timeline userWallet={walletAddress} />
      case 'audit':
        return <AuditLogPage logs={auditLogs} />
      case 'settings':
        return (
          <div className="settings-view">
            <TwoFASetup />
          </div>
        )
      default:
        return <OrganizerDashboard userWallet={walletAddress} onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="organizer-app issuer-app">
      <div className="grid-backdrop" aria-hidden />
      <Header
        organizerName={organizerName}
        walletAddress={walletAddress}
        stats={stats}
        onDisconnect={handleDisconnect}
      />
      <div className="organizer-layout issuer-layout">
        <Sidebar activeView={activeView} onViewChange={(v) => { setActiveView(v); setNavigateParam(null) }} />
        <main className="organizer-content issuer-content">
          {renderView()}
        </main>
      </div>
    </div>
  )
}
