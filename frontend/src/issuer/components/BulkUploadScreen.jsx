import React, { useState, useEffect } from 'react'

export default function BulkUploadScreen({ onUpload, issuerDID, issuerName }) {
  const [file, setFile] = useState(null)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [mapping, setMapping] = useState({
    name: 'name',
    age: 'age',
    degree: 'degree',
    cgpa: 'cgpa',
    projectTitle: 'projectTitle',
    college: 'college',
    rollNo: 'rollNo',
    achievements: 'achievements',
    experience: 'experience',
    contributions: 'contributions',
  })
  const [dryRunResults, setDryRunResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState([])

  // Generate a proper W3C Verifiable Credential JSON structure
  const generateVerifiableCredential = (row, index) => {
    const credentialId = `urn:uuid:cred_${Date.now()}_${index}`
    const issuanceDate = new Date().toISOString()
    
    // Build credentialSubject with all available data
    const credentialSubject = {
      id: `did:example:${row.rollNo || `student_${index}`}`, // Holder DID (would be real in production)
    }
    
    // Add all fields that have values
    if (row.name) credentialSubject.name = row.name
    if (row.age) credentialSubject.age = row.age
    if (row.degree) credentialSubject.degree = row.degree
    if (row.cgpa) credentialSubject.cgpa = row.cgpa
    if (row.projectTitle) credentialSubject.projectTitle = row.projectTitle
    if (row.college) credentialSubject.college = row.college
    if (row.rollNo) credentialSubject.rollNo = row.rollNo
    if (row.achievements) credentialSubject.achievements = row.achievements
    if (row.experience) credentialSubject.experience = row.experience
    if (row.contributions) credentialSubject.contributions = row.contributions

    // Generate transaction hash for blockchain record
    const txHash = `0x${crypto.getRandomValues(new Uint8Array(32)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')}`

    // Create W3C Verifiable Credential JSON structure
    const vc = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1'
      ],
      id: credentialId,
      type: ['VerifiableCredential', 'DegreeCredential', 'StudentCredential'],
      issuer: {
        id: issuerDID || 'did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        name: issuerName || 'MVJ College of Engineering'
      },
      issuanceDate: issuanceDate,
      credentialSubject: credentialSubject,
      credentialStatus: {
        id: `https://revocation-registry.example.com/status/${credentialId.split(':').pop()}`,
        type: 'RevocationList2020Status',
        statusListIndex: index.toString(),
        statusListCredential: 'https://revocation-registry.example.com/status-list'
      },
      proof: {
        type: 'BbsBlsSignature2020',
        created: issuanceDate,
        verificationMethod: `${issuerDID || 'did:ethr:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'}#keys-1`,
        proofPurpose: 'assertionMethod',
        proofValue: `z${crypto.getRandomValues(new Uint8Array(64)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')}`
      }
    }

    return {
      id: credentialId,
      vc: vc, // Full W3C Verifiable Credential JSON
      credentialSubject: credentialSubject,
      issueDate: issuanceDate,
      revoked: false,
      txHash: txHash,
      // Keep flat structure for backward compatibility
      name: row.name,
      age: row.age,
      degree: row.degree,
      cgpa: row.cgpa,
      projectTitle: row.projectTitle,
      college: row.college,
      rollNo: row.rollNo,
      achievements: row.achievements,
      experience: row.experience,
      contributions: row.contributions,
    }
  }

  // Simple CSV parser
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    
    // Parse rows
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      if (values.length > 0 && values.some(v => v)) {
        const row = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        rows.push(row)
      }
    }
    
    return { headers, rows }
  }

  // Validate row data
  const validateRow = (row, index) => {
    const errors = []
    
    // Check required fields
    const nameValue = row[mapping.name]?.trim()
    
    if (!nameValue) {
      errors.push(`Row ${index + 1}: Name is required`)
    }
    
    // Validate CGPA if provided
    if (mapping.cgpa && row[mapping.cgpa]) {
      const cgpa = parseFloat(row[mapping.cgpa])
      if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        errors.push(`Row ${index + 1}: CGPA must be a number between 0 and 10`)
      }
    }
    
    // Validate Age if provided
    if (mapping.age && row[mapping.age]) {
      const age = parseInt(row[mapping.age])
      if (isNaN(age) || age < 1 || age > 150) {
        errors.push(`Row ${index + 1}: Age must be a valid number`)
      }
    }
    
    return errors
  }

  // Process CSV file when file changes
  useEffect(() => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        const { headers, rows } = parseCSV(text)
        setCsvHeaders(headers)
        
        // Show preview of first 3 rows
        setPreviewData(rows.slice(0, 3))
        
        // Auto-detect column mapping if headers match
        const autoMapping = { ...mapping }
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase().replace(/\s+/g, '')
          Object.keys(mapping).forEach(key => {
            if (lowerHeader === key.toLowerCase() || 
                lowerHeader.includes(key.toLowerCase()) ||
                key.toLowerCase().includes(lowerHeader)) {
              autoMapping[key] = header
            }
          })
        })
        setMapping(autoMapping)
      }
      reader.readAsText(file)
    }
  }, [file]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Accept CSV files or files with .csv extension
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        setDryRunResults(null) // Reset previous results
      } else {
        alert('Please select a CSV file (.csv)')
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
        setDryRunResults(null) // Reset previous results
      } else {
        alert('Please drop a CSV file (.csv)')
      }
    }
  }

  const handleDryRun = async () => {
    if (!file) return

    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        const { rows } = parseCSV(text)
        
        let valid = 0
        let errors = 0
        const errorDetails = []
        const validRows = []
        
        rows.forEach((row, index) => {
          const rowErrors = validateRow(row, index)
          
          if (rowErrors.length === 0) {
            valid++
            // Map the row data according to mapping
            const mappedRow = {
              name: row[mapping.name]?.trim() || '',
              age: mapping.age && row[mapping.age] ? row[mapping.age].trim() : undefined,
              degree: mapping.degree && row[mapping.degree] ? row[mapping.degree].trim() : undefined,
              cgpa: mapping.cgpa && row[mapping.cgpa] ? row[mapping.cgpa].trim() : undefined,
              projectTitle: mapping.projectTitle && row[mapping.projectTitle] ? row[mapping.projectTitle].trim() : undefined,
              college: mapping.college && row[mapping.college] ? row[mapping.college].trim() : undefined,
              rollNo: mapping.rollNo && row[mapping.rollNo] ? row[mapping.rollNo].trim() : undefined,
              achievements: mapping.achievements && row[mapping.achievements] ? row[mapping.achievements].trim() : undefined,
              experience: mapping.experience && row[mapping.experience] ? row[mapping.experience].trim() : undefined,
              contributions: mapping.contributions && row[mapping.contributions] ? row[mapping.contributions].trim() : undefined,
            }
            validRows.push(mappedRow)
          } else {
            errors++
            errorDetails.push(...rowErrors)
          }
        })
        
        const results = {
          total: rows.length,
          valid,
          errors,
          errorDetails: errorDetails.slice(0, 20), // Limit to first 20 errors
          validRows, // Store valid rows for upload
        }
        
        setDryRunResults(results)
        setLoading(false)
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('Dry run failed:', error)
      alert('Dry run failed: ' + error.message)
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!file || !dryRunResults || !dryRunResults.validRows) return

    setLoading(true)
    try {
      // Generate proper Verifiable Credentials with VC JSON for each valid row
      const credentials = dryRunResults.validRows.map((row, index) => {
        return generateVerifiableCredential(row, index)
      })

      const results = {
        count: credentials.length,
        credentials,
      }

      onUpload(results)
      setDryRunResults(null)
      setFile(null)
      setPreviewData([])
      setCsvHeaders([])
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bulk-upload-screen">
      <h2>Bulk Upload Credentials</h2>

      <div
        className="drop-zone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="file-input"
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className="drop-zone-label">
          {file ? file.name : 'Drag & drop CSV file or click to select'}
        </label>
      </div>

      {file && (
        <>
          {csvHeaders.length > 0 && (
            <div className="csv-preview">
              <h3>CSV Preview</h3>
              <p className="preview-note">Detected {csvHeaders.length} columns. First 3 rows shown below.</p>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {csvHeaders.map((header, idx) => (
                        <th key={idx}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {csvHeaders.map((header, colIdx) => (
                          <td key={colIdx}>{row[header] || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mapping-section">
            <h3>Column Mapping</h3>
            <p className="mapping-help-text">
              Map your CSV column headers to the expected fields. 
              {csvHeaders.length > 0 && ` Detected columns: ${csvHeaders.join(', ')}`}
            </p>
            {csvHeaders.length > 0 && (
              <div className="column-suggestions">
                <p>Quick select:</p>
                <div className="suggestion-buttons">
                  {csvHeaders.map((header) => (
                    <button
                      key={header}
                      type="button"
                      className="btn-suggestion"
                      onClick={() => {
                        // Auto-map if header matches a field
                        const lowerHeader = header.toLowerCase().replace(/\s+/g, '')
                        const newMapping = { ...mapping }
                        Object.keys(mapping).forEach(key => {
                          if (lowerHeader === key.toLowerCase() || 
                              lowerHeader.includes(key.toLowerCase()) ||
                              key.toLowerCase().includes(lowerHeader)) {
                            newMapping[key] = header
                          }
                        })
                        setMapping(newMapping)
                      }}
                    >
                      {header}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mapping-grid">
              <div className="mapping-item">
                <label>Name Column *</label>
                <input
                  type="text"
                  value={mapping.name}
                  onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                  placeholder="name"
                />
              </div>
              <div className="mapping-item">
                <label>Age Column</label>
                <input
                  type="text"
                  value={mapping.age}
                  onChange={(e) => setMapping({ ...mapping, age: e.target.value })}
                  placeholder="age"
                />
              </div>
              <div className="mapping-item">
                <label>Degree Column</label>
                <input
                  type="text"
                  value={mapping.degree}
                  onChange={(e) => setMapping({ ...mapping, degree: e.target.value })}
                  placeholder="degree"
                />
              </div>
              <div className="mapping-item">
                <label>CGPA Column</label>
                <input
                  type="text"
                  value={mapping.cgpa}
                  onChange={(e) => setMapping({ ...mapping, cgpa: e.target.value })}
                  placeholder="cgpa"
                />
              </div>
              <div className="mapping-item">
                <label>Project Title Column</label>
                <input
                  type="text"
                  value={mapping.projectTitle}
                  onChange={(e) => setMapping({ ...mapping, projectTitle: e.target.value })}
                  placeholder="projectTitle"
                />
              </div>
              <div className="mapping-item">
                <label>College Column</label>
                <input
                  type="text"
                  value={mapping.college}
                  onChange={(e) => setMapping({ ...mapping, college: e.target.value })}
                  placeholder="college"
                />
              </div>
              <div className="mapping-item">
                <label>Roll No Column</label>
                <input
                  type="text"
                  value={mapping.rollNo}
                  onChange={(e) => setMapping({ ...mapping, rollNo: e.target.value })}
                  placeholder="rollNo"
                />
              </div>
              <div className="mapping-item">
                <label>Achievements Column</label>
                <input
                  type="text"
                  value={mapping.achievements}
                  onChange={(e) => setMapping({ ...mapping, achievements: e.target.value })}
                  placeholder="achievements"
                />
              </div>
              <div className="mapping-item">
                <label>Experience Column</label>
                <input
                  type="text"
                  value={mapping.experience}
                  onChange={(e) => setMapping({ ...mapping, experience: e.target.value })}
                  placeholder="experience"
                />
              </div>
              <div className="mapping-item">
                <label>Contributions Column</label>
                <input
                  type="text"
                  value={mapping.contributions}
                  onChange={(e) => setMapping({ ...mapping, contributions: e.target.value })}
                  placeholder="contributions"
                />
              </div>
            </div>
            <p className="mapping-note">* Required fields</p>
          </div>

          <div className="bulk-actions">
            <button className="btn-secondary" onClick={handleDryRun} disabled={loading}>
              {loading ? 'Running...' : 'Dry Run'}
            </button>
            {dryRunResults && (
              <button className="btn-primary" onClick={handleUpload} disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Credentials'}
              </button>
            )}
          </div>

          {dryRunResults && (
            <div className="dry-run-results">
              <h3>Dry Run Results</h3>
              <div className="results-stats">
                <div className="stat">
                  <span className="stat-label">Total Rows:</span>
                  <span className="stat-value">{dryRunResults.total}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Valid:</span>
                  <span className="stat-value stat-valid">{dryRunResults.valid}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Errors:</span>
                  <span className="stat-value stat-error">{dryRunResults.errors}</span>
                </div>
              </div>
              {dryRunResults.errors > 0 && (
                <div className="error-list">
                  <h4>Errors:</h4>
                  <ul>
                    {dryRunResults.errorDetails?.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

