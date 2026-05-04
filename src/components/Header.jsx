import React from 'react'
import './Header.css'

function fmtDuration(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h) return `${h}h${m.toString().padStart(2, '0')}m`
  return `${m}m`
}

export default function Header({ trackCount, totalDuration, scanning, newTrackFlash, onFocus, onRescan, currentPlaylist, onClearPlaylist }) {
  const api = window.electronAPI

  return (
    <header className="header" style={{ WebkitAppRegion: 'drag' }}>
      <div className="header-title">
        <span className="header-logo">SONIC_OS</span>
        <span className="header-version">v1.0</span>
        {newTrackFlash ? (
          <span className="header-meta scanning">· {newTrackFlash}</span>
        ) : scanning ? (
          <span className="header-meta scanning">· scanning...</span>
        ) : currentPlaylist ? (
          <span className="header-meta">
            · playlist: <span className="header-playlist">{currentPlaylist}</span>
            <button className="header-clear-pl" onClick={onClearPlaylist} style={{ WebkitAppRegion: 'no-drag' }}>✕</button>
          </span>
        ) : (
          <span className="header-meta">
            · {trackCount} tracks · {fmtDuration(totalDuration)}
          </span>
        )}
      </div>
      <div className="header-controls" style={{ WebkitAppRegion: 'no-drag' }}>
        <button className="hbtn" onClick={onRescan} title="Rescan [S]">[S]</button>
        <button className="hbtn" onClick={onFocus} title="Focus mode [F]">[F]</button>
        {api && (
          <>
            <button className="hbtn win-btn" onClick={() => api.windowMinimize()}>─</button>
            <button className="hbtn win-btn" onClick={() => api.windowMaximize()}>□</button>
            <button className="hbtn win-btn close-btn" onClick={() => api.windowClose()}>×</button>
          </>
        )}
      </div>
    </header>
  )
}
