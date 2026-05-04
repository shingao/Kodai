import React, { useState, useRef, useEffect } from 'react'
import './SmartPlaylistDialog.css'

const HINT = `field op value  (one per line)
──────────────────────────
addedAt within week
duration > 180
bpm > 120
tag includes chill
artist includes burial
playCount > 0
album = mezzanine`

export default function SmartPlaylistDialog({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [rulesText, setRulesText] = useState('')
  const [limit, setLimit] = useState('50')
  const [sortBy, setSortBy] = useState('addedAt')
  const [sortDir, setSortDir] = useState('desc')
  const [error, setError] = useState('')
  const nameRef = useRef(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const parseRules = (text) => {
    return text.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('─'))
      .map(l => {
        const parts = l.split(/\s+/)
        if (parts.length < 3) return null
        const [field, op, ...rest] = parts
        return { field, op, value: rest.join(' ') }
      })
      .filter(Boolean)
  }

  const handleSave = () => {
    if (!name.trim()) { setError('name required'); return }
    const rules = parseRules(rulesText)
    onSave({
      name: name.trim(),
      rules,
      limit: parseInt(limit) || 50,
      sortBy,
      sortDir,
    })
    onClose()
  }

  return (
    <div className="smart-dialog-overlay" onClick={onClose}>
      <div className="smart-dialog" onClick={e => e.stopPropagation()}>
        <div className="smart-dialog-header">
          <span className="smart-dialog-title">[★] NEW SMART PLAYLIST</span>
          <button className="smart-close" onClick={onClose}>✕</button>
        </div>

        <div className="smart-field">
          <span className="smart-label">NAME</span>
          <div className="smart-input-row">
            <span className="smart-prompt">›</span>
            <input
              ref={nameRef}
              className="smart-input"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Escape' && onClose()}
              placeholder="late night"
            />
          </div>
        </div>

        <div className="smart-field">
          <span className="smart-label">RULES</span>
          <textarea
            className="smart-textarea"
            value={rulesText}
            onChange={e => setRulesText(e.target.value)}
            placeholder={HINT}
            rows={6}
            spellCheck={false}
          />
        </div>

        <div className="smart-row">
          <div className="smart-field smart-inline">
            <span className="smart-label">LIMIT</span>
            <input
              className="smart-input smart-short"
              value={limit}
              onChange={e => setLimit(e.target.value)}
              type="number"
              min="1"
              max="500"
            />
          </div>
          <div className="smart-field smart-inline">
            <span className="smart-label">SORT BY</span>
            <select className="smart-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="addedAt">date added</option>
              <option value="duration">duration</option>
              <option value="bpm">bpm</option>
              <option value="playCount">play count</option>
              <option value="title">title</option>
              <option value="artist">artist</option>
            </select>
          </div>
          <div className="smart-field smart-inline">
            <span className="smart-label">DIR</span>
            <select className="smart-select" value={sortDir} onChange={e => setSortDir(e.target.value)}>
              <option value="desc">↓ desc</option>
              <option value="asc">↑ asc</option>
            </select>
          </div>
        </div>

        {error && <div className="smart-error">{error}</div>}

        <div className="smart-dialog-footer">
          <button className="smart-btn" onClick={onClose}>[ESC] cancel</button>
          <button className="smart-btn smart-btn-primary" onClick={handleSave}>[ENTER] create</button>
        </div>
      </div>
    </div>
  )
}
