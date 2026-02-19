import React, { useState } from 'react'

export default function AuditLogPage({ logs }) {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLogs = logs.filter((log) => {
    // Handle bulk upload filter
    if (filter === 'bulk_upload') {
      if (!log.details?.toLowerCase().includes('bulk upload')) return false
    } else if (filter !== 'all' && log.action !== filter) {
      return false
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        log.user?.toLowerCase().includes(search) ||
        log.credentialId?.toLowerCase().includes(search) ||
        log.details?.toLowerCase().includes(search)
      )
    }
    return true
  })

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'User', 'Credential ID', 'Details', 'Tx Hash'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.timestamp,
          log.action,
          log.user || '',
          log.credentialId || '',
          log.details || '',
          log.txHash || '',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getActionIcon = (action, details) => {
    // Check if it's a bulk upload
    if (details?.toLowerCase().includes('bulk upload')) {
      return '📦'
    }
    const icons = {
      issue: '📜',
      revoke: '🚫',
      verify: '✓',
      update: '✏️',
      delete: '🗑️',
    }
    return icons[action] || '📋'
  }

  return (
    <div className="audit-log-page">
      <div className="audit-header">
        <h2>Audit Logs</h2>
        <div className="audit-controls">
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="issue">Issue</option>
            <option value="bulk_upload">Bulk Upload</option>
            <option value="revoke">Revoke</option>
            <option value="verify">Verify</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
          <input
            type="text"
            placeholder="Search logs..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-primary" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>User</th>
              <th>Credential ID</th>
              <th>Details</th>
              <th>Transaction</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  No audit logs found
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => (
                <tr key={index}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>
                    <span className="action-badge">
                      {getActionIcon(log.action, log.details)} {log.details?.toLowerCase().includes('bulk upload') ? 'Bulk Upload' : log.action}
                    </span>
                  </td>
                  <td>{log.user || 'System'}</td>
                  <td>
                    <code className="cred-id">{log.credentialId || 'N/A'}</code>
                  </td>
                  <td>{log.details || '-'}</td>
                  <td>
                    {log.txHash ? (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${log.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {log.txHash.slice(0, 10)}...
                      </a>
                    ) : (
                      '-'
                    )}
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

