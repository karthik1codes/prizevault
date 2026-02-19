import React, { useMemo, useState } from 'react'

const candidateIndex = [
  {
    name: 'Avery Chen',
    skills: ['Zero-knowledge proofs', 'Rust', 'Research'],
    university: 'MVJ College of Engineering',
  },
  {
    name: 'Nina Alvarez',
    skills: ['Smart contracts', 'Solidity', 'Mentorship'],
    university: 'Blockchain Academy',
  },
  {
    name: 'Liam Patel',
    skills: ['Product design', 'UX research', 'Tokenomics'],
    university: 'Design Institute',
  },
]

export default function SemanticSearchPanel() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return candidateIndex
    return candidateIndex.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(q) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(q)) ||
        candidate.university.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <section className="recruiter-card">
      <header className="card-header">
        <div>
          <h3>Semantic candidate search</h3>
          <p className="muted">Find verified talent by skills, issuer, or university.</p>
        </div>
      </header>
      <input
        type="search"
        placeholder="Search for Rust, design, or institution…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className="candidate-list">
        {results.map((candidate) => (
          <li key={candidate.name}>
            <div>
              <strong>{candidate.name}</strong>
              <span className="muted">{candidate.university}</span>
            </div>
            <div className="chip-row">
              {candidate.skills.map((skill) => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))}
            </div>
          </li>
        ))}
        {results.length === 0 ? <li className="muted">No matches found.</li> : null}
      </ul>
    </section>
  )
}


