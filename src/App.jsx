import React, { useEffect, useCallback, useRef } from 'react'
import { useStore } from './store/useStore'
import { usePlayer } from './hooks/usePlayer'
import { useSearch } from './hooks/useSearch'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import TrackList from './components/TrackList'
import Player from './components/Player'
import SearchBar from './components/SearchBar'
import FocusMode from './components/FocusMode'
import EmptyState from './components/EmptyState'
import './styles/layout.css'

export default function App() {
  const store = useStore()
  const {
    tracks, setTracks,
    currentTrack, setCurrentTrack,
    isPlaying, setIsPlaying,
    volume, setVolume,
    progress, setProgress,
    duration, setDuration,
    searchQuery, setSearchQuery,
    addToSearchHistory,
    scanning, setScanning,
    focusMode,
    scanDirs, setScanDirs,
    logPlay,
    queue, setQueue,
    shuffleOn, setShuffleOn,
    activeView, setActiveView,
  } = store

  const filteredTracks = useSearch(tracks, searchQuery)
  const filteredRef = useRef(filteredTracks)
  filteredRef.current = filteredTracks
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks

  // ── Initial scan ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const api = window.electronAPI
      if (!api) return

      let dirs = scanDirs
      if (!dirs.length) {
        dirs = await api.getDefaultDirs()
        setScanDirs(dirs)
      }
      setScanning(true)
      try {
        const result = await api.scanDirs(dirs)
        const sorted = result.sort((a, b) => b.addedAt - a.addedAt)
        setTracks(sorted)
      } finally {
        setScanning(false)
      }
    }
    init()
  }, []) // eslint-disable-line

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT') return

      if (e.code === 'Space') {
        e.preventDefault()
        setIsPlaying((p) => !p)
      }
      if (e.code === 'ArrowRight' && !e.shiftKey) playNext()
      if (e.code === 'ArrowLeft') playPrev()
      if (e.code === 'ArrowUp') {
        e.preventDefault()
        setVolume(Math.min(1, volume + 0.05))
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        setVolume(Math.max(0, volume - 0.05))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [volume, currentTrack, shuffleOn]) // eslint-disable-line

  // ── Playback navigation ───────────────────────────────────────────────────
  const playNext = useCallback(() => {
    const list = filteredRef.current
    if (!list.length) return

    if (queue.length) {
      const [next, ...rest] = queue
      setQueue(rest)
      setCurrentTrack(next)
      logPlay(next)
      return
    }

    if (!currentTrack) {
      setCurrentTrack(list[0])
      logPlay(list[0])
      return
    }

    if (shuffleOn) {
      const others = list.filter((t) => t.id !== currentTrack.id)
      if (!others.length) return
      // Shuffle: avoid same artist consecutively if possible
      const sameArtist = others.filter((t) => t.artist === currentTrack.artist)
      const pool = others.length > sameArtist.length ? others.filter((t) => t.artist !== currentTrack.artist) : others
      const next = pool[Math.floor(Math.random() * pool.length)]
      setCurrentTrack(next)
      logPlay(next)
    } else {
      const idx = list.findIndex((t) => t.id === currentTrack.id)
      const next = list[(idx + 1) % list.length]
      setCurrentTrack(next)
      logPlay(next)
    }
  }, [currentTrack, queue, shuffleOn, setCurrentTrack, setQueue, logPlay])

  const playPrev = useCallback(() => {
    const list = filteredRef.current
    if (!list.length || !currentTrack) return
    const idx = list.findIndex((t) => t.id === currentTrack.id)
    const prev = list[(idx - 1 + list.length) % list.length]
    setCurrentTrack(prev)
    logPlay(prev)
  }, [currentTrack, setCurrentTrack, logPlay])

  const playTrack = useCallback((track) => {
    setCurrentTrack(track)
    logPlay(track)
    setIsPlaying(true)
  }, [setCurrentTrack, logPlay, setIsPlaying])

  const { seek } = usePlayer({
    currentTrack,
    isPlaying,
    volume,
    setIsPlaying,
    setProgress,
    setDuration,
    onTrackEnd: playNext,
  })

  // ── Rescan ────────────────────────────────────────────────────────────────
  const rescan = useCallback(async (dirs) => {
    const api = window.electronAPI
    if (!api) return
    const dirsToUse = dirs || scanDirs
    setScanning(true)
    try {
      const result = await api.scanDirs(dirsToUse)
      setTracks(result.sort((a, b) => b.addedAt - a.addedAt))
    } finally {
      setScanning(false)
    }
  }, [scanDirs, setScanDirs, setScanning, setTracks])

  const handleSearch = useCallback((q) => {
    setSearchQuery(q)
  }, [setSearchQuery])

  const handleSearchSubmit = useCallback((q) => {
    if (q.trim()) addToSearchHistory(q)
  }, [addToSearchHistory])

  if (focusMode) {
    return (
      <FocusMode
        track={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        onPlayPause={() => setIsPlaying((p) => !p)}
        onExit={() => store.setFocusMode(false)}
      />
    )
  }

  const totalDuration = tracks.reduce((s, t) => s + (t.duration || 0), 0)

  return (
    <div className="app">
      <Header
        trackCount={tracks.length}
        totalDuration={totalDuration}
        scanning={scanning}
        onFocus={() => store.setFocusMode(true)}
        onRescan={() => rescan()}
      />
      <div className="search-row">
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          onSubmit={handleSearchSubmit}
          history={store.searchHistory}
        />
      </div>
      <div className="main-area">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
        />
        {tracks.length === 0 && !scanning ? (
          <EmptyState onScan={() => rescan()} />
        ) : (
          <TrackList
            tracks={filteredTracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlay={playTrack}
            onAddToQueue={(t) => setQueue((q) => [...q, t])}
          />
        )}
      </div>
      <Player
        track={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        volume={volume}
        shuffleOn={shuffleOn}
        onPlayPause={() => setIsPlaying((p) => !p)}
        onNext={playNext}
        onPrev={playPrev}
        onSeek={seek}
        onVolume={setVolume}
        onShuffle={() => setShuffleOn(!shuffleOn)}
      />
    </div>
  )
}
