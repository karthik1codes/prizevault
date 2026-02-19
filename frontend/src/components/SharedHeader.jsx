import React from 'react'

export default function SharedHeader({ activeTab = 'landing' }) {
  const tabs = [
    { id: 'holder', label: 'Holder Wallet', href: '/holder' },
    { id: 'recruiter', label: 'Recruiter', href: '/verifier' },
    { id: 'issuer', label: 'Issuer', href: '/issuer' },
    { id: 'metamask', label: 'Login', href: '/metamask' },
  ]

  return (
    <header className="main-header">
      <div className="header-brand">
        <a href="/" className="logo-link logo-tab">
          <span className="logo">CIPHERS</span>
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

