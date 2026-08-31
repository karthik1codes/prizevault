import React, { useEffect, useMemo, useState } from 'react'
import SharedHeader from './components/SharedHeader'
import Icon from './components/Icon'
import HackathonGlobe from '@/components/ui/usage'
import { getHackathonsFromStorage } from './holder/utils/roleDetection'
import { subscribeHackathonsDatasetChanged } from './utils/hackathonSync'
import { fetchHackathons } from './services/hackathonApi'
import {
  STATUS_META,
  deriveStatus,
  eventCover,
  formatDateRange,
  formatRelative,
  formatXlm,
  participantCount,
  prizeCurrency,
  prizeTotal,
} from './utils/format'
import './styles/index.css'

const SPONSORS = [
  { name: 'PW', src: '/logos/pw.png' },
  { name: 'HDFC Bank', src: '/logos/hdfc.png' },
  { name: 'Amazon', src: '/logos/amazon.png' },
  { name: 'Infosys', src: '/logos/infosys.png' },
  { name: 'SBI', src: '/logos/sbi.png' },
  { name: 'Urban Company', src: '/logos/urban-company.png' },
  { name: 'Cursor', src: '/logos/cursor.png' },
  { name: 'IDFC First Bank', src: '/logos/idfc-first.png' },
]

const FEATURES = [
  {
    icon: 'lock',
    title: 'Neither side can move funds alone',
    text: 'A 2-of-2 escrow means the sponsor cannot claw prize money back and the organizer cannot divert it. Both signatures or nothing.',
  },
  {
    icon: 'send',
    title: 'Payouts are atomic',
    text: 'All winners are paid in a single transaction. There is no partial state where some winners are paid and others are stranded.',
  },
  {
    icon: 'shield',
    title: 'Auditable by anyone',
    text: 'Deposits and releases are public on Stellar, so finance and legal get a provable record without taking anyone at their word.',
  },
  {
    icon: 'clock',
    title: 'No cash fronting',
    text: 'Organizers never wire their own money or chase a sponsor after the event. The prize is already locked before judging starts.',
  },
]

const ROLES = [
  {
    title: 'For sponsors',
    href: '/verifier',
    cta: 'Open sponsor console',
    points: [
      'Fund a prize pool into escrow',
      'Review winners before releasing',
      'Co-approve the payout transaction',
    ],
  },
  {
    title: 'For organizers',
    href: '/organizer',
    cta: 'Open organizer console',
    points: [
      'Create events and prize tiers',
      'Manage participants and winners',
      'Propose and execute payouts',
    ],
  },
  {
    title: 'For participants',
    href: '/holder',
    cta: 'Open escrow wallet',
    points: [
      'Register for open hackathons',
      'Track prize and payout status',
      'Receive winnings on-chain',
    ],
  },
]

/**
 * Only scroll for fragments that are valid CSS identifiers. Marketing and
 * analytics tools append things like `#~utm`, and querySelector throws a
 * SyntaxError on those.
 */
