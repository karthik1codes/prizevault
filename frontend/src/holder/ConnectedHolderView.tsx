import React, { useEffect } from 'react'
import { HolderProvider } from './context/HolderContext'
import SponsorDashboard from './components/SponsorDashboard'
import ParticipantDashboard from './components/ParticipantDashboard'
import HackathonList from './components/HackathonList'
import { UserRole } from '../types/holder'
import deflyWallet from './deflyWallet'

export type HolderView = 'list' | 'sponsor' | 'participant' | 'organizer'

export interface ConnectedHolderViewProps {
  userWallet: string
  userRole: UserRole
  activeView: HolderView
  setActiveView: (v: HolderView) => void
  onDisconnect: () => void
  onNavigate: (view: string, params?: unknown) => void
}

export default function ConnectedHolderView({
  userWallet,
  userRole,
  activeView,
  setActiveView,
  onDisconnect,
  onNavigate,
}: ConnectedHolderViewProps) {
  // Ensure sponsor users land on sponsor view (hackathons to contribute to)
  useEffect(() => {
    if (userRole === 'sponsor' && activeView !== 'sponsor') {
      setActiveView('sponsor')
    }
  }, [userRole, activeView, setActiveView])

  return (
    <HolderProvider>
      <section className="wallet-info-bar">
        <div className="wallet-info-content">
          <div className="wallet-address">
            <strong>Wallet:</strong> {userWallet.slice(0, 6)}...{userWallet.slice(-4)}
            <button
              type="button"
              className="button secondary"
              onClick={async () => {
                try {
                  await deflyWallet.disconnect()
                } catch (_) {
                  /* ignore */
                }
                onDisconnect()
              }}
            >
              Disconnect
            </button>
          </div>
          {userRole && (
            <div className="user-role">
              <strong>Role:</strong> <span className={`badge badge-${userRole}`}>{userRole}</span>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-nav">
        <button
          className={`nav-tab ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => setActiveView('list')}
        >
          Hackathons
        </button>
        {userRole === 'sponsor' && (
          <button
            className={`nav-tab ${activeView === 'sponsor' ? 'active' : ''}`}
            onClick={() => setActiveView('sponsor')}
          >
            Sponsor Dashboard
          </button>
        )}
        {userRole === 'participant' && (
          <button
            className={`nav-tab ${activeView === 'participant' ? 'active' : ''}`}
            onClick={() => setActiveView('participant')}
          >
            Participant Dashboard
          </button>
        )}
        {userRole === 'organizer' && (
          <button
            className={`nav-tab ${activeView === 'organizer' ? 'active' : ''}`}
            onClick={() => setActiveView('organizer')}
          >
            Organizer
          </button>
        )}
      </section>

      {activeView === 'list' && (
        <HackathonList
          userWallet={userWallet}
          userRole={userRole}
          onNavigate={onNavigate}
        />
      )}

      {activeView === 'sponsor' && userRole === 'sponsor' && (
        <SponsorDashboard
          userWallet={userWallet}
          onNavigate={onNavigate}
        />
      )}

      {activeView === 'participant' && userRole === 'participant' && (
        <ParticipantDashboard
          userWallet={userWallet}
          onNavigate={onNavigate}
        />
      )}

      {activeView === 'organizer' && userRole === 'organizer' && (
        <div className="module-section">
          <div className="panel">
            <h3>Organizer console</h3>
            <p className="muted">
              Manage hackathons, select winners, and create payout proposals in the Organizer console.
            </p>
            <a href="/issuer" className="button primary">
              Open Organizer console
            </a>
          </div>
        </div>
      )}
    </HolderProvider>
  )
}
