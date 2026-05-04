import React, { useState, useEffect } from 'react'
import { DEFAULT_KEYMAP } from '../store/useStore'
import './KeymapView.css'

const ACTIONS = [
  { key: 'playPause', label: 'Play / Pause' },
  { key: 'next', label: 'Next track' },
  { key: 'prev', label: 'Previous track' },
  { key: 'volumeUp', label: 'Volume up' },
  { key: 'volumeDown', label: 'Volume down' },
  { key: 'focusMode', label: 'Focus mode' },
  { key: 'queueAdd', label: 'Add to queue' },
]

function fmtKey(code) {
  if (!code) return '—'
  return code
    .replace('Shift+', 'Shift + ')
    .replace('ArrowRight', '→')
    .replace('ArrowLeft', '←')
    .replace('ArrowUp', '↑')
    .replace('ArrowDown', '↓')
    .replace('Space', 'SPACE')
    .replace('Key', '')
}

export default function KeymapView({ keymap, setKeymap }) {
  const [capturing, setCapturing] = useState(null)

  useEffect(() => {
    if (!capturing) return
    const handler = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const code = e.shiftKey ? `Shift+${e.code}` : e.code
      if (code === 'Escape') { setCapturing(null); return }
      setKeymap({ ...keymap, [capturing]: code })
      setCapturing(null)
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [capturing, keymap, setKeymap])

  const reset = () => {
    setKeymap({ ...DEFAULT_KEYMAP })
  }

  return (
    <div className="keymap-view">
      <div className="km-header">
        <span className="km-title">HOTKEY MAP</span>
        <button className="km-btn" onClick={reset} title="Reset to defaults">[reset]</button>
      </div>
      <div className="km-hint">click a binding to remap it</div>
      <div className="km-table">
        <div className="km-row km-head">
          <span className="km-col-action">ACTION</span>
          <span className="km-col-key">KEY</span>
          <span className="km-col-default">DEFAULT</span>
        </div>
        {ACTIONS.map(({ key, label }) => {
          const isCapturing = capturing === key
          return (
            <div
              key={key}
              className={`km-row ${isCapturing ? 'km-capturing' : ''}`}
              onClick={() => setCapturing(isCapturing ? null : key)}
            >
              <span className="km-col-action">{label}</span>
              <span className="km-col-key">
                {isCapturing ? '[ press key... ]' : fmtKey(keymap[key])}
              </span>
              <span className="km-col-default km-dim">{fmtKey(DEFAULT_KEYMAP[key])}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
