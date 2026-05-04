import React, { useState, useEffect, useRef } from 'react'
import SmartPlaylistDialog from './SmartPlaylistDialog'
import './PlaylistPanel.css'

export default function PlaylistPanel({ tracks, currentPlaylist, onSelect, onPlay, onChanged }) {
  const [playlists, setPlaylists] = useState([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const [smartDialog, setSmartDialog] = useState(false)
  const inputRef = useRef(null)
  const api = window.electronAPI

  const load = async () => {
    if (!api) return
    const list = await api.playlistList()
    setPlaylists(list)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (creating || renaming) inputRef.current?.focus() }, [creating, renaming])

  const create = async () => {
    if (!newName.trim() || !api) return
    await api.playlistCreate(newName.trim())
    setNewName(''); setCreating(false)
    load(); onChanged?.()
  }

  const createSmart = async (args) => {
    if (!api) return
    await api.smartPlaylistCreate(args)
    load(); onChanged?.()
  }

  const rename = async (oldName) => {
    if (!renameVal.trim() || !api) return
    await api.playlistRename({ oldName, newName: renameVal.trim() })
    setRenaming(null); load(); onChanged?.()
  }

  const del = async (pl) => {
    if (!api || !window.confirm(`Delete "${pl.name}"?`)) return
    if (pl.smart) await api.smartPlaylistDelete(pl.name)
    else await api.playlistDelete(pl.name)
    if (currentPlaylist === pl.name) onSelect(null)
    load(); onChanged?.()
  }

  const exportPl = async (pl) => {
    if (!api || pl.smart) return
    await api.playlistExport({ name: pl.name, paths: pl.paths })
  }

  const importPl = async () => {
    if (!api) return
    const result = await api.playlistImport()
    if (!result) return
    await api.playlistCreate(result.name)
    await api.playlistSave(result)
    load(); onChanged?.()
  }

  const handleSelect = async (pl) => {
    if (pl.smart && api) {
      // re-evaluate rules on click
      const resolved = await api.smartPlaylistEval({
        rules: pl.rules,
        limit: pl.limit,
        sortBy: pl.sortBy,
        sortDir: pl.sortDir,
        tracks,
      })
      onSelect(pl.name, resolved.map(t => t.path))
    } else {
      onSelect(pl.name, pl.paths)
    }
  }

  const handlePlay = async (pl) => {
    if (pl.smart && api) {
      const resolved = await api.smartPlaylistEval({
        rules: pl.rules, limit: pl.limit, sortBy: pl.sortBy, sortDir: pl.sortDir, tracks,
      })
      onPlay({ ...pl, paths: resolved.map(t => t.path) })
    } else {
      onPlay(pl)
    }
  }

  return (
    <div className="playlist-panel">
      <div className="pl-header">
        <span className="pl-title">PLAYLISTS</span>
        <div className="pl-actions">
          <button className="pl-btn" onClick={() => setCreating(true)} title="New playlist">+</button>
          <button className="pl-btn" onClick={() => setSmartDialog(true)} title="New smart playlist">[★]</button>
          <button className="pl-btn" onClick={importPl} title="Import .m3u">↓</button>
        </div>
      </div>

      {smartDialog && (
        <SmartPlaylistDialog
          onSave={createSmart}
          onClose={() => setSmartDialog(false)}
        />
      )}

      {creating && (
        <div className="pl-input-row">
          <span className="pl-prompt">›</span>
          <input
            ref={inputRef}
            className="pl-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') create()
              if (e.key === 'Escape') { setCreating(false); setNewName('') }
            }}
            placeholder="playlist name..."
          />
        </div>
      )}

      <div className="pl-list">
        {playlists.length === 0 && !creating && (
          <div className="pl-empty">no playlists yet</div>
        )}
        {playlists.map(pl => (
          <div
            key={pl.name}
            className={`pl-item ${currentPlaylist === pl.name ? 'active' : ''}`}
            onClick={() => handleSelect(pl)}
          >
            {renaming === pl.name ? (
              <input
                ref={inputRef}
                className="pl-input"
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') rename(pl.name)
                  if (e.key === 'Escape') setRenaming(null)
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="pl-indicator">{currentPlaylist === pl.name ? '▶ ' : '  '}</span>
                {pl.smart && <span className="pl-smart-icon">★ </span>}
                <span className="pl-name">{pl.name}</span>
                {!pl.smart && <span className="pl-count">{pl.paths.length}</span>}
                <div className="pl-item-actions" onClick={e => e.stopPropagation()}>
                  <button title="Play" onClick={() => handlePlay(pl)}>▶</button>
                  {!pl.smart && <button title="Export" onClick={() => exportPl(pl)}>↑</button>}
                  {!pl.smart && <button title="Rename" onClick={() => { setRenaming(pl.name); setRenameVal(pl.name) }}>✎</button>}
                  <button title="Delete" onClick={() => del(pl)}>✕</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
