import { useEffect, useRef, useCallback } from 'react'
import { Howl } from 'howler'

export function usePlayer({ currentTrack, isPlaying, volume, setIsPlaying, setProgress, setDuration, onTrackEnd, onAnalyser }) {
  const howlRef = useRef(null)
  const rafRef = useRef(null)
  const trackRef = useRef(null)
  const ctxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)

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

  const setupAnalyser = useCallback((howl) => {
    const audioNode = howl._sounds?.[0]?._node
    if (!audioNode) return
    try {
      if (!ctxRef.current) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 128
        analyser.connect(ctx.destination)
        ctxRef.current = ctx
        analyserRef.current = analyser
      }
      if (sourceRef.current) {
        try { sourceRef.current.disconnect() } catch {}
        sourceRef.current = null
      }
      sourceRef.current = ctxRef.current.createMediaElementSource(audioNode)
      sourceRef.current.connect(analyserRef.current)
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
      onAnalyser?.(analyserRef.current)
    } catch (e) {
      console.warn('AudioContext setup:', e)
    }
  }, [onAnalyser])

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

    const src = currentTrack.path.startsWith('/')
      ? `localfile://${currentTrack.path}`
      : currentTrack.path

    const howl = new Howl({
      src: [src],
      html5: true,
      volume,
      onload() {
        setDuration(howl.duration())
        setupAnalyser(howl)
      },
      onplay() {
        setIsPlaying(true)
        startRAF()
        if (ctxRef.current?.state === 'suspended') ctxRef.current.resume()
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
