import React, { useState } from 'react'
import QRCode from 'qrcode'
import { useHolderWallet } from '../context/HolderContext'
import { copyToClipboard, formatDateTime, truncate } from '../utils/ui'

export default function ShareCenter() {
  const { state, shareProof } = useHolderWallet()
  const [qrData, setQrData] = useState(null)
  const [loadingId, setLoadingId] = useState('')
  const proofs = state.proofs

  const handleGenerateQr = async (proof) => {
    setLoadingId(proof.id)
    try {
      const json = JSON.stringify(proof.proofPayload)
      const dataUrl = await QRCode.toDataURL(json, { width: 280, margin: 1 })
      setQrData({ dataUrl, proof })
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId('')
    }
  }

  const handleCopy = async (proof) => {
    await copyToClipboard(JSON.stringify(proof.proofPayload, null, 2))
    await shareProof(proof.id, 'clipboard')
  }

  const handleDownload = async (proof) => {
    await shareProof(proof.id, 'download')
  }

  return (
    <section className="module-section" id="module-share">
      <header className="module-heading">
        <h2>Share Proofs</h2>
        <p>Deliver verifiable presentations to recruiters via QR, download, or clipboard.</p>
      </header>

      <div className="cards-grid">
        {proofs.length === 0 ? (
          <div className="empty-state">
            <p>No derived proofs yet. Generate one in the selective disclosure module.</p>
          </div>
        ) : (
          proofs.map((proof) => (
            <article key={proof.id} className="module-card proof-share-card">
              <header className="module-card-header">
                <div>
                  <h3>{truncate(proof.id, 14)}</h3>
                  <p className="muted">Generated {formatDateTime(proof.generatedAt)}</p>
                </div>
                <span className="tag">Fields {proof.revealedFields.length}</span>
              </header>
              <div className="detail-grid">
                <div>
                  <span className="label">Challenge</span>
                  <span>{proof.challenge}</span>
                </div>
                <div>
                  <span className="label">Nonce</span>
                  <span>{truncate(proof.nonce, 12)}</span>
                </div>
              </div>
              <div className="button-row">
                <button type="button" className="button secondary" onClick={() => handleGenerateQr(proof)}>
                  {loadingId === proof.id ? 'Generating QR…' : 'QR code'}
                </button>
                <button type="button" className="button ghost" onClick={() => handleCopy(proof)}>
                  Copy JSON
                </button>
                <button type="button" className="button primary" onClick={() => handleDownload(proof)}>
                  Download JSON
                </button>
              </div>
              {proof.shareHistory?.length ? (
                <div className="share-history">
                  <span className="label">Share log</span>
                  <ul>
                    {proof.shareHistory.map((event) => (
                      <li key={event.id}>
                        {event.method} · {formatDateTime(event.at)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>

      {qrData ? (
        <div className="qr-modal">
          <div className="qr-card">
            <header>
              <h3>QR Share</h3>
              <p className="muted">{qrData.proof.id}</p>
            </header>
            <img src={qrData.dataUrl} alt="Proof QR code" />
            <button type="button" className="button ghost" onClick={() => setQrData(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}


