import React, { useEffect } from 'react'
import './FocusMode.css'

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function progressBar(prog, dur, width = 20) {
  if (!dur) return '░'.repeat(width)
  const filled = Math.round((prog / dur) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

export default function FocusMode({ track, isPlaying, progress, duration, onPlayPause, onExit }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'f' || e.key === 'F') onExit()
      if (e.code === 'Space') { e.preventDefault(); onPlayPause() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onExit, onPlayPause])

  return (
    <div className="focus-bar" style={{ WebkitAppRegion: 'drag' }}>
      <button
        className="focus-play"
        onClick={onPlayPause}
        style={{ WebkitAppRegion: 'no-drag' }}
        title="Play/Pause [SPACE]"
      >
        {isPlaying ? '▮▮' : '▶'}
      </button>
      <span className="focus-info">
        {track ? `${track.artist} — ${track.title}` : 'no track'}
      </span>
      <span className="focus-progress">{progressBar(progress, duration)}</span>
      <span className="focus-time">{fmtTime(progress)}/{fmtTime(duration)}</span>
      <button
        className="focus-exit"
        onClick={onExit}
        style={{ WebkitAppRegion: 'no-drag' }}
        title="Exit focus [F]"
      >
        ↗
      </button>
    </div>
  )
}
