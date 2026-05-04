import React, { useRef, useState } from 'react'
import './SearchBar.css'

export default function SearchBar({ value, onChange, onSubmit, history }) {
  const inputRef = useRef(null)
  const [histIdx, setHistIdx] = useState(-1)
  const [showHints, setShowHints] = useState(false)

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(next)
      if (history[next]) onChange(history[next])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(histIdx - 1, -1)
      setHistIdx(next)
      onChange(next === -1 ? '' : history[next])
    } else if (e.key === 'Enter') {
      onSubmit(value)
      setHistIdx(-1)
      setShowHints(false)
    } else if (e.key === 'Escape') {
      onChange('')
      setHistIdx(-1)
      setShowHints(false)
      inputRef.current?.blur()
    }
  }

  const handleChange = (e) => {
    onChange(e.target.value)
    setHistIdx(-1)
  }

  return (
    <div className="searchbar">
      <span className="prompt">&gt;</span>
      <input
        ref={inputRef}
        className="search-input"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowHints(true)}
        onBlur={() => setTimeout(() => setShowHints(false), 150)}
        placeholder="search tracks, or: artist: album: added:today bpm:>120 dur:>3m tag:chill"
        spellCheck={false}
        autoComplete="off"
      />
      {value && (
        <button className="clear-btn" onMouseDown={() => { onChange(''); setHistIdx(-1) }}>✕</button>
      )}
      {showHints && history.length > 0 && !value && (
        <div className="search-history">
          {history.slice(0, 8).map((q, i) => (
            <div
              key={i}
              className="history-item"
              onMouseDown={() => { onChange(q); onSubmit(q); setShowHints(false) }}
            >
              <span className="hist-arrow">↑</span> {q}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
