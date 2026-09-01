'use client'

import type { ReactNode } from 'react'
import Icon from '../../components/Icon'
import ProfileForm from './ProfileForm'
import type { UserProfile } from '../../types/holder'
import type { AppRole } from '../../utils/authSession'

const ROLES: {
  id: AppRole
  label: string
  hello: string
  blurb: string
  title: string
}[] = [
  {
    id: 'participant',
    label: 'Participant',
    hello: 'HELLO, FRIEND!',
    blurb: 'Enter your details to start competing and receive prizes on-chain.',
    title: 'Sign in as Participant',
  },
  {
    id: 'organizer',
    label: 'Organizer',
    hello: 'HELLO, ORGANIZER!',
    blurb: 'Run events and propose payouts. You never hold prize money alone.',
    title: 'Sign in as Organizer',
  },
  {
    id: 'sponsor',
    label: 'Sponsor',
    hello: 'HELLO, SPONSOR!',
    blurb: 'Lock the prize pool. Nothing leaves escrow until you co-approve.',
    title: 'Sign in as Sponsor',
  },
]

export interface WalletGateProps {
  role: AppRole
  onRoleChange: (role: AppRole) => void
  loginStep: 'profile' | 'connect'
  connectError: string
  onProfileSubmit: (profile: UserProfile) => void
  onBackToProfile: () => void
  connectSlot: ReactNode
}

export default function WalletGate({
  role,
  onRoleChange,
  loginStep,
  connectError,
  onProfileSubmit,
  onBackToProfile,
  connectSlot,
}: WalletGateProps) {
  const copy = ROLES.find((r) => r.id === role) || ROLES[0]

  return (
    <div className="pv-gate">
      <div className="pv-gate__circuit" aria-hidden="true" />
      <div className="pv-gate__glow" aria-hidden="true" />

      <a className="pv-skip-link" href="#gate-form">
        Skip to sign in
      </a>

      <a href="/" className="pv-gate__brand">
        <span className="pv-gate__brand-mark" aria-hidden>
          <Icon name="lock" size={14} />
        </span>
        PrizeVault
      </a>

      <div className="pv-gate__stage">
        <div className={`pv-gate__card ${loginStep === 'connect' ? 'is-connect' : ''}`.trim()}>
          <section className="pv-gate__hello">
            <p className="pv-gate__kicker">Prize escrow on Stellar</p>
            <h2 key={copy.hello} className="pv-gate__hello-title">
              {copy.hello}
            </h2>
            <p key={copy.blurb} className="pv-gate__hello-text">
              {copy.blurb}
            </p>
          </section>

          <section className="pv-gate__panel" id="gate-form">
            <h1 className="pv-gate__title">
              {loginStep === 'profile' ? copy.title : 'Connect your wallet'}
            </h1>
            <p className="pv-gate__subtitle">
              {loginStep === 'profile'
                ? 'Step 1 of 2 — this decides which console you land in.'
                : 'Step 2 of 2 — confirm the Stellar account you control.'}
            </p>

            <div className="pv-gate__tabs" role="tablist" aria-label="Sign in as">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={role === r.id}
                  className={`pv-gate__tab ${role === r.id ? 'is-active' : ''}`.trim()}
                  onClick={() => onRoleChange(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div key={loginStep} className="pv-gate__step">
              {loginStep === 'profile' ? (
                <ProfileForm role={role} onSubmit={onProfileSubmit} />
              ) : (
                <div className="pv-gate__connect">
                  <button type="button" className="pv-gate__back" onClick={onBackToProfile}>
                    <Icon name="chevronRight" size={14} />
                    Back to details
                  </button>

                  {connectError ? (
                    <div className="pv-gate__alert" role="alert">
                      <Icon name="alert" size={16} />
                      <p>{connectError}</p>
                    </div>
                  ) : null}

                  {connectSlot}
                </div>
              )}
            </div>
          </section>
        </div>

        <p className="pv-gate__disclaimer">
          Prizes are held in a 2-of-2 escrow. Neither sponsor nor organizer can move funds alone.
        </p>
      </div>
    </div>
  )
}
