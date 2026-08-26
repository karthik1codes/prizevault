import React from 'react'
import Icon from '../../components/Icon'
import { deleteHackathonById } from '../../holder/utils/roleDetection'
import { hackathonBelongsToOrganizerPortal } from '../../utils/organizerPortalFilter'
import { useHackathons } from '../../hooks/useHackathons'
import {
  STATUS_META,
  deriveStatus,
  formatDateRange,
  formatXlm,
  participantCount,
  prizeCurrency,
  prizeTotal,
} from '../../utils/format'

function HackathonRow({ hackathon, onNavigate }) {
  const status = deriveStatus(hackathon)
  const meta = STATUS_META[status]
  const winners = hackathon.winners?.length || 0

  const handleDelete = () => {
    const ok = window.confirm(
      `Delete hackathon "${hackathon.name}"? This removes it for sponsors and participants and deletes related proposals.`,
    )
    if (ok) deleteHackathonById(hackathon.id)
  }

  return (
    <tr>
      <td>
        <span className="pv-table__primary">{hackathon.name || 'Untitled'}</span>
        <span className="pv-table__sub">
          {formatDateRange(hackathon.startDate, hackathon.endDate)}
        </span>
      </td>
      <td>
        <span className={`pv-badge ${meta.badge}`.trim()}>
          {status === 'live' ? <span className="pv-badge__dot pv-badge__dot--pulse" /> : null}
          {meta.label}
        </span>
      </td>
      <td className="pv-table__num">
        {formatXlm(prizeTotal(hackathon))}{' '}
        <span className="pv-dim">{prizeCurrency(hackathon)}</span>
      </td>
      <td className="pv-table__num">{participantCount(hackathon)}</td>
      <td>
        {hackathon.payoutProposed ? (
          <span className="pv-badge pv-badge--accent">Payout proposed</span>
        ) : hackathon.winnersSelected ? (
          <span className="pv-badge pv-badge--warning">
            {winners} winner{winners === 1 ? '' : 's'} chosen
          </span>
        ) : (
          <span className="pv-badge">No winners yet</span>
        )}
      </td>
      <td className="pv-table__actions">
        <span className="pv-btn-group">
          <button
            type="button"
            className="pv-btn pv-btn--ghost pv-btn--xs"
            onClick={() => onNavigate?.('participants', hackathon.id)}
          >
            Participants
          </button>
          <button
            type="button"
            className="pv-btn pv-btn--ghost pv-btn--xs"
            onClick={() => onNavigate?.('winners', hackathon.id)}
          >
            Winners
          </button>
          <button
            type="button"
            className="pv-btn pv-btn--ghost pv-btn--xs"
            onClick={() => onNavigate?.('payouts', hackathon.id)}
          >
            Payout
          </button>
          <button
            type="button"
            className="pv-btn pv-btn--ghost pv-btn--xs pv-btn--icon"
            onClick={handleDelete}
            aria-label={`Delete ${hackathon.name}`}
            title="Delete hackathon"
          >
            <Icon name="trash" size={13} />
          </button>
        </span>
      </td>
    </tr>
  )
}

