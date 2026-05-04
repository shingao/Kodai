import React from 'react'
import PlaylistPanel from './PlaylistPanel'
import CratePanel from './CratePanel'
import './Sidebar.css'

const VIEWS = [
  { id: 'library', label: 'LIBRARY' },
  { id: 'recent', label: 'RECENT' },
  { id: 'stats', label: 'STATS' },
  { id: 'log', label: 'LOG' },
  { id: 'changelog', label: 'CHANGELOG' },
  { id: 'keys', label: 'KEYS' },
]

export default function Sidebar({ style, activeView, setActiveView, currentPlaylist, onPlaylistSelect, onPlaylistPlay, tracks, onPlaylistsChange, crates, currentCrate, onCrateSelect, onCratesChange }) {
  return (
    <nav className="sidebar" style={style}>
      {VIEWS.map((v) => (
        <button
          key={v.id}
          className={`sidebar-item ${activeView === v.id ? 'active' : ''}`}
          onClick={() => setActiveView(v.id)}
        >
          {activeView === v.id ? '> ' : '  '}{v.label}
        </button>
      ))}
      <div className="sidebar-divider">──────</div>
      <PlaylistPanel
        tracks={tracks}
        currentPlaylist={currentPlaylist}
        onSelect={onPlaylistSelect}
        onPlay={onPlaylistPlay}
        onChanged={onPlaylistsChange}
      />
      <div className="sidebar-divider">──────</div>
      <CratePanel
        crates={crates || []}
        currentCrate={currentCrate}
        onSelect={onCrateSelect}
        onChanged={onCratesChange}
      />
    </nav>
  )
}
