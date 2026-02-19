import React from 'react'
import { useHolderWallet } from '../context/HolderContext'
import { formatDateTime, truncate } from '../utils/ui'

export default function RevocationMonitor() {
  const { state, checkRevocation } = useHolderWallet()

  const handleCheck = async (credentialId) => {
    await checkRevocation(credentialId)
  }

  return (
    <section className="module-section" id="module-revocation">
      <header className="module-heading">
        <h2>Revocation Monitor</h2>
        <p>Query on-chain registry to confirm credential status.</p>
      </header>

      <div className="table">
        <table>
          <thead>
            <tr>
              <th>Credential</th>
              <th>Issuer</th>
              <th>Status</th>
              <th>Last check</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.credentials.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">No credentials to monitor.</div>
                </td>
              </tr>
            ) : (
              state.credentials.map((credential) => (
                <tr key={credential.id}>
                  <td>{credential.title}</td>
                  <td>{truncate(credential.issuer, 16)}</td>
                  <td>
                    <span className={`status-pill status-${credential.revocationStatus || 'unknown'}`}>
                      {credential.revocationStatus || 'unknown'}
                    </span>
                  </td>
                  <td>{credential.lastRevocationCheck ? formatDateTime(credential.lastRevocationCheck) : 'Never'}</td>
                  <td>
                    <button type="button" className="button ghost small" onClick={() => handleCheck(credential.id)}>
                      Check status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}


