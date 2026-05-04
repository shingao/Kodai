import React, { useEffect, useState, useCallback } from 'react'
import './ChangelogView.css'

export default function ChangelogView({ api }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!api) return
    setLoading(true)
    try {
      const text = await api.changelogRead()
      setContent(text || '')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { load() }, [load])

  const handleClear = async () => {
    if (!window.confirm('Clear changelog?')) return
    await api?.changelogClear()
    setContent('')
  }

  const lines = content ? content.split('\n').filter(Boolean) : []

  return (
    <div className="changelog-view">
      <div className="cl-header">
        <span className="cl-title">CHANGELOG</span>
        <div className="cl-actions">
          <button className="cl-btn" onClick={load} title="Refresh">↺</button>
          <button className="cl-btn" onClick={handleClear} title="Clear">✕</button>
        </div>
      </div>
      <div className="cl-body">
        {loading ? (
          <div className="cl-empty">loading...</div>
        ) : lines.length === 0 ? (
          <div className="cl-empty">no file changes detected yet.</div>
        ) : (
          <div className="cl-lines">
            {lines.map((line, i) => (
              <div
                key={i}
                className={`cl-line ${line.startsWith('+') ? 'cl-added' : line.startsWith('-') ? 'cl-removed' : ''}`}
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
