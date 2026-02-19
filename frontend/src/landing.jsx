import React, { useEffect, useState } from 'react'
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

  const sponsors = [
    { name: 'PW', src: '/logos/pw.png' },
    { name: 'HDFC Bank', src: '/logos/hdfc.png' },
    { name: 'Amazon', src: '/logos/amazon.png' },
    { name: 'Infosys', src: '/logos/infosys.png' },
    { name: 'SBI', src: '/logos/sbi.png' },
    { name: 'Urban Company', src: '/logos/urban-company.png' },
    { name: 'Cursor', src: '/logos/cursor.png' },
    { name: 'IDFC First Bank', src: '/logos/idfc-first.png' },
  ]

  const [isSponsorPaused, setIsSponsorPaused] = useState(false)

  return (
    <div className="landing-page">
      <div className="global-noise"></div>
      <SharedHeader activeTab="landing" />

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Hackathon prize escrow on Algorand.</span>
            <h1>Lock hackathon prize money in escrow so nobody has to blindly trust anyone.</h1>
            <p>
              Sponsors don&apos;t want prize money misused or delayed. Organizers don&apos;t want to front cash or be
              blamed. Winners just want a fast, guaranteed payout once results are final.
            </p>
            <div className="cta-group">
              <a href="/holder" className="button primary">
                Launch Escrow Wallet
              </a>
              <a href="#workflow" className="button secondary">
                See how the escrow works
              </a>
            </div>
            <div className="status-strip">
              <span className="status-pill">On-chain escrow</span>
              <span className="status-pill">2-of-2 approvals</span>
              <span className="status-pill">Atomic payouts</span>
            </div>
          </div>
          <div className="hero-card">
            <h2>Escrow in three moves</h2>
            <ul>
              <li>Sponsor locks prize funds into a shared escrow account on Algorand.</li>
              <li>Organizer configures the hackathon, picks winners, and proposes payout.</li>
              <li>Both co-sign one atomic transaction that releases all prizes at once.</li>
            </ul>
            <a className="card-link" href="#workflow">
              See the full escrow lifecycle →
            </a>
          </div>
        </section>

        <section className="sponsor-strip" aria-label="Hackathon sponsors">
          <p className="sponsor-strip-label">Trusted by sponsors</p>
          <div className="sponsor-strip-viewport">
            <div className={`sponsor-track ${isSponsorPaused ? 'paused' : ''}`} aria-hidden>
              {[...sponsors, ...sponsors].map((sponsor, idx) => (
                <div
                  className="sponsor-logo"
                  key={`${sponsor.name}-${idx}`}
                  onMouseEnter={() => setIsSponsorPaused(true)}
                  onMouseLeave={() => setIsSponsorPaused(false)}
                >
                  <img src={sponsor.src} alt={sponsor.name} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="permanence-band" id="trust">
          <div className="band-copy">
            <h2>How the escrow fixes hackathon payouts</h2>
            <p>
              We lock funds on-chain in a shared escrow so the sponsor can&apos;t disappear, the organizer can&apos;t
              divert funds, and everyone can see what happened.
            </p>
          </div>
          <div className="band-metrics">
            <div>
              <span className="metric">2-of-2</span>
              <p>Both sponsor and organizer must approve before any prize moves.</p>
            </div>
            <div>
              <span className="metric">Atomic</span>
              <p>Approval and payout happen together in one all-or-nothing transaction.</p>
            </div>
            <div>
              <span className="metric">Transparent</span>
              <p>Every deposit and payout is visible on Algorand for anyone to audit.</p>
            </div>
          </div>
        </section>

        <section className="role-panels" id="roles">
          <article className="role-card">
            <h3>Sponsor view</h3>
            <p>Fund the prize into escrow, see committed prize pools, and co-approve payouts when results are final.</p>
            <a href="/verifier" className="button tertiary">
              For sponsors
            </a>
          </article>
          <article className="role-card highlight" id="wallet">
            <h3>Organizer console</h3>
            <p>Configure hackathons, register winners, and co-approve payouts from shared escrow.</p>
            <a href="/issuer" className="button tertiary">
              For organizers
            </a>
          </article>
          <article className="role-card">
            <h3>Winner view</h3>
            <p>Track prize status and receive on-chain payout once both sponsor and organizer have signed.</p>
            <a href="/verifier" className="button tertiary">
              For winners
            </a>
          </article>
        </section>

        <section className="workflow" id="workflow">
          <div className="section-heading">
            <h2>Escrow lifecycle on Algorand</h2>
            <p>From funding the prize pool to on-chain payout, every step is coordinated through a shared escrow.</p>
          </div>
          <div className="workflow-grid">
            <article className="node" id="issuer">
              <h3>1. Lock the prize pool</h3>
              <p>
                The sponsor locks prize funds into an Algorand escrow account controlled by a LogicSig. Neither party
                can move the money alone.
              </p>
            </article>
            <article className="node highlight" id="credentials">
              <h3>2. Configure the hackathon</h3>
              <p>
                The organizer sets up the event, defines prize structure, and connects winner wallet addresses to each
                prize.
              </p>
            </article>
            <article className="node">
              <h3>3. Finalize results</h3>
              <p>
                Once judging is complete, the organizer prepares a payout proposal from the escrow to the winning
                addresses.
              </p>
            </article>
            <article className="node" id="recruiters">
              <h3>4. Co-approve payout</h3>
              <p>
                The sponsor reviews and co-signs, so both sponsor and organizer explicitly agree on who gets paid and
                how much.
              </p>
            </article>
            <article className="node">
              <h3>5. Atomic release</h3>
              <p>
                An atomic group transaction executes, releasing funds from escrow to all winners in one all-or-nothing
                operation.
              </p>
            </article>
            <article className="node">
              <h3>6. Audit anytime</h3>
              <p>
                Every deposit and payout stays on-chain, giving sponsors, organizers, and auditors a tamper-proof prize
                history.
              </p>
            </article>
          </div>
        </section>

        <section className="cta-panels" id="cta">
          <div className="section-heading">
            <h2>Where this escrow actually helps</h2>
            <p>Built for hackathons and bounty programs where trust, finance, and fairness really matter.</p>
          </div>
          <article className="panel">
            <h3>Corporate-sponsored hackathons</h3>
            <p>Give finance and legal a provable on-chain record of how every sponsored prize was funded and paid.</p>
            <a className="button tertiary" href="/holder">
              Show sponsors the flow
            </a>
          </article>
          <article className="panel">
            <h3>Online &amp; global hackathons</h3>
            <p>
              Run prizes across borders without asking anyone to wire funds to a stranger or sit on money they
              don&apos;t control.
            </p>
            <a href="/holder" className="button tertiary">
              Try the Escrow Wallet
            </a>
          </article>
          <article className="panel">
            <h3>DAOs &amp; community bounties</h3>
            <p>
              Let sponsors and reviewers share control of bounty pools so no single signer can unilaterally move funds.
            </p>
            <a href="/issuer" className="button tertiary">
              Talk about bounty flows
            </a>
          </article>
          <article className="panel">
            <h3>What this does not solve (yet)</h3>
            <p>
              If either sponsor or organizer refuses to sign, funds can remain stuck in escrow—there is no timeout or
              automatic refund rule yet.
            </p>
            <p>We also focus on on-chain ALGO/ASA prizes only; off-chain rewards like gift cards are out of scope.</p>
            <a href="#workflow" className="button tertiary">
              See current escrow design
            </a>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <p>Hackathon prize escrow powered by Algorand smart signatures.</p>
        <p className="credit">
          <a href="https://www.algorand.foundation/" target="_blank" rel="noreferrer">
            Learn more about Algorand
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

