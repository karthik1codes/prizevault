import React from 'react'

const eventTimeline = [
  {
    id: 'day1',
    label: "Day 1 · The Rift Opens",
    date: 'February 19, 2026',
    items: [
      {
        id: 'arrival',
        time: '09:00 AM – 11:00 AM',
        title: 'Arrival & Registration',
        details: [
          'Gate opens, teams check in with QR and ID verification.',
          'Swag kit distribution and Wi‑Fi credentials.',
          'Seat allocation and team setup at designated tables.',
        ],
      },
      {
        id: 'opening',
        time: '11:00 AM – 12:30 PM',
        title: 'Opening Ceremony & Speaker Sessions',
        details: [
          'Welcome note and introduction to RIFT & PW IOI.',
          'Industry leader talks on open innovation.',
          'Rules briefing, submission guidelines and judging criteria.',
        ],
      },
      {
        id: 'reveal',
        time: '12:30 PM',
        title: 'Problem Statements Reveal · Hacking Begins',
        details: [
          'Four open innovation challenges unlocked simultaneously across all 4 cities.',
          'Teams start brainstorming and locking down ideas.',
        ],
      },
      {
        id: 'ideation',
        time: '12:30 PM – 01:30 PM',
        title: 'Ideation & Brainstorming',
        details: ['Teams study the problem statements and decide their tech approach and architecture.'],
      },
      {
        id: 'lunch',
        time: '01:00 PM – 03:30 PM',
        title: 'Lunch Break',
        details: ['Staggered lunch so teams can refuel without breaking momentum.'],
      },
      {
        id: 'mentoring',
        time: '04:00 PM – 08:00 PM',
        title: 'Mentoring Window',
        details: [
          'Idea and architecture validation with mentors.',
          'Feedback on feasibility, stack choices, and pivots if needed.',
        ],
      },
      {
        id: 'strategy-lock',
        time: '06:00 PM – 08:00 PM',
        title: 'Strategy Lock',
        details: [
          'Mandatory form fill to lock team name and selected problem statement.',
          'No changes to problem statement allowed after this window.',
        ],
      },
      {
        id: 'dinner',
        time: '08:00 PM – 10:30 PM',
        title: 'Dinner',
        details: ['Teams take a break and prep for the night sprint.'],
      },
      {
        id: 'mini-event-1',
        time: '10:00 PM – 11:59 PM',
        title: 'Mini‑Event 1 · Game / Quiz',
        details: [
          'Short 30‑minute energizer: typing challenge, CS quiz, or rapid‑fire gaming.',
          'Helps teams reset before the midnight push.',
        ],
      },
      {
        id: 'midnight-checkpoint',
        time: '11:59 PM',
        title: 'Midnight Checkpoint',
        details: ['Halfway mark: teams are expected to have core backend / logic ready.'],
      },
    ],
  },
  {
    id: 'day2',
    label: 'Day 2 · The Shift',
    date: 'February 20, 2026',
    items: [
      {
        id: 'midnight-snacks',
        time: '01:00 AM – 03:00 AM',
        title: 'Midnight Snacks',
        details: ['Late‑night snacks and coffee to sustain the overnight sprint.'],
      },
      {
        id: 'breakfast',
        time: '07:00 AM – 09:30 AM',
        title: 'Breakfast',
        details: ['Morning breakfast while teams stabilize builds and polish UX.'],
      },
      {
        id: 'code-freeze-warning',
        time: '11:30 AM',
        title: 'Code Freeze Warning',
        details: ['Final 60 minutes of hacking: teams focus on bug fixes and demo prep.'],
      },
      {
        id: 'submission-open',
        time: '12:00 PM',
        title: 'Submission Portal Opens',
        details: [
          'Teams push final code to GitHub.',
          'Submission links uploaded to the official portal.',
        ],
      },
      {
        id: 'hacking-ends',
        time: '12:30 PM',
        title: 'Hacking Ends · Hard Stop',
        details: ['No further code changes allowed; teams switch fully to pitch readiness.'],
      },
      {
        id: 'judging-expo',
        time: '01:00 PM – 05:00 PM',
        title: 'Judging · Expo Mode',
        details: [
          'Judges walk through each table for live prototype demos.',
          'Top teams shortlisted for on‑stage pitches (depending on volume).',
        ],
      },
      {
        id: 'closing',
        time: '05:00 PM – 06:00 PM',
        title: 'Closing Ceremony',
        details: [
          'Winner announcements and prize distribution.',
          'Group photos and closing vote of thanks.',
        ],
      },
      {
        id: 'dispersal',
        time: '06:00 PM',
        title: 'Dispersal',
        details: ['Teams wrap up and exit the venue.'],
      },
    ],
  },
]

export default function Timeline() {
  return (
    <section className="issuer-section timeline-expanded">
      <div className="section-heading">
        <h2>RIFT &apos;26 Event Timeline</h2>
        <p>
          A quick glance at how the 24‑hour hackathon unfolds across Bengaluru, Pune, Noida and Lucknow so your team
          can plan energy, deliverables and demos.
        </p>
      </div>
      <div className="timeline">
        {eventTimeline.map((day) => (
          <div key={day.id} className="timeline-item">
            <div className="timeline-dot" />
            <h3>{day.label}</h3>
            <span className="timestamp">{day.date}</span>
            <ul>
              {day.items.map((item) => (
                <li key={item.id} style={{ marginTop: '14px' }}>
                  <strong>{item.time}</strong>
                  <div>{item.title}</div>
                  {item.details?.map((line, idx) => (
                    <p key={idx} className="muted">
                      {line}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

