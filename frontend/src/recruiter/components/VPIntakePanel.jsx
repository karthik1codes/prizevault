import React, { useState } from 'react'

const sampleVp = `{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiablePresentation"],
  "verifiableCredential": [{
    "issuer": "did:web:university.example",
    "credentialSubject": {"name": "Avery Chen", "degree": "BSc Computer Science"}
  }]
}`

export default function VPIntakePanel({ onLoad }) {
  const [input, setInput] = useState(sampleVp)
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState('')

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const text = await file.text()
    setInput(text)
    setStatus(`Loaded ${file.name}`)
    onLoad?.(text)
  }

  const handlePaste = () => {
    try {
      const parsed = JSON.parse(input)
      setStatus('VP JSON loaded')
      onLoad?.(parsed)
    } catch (err) {
      setStatus('Invalid JSON: please review payload')
    }
  }

  const handleScan = () => {
    setStatus('QR scan simulated – payload ready')
    onLoad?.(JSON.parse(sampleVp))
    setInput(sampleVp)
  }

  return (
    <section className="recruiter-card">
      <header className="card-header">
        <div>
          <h3>VP intake</h3>
          <p className="muted">Paste JSON, upload a file, or simulate a QR scan to begin verification.</p>
        </div>
      </header>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={10} spellCheck={false} />
      <div className="intake-actions">
        <label className="file-button">
          Upload VP
          <input type="file" accept=".json,.vp,.txt" onChange={handleFile} />
        </label>
        <button type="button" className="button primary small" onClick={handlePaste}>
          Load JSON
        </button>
        <button type="button" className="button ghost small" onClick={handleScan}>
          Simulate QR scan
        </button>
      </div>
      {fileName ? <p className="muted">Loaded file: {fileName}</p> : null}
      {status ? <p className="status-text">{status}</p> : null}
    </section>
  )
}


