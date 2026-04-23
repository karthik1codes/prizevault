import React, { useState, useEffect, Suspense, lazy } from 'react'
import SharedHeader from '../components/SharedHeader'
import { detectUserRole } from './utils/roleDetection'
import { getProfileForWallet, setProfileForWallet } from './utils/userProfileStorage'
import { UserRole, UserProfile } from '../types/holder'
import {
  clearActiveSession,
  getActiveSession,
  requireManualConnect,
  setActiveSession,
} from '../utils/authSession'
import { resolveSessionWithQrBootstrap } from '../utils/qrSession'
import ProfileForm from './components/ProfileForm'

// Stellar wallet SDK loads after the profile step (Freighter + QR in StellarLogin).
const StellarConnectBlock = lazy(() => import('./StellarConnectBlock'))
const ConnectedHolderView = lazy(() => import('./ConnectedHolderView'))

export type HolderView = 'list' | 'sponsor' | 'participant' | 'organizer'

function HolderHeader() {
  return (
    <div className="holder-sub-header">
      <div className="holder-sub-header-content">
        <div>
          <h1>Escrow Wallet</h1>
          <p>Manage hackathon prizes, sponsorships, and participations.</p>
        </div>
      </div>
    </div>
  )
}

export default function HolderApp() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [userWallet, setUserWallet] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [activeView, setActiveView] = useState<HolderView>('list')
  const [loginStep, setLoginStep] = useState<'profile' | 'connect'>('profile')
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const session = resolveSessionWithQrBootstrap() || getActiveSession()
    if (!session) return

    setUserWallet(session.wallet)
    setUserRole(session.role)
    setWalletConnected(true)

    if (session.role === 'participant') {
      setActiveView('participant')
      return
    }
    if (session.role === 'sponsor') {
      window.location.href = '/verifier'
      return
    }
    if (session.role === 'organizer') {
      window.location.href = '/issuer'
    }
  }, [])

  const handleWalletConnect = (address: string) => {
    setUserWallet(address)
    setWalletConnected(true)
    // Prefer the profile just submitted this session so sponsor choice redirects correctly
    let role: UserRole
    if (pendingProfile) {
      setProfileForWallet(address, pendingProfile)
      role = pendingProfile.role
      setUserRole(role)
      setPendingProfile(null)
    } else {
      const saved = getProfileForWallet(address)
      if (saved) {
        role = saved.role
        setUserRole(role)
      } else {
        role = detectUserRole(address)
        setUserRole(role)
      }
    }
    if (role) {
      setActiveSession(address, role)
    }
    if (role === 'sponsor') {
      window.location.href = '/verifier'
      return
    }
    if (role === 'organizer') {
      window.location.href = '/issuer'
      return
    }
  }

  // Route users to their role-specific windows.
  useEffect(() => {
    if (!walletConnected || !userRole) return
    if (userRole === 'sponsor') {
      window.location.href = '/verifier'
      return
    }
    if (userRole === 'organizer') {
      window.location.href = '/issuer'
    }
  }, [walletConnected, userRole])

  const handleWalletError = (error: string) => {
    console.error('Stellar wallet connection error:', error)
    alert(error)
  }

  const handleNavigate = (view: string, params?: any) => {
    if (view === 'sponsor') setActiveView('sponsor')
    else if (view === 'participant') setActiveView('participant')
    else if (view === 'organizer') setActiveView('organizer')
    else setActiveView('list')
  }

  const handleDisconnect = () => {
    clearActiveSession()
    requireManualConnect()
    setWalletConnected(false)
    setUserWallet(null)
    setUserRole(null)
    setActiveView('list')
    setLoginStep('profile')
    setPendingProfile(null)
  }

  const connectedContent = walletConnected && userWallet && (
    <Suspense fallback={<p className="muted">Loading dashboard…</p>}>
      <ConnectedHolderView
        userWallet={userWallet}
        userRole={userRole}
        activeView={activeView}
        setActiveView={setActiveView}
        onDisconnect={handleDisconnect}
        onNavigate={handleNavigate}
      />
    </Suspense>
  )

  return (
    <div className="holder-wallet">
      <div className="grid-backdrop" aria-hidden />
      <SharedHeader activeTab="holder" />
      <HolderHeader />
      <main>
        {/* Step 1: Profile – then Step 2: Connect Stellar wallet */}
        {!walletConnected && (
          <section className="wallet-login-section">
            <div className="wallet-login-container">
              {loginStep === 'profile' ? (
                <>
                  <h2>Enter your details</h2>
                  <p>Tell us who you are and how you’re participating. Then connect your Stellar wallet.</p>
                  <ProfileForm
                    onSubmit={(profile) => {
                      setPendingProfile(profile)
                      setLoginStep('connect')
                    }}
                  />
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => setLoginStep('profile')}
                    style={{ marginBottom: 16 }}
                  >
                    Back
                  </button>
                  <Suspense fallback={<p className="muted">Loading connection…</p>}>
                    <StellarConnectBlock
                      onConnect={handleWalletConnect}
                      onError={handleWalletError}
                      desiredRole={pendingProfile?.role || null}
                    />
                  </Suspense>
                </>
              )}
            </div>
          </section>
        )}

        {/* Connected State - HolderProvider only mounts after connect */}
        {connectedContent}
      </main>
      <footer className="hw-footer">
        <p>Hackathon prize escrow powered by Stellar smart contracts.</p>
        <p className="footer-meta">2-of-2 approvals · Atomic payouts · Transparent audit trail</p>
      </footer>
    </div>
  )
}
