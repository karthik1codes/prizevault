import React from 'react'

export default function Sidebar({ activeView, onViewChange }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'participants', label: 'Participants', icon: '👥' },
    { id: 'winners', label: 'Select Winners', icon: '🏆' },
    { id: 'payouts', label: 'Payout Proposals', icon: '💰' },
    { id: 'hackathons', label: 'My Hackathons', icon: '📅' },
    { id: 'timeline', label: 'Event Timeline', icon: '📆' },
    { id: 'audit', label: 'Audit Logs', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <aside className="organizer-sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