function scrollToHash(hash) {
  if (!hash || hash.length < 2) return
  if (!/^#[A-Za-z][\w-]*$/.test(hash)) return
  const element = document.getElementById(hash.slice(1))
  if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function EventCard({ hackathon }) {
  const status = deriveStatus(hackathon)
  const meta = STATUS_META[status]
  const cover = eventCover(hackathon.name)
  const people = participantCount(hackathon)
  const total = prizeTotal(hackathon)

  return (
    <a
      id={`event-${hackathon.id}`}
      className="pv-event"
      href={`/holder?event=${encodeURIComponent(hackathon.id)}`}
    >
      <div className="pv-event__cover" style={{ background: cover.background }}>
        <span className="pv-event__cover-initials">{cover.initials}</span>
        <span className={`pv-badge ${meta.badge} pv-event__cover-badge`.trim()}>
          {status === 'live' ? <span className="pv-badge__dot pv-badge__dot--pulse" /> : null}
          {meta.label}
        </span>
      </div>
      <div className="pv-event__body">
        <span className="pv-event__date">
          <Icon name="calendar" size={13} />
          {formatDateRange(hackathon.startDate, hackathon.endDate)}
          {status === 'upcoming' && hackathon.startDate ? (
            <span className="pv-dim">· {formatRelative(hackathon.startDate)}</span>
          ) : null}
        </span>
        <h3 className="pv-event__title">{hackathon.name || 'Untitled event'}</h3>
        {hackathon.description ? (
          <p className="pv-event__desc">{hackathon.description}</p>
        ) : null}
        <div className="pv-event__meta">
          <span className="pv-event__meta-item">
            <Icon name="trophy" size={13} />
            <span className="pv-event__prize">
              {formatXlm(total)} {prizeCurrency(hackathon)}
            </span>
          </span>
          <span className="pv-event__meta-item">
            <Icon name="users" size={13} />
            {people} registered
          </span>
        </div>
      </div>
    </a>
  )
}

function Landing() {
  const [hackathons, setHackathons] = useState(() => getHackathonsFromStorage())

  useEffect(() => {
    if (window.location.hash) {
      scrollToHash(window.location.hash)
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    const onHashChange = () => scrollToHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(
    () => subscribeHackathonsDatasetChanged(() => setHackathons(getHackathonsFromStorage())),
    [],
  )

  useEffect(() => {
    fetchHackathons()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) setHackathons(list)
      })
      .catch(() => {})
  }, [])

  const { openEvents, stats } = useMemo(() => {
    const withStatus = hackathons.map((h) => ({ ...h, _status: deriveStatus(h) }))
    const open = withStatus
      .filter((h) => h._status !== 'completed')
      .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0))
    return {
      openEvents: open,
      stats: {
        events: hackathons.length,
        locked: hackathons.reduce((sum, h) => sum + prizeTotal(h), 0),
        participants: hackathons.reduce((sum, h) => sum + participantCount(h), 0),
      },
    }
  }, [hackathons])

  return (
    <div className="pv-shell">
      <a className="pv-skip-link" href="#main">
        Skip to content
      </a>

      <SharedHeader activeTab="landing" />

      <main id="main">
        <section className="pv-container">
          <div className="pv-hero">
            <div className="pv-hero__copy">
              <span className="pv-eyebrow">
                <Icon name="lock" size={13} />
                Hackathon prize escrow on Stellar
              </span>
              <h1 className="pv-hero__title">
                Prize money nobody can move alone.
              </h1>
              <p className="pv-hero__lede">
                Sponsors do not want prize funds misused or delayed. Organizers do not want to
                front cash or take the blame. Winners just want a guaranteed payout once results
                are final. PrizeVault holds the money on-chain until both sides agree.
              </p>
              <div className="pv-hero__cta">
                <a href="#events" className="pv-btn pv-btn--primary pv-btn--lg">
                  Browse events
                </a>
                <a href="#how" className="pv-btn pv-btn--secondary pv-btn--lg">
                  How escrow works
                  <Icon name="arrowRight" size={15} />
                </a>
              </div>
              <div className="pv-hero__proof">
                <div className="pv-hero__proof-item">
                  <span className="pv-hero__proof-value">{stats.events}</span>
                  <span className="pv-hero__proof-label">
                    {stats.events === 1 ? 'Event' : 'Events'}
                  </span>
                </div>
                <div className="pv-hero__proof-item">
                  <span className="pv-hero__proof-value">{formatXlm(stats.locked)}</span>
                  <span className="pv-hero__proof-label">XLM in prize pools</span>
                </div>
                <div className="pv-hero__proof-item">
                  <span className="pv-hero__proof-value">{stats.participants}</span>
                  <span className="pv-hero__proof-label">Registrations</span>
                </div>
              </div>
            </div>

            <div className="pv-hero__globe">
              <HackathonGlobe hackathons={openEvents} />
            </div>
          </div>
        </section>

        <section className="pv-band pv-band--surface" id="events">
          <div className="pv-container">
            <div className="pv-section__header">
              <div>
                <h2 className="pv-section-head__title">Open events</h2>
                <p className="pv-section__desc">
                  Hackathons currently accepting registrations or in progress.
                </p>
              </div>
              <a href="/holder" className="pv-btn pv-btn--secondary pv-btn--sm">
                View all in wallet
                <Icon name="arrowRight" size={14} />
              </a>
            </div>

            {openEvents.length > 0 ? (
              <div className="pv-events">
                {openEvents.map((h) => (
                  <EventCard key={h.id} hackathon={h} />
                ))}
              </div>
            ) : (
              <div className="pv-card pv-card--flat">
                <div className="pv-empty">
                  <span className="pv-empty__icon">
                    <Icon name="calendar" size={20} />
                  </span>
                  <h3 className="pv-empty__title">No open events yet</h3>
                  <p className="pv-empty__text">
                    When an organizer publishes a hackathon and a sponsor locks its prize pool,
                    it appears here for participants to register.
                  </p>
                  <a href="/organizer" className="pv-btn pv-btn--primary pv-btn--sm">
                    <Icon name="plus" size={14} />
                    Create an event
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="pv-band" id="how">
          <div className="pv-container">
            <div className="pv-section-head">
              <h2 className="pv-section-head__title">Why escrow, not trust</h2>
              <p className="pv-section-head__text">
                Hackathon prizes fail in predictable ways. Each of these removes one of them.
              </p>
            </div>
            <div className="pv-features">
              {FEATURES.map((f) => (
                <div className="pv-feature" key={f.title}>
                  <span className="pv-feature__icon">
                    <Icon name={f.icon} size={18} />
                  </span>
                  <h3 className="pv-feature__title">{f.title}</h3>
                  <p className="pv-feature__text">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pv-band pv-band--surface">
          <div className="pv-container pv-logos">
            <p className="pv-logos__label">Trusted by sponsors</p>
            <div className="pv-logos__row">
              {SPONSORS.map((s) => (
                <span className="pv-logos__item" key={s.name}>
                  <img src={s.src} alt={s.name} loading="lazy" />
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="pv-band" id="roles">
          <div className="pv-container">
            <div className="pv-section-head">
              <h2 className="pv-section-head__title">Pick your side of the table</h2>
              <p className="pv-section-head__text">
                Three consoles, one shared escrow. Each role only sees what it controls.
              </p>
            </div>
            <div className="pv-roles">
              {ROLES.map((role) => (
                <div className="pv-role" key={role.title}>
                  <h3 className="pv-role__title">{role.title}</h3>
                  <ul className="pv-role__list">
                    {role.points.map((p) => (
                      <li key={p}>
                        <span className="pv-role__tick">
                          <Icon name="check" size={14} />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <a href={role.href} className="pv-btn pv-btn--secondary pv-btn--block">
                    {role.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pv-container">
          <div className="pv-caveat">
            <span className="pv-caveat__icon">
              <Icon name="alert" size={18} />
            </span>
            <div>
              <h3 className="pv-caveat__title">What this does not solve yet</h3>
              <p className="pv-caveat__text">
                If either sponsor or organizer refuses to sign, funds stay in escrow. There is no
                timeout or automatic refund rule.
              </p>
              <p className="pv-caveat__text">
                Only on-chain XLM and token prizes are supported. Off-chain rewards such as gift
                cards or swag are out of scope.
              </p>
            </div>
          </div>

          <div className="pv-cta">
            <h2 className="pv-cta__title">Run your next hackathon without the payout argument</h2>
            <p className="pv-cta__text">
              Lock the prize pool once. Let the chain settle who gets paid.
            </p>
            <div className="pv-btn-group">
              <a href="/organizer" className="pv-btn pv-btn--primary pv-btn--lg">
                Create an event
              </a>
              <a href="/holder" className="pv-btn pv-btn--secondary pv-btn--lg">
                Open escrow wallet
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="pv-footer">
        <div className="pv-footer__inner">
          <span>Hackathon prize escrow powered by Stellar smart contracts.</span>
          <ul className="pv-footer__links">
            <li>
              <a href="/holder">Escrow Wallet</a>
            </li>
            <li>
              <a href="/organizer">Organizer</a>
            </li>
            <li>
              <a href="/verifier">Sponsor</a>
            </li>
            <li>
              <a href="https://stellar.org/" target="_blank" rel="noreferrer">
                Stellar
                <Icon name="external" size={12} />
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}

export default Landing
export { Landing }
