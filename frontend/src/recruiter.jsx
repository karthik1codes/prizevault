import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import SharedHeader from './components/SharedHeader'
import '../styles.css'
import './index.css'
import './recruiter.css'
import VPIntakePanel from './recruiter/components/VPIntakePanel'
import VerificationWorkbench from './recruiter/components/VerificationWorkbench'
import AdvancedToolkit from './recruiter/components/AdvancedToolkit'
import AIInsightsPanel from './recruiter/components/AIInsightsPanel'
import SemanticSearchPanel from './recruiter/components/SemanticSearchPanel'
import OfflineVerificationPanel from './recruiter/components/OfflineVerificationPanel'

function RecruiterDashboard() {
  const [vpPayload, setVpPayload] = useState(null)
  const [verificationResults, setVerificationResults] = useState(null)

  const handleVerificationComplete = (results) => {
    setVerificationResults(results)
  }

  const handleVPLoad = (payload) => {
    setVpPayload(payload)
    // Reset verification results when new VP is loaded
    setVerificationResults(null)
  }

  return (
    <div className="recruiter-page">
      <div className="recruiter-backdrop" aria-hidden />
      <SharedHeader activeTab="recruiter" />
      <div className="recruiter-sub-header">
        <div className="recruiter-sub-header-content">
          <div>
            <h1>Recruiter Verification Console</h1>
            <p>High-assurance verification of BBS+ proofs, DID authenticity, and talent credentials.</p>
          </div>
        </div>
      </div>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-eyebrow">Talent verification, trust-first.</span>
            <h2>Instantly validate selective disclosures and surface risk signals before you extend an offer.</h2>
            <p>
              Bring every proof through BBS+, DID, revocation, and CID checks. Then lean on AI for risk scoring,
              semantic search, and fraud detection—without leaving the dashboard.
            </p>
            <div className="hero-actions">
              <a href="#workspace" className="button primary">
                Open verification workspace
              </a>
              <a href="#ai" className="button ghost">
                See AI copilots
              </a>
            </div>
          </div>
          <aside className="hero-panel">
            <div className="hero-card">
              <h3>Verification stack</h3>
              <ul>
                <li>BBS+ proof engine with JSON-LD frames</li>
                <li>Issuer DID resolver + trust graph</li>
                <li>Polygon revocation registry polling</li>
                <li>CID hashing & integrity guardrails</li>
                <li>AI insights, risk scoring, semantic search</li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="workspace" id="workspace">
          <VPIntakePanel onLoad={handleVPLoad} />
          <VerificationWorkbench 
            vpPayload={vpPayload} 
            onVerificationComplete={handleVerificationComplete}
          />
        </section>

        <AdvancedToolkit />

        <section className="ai-grid" id="ai">
          <AIInsightsPanel 
            verificationResults={verificationResults}
            vpPayload={vpPayload}
          />
          <SemanticSearchPanel />
          <OfflineVerificationPanel />
        </section>

        <section className="cta">
          <h2>Ready to verify talent without compromise?</h2>
          <p>Pair the recruiter console with the holder wallet and issuer portal for a zero-trust credential ecosystem.</p>
          <div className="cta-actions">
            <a href="/metamask" className="button primary">
              Try login flow
            </a>
            <a href="/issuer" className="button ghost">
              Explore issuer tooling
            </a>
          </div>
        </section>
      </main>

      <footer className="recruiter-footer">
        <p>Recruiter dashboard blueprint • Ciphers decentralized credentials.</p>
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RecruiterDashboard />
  </React.StrictMode>,
)

