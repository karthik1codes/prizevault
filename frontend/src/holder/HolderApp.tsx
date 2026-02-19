import React, { useState, useEffect, Suspense, lazy } from 'react'
import SharedHeader from '../components/SharedHeader'
import { detectUserRole } from './utils/roleDetection'
import { getProfileForWallet, setProfileForWallet } from './utils/userProfileStorage'
import { UserRole, UserProfile } from '../types/holder'
import ProfileForm from './components/ProfileForm'

// Defly SDK loads only after user clicks "Connect Defly Wallet" – keeps first paint safe
const DeflyConnectBlock = lazy(() => import('./DeflyConnectBlock'))
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
  const [deflyConnected, setDeflyConnected] = useState(false)
  const [userWallet, setUserWallet] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [activeView, setActiveView] = useState<HolderView>('list')
  const [loginStep, setLoginStep] = useState<'profile' | 'connect'>('profile')
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null)
  const [showConnectUI, setShowConnectUI] = useState(false)

  const handleDeflyConnect = (address: string) => {
    setUserWallet(address)
    setDeflyConnected(true)
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
    if (role === 'sponsor') setActiveView('sponsor')
  }

  // Keep sponsor users on the sponsor view (list of hackathons to contribute to)
  useEffect(() => {
    if (deflyConnected && userRole === 'sponsor') {
      setActiveView('sponsor')
    }
  }, [deflyConnected, userRole])

  const handleDeflyError = (error: string) => {
    console.error('Defly connection error:', error)
    alert(error)
  }

  const handleNavigate = (view: string, params?: any) => {
    if (view === 'sponsor') setActiveView('sponsor')
    else if (view === 'participant') setActiveView('participant')
    else if (view === 'organizer') setActiveView('organizer')
    else setActiveView('list')
  }

  const handleDisconnect = () => {
    setDeflyConnected(false)
    setUserWallet(null)
    setUserRole(null)
    setActiveView('list')
    setLoginStep('profile')
    setPendingProfile(null)
  }

  const connectedContent = deflyConnected && userWallet && (
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
        {/* Step 1: Profile – then Step 2: Connect Defly */}
        {!deflyConnected && (
          <section className="defly-login-section">
            <div className="defly-login-container">
              {loginStep === 'profile' ? (
                <>
                  <h2>Enter your details</h2>
                  <p>Tell us who you are and how you’re participating. Then connect your Defly wallet.</p>
                  <ProfileForm
                    onSubmit={(profile) => {
                      setPendingProfile(profile)
                      setLoginStep('connect')
                    }}
                  />
                </>
              ) : (
                <>
                  <h2>Connect Your Defly Wallet</h2>
                  <p>Use your Defly app on your phone to scan the QR code and connect. You can also use the Defly Web extension if installed.</p>
                  {!showConnectUI ? (
                    <>
                      <button
                        type="button"
                        className="button primary defly-connect-btn"
                        onClick={() => setShowConnectUI(true)}
                      >
                        Connect Defly Wallet
                      </button>
                      <button
                        type="button"
                        className="button ghost"
                        onClick={() => setLoginStep('profile')}
                        style={{ marginLeft: 8 }}
                      >
                        Back
                      </button>
                      <p className="defly-install-hint">
                        Don’t have Defly?{' '}
                        <a
                          href="https://defly.app/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="defly-install-link"
                        >
                          Get the Defly app
                        </a>
                        {' '}for iOS or Android, or install the Defly Web Beta extension for Chrome.
                      </p>
                    </>
                  ) : (
                    <Suspense fallback={<p className="muted">Loading connection…</p>}>
                      <DeflyConnectBlock onConnect={handleDeflyConnect} onError={handleDeflyError} />
                    </Suspense>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* Connected State - HolderProvider only mounts after connect */}
        {connectedContent}
      </main>
      <footer className="hw-footer">
        <p>Hackathon prize escrow powered by Algorand smart signatures.</p>
        <p className="footer-meta">2-of-2 approvals · Atomic payouts · Transparent audit trail</p>
      </footer>
    </div>
  )
}
