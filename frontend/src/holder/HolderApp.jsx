import React from 'react'
import { HolderProvider } from './context/HolderContext'
import SharedHeader from '../components/SharedHeader'
import StatsBar from './components/StatsBar'
import DidManager from './components/DidManager'
import CredentialInbox from './components/CredentialInbox'
import CredentialVault from './components/CredentialVault'
import DocumentUpload from './components/DocumentUpload'
import SelectiveDisclosure from './components/SelectiveDisclosure'
import ShareCenter from './components/ShareCenter'
import SecurityCenter from './components/SecurityCenter'
import VerificationRequests from './components/VerificationRequests'
import RevocationMonitor from './components/RevocationMonitor'
import AuditTrail from './components/AuditTrail'

function HolderHeader() {
  return (
    <div className="holder-sub-header">
      <div className="holder-sub-header-content">
        <div>
          <h1>Holder Wallet</h1>
          <p>Manage your decentralized identity and verifiable credentials.</p>
        </div>
        <nav className="hw-nav">
          <a href="#module-did">DIDs</a>
          <a href="#module-inbox">Inbox</a>
          <a href="#module-vault">Vault</a>
          <a href="#module-documents">Documents</a>
          <a href="#module-selective">Selective proof</a>
          <a href="#module-share">Share</a>
          <a href="#module-security">Security</a>
          <a href="#module-requests">Requests</a>
          <a href="#module-revocation">Revocation</a>
          <a href="#module-audit">Audit</a>
        </nav>
      </div>
    </div>
  )
}

export default function HolderApp() {
  return (
    <HolderProvider>
      <div className="holder-wallet">
        <div className="grid-backdrop" aria-hidden />
        <SharedHeader activeTab="holder" />
        <HolderHeader />
        <main>
          <section className="hero">
            <div className="hero-copy">
              <h1>Student Holder Wallet</h1>
              <p>
                Manage decentralized identity, encrypted credentials, IPFS documents, and selective disclosure proofs in
                one secure vault built for education workflows.
              </p>
              <div className="hero-actions">
                <a href="#module-did" className="button primary">
                  Start with DID
                </a>
                <a href="#module-selective" className="button ghost">
                  Generate proof
                </a>
              </div>
            </div>
            <aside className="hero-summary">
              <div className="summary-card">
                <span className="summary-label">Backbone</span>
                <h2>DIDs + VCs</h2>
                <p>Generate and connect decentralized identifiers for every credential exchange.</p>
              </div>
              <div className="summary-card">
                <span className="summary-label">Storage</span>
                <h2>Encrypted</h2>
                <p>Local AES-GCM encryption with optional IPFS upload and CID tracking.</p>
              </div>
              <div className="summary-card">
                <span className="summary-label">Proofs</span>
                <h2>BBS+</h2>
                <p>Derived presentations with fine-grained selective disclosure controls.</p>
              </div>
            </aside>
          </section>

          <StatsBar />
          <DidManager />
          <CredentialInbox />
          <CredentialVault />
          <DocumentUpload />
          <SelectiveDisclosure />
          <ShareCenter />
          <SecurityCenter />
          <VerificationRequests />
          <RevocationMonitor />
          <AuditTrail />
        </main>
        <footer className="hw-footer">
          <p>Holder wallet MVP covering DID management, credential vault, proofs, and security.</p>
          <p className="footer-meta">Powered by decentralized identifiers · BBS+ · IPFS · Polygon revocation registry</p>
        </footer>
      </div>
    </HolderProvider>
  )
}


