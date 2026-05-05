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
      <span className="sidebar-vlabel">SECTOR · NAV-01</span>
      <div className="sidebar-rule">VIEWS</div>
      {VIEWS.map((v) => (
        <button
          key={v.id}
          className={`sidebar-item ${activeView === v.id ? 'active' : ''}`}
          onClick={() => setActiveView(v.id)}
        >
          <span className="sb-arr">{activeView === v.id ? '▸' : ' '}</span>
          {v.label}
        </button>
      ))}
      <div className="sidebar-rule">PLAYLISTS</div>
      <PlaylistPanel
        tracks={tracks}
        currentPlaylist={currentPlaylist}
        onSelect={onPlaylistSelect}
        onPlay={onPlaylistPlay}
        onChanged={onPlaylistsChange}
      />
      <div className="sidebar-rule">CRATES</div>
      <CratePanel
        crates={crates || []}
        currentCrate={currentCrate}
        onSelect={onCrateSelect}
        onChanged={onCratesChange}
      />
    </nav>
  )
}
