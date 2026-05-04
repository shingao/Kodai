import React, { useEffect, useState, useCallback } from 'react'
import './SessionLog.css'

export default function SessionLog({ api }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!api) return
    setLoading(true)
    try {
      const text = await api.logRead()
      setContent(text || '')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { load() }, [load])

  const handleExport = async () => {
    await api?.logExport()
  }

  const handleClear = async () => {
    if (!window.confirm('Clear session log?')) return
    await api?.logClear()
    setContent('')
  }

  const lines = content ? content.split('\n').filter(Boolean) : []

  return (
    <div className="session-log">
      <div className="log-header">
        <span className="log-title">SESSION LOG</span>
        <div className="log-actions">
          <button className="log-btn" onClick={load} title="Refresh">↺</button>
          <button className="log-btn" onClick={handleExport} title="Export">↑</button>
          <button className="log-btn" onClick={handleClear} title="Clear">✕</button>
        </div>
      </div>
      <div className="log-body">
        {loading ? (
          <div className="log-empty">loading...</div>
        ) : lines.length === 0 ? (
          <div className="log-empty">no entries yet. play some tracks.</div>
        ) : (
          <div className="log-lines">
            {lines.map((line, i) => (
              <div
                key={i}
                className={`log-line ${line.startsWith('---') ? 'log-sep' : ''}`}
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
