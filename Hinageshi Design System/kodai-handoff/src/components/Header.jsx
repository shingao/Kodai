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
      <span className="reg-tick tl" />
      <div className="header-title">
        <span className="header-logo">
          <span className="header-kanji jp">古代</span>
          <span className="header-mark">KODAI</span>
        </span>
        <span className="header-version">v1.0 // BUILD 0xCA44</span>
        {newTrackFlash ? (
          <span className="header-meta scanning"><span className="dot" /> {newTrackFlash}</span>
        ) : scanning ? (
          <span className="header-meta scanning"><span className="dot" /> SCANNING…</span>
        ) : currentPlaylist ? (
          <span className="header-meta">
            · playlist: <span className="header-playlist">{currentPlaylist}</span>
            <button className="header-clear-pl" onClick={onClearPlaylist} style={{ WebkitAppRegion: 'no-drag' }}>✕</button>
          </span>
        ) : (
          <span className="header-meta">
            <span className="dot live" /> {trackCount} TRACKS · {fmtDuration(totalDuration).toUpperCase()} · LIVE
          </span>
        )}
      </div>
      <div className="header-controls" style={{ WebkitAppRegion: 'no-drag' }}>
        <button className="hbtn" onClick={onRescan} title="Rescan [S]">[S] RESCAN</button>
        <button className="hbtn" onClick={onFocus} title="Focus mode [F]">[F] FOCUS</button>
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
