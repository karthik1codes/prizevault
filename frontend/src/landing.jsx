import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import SharedHeader from './components/SharedHeader'
import '../styles.css'

function scrollToHash(hash) {
  if (!hash) return
  const element = document.querySelector(hash)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function Landing() {
  useEffect(() => {
    if (window.location.hash) {
      const timer = window.requestAnimationFrame(() => scrollToHash(window.location.hash))
      return () => window.cancelAnimationFrame(timer)
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
    return undefined
  }, [])

  return (
    <div className="landing-page">
      <div className="global-noise"></div>
      <SharedHeader activeTab="landing" />

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Store credentials. Forever.</span>
            <h1>The decentralized credential layer for issuers, holders, and recruiters.</h1>
            <p>
              Ciphers anchors verifiable credentials on Arweave’s permanent storage so every DID connection stays
              trustless. College admins mint once, students control access, and recruiters verify proofs with zero
              guesswork.
            </p>
            <div className="cta-group">
              <a href="/holder" className="button primary">
                Launch holder wallet
              </a>
              <a href="#workflow" className="button secondary">
                View decentralized flow
              </a>
            </div>
            <div className="status-strip">
              <span className="status-pill">Arweave permanence</span>
              <span className="status-pill">Selective disclosure</span>
              <span className="status-pill">Zero-knowledge proofs</span>
            </div>
          </div>
          <div className="hero-card">
            <h2>Credential handshake</h2>
            <ul>
              <li>Issuer signs academic records using institution keys and DID auth.</li>
              <li>Holder encrypts credentials, uploads to Arweave-backed IPFS, stores returned CID.</li>
              <li>Recruiter receives derived proof, resolves CID, verifies signature instantly.</li>
            </ul>
            <a className="card-link" href="#workflow">
              See how permanence powers trust →
            </a>
          </div>
        </section>

        <section className="permanence-band" id="trust">
          <div className="band-copy">
            <h2>Pay once, trust always.</h2>
            <p>Arweave’s permaweb keeps credential evidence online without expiring links or centralized servers.</p>
          </div>
          <div className="band-metrics">
            <div>
              <span className="metric">1x</span>
              <p>Single upload cost to store encrypted credential archives.</p>
            </div>
            <div>
              <span className="metric">Perma</span>
              <p>Immutable audit log for every issuance and verification event.</p>
            </div>
            <div>
              <span className="metric">Trustless</span>
              <p>Recruiters verify proofs without contacting issuers.</p>
            </div>
          </div>
        </section>

        <section className="role-panels" id="roles">
          <article className="role-card">
            <h3>Issuer console</h3>
            <p>College admins verify learners, mint W3C VCs, and sign with DID keys to guarantee authenticity.</p>
            <a href="/issuer" className="button tertiary">
              Launch issuer portal
            </a>
          </article>
          <article className="role-card highlight" id="wallet">
            <h3>Holder wallet</h3>
            <p>
              Students decrypt credentials, manage consent, and preserve encrypted CIDs inside a DID-controlled vault.
            </p>
            <a href="/holder" className="button tertiary">
              Manage wallet
            </a>
          </article>
          <article className="role-card">
            <h3>Recruiter dashboard</h3>
            <p>Talent teams request selective disclosures, validate proofs, and cross-check CIDs on the permaweb.</p>
              <a href="/verifier" className="button tertiary">
              Review proofs
            </a>
          </article>
        </section>

        <section className="workflow" id="workflow">
          <div className="section-heading">
            <h2>Credential lifecycle on the permaweb</h2>
            <p>From DID creation to recruiter verification, each stage is decentralized, encrypted, and permanent.</p>
          </div>
          <div className="workflow-grid">
            <article className="node" id="issuer">
              <h3>1. Verify &amp; issue</h3>
              <p>
                College admins authenticate students, create verifiable credentials, and sign using institution DIDs.
                Encrypted payloads are handed to the learner—no centralized copy retained.
              </p>
            </article>
            <article className="node highlight" id="credentials">
              <h3>2. Anchor to Arweave</h3>
              <p>
                Holders encrypt credential files, upload to IPFS with Arweave permanence, and receive the immutable
                content ID (CID) that backs every future proof.
              </p>
            </article>
            <article className="node">
              <h3>3. Control disclosure</h3>
              <p>
                The wallet derives proofs tailored to recruiter requests, revealing only approved attributes via
                zero-knowledge proofs.
              </p>
            </article>
            <article className="node" id="recruiters">
              <h3>4. Instant verification</h3>
              <p>
                Recruiters resolve the CID, verify signatures on-chain, and confirm credential integrity without round
                trips to the issuer.
              </p>
            </article>
            <article className="node">
              <h3>5. Immutable audit trail</h3>
              <p>
                Every issuance, storage, and verification event creates a timestamped record, providing regulators and
                institutions with end-to-end traceability.
              </p>
            </article>
            <article className="node">
              <h3>6. Continuous trust</h3>
              <p>
                Credentials never expire or vanish, ensuring lifelong recognition of achievements wherever learners share
                their DID.
              </p>
            </article>
          </div>
        </section>

        <section className="cta-panels" id="cta">
          <article className="panel">
            <h3>Deploy issuer instance</h3>
            <p>Spin up decentralized issuance workflows with built-in DID key management and Arweave anchoring.</p>
            <a className="button tertiary" href="/issuer">
              Start issuing
            </a>
          </article>
          <article className="panel">
            <h3>Empower every learner</h3>
            <p>Offer students an intuitive wallet that keeps credentials encrypted, permanent, and under their control.</p>
            <a href="/holder" className="button tertiary">
              Equip holders
            </a>
          </article>
          <article className="panel">
            <h3>Accelerate hiring</h3>
            <p>Give recruiters verifiable talent insights backed by tamper-proof records sourced from Arweave.</p>
            <a href="#recruiters" className="button tertiary">
              Invite recruiters
            </a>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <p>Powered by decentralized identifiers, selective disclosure, and the Arweave permaweb.</p>
        <p className="credit">
          <a href="https://www.arweave.com/" target="_blank" rel="noreferrer">
            Discover Arweave permanence
          </a>
        </p>
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Landing />
  </React.StrictMode>,
)

