import React, { useEffect, useCallback, useRef, useState } from 'react'
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
import QueuePanel from './components/QueuePanel'
import StatsView from './components/StatsView'
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
    playHistory,
  } = store

  const [currentPlaylist, setCurrentPlaylist] = useState(null)
  const [playlistPaths, setPlaylistPaths] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [queueVisible, setQueueVisible] = useState(true)

  const filteredTracks = useSearch(tracks, searchQuery)
  const filteredRef = useRef(filteredTracks)
  filteredRef.current = filteredTracks
  const api = window.electronAPI

  // ── playlist tracks (resolved from paths) ─────────────────────────────────
  const playlistTracks = useRef([])
  playlistTracks.current = playlistPaths.length
    ? tracks.filter(t => playlistPaths.includes(t.path))
    : []

  const displayTracks = currentPlaylist
    ? playlistTracks.current
    : activeView === 'recent'
      ? [...filteredTracks].sort((a, b) => b.addedAt - a.addedAt).slice(0, 50)
      : filteredTracks

  // ── Initial scan ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!api) return
      let dirs = scanDirs
      if (!dirs.length) {
        dirs = await api.getDefaultDirs()
        setScanDirs(dirs)
      }
      setScanning(true)
      try {
        const result = await api.scanDirs(dirs)
        setTracks(result.sort((a, b) => b.addedAt - a.addedAt))
      } finally {
        setScanning(false)
      }
      // load playlists
      loadPlaylists()
    }
    init()
  }, []) // eslint-disable-line

  const loadPlaylists = useCallback(async () => {
    if (!api) return
    const list = await api.playlistList()
    setPlaylists(list)
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT') return

      if (e.code === 'Space') { e.preventDefault(); setIsPlaying(p => !p) }
      if (e.code === 'ArrowRight' && !e.shiftKey) playNext()
      if (e.code === 'ArrowLeft') playPrev()
      if (e.code === 'ArrowUp') { e.preventDefault(); setVolume(Math.min(1, volume + 0.05)) }
      if (e.code === 'ArrowDown') { e.preventDefault(); setVolume(Math.max(0, volume - 0.05)) }
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey) store.setFocusMode(true)
      if (e.code === 'ArrowRight' && e.shiftKey) {
        // SHIFT+→: add selected track to queue (add currently highlighted / playing)
        if (currentTrack) setQueue(q => [...q, currentTrack])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [volume, currentTrack, shuffleOn]) // eslint-disable-line

  // ── Playback navigation ───────────────────────────────────────────────────
  const activeList = useRef(displayTracks)
  activeList.current = displayTracks

  const playNext = useCallback(() => {
    const list = activeList.current
    if (!list.length) return

    if (queue.length) {
      const [next, ...rest] = queue
      setQueue(rest)
      setCurrentTrack(next)
      logPlay(next)
      return
    }
    if (!currentTrack) { setCurrentTrack(list[0]); logPlay(list[0]); return }

    if (shuffleOn) {
      const others = list.filter(t => t.id !== currentTrack.id)
      if (!others.length) return
      const diff = others.filter(t => t.artist !== currentTrack.artist)
      const pool = diff.length ? diff : others
      const next = pool[Math.floor(Math.random() * pool.length)]
      setCurrentTrack(next); logPlay(next)
    } else {
      const idx = list.findIndex(t => t.id === currentTrack.id)
      const next = list[(idx + 1) % list.length]
      setCurrentTrack(next); logPlay(next)
    }
  }, [currentTrack, queue, shuffleOn, setCurrentTrack, setQueue, logPlay])

  const playPrev = useCallback(() => {
    const list = activeList.current
    if (!list.length || !currentTrack) return
    const idx = list.findIndex(t => t.id === currentTrack.id)
    const prev = list[(idx - 1 + list.length) % list.length]
    setCurrentTrack(prev); logPlay(prev)
  }, [currentTrack, setCurrentTrack, logPlay])

  const playTrack = useCallback((track) => {
    setCurrentTrack(track); logPlay(track); setIsPlaying(true)
  }, [setCurrentTrack, logPlay, setIsPlaying])

  const { seek } = usePlayer({
    currentTrack, isPlaying, volume,
    setIsPlaying, setProgress, setDuration,
    onTrackEnd: playNext,
  })

  // ── Rescan ────────────────────────────────────────────────────────────────
  const rescan = useCallback(async (dirs) => {
    if (!api) return
    const d = dirs || scanDirs
    setScanning(true)
    try {
      const result = await api.scanDirs(d)
      setTracks(result.sort((a, b) => b.addedAt - a.addedAt))
    } finally {
      setScanning(false)
    }
  }, [scanDirs, setScanning, setTracks])

  // ── Playlists ─────────────────────────────────────────────────────────────
  const handlePlaylistSelect = useCallback((name, paths) => {
    setCurrentPlaylist(name)
    setPlaylistPaths(paths || [])
    setActiveView('library')
    setSearchQuery('')
  }, [setActiveView, setSearchQuery])

  const handlePlaylistPlay = useCallback((pl) => {
    const resolved = tracks.filter(t => pl.paths.includes(t.path))
    if (!resolved.length) return
    setCurrentPlaylist(pl.name)
    setPlaylistPaths(pl.paths)
    setCurrentTrack(resolved[0])
    logPlay(resolved[0])
    setIsPlaying(true)
  }, [tracks, setCurrentTrack, logPlay, setIsPlaying])

  const handleAddToPlaylist = useCallback(async (track, playlistName) => {
    if (!api) return
    const list = await api.playlistList()
    const pl = list.find(p => p.name === playlistName)
    if (!pl) return
    if (!pl.paths.includes(track.path)) {
      await api.playlistSave({ name: playlistName, paths: [...pl.paths, track.path] })
      loadPlaylists()
      if (currentPlaylist === playlistName) {
        setPlaylistPaths(prev => [...prev, track.path])
      }
    }
  }, [api, currentPlaylist, loadPlaylists])

  // ── Tags ──────────────────────────────────────────────────────────────────
  const handleTagSave = useCallback(async (trackId, tags) => {
    if (api) await api.tagsSave({ trackId, tags })
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, tags } : t))
  }, [api, setTracks])

  // ── Queue ─────────────────────────────────────────────────────────────────
  const removeFromQueue = useCallback((idx) => {
    setQueue(q => q.filter((_, i) => i !== idx))
  }, [setQueue])

  if (focusMode) {
    return (
      <FocusMode
        track={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        onPlayPause={() => setIsPlaying(p => !p)}
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
        currentPlaylist={currentPlaylist}
        onClearPlaylist={() => { setCurrentPlaylist(null); setPlaylistPaths([]) }}
      />
      <div className="search-row">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={q => { if (q.trim()) addToSearchHistory(q) }}
          history={store.searchHistory}
        />
      </div>
      <div className="main-area">
        <Sidebar
          activeView={activeView}
          setActiveView={v => { setActiveView(v); setCurrentPlaylist(null); setPlaylistPaths([]) }}
          currentPlaylist={currentPlaylist}
          onPlaylistSelect={handlePlaylistSelect}
          onPlaylistPlay={handlePlaylistPlay}
          tracks={tracks}
        />

        <div className="content-area">
          {activeView === 'stats' && !currentPlaylist ? (
            <StatsView tracks={tracks} playHistory={playHistory} />
          ) : tracks.length === 0 && !scanning ? (
            <EmptyState onScan={() => rescan()} />
          ) : (
            <TrackList
              tracks={displayTracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlay={playTrack}
              onAddToQueue={t => setQueue(q => [...q, t])}
              onTagSave={handleTagSave}
              playlists={playlists}
              onAddToPlaylist={handleAddToPlaylist}
            />
          )}
        </div>

        <QueuePanel
          queue={queue}
          visible={queueVisible}
          onToggle={() => setQueueVisible(v => !v)}
          onRemove={removeFromQueue}
          onClear={() => setQueue([])}
          onReorder={setQueue}
        />
      </div>
      <Player
        track={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        volume={volume}
        shuffleOn={shuffleOn}
        onPlayPause={() => setIsPlaying(p => !p)}
        onNext={playNext}
        onPrev={playPrev}
        onSeek={seek}
        onVolume={setVolume}
        onShuffle={() => setShuffleOn(!shuffleOn)}
      />
    </div>
  )
}
