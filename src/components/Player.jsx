import React from 'react'
import Waveform from './Waveform'
import './Player.css'

function fmtTime(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function volBars(vol) {
  const filled = Math.round(vol * 8)
  return '█'.repeat(filled) + '░'.repeat(8 - filled)
}

export default function Player({ track, isPlaying, progress, duration, volume, shuffleOn, onPlayPause, onNext, onPrev, onSeek, onVolume, onShuffle }) {
  return (
    <footer className="player">
      <div className="player-info">
        {track ? (
          <>
            <div className="now-playing-label">NOW PLAYING</div>
            <div className="now-playing-track">
              <span className="np-artist">{track.artist?.toUpperCase()}</span>
              <span className="np-sep"> · </span>
              <span className="np-album">{track.album?.toUpperCase()}</span>
            </div>
            <div className="now-playing-title">{track.title}</div>
          </>
        ) : (
          <div className="now-playing-label dim">no track selected</div>
        )}
      </div>

      <div className="player-center">
        <div className="waveform-row">
          <span className="time-label">{fmtTime(progress)}</span>
          <Waveform progress={progress} duration={duration} onSeek={onSeek} />
          <span className="time-label">{fmtTime(duration)}</span>
        </div>
        <div className="controls-row">
          <button className="ctrl-btn" onClick={onPrev} title="Previous [←]">|◀◀</button>
          <button className="ctrl-btn play-btn" onClick={onPlayPause} title="Play/Pause [SPACE]">
            {isPlaying ? '[ ▮▮ ]' : '[ ▶  ]'}
          </button>
          <button className="ctrl-btn" onClick={onNext} title="Next [→]">▶▶|</button>
          <div className="vol-control">
            <span className="vol-label">VOL</span>
            <span className="vol-bars">{volBars(volume)}</span>
            <div className="vol-btns">
              <button onClick={() => onVolume(Math.min(1, volume + 0.1))}>+</button>
              <button onClick={() => onVolume(Math.max(0, volume - 0.1))}>-</button>
            </div>
          </div>
          <button
            className={`ctrl-btn shuffle-btn ${shuffleOn ? 'on' : ''}`}
            onClick={onShuffle}
            title="Toggle shuffle"
          >
            {shuffleOn ? 'shuffle:ON' : 'shuffle:off'}
          </button>
        </div>
      </div>
    </footer>
  )
}
