import React, { useState, useEffect } from 'react'
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from '../constants/escrow'
import { getActiveSession, hasRequiredRole } from '../utils/authSession'
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
import './issuerApp.css'

const HACKATHON_STORAGE_KEY = 'prize_vault_hackathons'

const DEFAULT_HACKATHONS = [
  {
    id: 'hack_001',
    name: 'RIFT \'26',
    startDate: '2026-02-19',
    endDate: '2026-02-20',
    prizePool: { total: 10000, currency: 'XLM', locked: true },
    organizerAddress: DEFAULT_ORGANIZER_ESCROW_ADDRESS,
    sponsorAddress: '0x1234567890abcdef',
    escrowAddress: DEFAULT_ORGANIZER_ESCROW_ADDRESS,
    status: 'live',
    participantCount: 0,
    participants: [],
    winnersSelected: false,
    payoutProposed: false,
    description: '24-hour hackathon across Bengaluru, Pune, Noida and Lucknow',
  },
]

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
      localStorage.setItem(HACKATHON_STORAGE_KEY, JSON.stringify(DEFAULT_HACKATHONS))
    } else {
      const parsed = JSON.parse(existing)
      const fixed = parsed.map((h) => ({
        ...h,
        participants: h.participants || [],
        participantCount: h.participants?.length || 0,
      }))
      localStorage.setItem(HACKATHON_STORAGE_KEY, JSON.stringify(fixed))
    }
  } catch (_) {}
}

export default function IssuerApp() {
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

  const [auditLogs, setAuditLogs] = useState([
    { timestamp: new Date().toISOString(), action: 'create', user: 'Organizer', credentialId: null, details: 'Organizer console loaded', txHash: null },
  ])

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
        return <Timeline />
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
