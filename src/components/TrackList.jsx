import React, { useRef, useEffect } from 'react'
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

export default function TrackList({ tracks, currentTrack, isPlaying, onPlay, onAddToQueue }) {
  const listRef = useRef(null)
  const activeRef = useRef(null)

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [currentTrack?.id])

  if (!tracks.length) {
    return (
      <div className="tracklist-empty">
        <span>no results.</span>
      </div>
    )
  }

  return (
    <div className="tracklist" ref={listRef}>
      <div className="tracklist-header">
        <span className="col-num">#</span>
        <span className="col-title">TITLE</span>
        <span className="col-artist">ARTIST</span>
        <span className="col-album">ALBUM</span>
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
              onContextMenu={(e) => {
                e.preventDefault()
                onAddToQueue(track)
              }}
              title={`${track.artist} — ${track.title}\nRight-click: add to queue`}
            >
              <span className="col-num">
                {isActive
                  ? <span className="playing-icon">{isPlaying ? '▶' : '▮▮'}</span>
                  : <span className="track-num">{String(idx + 1).padStart(2, '0')}</span>
                }
              </span>
              <span className="col-title">
                {track.tags?.length > 0 && (
                  <span className="tags">{track.tags.map((t) => `[#${t}]`).join(' ')} </span>
                )}
                {truncate(track.title, 36)}
              </span>
              <span className="col-artist">{truncate(track.artist, 24)}</span>
              <span className="col-album">{truncate(track.album, 24)}</span>
              <span className="col-dur">{fmtDur(track.duration)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
