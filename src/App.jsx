import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react'
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
import SessionLog from './components/SessionLog'
import ChangelogView from './components/ChangelogView'
import KeymapView from './components/KeymapView'
import ResizeDivider, { usePanelWidth } from './components/ResizeDivider'
import { useBpmDetect } from './hooks/useBpmDetect'
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
    keymap, setKeymap,
  } = store

  const [currentPlaylist, setCurrentPlaylist] = useState(null)
  const [playlistPaths, setPlaylistPaths] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [queueVisible, setQueueVisible] = useState(true)
  const [newTrackFlash, setNewTrackFlash] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const [crates, setCrates] = useState([])
  const [currentCrate, setCurrentCrate] = useState(null)
  const [cratePaths, setCratePaths] = useState([])

  // ── Panel widths (Task 1) ─────────────────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = usePanelWidth('sidebar', 150, 90, 220)
  const [queueWidth, setQueueWidth] = usePanelWidth('queue', 200, 120, 320)

  const filteredTracks = useSearch(tracks, searchQuery)
  const api = window.electronAPI

  const playlistTracks = useRef([])
  playlistTracks.current = playlistPaths.length
    ? tracks.filter(t => playlistPaths.includes(t.path))
    : []

  const crateTracks = cratePaths.length ? tracks.filter(t => cratePaths.includes(t.path)) : []

  const displayTracks = currentPlaylist
    ? playlistTracks.current
    : currentCrate
      ? crateTracks
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
      loadPlaylists()
      loadCrates()
      api.watchStart?.(dirs)
    }
    init()
  }, []) // eslint-disable-line

  // ── Chokidar listeners (Task 4) ───────────────────────────────────────────
  useEffect(() => {
    if (!api?.onTrackAdded) return
    const removeAdded = api.onTrackAdded((track) => {
      setTracks(prev => {
        if (prev.find(t => t.id === track.id)) return prev
        setNewTrackFlash(`+1 track detected`)
        setTimeout(() => setNewTrackFlash(null), 3000)
        return [track, ...prev]
      })
    })
    const removeRemoved = api.onTrackRemoved((filePath) => {
      setTracks(prev => prev.filter(t => t.path !== filePath))
    })
    return () => { removeAdded?.(); removeRemoved?.() }
  }, [setTracks])

  const loadPlaylists = useCallback(async () => {
    if (!api) return
    const list = await api.playlistList()
    setPlaylists(list)
  }, [])

  const loadCrates = useCallback(async () => {
    if (!api) return
    const list = await api.crateList()
    setCrates(list)
  }, [])

  const logAndAppend = useCallback((track) => {
    logPlay(track)
    api?.logAppend({ artist: track.artist, title: track.title })
  }, [logPlay, api])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const km = keymap
      const code = e.shiftKey ? `Shift+${e.code}` : e.code
      if (code === km.playPause || e.code === km.playPause) {
        if (e.code === 'Space') e.preventDefault()
        setIsPlaying(p => !p)
      } else if (code === km.next) {
        playNext()
      } else if (code === km.prev) {
        playPrev()
      } else if (code === km.volumeUp) {
        e.preventDefault(); setVolume(Math.min(1, volume + 0.05))
      } else if (code === km.volumeDown) {
        e.preventDefault(); setVolume(Math.max(0, volume - 0.05))
      } else if (code === km.focusMode && !e.ctrlKey && !e.metaKey) {
        enterFocus()
      } else if (code === km.queueAdd) {
        if (currentTrack) setQueue(q => [...q, currentTrack])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [volume, currentTrack, shuffleOn, keymap]) // eslint-disable-line

  // ── Focus mode (Task 2) ───────────────────────────────────────────────────
  const enterFocus = useCallback(() => {
    store.setFocusMode(true)
    api?.windowFocusMode?.({ enter: true })
  }, [api])

  const exitFocus = useCallback(() => {
    store.setFocusMode(false)
    api?.windowFocusMode?.({ enter: false })
  }, [api])

  // ── Playback navigation ───────────────────────────────────────────────────
  const activeList = useRef(displayTracks)
  activeList.current = displayTracks

  const playNext = useCallback(() => {
    const list = activeList.current
    if (!list.length) return
    if (queue.length) {
      const [next, ...rest] = queue
      setQueue(rest); setCurrentTrack(next); logAndAppend(next); return
    }
    if (!currentTrack) { setCurrentTrack(list[0]); logAndAppend(list[0]); return }
    if (shuffleOn) {
      const others = list.filter(t => t.id !== currentTrack.id)
      if (!others.length) return
      const diff = others.filter(t => t.artist !== currentTrack.artist)
      const pool = diff.length ? diff : others
      const next = pool[Math.floor(Math.random() * pool.length)]
      setCurrentTrack(next); logAndAppend(next)
    } else {
      const idx = list.findIndex(t => t.id === currentTrack.id)
      const next = list[(idx + 1) % list.length]
      setCurrentTrack(next); logAndAppend(next)
    }
  }, [currentTrack, queue, shuffleOn, setCurrentTrack, setQueue, logAndAppend])

  const playPrev = useCallback(() => {
    const list = activeList.current
    if (!list.length || !currentTrack) return
    const idx = list.findIndex(t => t.id === currentTrack.id)
    const prev = list[(idx - 1 + list.length) % list.length]
    setCurrentTrack(prev)
    logAndAppend(prev)
  }, [currentTrack, setCurrentTrack, logAndAppend])

  const playTrack = useCallback((track) => {
    setCurrentTrack(track); logAndAppend(track); setIsPlaying(true)
  }, [setCurrentTrack, logAndAppend, setIsPlaying])

  const { seek } = usePlayer({
    currentTrack, isPlaying, volume,
    setIsPlaying, setProgress, setDuration,
    onTrackEnd: playNext,
    onAnalyser: setAnalyser,
  })

  const { detecting: bpmDetecting, detect: detectBpm } = useBpmDetect()

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
    setCurrentPlaylist(name); setPlaylistPaths(paths || [])
    setActiveView('library'); setSearchQuery('')
  }, [setActiveView, setSearchQuery])

  const handlePlaylistPlay = useCallback((pl) => {
    const resolved = tracks.filter(t => pl.paths.includes(t.path))
    if (!resolved.length) return
    setCurrentPlaylist(pl.name); setPlaylistPaths(pl.paths)
    setCurrentTrack(resolved[0]); logAndAppend(resolved[0]); setIsPlaying(true)
  }, [tracks, setCurrentTrack, logAndAppend, setIsPlaying])

  const handleAddToPlaylist = useCallback(async (track, playlistName) => {
    if (!api) return
    const list = await api.playlistList()
    const pl = list.find(p => p.name === playlistName)
    if (!pl || pl.paths.includes(track.path)) return
    await api.playlistSave({ name: playlistName, paths: [...pl.paths, track.path] })
    loadPlaylists()
    if (currentPlaylist === playlistName) setPlaylistPaths(prev => [...prev, track.path])
  }, [api, currentPlaylist, loadPlaylists])

  // ── Tags ──────────────────────────────────────────────────────────────────
  const handleTagSave = useCallback(async (trackId, tags) => {
    if (api) await api.tagsSave({ trackId, tags })
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, tags } : t))
  }, [api, setTracks])

  // ── BPM save ──────────────────────────────────────────────────────────────
  const handleBpmSave = useCallback(async (track, bpm) => {
    if (api) await api.bpmSave({ trackId: track.id, bpm })
    setTracks(prev => prev.map(t => t.id === track.id ? { ...t, bpm } : t))
  }, [api, setTracks])

  // ── Crates ────────────────────────────────────────────────────────────────
  const handleCrateSelect = useCallback((name, paths) => {
    setCurrentCrate(name); setCratePaths(paths || [])
    setCurrentPlaylist(null); setPlaylistPaths([])
    setActiveView('library'); setSearchQuery('')
  }, [setActiveView, setSearchQuery])

  const handleAddToCrate = useCallback(async (track, crateName) => {
    if (!api) return
    const list = await api.crateList()
    const cr = list.find(c => c.name === crateName)
    if (!cr || cr.paths.includes(track.path)) return
    await api.crateSave({ name: crateName, paths: [...cr.paths, track.path] })
    loadCrates()
    if (currentCrate === crateName) setCratePaths(prev => [...prev, track.path])
  }, [api, currentCrate, loadCrates])

  // ── Queue ─────────────────────────────────────────────────────────────────
  const removeFromQueue = useCallback((idx) => setQueue(q => q.filter((_, i) => i !== idx)), [setQueue])

  if (focusMode) {
    return (
      <FocusMode
        track={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        onPlayPause={() => setIsPlaying(p => !p)}
        onExit={exitFocus}
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
        newTrackFlash={newTrackFlash}
        onFocus={enterFocus}
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
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
          activeView={activeView}
          setActiveView={v => {
            setActiveView(v)
            setCurrentPlaylist(null); setPlaylistPaths([])
            setCurrentCrate(null); setCratePaths([])
          }}
          currentPlaylist={currentPlaylist}
          onPlaylistSelect={handlePlaylistSelect}
          onPlaylistPlay={handlePlaylistPlay}
          tracks={tracks}
          onPlaylistsChange={loadPlaylists}
          crates={crates}
          currentCrate={currentCrate}
          onCrateSelect={handleCrateSelect}
          onCratesChange={loadCrates}
        />

        <ResizeDivider onDrag={dx => setSidebarWidth(w => w + dx)} />

        <div className="content-area">
          {activeView === 'stats' && !currentPlaylist && !currentCrate ? (
            <StatsView tracks={tracks} playHistory={playHistory} />
          ) : activeView === 'log' ? (
            <SessionLog api={api} />
          ) : activeView === 'changelog' ? (
            <ChangelogView api={api} />
          ) : activeView === 'keys' ? (
            <KeymapView keymap={keymap} setKeymap={setKeymap} />
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
              crates={crates}
              onAddToCrate={handleAddToCrate}
              onBpmDetect={(track) => detectBpm(track, (bpm) => bpm && handleBpmSave(track, bpm))}
              bpmDetecting={bpmDetecting}
            />
          )}
        </div>

        <ResizeDivider onDrag={dx => setQueueWidth(w => w - dx)} />

        <QueuePanel
          style={{ width: queueWidth, minWidth: queueWidth }}
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
        analyser={analyser}
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
