import React from 'react'
import { useHolderWallet } from '../context/HolderContext'

export default function StatsBar() {
  const { state } = useHolderWallet()

  const stats = [
    { label: 'Active DIDs', value: state.didProfiles.length },
    { label: 'Credentials', value: state.credentials.length },
    { label: 'Encrypted docs', value: state.documents.length },
    { label: 'Derived proofs', value: state.proofs.length },
    { label: 'Pending requests', value: state.requests.filter((request) => request.status !== 'handled').length },
  ]

  return (
    <section className="stats-bar">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-item">
          <span className="stat-value">{stat.value}</span>
          <span className="stat-label">{stat.label}</span>
        </div>
      ))}
    </section>
  )
}


