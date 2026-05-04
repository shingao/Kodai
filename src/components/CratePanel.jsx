import React, { useState, useEffect, useRef } from 'react'
import './CratePanel.css'

function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'CR-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function CratePanel({ currentCrate, onSelect, onChanged, crates }) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const inputRef = useRef(null)
  const api = window.electronAPI

  useEffect(() => { if (creating || renaming) inputRef.current?.focus() }, [creating, renaming])

  const create = async () => {
    if (!newName.trim() || !api) return
    const code = genCode()
    await api.crateCreate({ name: newName.trim(), code })
    setNewName(''); setCreating(false)
    onChanged?.()
  }

  const rename = async (code) => {
    if (!renameVal.trim() || !api) return
    await api.crateRename({ code, newName: renameVal.trim() })
    setRenaming(null); onChanged?.()
  }

  const del = async (cr) => {
    if (!api || !window.confirm(`Delete crate "${cr.name}"?`)) return
    await api.crateDelete(cr.code)
    if (currentCrate === cr.name) onSelect(null)
    onChanged?.()
  }

  const exportCr = async (cr) => {
    if (!api) return
    await api.crateExport({ name: cr.name, paths: cr.paths })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = async (e, cr) => {
    e.preventDefault()
    const data = e.dataTransfer.getData('application/x-track')
    if (!data || !api) return
    const track = JSON.parse(data)
    const list = await api.crateList()
    const found = list.find(c => c.code === cr.code)
    if (!found || found.paths.includes(track.path)) return
    await api.crateSave({ name: cr.name, code: cr.code, paths: [...found.paths, track.path] })
    onChanged?.()
  }

  return (
    <div className="crate-panel">
      <div className="cr-header">
        <span className="cr-title">CRATES</span>
        <button className="cr-btn" onClick={() => setCreating(true)} title="New crate">+</button>
      </div>

      {creating && (
        <div className="cr-input-row">
          <span className="cr-prompt">›</span>
          <input
            ref={inputRef}
            className="cr-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') create()
              if (e.key === 'Escape') { setCreating(false); setNewName('') }
            }}
            placeholder="crate name..."
          />
        </div>
      )}

      <div className="cr-list">
        {crates.length === 0 && !creating && (
          <div className="cr-empty">no crates yet</div>
        )}
        {crates.map(cr => (
          <div
            key={cr.code}
            className={`cr-item ${currentCrate === cr.name ? 'active' : ''}`}
            onClick={() => onSelect(cr.name, cr.paths)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, cr)}
          >
            {renaming === cr.code ? (
              <input
                ref={inputRef}
                className="cr-input"
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') rename(cr.code)
                  if (e.key === 'Escape') setRenaming(null)
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="cr-indicator">{currentCrate === cr.name ? '▶ ' : '  '}</span>
                <span className="cr-code">[{cr.code}]</span>
                <span className="cr-name">{cr.name}</span>
                <span className="cr-count">{cr.paths?.length ?? 0}</span>
                <div className="cr-item-actions" onClick={e => e.stopPropagation()}>
                  <button title="Export" onClick={() => exportCr(cr)}>↑</button>
                  <button title="Rename" onClick={() => { setRenaming(cr.code); setRenameVal(cr.name) }}>✎</button>
                  <button title="Delete" onClick={() => del(cr)}>✕</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
