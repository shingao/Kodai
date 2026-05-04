import { useEffect, useRef, useCallback } from 'react'
import { Howl } from 'howler'

export function usePlayer({ currentTrack, isPlaying, volume, setIsPlaying, setProgress, setDuration, onTrackEnd }) {
  const howlRef = useRef(null)
  const rafRef = useRef(null)
  const trackRef = useRef(null)

  const stopRAF = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const startRAF = useCallback(() => {
    stopRAF()
    const tick = () => {
      if (howlRef.current && howlRef.current.playing()) {
        const seek = howlRef.current.seek() || 0
        setProgress(seek)
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [setProgress])

  // Load new track
  useEffect(() => {
    if (!currentTrack) return
    if (trackRef.current === currentTrack.id) return
    trackRef.current = currentTrack.id

    stopRAF()
    if (howlRef.current) {
      howlRef.current.stop()
      howlRef.current.unload()
    }

    // Electron serves local files via webSecurity:false, use file:// path
    const src = currentTrack.path.startsWith('/')
      ? `localfile://${currentTrack.path}`
      : currentTrack.path

    const howl = new Howl({
      src: [src],
      html5: true,
      volume,
      onload() {
        setDuration(howl.duration())
      },
      onplay() {
        setIsPlaying(true)
        startRAF()
      },
      onpause() {
        setIsPlaying(false)
        stopRAF()
      },
      onstop() {
        setIsPlaying(false)
        stopRAF()
        setProgress(0)
      },
      onend() {
        stopRAF()
        setProgress(0)
        onTrackEnd?.()
      },
      onloaderror(id, err) {
        console.error('Load error:', err)
      },
    })

    howlRef.current = howl
    howl.play()
  }, [currentTrack]) // eslint-disable-line

  // Play / pause sync
  useEffect(() => {
    if (!howlRef.current) return
    if (isPlaying && !howlRef.current.playing()) {
      howlRef.current.play()
    } else if (!isPlaying && howlRef.current.playing()) {
      howlRef.current.pause()
    }
  }, [isPlaying])

  // Volume sync
  useEffect(() => {
    if (howlRef.current) howlRef.current.volume(volume)
  }, [volume])

  const seek = useCallback((t) => {
    if (howlRef.current) {
      howlRef.current.seek(t)
      setProgress(t)
    }
  }, [setProgress])

  useEffect(() => () => {
    stopRAF()
    if (howlRef.current) {
      howlRef.current.stop()
      howlRef.current.unload()
    }
  }, [])

  return { seek }
}
