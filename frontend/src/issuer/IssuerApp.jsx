import React, { useState, useEffect } from 'react'
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from '../constants/escrow'
import { hackathonBelongsToOrganizerPortal } from '../utils/organizerPortalFilter'
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
import { broadcastHackathonsDatasetChanged } from '../utils/hackathonSync'
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
      broadcastHackathonsDatasetChanged()
    } else {
      const parsed = JSON.parse(existing)
      const fixed = parsed.map((h) => ({
        ...h,
        participants: h.participants || [],
        participantCount: h.participants?.length || 0,
      })).filter((h) => !(h.id === 'hack_001' && h.name === "RIFT '26"))
      localStorage.setItem(HACKATHON_STORAGE_KEY, JSON.stringify(fixed))
      broadcastHackathonsDatasetChanged()
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
  /** Connected Stellar account (may differ from canonical organizer); used for portal filters. */
  const sessionWallet = session?.wallet ?? null
  /** Always show the organizer G-address in the header (not the sponsor session wallet). */
  const organizerDisplayAddress = DEFAULT_ORGANIZER_ESCROW_ADDRESS

  const handleDisconnect = () => {
    clearActiveSession()
    requireManualConnect()
    window.location.href = '/holder'
  }

  const hackathons = getHackathons()
  const myHackathons = hackathons.filter((h) =>
    hackathonBelongsToOrganizerPortal(h, sessionWallet),
  )
  const totalParticipants = myHackathons.reduce((sum, h) => sum + (h.participants?.length || 0), 0)
  const pendingPayouts = myHackathons.filter((h) => h.winnersSelected && !h.payoutProposed).length

  const [stats, setStats] = useState({
    hackathons: myHackathons.length,
    participants: totalParticipants,
    pendingPayouts,
  })

  const [auditLogs, setAuditLogs] = useState([])

  useEffect(() => {
    const recompute = () => {
      const hackathonsData = getHackathons()
      const myH = hackathonsData.filter((h) =>
        hackathonBelongsToOrganizerPortal(h, sessionWallet),
      )
      const parts = myH.reduce((sum, h) => sum + (h.participants?.length || 0), 0)
      const pending = myH.filter((h) => h.winnersSelected && !h.payoutProposed).length
      setStats({
        hackathons: myH.length,
        participants: parts,
        pendingPayouts: pending,
      })
    }
    recompute()
    window.addEventListener('prize_vault_hackathons_changed', recompute)
    const onStorage = (e) => {
      if (e.key === HACKATHON_STORAGE_KEY || e.key === null) recompute()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('prize_vault_hackathons_changed', recompute)
      window.removeEventListener('storage', onStorage)
    }
  }, [sessionWallet])

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
            sessionWallet={sessionWallet}
            onNavigate={handleNavigate}
          />
        )
      case 'participants':
        return (
          <ParticipantManager
            hackathonId={navigateParam}
            sessionWallet={sessionWallet}
            onNavigate={handleNavigate}
          />
        )
      case 'winners':
        return (
          <WinnerSelection
            hackathonId={navigateParam}
            sessionWallet={sessionWallet}
            onSave={() => handleNavigate('payouts')}
          />
        )
      case 'payouts':
        return (
          <PayoutProposal
            hackathonId={navigateParam}
            sessionWallet={sessionWallet}
          />
        )
      case 'hackathons':
        return (
          <OrganizerHackathonList
            sessionWallet={sessionWallet}
            onNavigate={handleNavigate}
          />
        )
      case 'create-hackathon':
        return (
          <CreateHackathonForm
            userWallet={sessionWallet}
            onSave={() => handleNavigate('hackathons')}
            onCancel={() => handleNavigate('hackathons')}
          />
        )
      case 'timeline':
        return <Timeline sessionWallet={sessionWallet} />
      case 'audit':
        return <AuditLogPage logs={auditLogs} />
      case 'settings':
        return (
          <div className="settings-view">
            <TwoFASetup />
          </div>
        )
      default:
        return <OrganizerDashboard sessionWallet={sessionWallet} onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="organizer-app issuer-app">
      <div className="grid-backdrop" aria-hidden />
      <Header
        organizerName={organizerName}
        walletAddress={organizerDisplayAddress}
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
