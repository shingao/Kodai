import React, { useMemo } from 'react'
import './StatsView.css'

function fmtDur(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h) return `${h}h${m.toString().padStart(2, '0')}m`
  return `${m}m`
}

function sparkline(values, width = 24) {
  if (!values.length) return '░'.repeat(width)
  const max = Math.max(...values, 1)
  const chars = ' ▁▂▃▄▅▆▇█'
  return values.map(v => {
    const idx = Math.round((v / max) * (chars.length - 1))
    return chars[idx]
  }).join('')
}

function last30Days(playHistory) {
  const now = Date.now()
  const DAY = 86400000
  const days = Array(30).fill(0)
  for (const entry of playHistory) {
    const ago = Math.floor((now - entry.timestamp) / DAY)
    if (ago < 30) days[29 - ago]++
  }
  return days
}

export default function StatsView({ tracks, playHistory }) {
  const stats = useMemo(() => {
    const playMap = {}
    const artistMap = {}

    for (const entry of playHistory) {
      playMap[entry.trackId] = (playMap[entry.trackId] || 0) + 1
    }

    for (const [id, count] of Object.entries(playMap)) {
      const track = tracks.find(t => t.id === id)
      if (track) {
        artistMap[track.artist] = (artistMap[track.artist] || 0) + count
      }
    }

    const topTracks = Object.entries(playMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ track: tracks.find(t => t.id === id), count }))
      .filter(x => x.track)

    const topArtists = Object.entries(artistMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([artist, count]) => ({ artist, count }))

    const neverPlayed = tracks.filter(t => !playMap[t.id])

    const totalListened = playHistory.reduce((s, e) => {
      const t = tracks.find(tr => tr.id === e.trackId)
      return s + (t?.duration || 0)
    }, 0)

    const days30 = last30Days(playHistory)
    const totalPlays = playHistory.length

    return { topTracks, topArtists, neverPlayed, totalListened, days30, totalPlays }
  }, [tracks, playHistory])

  const maxTop = stats.topTracks[0]?.count || 1
  const maxArtist = stats.topArtists[0]?.count || 1

  return (
    <div className="stats-view">
      <div className="stats-section">
        <div className="stats-label">OVERVIEW</div>
        <div className="stats-row">
          <span className="stats-key">total tracks</span>
          <span className="stats-val">{tracks.length}</span>
        </div>
        <div className="stats-row">
          <span className="stats-key">total plays</span>
          <span className="stats-val">{stats.totalPlays}</span>
        </div>
        <div className="stats-row">
          <span className="stats-key">time listened</span>
          <span className="stats-val">{fmtDur(stats.totalListened)}</span>
        </div>
        <div className="stats-row">
          <span className="stats-key">never played</span>
          <span className="stats-val">{stats.neverPlayed.length}</span>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-label">LAST 30 DAYS</div>
        <div className="sparkline-wrap">
          <span className="sparkline">{sparkline(stats.days30, 30)}</span>
        </div>
        <div className="sparkline-axis">
          <span>30d ago</span>
          <span>today</span>
        </div>
      </div>

      {stats.topTracks.length > 0 && (
        <div className="stats-section">
          <div className="stats-label">TOP 10 TRACKS</div>
          {stats.topTracks.map(({ track, count }, i) => (
            <div key={track.id} className="stats-bar-row">
              <span className="stats-rank">{String(i + 1).padStart(2, '0')}</span>
              <div className="stats-bar-info">
                <span className="stats-bar-name">{track.title}</span>
                <span className="stats-bar-sub">{track.artist}</span>
              </div>
              <div className="stats-bar-wrap">
                <div
                  className="stats-bar-fill"
                  style={{ width: `${Math.round((count / maxTop) * 100)}%` }}
                />
              </div>
              <span className="stats-bar-count">×{count}</span>
            </div>
          ))}
        </div>
      )}

      {stats.topArtists.length > 0 && (
        <div className="stats-section">
          <div className="stats-label">TOP ARTISTS</div>
          {stats.topArtists.map(({ artist, count }, i) => (
            <div key={artist} className="stats-bar-row">
              <span className="stats-rank">{String(i + 1).padStart(2, '0')}</span>
              <span className="stats-bar-name" style={{ flex: 1 }}>{artist}</span>
              <div className="stats-bar-wrap" style={{ width: 80 }}>
                <div
                  className="stats-bar-fill"
                  style={{ width: `${Math.round((count / maxArtist) * 100)}%` }}
                />
              </div>
              <span className="stats-bar-count">×{count}</span>
            </div>
          ))}
        </div>
      )}

      {stats.neverPlayed.length > 0 && (
        <div className="stats-section">
          <div className="stats-label">NEVER PLAYED ({stats.neverPlayed.length})</div>
          <div className="never-played-list">
            {stats.neverPlayed.slice(0, 15).map(t => (
              <div key={t.id} className="never-played-item">
                <span className="np-dot">·</span>
                <span className="np-title">{t.title}</span>
                <span className="np-artist">{t.artist}</span>
              </div>
            ))}
            {stats.neverPlayed.length > 15 && (
              <div className="never-played-more">
                +{stats.neverPlayed.length - 15} more...
              </div>
            )}
          </div>
        </div>
      )}

      {stats.totalPlays === 0 && (
        <div className="stats-empty">
          no play history yet.<br />start listening to generate stats.
        </div>
      )}
    </div>
  )
}
