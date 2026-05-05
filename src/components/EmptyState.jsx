import React from 'react'
import './EmptyState.css'

export default function EmptyState({ onScan }) {
  const addDir = async () => {
    const api = window.electronAPI
    if (!api) return
    const dir = await api.pickDirectory()
    if (dir) onScan([dir])
  }

  return (
    <div className="empty-state">
      <pre className="empty-art">{`
 ╔═══════════════════════╗
 ║   N E I R O _ O S    ║
 ║   ─────────────────   ║
 ║   no tracks found.    ║
 ╚═══════════════════════╝`}
      </pre>
      <div className="empty-msg">
        drag a folder here or press <kbd>[S]</kbd> to rescan default paths
      </div>
      <div className="empty-actions">
        <button className="empty-btn" onClick={onScan}>
          [S] scan default folders
        </button>
        <button className="empty-btn" onClick={addDir}>
          [D] pick a directory
        </button>
      </div>
    </div>
  )
}
