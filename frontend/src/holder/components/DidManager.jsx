import React, { useMemo, useState } from 'react'
import { useHolderWallet } from '../context/HolderContext'
import { copyToClipboard, formatDateTime, truncate } from '../utils/ui'
import { generateRandomId } from '../utils/crypto'

function DidCard({ profile, isActive, onActivate, onExport }) {
  return (
    <div className={`module-card focus-card ${isActive ? 'active' : ''}`}>
      <div className="module-card-header">
        <div>
          <h3>{profile.alias}</h3>
          <p className="muted">{profile.did}</p>
        </div>
        <div className="tag">{profile.method}</div>
      </div>
      <div className="details-grid">
        <div>
          <span className="label">Created</span>
          <span>{formatDateTime(profile.createdAt)}</span>
        </div>
        <div>
          <span className="label">Public key</span>
          <span className="mono">{truncate(profile.publicKeyHex, 12)}</span>
        </div>
        {profile.account ? (
          <div>
            <span className="label">Account</span>
            <span className="mono">{profile.account}</span>
          </div>
        ) : null}
      </div>
      <div className="button-row">
        <button type="button" className="button ghost" onClick={() => copyToClipboard(profile.did)}>
          Copy DID
        </button>
        <button type="button" className="button ghost" onClick={onExport}>
          Backup
        </button>
        <button type="button" className="button primary" onClick={onActivate}>
          {isActive ? 'Active DID' : 'Set active'}
        </button>
      </div>
    </div>
  )
}

export default function DidManager() {
  const { state, loadingStates, createDid, connectEthrDid, importDid, exportDid, setActiveDid } = useHolderWallet()
  const [alias, setAlias] = useState('')
  const [importError, setImportError] = useState('')

  const hasProfiles = state.didProfiles.length > 0

  const activeProfile = useMemo(() => state.didProfiles.find((profile) => profile.id === state.activeDidId), [
    state.activeDidId,
    state.didProfiles,
  ])

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImportError('')
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!parsed.did || !parsed.privateKeyBase64) throw new Error('Invalid DID backup file')
      importDid({
        id: generateRandomId('did'),
        alias: parsed.alias || 'Imported DID',
        did: parsed.did,
        method: parsed.method || 'did:key',
        createdAt: parsed.createdAt,
        publicKeyHex: parsed.publicKeyHex,
        privateKeyBase64: parsed.privateKeyBase64,
      })
    } catch (err) {
      setImportError(err.message)
    }
  }

  return (
    <section className="module-section" id="module-did">
      <header className="module-heading">
        <h2>DID Management</h2>
        <p>Create, import, export, and activate decentralized identifiers controlled by the student.</p>
      </header>

      <div className="panel-grid">
        <div className="panel">
          <h3>Create DID</h3>
          <p className="muted">Choose method, generate keys, and designate an alias.</p>
          <label className="field">
            <span>Alias</span>
            <input value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="Student primary DID" />
          </label>
          <div className="button-row">
            <button
              type="button"
              className="button primary"
              onClick={() => createDid({ alias })}
              disabled={loadingStates.did}
            >
              {loadingStates.did ? 'Generating…' : 'Generate did:key'}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => connectEthrDid({ alias })}
              disabled={loadingStates.did}
            >
              Link did:ethr (MetaMask)
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>Import backup</h3>
          <p className="muted">Restore a DID from an encrypted backup JSON file.</p>
          <label className="field">
            <span>Backup file</span>
            <input type="file" accept="application/json" onChange={handleImport} />
          </label>
          {importError ? <p className="error-text">{importError}</p> : null}
          {activeProfile ? (
            <div className="alert success">
              <strong>Active DID:</strong> {activeProfile.alias} ({activeProfile.method})
            </div>
          ) : null}
        </div>
      </div>

      <div className="cards-grid">
        {hasProfiles ? (
          state.didProfiles.map((profile) => (
            <DidCard
              key={profile.id}
              profile={profile}
              isActive={profile.id === state.activeDidId}
              onActivate={() => setActiveDid(profile.id)}
              onExport={() => exportDid(profile)}
            />
          ))
        ) : (
          <div className="empty-state">
            <p>No DIDs yet. Generate or import to begin managing credentials.</p>
          </div>
        )}
      </div>
    </section>
  )
}


