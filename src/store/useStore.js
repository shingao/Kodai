import { useState, useCallback } from 'react'

const STORAGE_KEY = 'neiro_os_state'

export const DEFAULT_KEYMAP = {
  playPause: 'Space',
  next: 'ArrowRight',
  prev: 'ArrowLeft',
  volumeUp: 'ArrowUp',
  volumeDown: 'ArrowDown',
  focusMode: 'KeyF',
  queueAdd: 'Shift+ArrowRight',
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function persist(patch) {
  try {
    const prev = loadPersisted()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...patch }))
  } catch {}
}

export function useStore() {
  const saved = loadPersisted()

  const [tracks, setTracks] = useState([])
  const [currentTrack, setCurrentTrackState] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(saved.volume ?? 0.8)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState(saved.searchHistory ?? [])
  const [scanning, setScanning] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [scanDirs, setScanDirs] = useState(saved.scanDirs ?? [])
  const [playHistory, setPlayHistory] = useState(saved.playHistory ?? [])
  const [queue, setQueue] = useState([])
  const [shuffleOn, setShuffleOn] = useState(saved.shuffleOn ?? false)
  const [activeView, setActiveView] = useState('library')
  const [keymap, setKeymapState] = useState(saved.keymap ?? DEFAULT_KEYMAP)

  const setCurrentTrack = useCallback((track) => {
    setCurrentTrackState(track)
    if (track) persist({ lastTrackId: track.id })
  }, [])

  const setVolume = useCallback((v) => {
    setVolumeState(v)
    persist({ volume: v })
  }, [])

  const addToSearchHistory = useCallback((query) => {
    if (!query.trim()) return
    setSearchHistory((prev) => {
      const next = [query, ...prev.filter((q) => q !== query)].slice(0, 20)
      persist({ searchHistory: next })
      return next
    })
  }, [])

  const logPlay = useCallback((track) => {
    const entry = { trackId: track.id, timestamp: Date.now(), path: track.path }
    setPlayHistory((prev) => {
      const next = [entry, ...prev].slice(0, 5000)
      persist({ playHistory: next })
      return next
    })
    setTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, playCount: (t.playCount || 0) + 1 } : t))
    )
  }, [])

  const persistScanDirs = useCallback((dirs) => {
    setScanDirs(dirs)
    persist({ scanDirs: dirs })
  }, [])

  const persistShuffle = useCallback((v) => {
    setShuffleOn(v)
    persist({ shuffleOn: v })
  }, [])

  const setKeymap = useCallback((km) => {
    setKeymapState(km)
    persist({ keymap: km })
  }, [])

  return {
    tracks, setTracks,
    currentTrack, setCurrentTrack,
    isPlaying, setIsPlaying,
    volume, setVolume,
    progress, setProgress,
    duration, setDuration,
    searchQuery, setSearchQuery,
    searchHistory, addToSearchHistory,
    scanning, setScanning,
    focusMode, setFocusMode,
    scanDirs, setScanDirs: persistScanDirs,
    playHistory, logPlay,
    queue, setQueue,
    shuffleOn, setShuffleOn: persistShuffle,
    activeView, setActiveView,
    keymap, setKeymap,
  }
}
