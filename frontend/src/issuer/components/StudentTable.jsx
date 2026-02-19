import React, { useState } from 'react'

export default function StudentTable({ students, onView, onVerify, onIssue }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase()
    return (
      student.name?.toLowerCase().includes(search) ||
      student.did?.toLowerCase().includes(search) ||
      student.rollNo?.toLowerCase().includes(search)
    )
  })

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-pending', text: 'Pending' },
      verified: { class: 'badge-verified', text: 'Verified' },
      issued: { class: 'badge-issued', text: 'Issued' },
      revoked: { class: 'badge-revoked', text: 'Revoked' },
      rejected: { class: 'badge-rejected', text: 'Rejected' },
    }
    const badge = badges[status] || badges.pending
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>
  }

  return (
    <div className="student-table-container">
      <div className="table-header">
        <h2>Students</h2>
        <input
          type="text"
          placeholder="Search by name, DID, or roll number..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="table-wrapper">
        <table className="student-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll No</th>
              <th>Degree</th>
              <th>College</th>
              <th>CGPA</th>
              <th>Status</th>
              <th>Issued Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-row">
                  No students found
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <strong>{student.name}</strong>
                    {student.did && (
                      <div>
                        <code className="did-cell-small">{student.did}</code>
                      </div>
                    )}
                  </td>
                  <td>{student.rollNo || 'N/A'}</td>
                  <td>{student.degree || '-'}</td>
                  <td>{student.college || '-'}</td>
                  <td>{student.cgpa || '-'}</td>
                  <td>{getStatusBadge(student.status)}</td>
                  <td>
                    {student.issueDate
                      ? new Date(student.issueDate).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-view"
                        onClick={() => onView(student)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      {student.status === 'verified' && (
                        <button
                          className="btn-action btn-issue"
                          onClick={() => onIssue(student)}
                          title="Issue Credential"
                        >
                          📜
                        </button>
                      )}
                      {student.status === 'pending' && (
                        <button
                          className="btn-action btn-verify"
                          onClick={() => onVerify(student)}
                          title="Verify"
                        >
                          ✓
                        </button>
                      )}
                      {student.credentialId && (
                        <button
                          className="btn-action btn-view"
                          onClick={() => onView({ ...student, isCredential: true })}
                          title="View Credential"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

