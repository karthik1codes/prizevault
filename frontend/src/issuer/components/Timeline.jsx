import React, { useEffect, useMemo, useState } from 'react'
import { getDocument } from 'pdfjs-dist'
import { GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { DEFAULT_ORGANIZER_ESCROW_ADDRESS } from '../../constants/escrow'
import { appendIssuerAuditLog } from '../../utils/issuerAuditLog'

const HACKATHON_STORAGE_KEY = 'prize_vault_hackathons'
const TIMELINE_STORAGE_KEY = 'prize_vault_hackathon_timelines'

GlobalWorkerOptions.workerSrc = pdfWorker

function getStoredHackathons() {
  try {
    const raw = localStorage.getItem(HACKATHON_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (_) {
    return []
  }
}

function getTimelineStore() {
  try {
    const raw = localStorage.getItem(TIMELINE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (_) {
    return {}
  }
}

function saveTimelineStore(store) {
  try {
    localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(store))
  } catch (_) {}
}

function newEvent() {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    time: '',
    title: '',
    details: '',
  }
}

function extractTimelineEventsFromText(text) {
  const lines = (text || '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const events = []
  let current = null
  const timeRegex =
    /^(\d{1,2}(?::\d{2})?\s?(?:AM|PM|am|pm)?\s?(?:-|–|to)\s?\d{1,2}(?::\d{2})?\s?(?:AM|PM|am|pm)?|\d{1,2}(?::\d{2})?\s?(?:AM|PM|am|pm))\b/

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[\u2022\-*]\s*/, '')
    const timeMatch = line.match(timeRegex)

    if (timeMatch) {
      if (current && (current.time || current.title || current.details)) {
        events.push(current)
      }
      const time = timeMatch[1].trim()
      const title = line.slice(timeMatch[0].length).replace(/^[-:–]\s*/, '').trim()
      current = {
        id: newEvent().id,
        time,
        title,
        details: '',
      }
      continue
    }

    if (!current) {
      if (line.length > 8) {
        current = {
          id: newEvent().id,
          time: '',
          title: line,
          details: '',
        }
      }
      continue
    }

    if (!current.title) {
      current.title = line
    } else {
      current.details = current.details ? `${current.details}\n${line}` : line
    }
  }

  if (current && (current.time || current.title || current.details)) {
    events.push(current)
  }

  return events.slice(0, 100)
}

export default function Timeline({ userWallet }) {
  const [allHackathons, setAllHackathons] = useState([])
  const [selectedHackathonId, setSelectedHackathonId] = useState('')
  const [events, setEvents] = useState([])
  const [saveMessage, setSaveMessage] = useState('')
  const [isParsingPdf, setIsParsingPdf] = useState(false)
  const [pdfError, setPdfError] = useState('')

  useEffect(() => {
    const list = getStoredHackathons()
    setAllHackathons(list)
  }, [])

  const myWallet = (userWallet || DEFAULT_ORGANIZER_ESCROW_ADDRESS).toLowerCase()
  const myHackathons = useMemo(
    () => allHackathons.filter((h) => h.organizerAddress?.toLowerCase() === myWallet),
    [allHackathons, myWallet]
  )

  useEffect(() => {
    if (!myHackathons.length) {
      setSelectedHackathonId('')
      return
    }
    if (!selectedHackathonId || !myHackathons.some((h) => h.id === selectedHackathonId)) {
      setSelectedHackathonId(myHackathons[0].id)
    }
  }, [myHackathons, selectedHackathonId])

  useEffect(() => {
    if (!selectedHackathonId) {
      setEvents([])
      return
    }
    const store = getTimelineStore()
    const timeline = store[selectedHackathonId] || []
    setEvents(
      timeline.map((evt) => ({
        id: evt.id || newEvent().id,
        time: evt.time || '',
        title: evt.title || '',
        details: evt.details || '',
      }))
    )
  }, [selectedHackathonId])

  const selectedHackathon = myHackathons.find((h) => h.id === selectedHackathonId)

  const addEvent = () => {
    const created = newEvent()
    setEvents((prev) => [...prev, created])
    appendIssuerAuditLog({
      action: 'create',
      user: 'Organizer',
      details: `Timeline event added${selectedHackathon ? ` for ${selectedHackathon.name}` : ''}.`,
      wallet: userWallet || DEFAULT_ORGANIZER_ESCROW_ADDRESS,
      hackathonId: selectedHackathonId || null,
    })
  }

  const removeEvent = (id) => {
    setEvents((prev) => prev.filter((evt) => evt.id !== id))
    appendIssuerAuditLog({
      action: 'delete',
      user: 'Organizer',
      details: `Timeline event removed${selectedHackathon ? ` for ${selectedHackathon.name}` : ''}.`,
      wallet: userWallet || DEFAULT_ORGANIZER_ESCROW_ADDRESS,
      hackathonId: selectedHackathonId || null,
    })
  }

  const updateEventField = (id, field, value) => {
    setEvents((prev) =>
      prev.map((evt) => (evt.id === id ? { ...evt, [field]: value } : evt))
    )
  }

  const saveTimeline = () => {
    if (!selectedHackathonId) return
    const store = getTimelineStore()
    const previous = Array.isArray(store[selectedHackathonId]) ? store[selectedHackathonId] : []
    const cleaned = events
      .map((evt) => ({
        id: evt.id,
        time: (evt.time || '').trim(),
        title: (evt.title || '').trim(),
        details: (evt.details || '').trim(),
      }))
      .filter((evt) => evt.time || evt.title || evt.details)

    store[selectedHackathonId] = cleaned
    saveTimelineStore(store)
    setSaveMessage('Timeline saved.')
    appendIssuerAuditLog({
      action: 'update',
      user: 'Organizer',
      details: `Timeline saved for ${selectedHackathon?.name || 'selected hackathon'} (${cleaned.length} events, previously ${previous.length}).`,
      wallet: userWallet || DEFAULT_ORGANIZER_ESCROW_ADDRESS,
      hackathonId: selectedHackathonId,
    })
    setTimeout(() => setSaveMessage(''), 2000)
  }

  const handlePdfUpload = async (file) => {
    if (!file) return
    setPdfError('')
    setSaveMessage('')
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Please upload a PDF file.')
      return
    }

    try {
      setIsParsingPdf(true)
      const data = new Uint8Array(await file.arrayBuffer())
      const pdf = await getDocument({ data }).promise
      let fullText = ''

      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
        const page = await pdf.getPage(pageNo)
        const content = await page.getTextContent()
        const pageText = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
        fullText += `${pageText}\n`
      }

      const parsedEvents = extractTimelineEventsFromText(fullText)
      if (!parsedEvents.length) {
        setPdfError('Could not detect timeline entries in this PDF. You can still add events manually.')
        return
      }

      setEvents(parsedEvents)
      setSaveMessage(`Loaded ${parsedEvents.length} events from PDF. Review and click Save Timeline.`)
      appendIssuerAuditLog({
        action: 'update',
        user: 'Organizer',
        details: `Timeline PDF imported for ${selectedHackathon?.name || 'selected hackathon'} (${parsedEvents.length} extracted events).`,
        wallet: userWallet || DEFAULT_ORGANIZER_ESCROW_ADDRESS,
        hackathonId: selectedHackathonId || null,
      })
    } catch (err) {
      console.error('Failed to parse timeline PDF:', err)
      setPdfError('Unable to read this PDF. Please try another file or add events manually.')
    } finally {
      setIsParsingPdf(false)
    }
  }

  return (
    <section className="issuer-section timeline-expanded">
      <div className="section-heading">
        <h2>Event Timeline</h2>
        <p>Create and manage timeline events per hackathon. You can add or remove multiple entries anytime.</p>
      </div>

      {!myHackathons.length ? (
        <p className="muted">No organizer hackathons found. Create a hackathon first to manage timeline events.</p>
      ) : (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="field">
            <label htmlFor="timeline-hackathon-select">Hackathon</label>
            <select
              id="timeline-hackathon-select"
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
            >
              {myHackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.startDate} - {h.endDate})
                </option>
              ))}
            </select>
          </div>
          {selectedHackathon && (
            <p className="muted" style={{ marginTop: 8 }}>
              Managing timeline for <strong>{selectedHackathon.name}</strong>
            </p>
          )}
        </div>
      )}

      {!!selectedHackathonId && (
        <>
          <div className="button-row" style={{ marginBottom: 12 }}>
            <button type="button" className="btn-secondary" onClick={addEvent}>
              Add Timeline Event
            </button>
            <button type="button" className="btn-primary" onClick={saveTimeline}>
              Save Timeline
            </button>
          </div>
          <div className="panel" style={{ marginBottom: 12 }}>
            <div className="field">
              <label htmlFor="timeline-pdf-upload">Upload Timeline PDF</label>
              <input
                id="timeline-pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={(e) => handlePdfUpload(e.target.files?.[0])}
                disabled={isParsingPdf}
              />
              <p className="muted" style={{ marginTop: 6 }}>
                Upload an official timeline PDF to auto-fill events. You can edit entries before saving.
              </p>
            </div>
            {isParsingPdf && <p className="muted">Reading PDF and extracting timeline…</p>}
            {pdfError && <p className="error-text">{pdfError}</p>}
          </div>
          {saveMessage && <p className="muted">{saveMessage}</p>}

          {!events.length ? (
            <p className="muted">No timeline events yet for this hackathon. Click "Add Timeline Event".</p>
          ) : (
            <div className="timeline">
              {events.map((evt, index) => (
                <div key={evt.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <h3>Event #{index + 1}</h3>
                  <div className="field-row">
                    <div className="field">
                      <label>Time / Slot</label>
                      <input
                        type="text"
                        value={evt.time}
                        onChange={(e) => updateEventField(evt.id, 'time', e.target.value)}
                        placeholder="e.g. 09:00 AM - 10:00 AM"
                      />
                    </div>
                    <div className="field">
                      <label>Title</label>
                      <input
                        type="text"
                        value={evt.title}
                        onChange={(e) => updateEventField(evt.id, 'title', e.target.value)}
                        placeholder="e.g. Registration"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Details</label>
                    <textarea
                      value={evt.details}
                      onChange={(e) => updateEventField(evt.id, 'details', e.target.value)}
                      rows={3}
                      placeholder="Optional details for this event"
                    />
                  </div>
                  <div className="hackathon-card-actions">
                    <button type="button" className="btn-small" onClick={() => removeEvent(evt.id)}>
                      Remove Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

