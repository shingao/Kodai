import React, { useRef } from 'react'
import './QueuePanel.css'

function fmtDur(secs) {
  if (!secs) return '--:--'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function QueuePanel({ style, queue, onRemove, onClear, onReorder, visible, onToggle }) {
  const dragIdx = useRef(null)

  const handleDragStart = (e, idx) => {
    dragIdx.current = idx
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e, targetIdx) => {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === targetIdx) return
    const next = [...queue]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(targetIdx, 0, moved)
    onReorder(next)
    dragIdx.current = null
  }

  return (
    <div className={`queue-panel ${visible ? 'open' : 'closed'}`} style={visible ? style : undefined}>
      <div className="queue-header">
        <span className="queue-title">QUEUE</span>
        <span className="queue-count">{queue.length > 0 ? `${queue.length} tracks` : 'empty'}</span>
        <div className="queue-hdr-actions">
          {queue.length > 0 && (
            <button className="q-btn" onClick={onClear} title="Clear queue">✕</button>
          )}
          <button className="q-btn q-toggle" onClick={onToggle} title="Toggle queue panel">
            {visible ? '›' : '‹'}
          </button>
        </div>
      </div>

      {visible && (
        <div className="queue-body">
          {queue.length === 0 ? (
            <div className="queue-empty">
              <div>queue is empty</div>
              <div className="queue-hint">right-click a track to add</div>
              <div className="queue-hint">or [SHIFT+→] on selection</div>
            </div>
          ) : (
            queue.map((track, idx) => (
              <div
                key={`${track.id}-${idx}`}
                className="queue-item"
                draggable
                onDragStart={e => handleDragStart(e, idx)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, idx)}
              >
                <span className="q-num">{String(idx + 1).padStart(2, '0')}</span>
                <div className="q-info">
                  <div className="q-title">{track.title}</div>
                  <div className="q-artist">{track.artist}</div>
                </div>
                <span className="q-dur">{fmtDur(track.duration)}</span>
                <button className="q-remove" onClick={() => onRemove(idx)} title="Remove">✕</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