export default function OrganizerDashboard({ sessionWallet, onNavigate }) {
  const { hackathons } = useHackathons((h) => hackathonBelongsToOrganizerPortal(h, sessionWallet))

  // A completed event with no winners chosen is the thing that actually needs
  // action. The original tested `winnersSelected && !payoutProposed`, which is
  // the opposite -- it only nudged once winners were already picked.
  const needWinners = hackathons.filter(
    (h) => deriveStatus(h) === 'completed' && !h.winnersSelected,
  )
  const needProposal = hackathons.filter((h) => h.winnersSelected && !h.payoutProposed)
  const awaitingApproval = hackathons.filter((h) => h.payoutProposed && !h.payoutExecuted)

  const nudges = [
    needWinners.length > 0 && {
      icon: 'trophy',
      tone: 'pv-alert--warning',
      title: `${needWinners.length} completed ${needWinners.length === 1 ? 'event needs' : 'events need'} winners`,
      text: needWinners.map((h) => h.name).join(', '),
      cta: 'Select winners',
      view: 'winners',
      id: needWinners[0].id,
    },
    needProposal.length > 0 && {
      icon: 'send',
      tone: 'pv-alert--accent',
      title: `${needProposal.length} ${needProposal.length === 1 ? 'event has' : 'events have'} winners but no payout proposal`,
      text: needProposal.map((h) => h.name).join(', '),
      cta: 'Create payout',
      view: 'payouts',
      id: needProposal[0].id,
    },
    awaitingApproval.length > 0 && {
      icon: 'clock',
      tone: '',
      title: `${awaitingApproval.length} payout ${awaitingApproval.length === 1 ? 'proposal' : 'proposals'} awaiting sponsor approval`,
      text: 'The sponsor must co-approve before funds can be released.',
      cta: 'View payouts',
      view: 'payouts',
      id: awaitingApproval[0].id,
    },
  ].filter(Boolean)

  return (
    <div className="pv-stack pv-stack--lg">
      <div className="pv-row pv-row--between">
        <div className="pv-btn-group">
          <button
            type="button"
            className="pv-btn pv-btn--primary"
            onClick={() => onNavigate?.('create-hackathon')}
          >
            <Icon name="plus" size={15} />
            Create hackathon
          </button>
          <a href="/holder" className="pv-btn pv-btn--secondary">
            <Icon name="wallet" size={15} />
            View escrow wallet
          </a>
        </div>
      </div>

      {nudges.length > 0 ? (
        <div className="pv-stack pv-stack--sm">
          {nudges.map((n) => (
            <div className={`pv-alert ${n.tone}`.trim()} key={n.title}>
              <span className="pv-alert__icon">
                <Icon name={n.icon} size={16} />
              </span>
              <div className="pv-alert__content">
                <p className="pv-alert__title">{n.title}</p>
                <p className="pv-alert__text">{n.text}</p>
              </div>
              <button
                type="button"
                className="pv-btn pv-btn--secondary pv-btn--sm"
                onClick={() => onNavigate?.(n.view, n.id)}
              >
                {n.cta}
              </button>
            </div>
          ))}
        </div>
      ) : hackathons.length > 0 ? (
        <div className="pv-alert pv-alert--success">
          <span className="pv-alert__icon">
            <Icon name="checkCircle" size={16} />
          </span>
          <div className="pv-alert__content">
            <p className="pv-alert__title">Nothing needs your attention</p>
            <p className="pv-alert__text">
              Every event either has no results yet or has a payout already in flight.
            </p>
          </div>
        </div>
      ) : null}

      <section className="pv-card">
        <div className="pv-card__header">
          <div>
            <h3 className="pv-card__title">My hackathons</h3>
            <p className="pv-card__subtitle">
              {hackathons.length} event{hackathons.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="pv-card__actions">
            <button
              type="button"
              className="pv-btn pv-btn--ghost pv-btn--sm"
              onClick={() => onNavigate?.('hackathons')}
            >
              See all
              <Icon name="arrowRight" size={14} />
            </button>
          </div>
        </div>

        {hackathons.length === 0 ? (
          <div className="pv-empty">
            <span className="pv-empty__icon">
              <Icon name="calendar" size={20} />
            </span>
            <h4 className="pv-empty__title">No hackathons yet</h4>
            <p className="pv-empty__text">
              Create your first event to set a prize pool, register participants and run a payout
              through escrow.
            </p>
            <button
              type="button"
              className="pv-btn pv-btn--primary pv-btn--sm"
              onClick={() => onNavigate?.('create-hackathon')}
            >
              <Icon name="plus" size={14} />
              Create hackathon
            </button>
          </div>
        ) : (
          <div className="pv-card__body pv-card__body--flush">
            <div className="pv-table-wrap">
              <table className="pv-table pv-table--hover">
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="pv-table__num">
                      Prize pool
                    </th>
                    <th scope="col" className="pv-table__num">
                      Registered
                    </th>
                    <th scope="col">Payout stage</th>
                    <th scope="col" className="pv-table__actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hackathons.map((h) => (
                    <HackathonRow key={h.id} hackathon={h} onNavigate={onNavigate} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
