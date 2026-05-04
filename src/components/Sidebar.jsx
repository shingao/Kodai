import React from 'react'
import PlaylistPanel from './PlaylistPanel'
import './Sidebar.css'

const VIEWS = [
  { id: 'library', label: 'LIBRARY' },
  { id: 'recent', label: 'RECENT' },
  { id: 'stats', label: 'STATS' },
]

export default function Sidebar({ style, activeView, setActiveView, currentPlaylist, onPlaylistSelect, onPlaylistPlay, tracks, onPlaylistsChange }) {
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
    </nav>
  )
}
