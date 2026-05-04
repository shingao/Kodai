import React, { useRef, useEffect, useState } from 'react'
import TagEditor from './TagEditor'
import './TrackList.css'

function fmtDur(secs) {
  if (!secs) return '--:--'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function truncate(str, max) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

export default function TrackList({ tracks, currentTrack, isPlaying, onPlay, onAddToQueue, onTagSave, playlists, onAddToPlaylist, crates, onAddToCrate, onBpmDetect, bpmDetecting }) {
  const activeRef = useRef(null)
  const [editingTag, setEditingTag] = useState(null)
  const [ctxMenu, setCtxMenu] = useState(null)

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [currentTrack?.id])

  useEffect(() => {
    const close = () => setCtxMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const handleContext = (e, track) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY, track })
  }

  const handleDragStart = (e, track) => {
    e.dataTransfer.setData('application/x-track', JSON.stringify({ id: track.id, path: track.path, title: track.title, artist: track.artist }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const fmtBpm = (track) => {
    if (bpmDetecting?.[track.id]) return '[...]'
    if (track.bpm) return Math.round(track.bpm)
    return '[~]'
  }

  if (!tracks.length) {
    return (
      <div className="tracklist-empty">
        <span>no results.</span>
      </div>
    )
  }

  return (
    <div className="tracklist">
      <div className="tracklist-header">
        <span className="col-num">#</span>
        <span className="col-title">TITLE</span>
        <span className="col-artist">ARTIST</span>
        <span className="col-album">ALBUM</span>
        <span className="col-bpm">BPM</span>
        <span className="col-dur">DUR</span>
      </div>
      <div className="tracklist-body">
        {tracks.map((track, idx) => {
          const isActive = currentTrack?.id === track.id
          return (
            <div
              key={track.id}
              ref={isActive ? activeRef : null}
              className={`track-row ${isActive ? 'active' : ''}`}
              onDoubleClick={() => onPlay(track)}
              onContextMenu={e => handleContext(e, track)}
              draggable
              onDragStart={e => handleDragStart(e, track)}
              title={`${track.artist} — ${track.title}\nRight-click for options`}
            >
              <span className="col-num">
                {isActive
                  ? <span className="playing-icon">{isPlaying ? '▶' : '▮▮'}</span>
                  : <span className="track-num">{String(idx + 1).padStart(2, '0')}</span>
                }
              </span>
              <span className="col-title">
                {editingTag === track.id ? (
                  <TagEditor
                    track={track}
                    onSave={onTagSave}
                    onClose={() => setEditingTag(null)}
                  />
                ) : (
                  <>
                    {track.tags?.length > 0 && (
                      <span
                        className="tags"
                        onClick={e => { e.stopPropagation(); setEditingTag(track.id) }}
                        title="Click to edit tags"
                      >
                        {track.tags.map(t => `[#${t}]`).join(' ')}{' '}
                      </span>
                    )}
                    {truncate(track.title, 36)}
                  </>
                )}
              </span>
              <span className="col-artist">{truncate(track.artist, 24)}</span>
              <span className="col-album">{truncate(track.album, 24)}</span>
              <span
                className={`col-bpm ${!track.bpm && !bpmDetecting?.[track.id] ? 'col-bpm-detect' : ''}`}
                onClick={e => {
                  if (!track.bpm && !bpmDetecting?.[track.id]) {
                    e.stopPropagation()
                    onBpmDetect?.(track)
                  }
                }}
                title={track.bpm ? `BPM: ${Math.round(track.bpm)}` : 'Click to detect BPM'}
              >
                {fmtBpm(track)}
              </span>
              <span className="col-dur">{fmtDur(track.duration)}</span>
            </div>
          )
        })}
      </div>

      {ctxMenu && (
        <div
          className="ctx-menu"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className="ctx-item" onClick={() => { onPlay(ctxMenu.track); setCtxMenu(null) }}>
            ▶ play now
          </div>
          <div className="ctx-item" onClick={() => { onAddToQueue(ctxMenu.track); setCtxMenu(null) }}>
            + add to queue
          </div>
          <div className="ctx-divider" />
          <div className="ctx-item" onClick={() => { setEditingTag(ctxMenu.track.id); setCtxMenu(null) }}>
            # edit tags
          </div>
          <div className="ctx-item" onClick={() => { onBpmDetect?.(ctxMenu.track); setCtxMenu(null) }}>
            ~ detect BPM
          </div>
          {playlists?.length > 0 && (
            <>
              <div className="ctx-divider" />
              <div className="ctx-sub-label">add to playlist</div>
              {playlists.filter(pl => !pl.smart).map(pl => (
                <div
                  key={pl.name}
                  className="ctx-item ctx-indent"
                  onClick={() => { onAddToPlaylist(ctxMenu.track, pl.name); setCtxMenu(null) }}
                >
                  › {pl.name}
                </div>
              ))}
            </>
          )}
          {crates?.length > 0 && (
            <>
              <div className="ctx-divider" />
              <div className="ctx-sub-label">add to crate</div>
              {crates.map(cr => (
                <div
                  key={cr.code}
                  className="ctx-item ctx-indent"
                  onClick={() => { onAddToCrate?.(ctxMenu.track, cr.name); setCtxMenu(null) }}
                >
                  › [{cr.code}] {cr.name}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
