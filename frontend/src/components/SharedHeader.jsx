import React from 'react'
import { getActiveSession } from '../utils/authSession'

export default function SharedHeader({ activeTab = 'landing' }) {
  const allTabs = [
    { id: 'holder', label: 'Holder Wallet', href: '/holder' },
    { id: 'recruiter', label: 'Sponsor', href: '/verifier' },
    { id: 'issuer', label: 'Organizer', href: '/issuer' },
  ]
  const session = getActiveSession()
  const tabs = session
    ? allTabs.filter((tab) => {
        if (session.role === 'participant') return tab.id === 'holder'
        if (session.role === 'sponsor') return tab.id === 'recruiter'
        if (session.role === 'organizer') return tab.id === 'issuer'
        return false
      })
    : allTabs

  return (
    <header className="main-header">
      <div className="header-brand">
        <a href="/" className="logo-link logo-tab">
          <span className="logo">Prize Vault</span>
        </a>
      </div>
      <nav className="header-nav">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={tab.href}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

