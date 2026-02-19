import React from 'react'

export default function Sidebar({ activeView, onViewChange }) {
  const menuItems = [
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'issue', label: 'Issue Credential', icon: '📜' },
    { id: 'issued', label: 'Issued Credentials', icon: '✅' },
    { id: 'revoke', label: 'Revoke', icon: '🚫' },
    { id: 'did', label: 'DID Management', icon: '🔑' },
    { id: 'audit', label: 'Audit Logs', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <aside className="issuer-sidebar">
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

