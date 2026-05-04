import React, { useRef, useEffect, useCallback } from 'react'
import './Waveform.css'

const BAR_WIDTH = 3
const BAR_GAP = 1
const BAR_STEP = BAR_WIDTH + BAR_GAP
const MAX_HEIGHT = 28

export default function Waveform({ progress, duration, onSeek, analyser, isPlaying }) {
  const canvasRef = useRef(null)
  const barsRef = useRef(null)
  const liveRafRef = useRef(null)
  const progressRef = useRef(progress)
  const durationRef = useRef(duration)

  useEffect(() => { progressRef.current = progress }, [progress])
  useEffect(() => { durationRef.current = duration }, [duration])

  // Generate static noise bars on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.offsetWidth || 600
    canvas.width = W
    canvas.height = MAX_HEIGHT + 4

    const count = Math.floor(W / BAR_STEP)
    const bars = []
    let v = 0.5
    for (let i = 0; i < count; i++) {
      v += (Math.random() - 0.5) * 0.3
      v = Math.max(0.05, Math.min(1, v))
      bars.push(v)
    }
    barsRef.current = bars
    drawBars(canvas, bars, progress, duration, null)
  }, []) // eslint-disable-line

  // Static redraw when not in live mode
  useEffect(() => {
    if (analyser && isPlaying) return
    const canvas = canvasRef.current
    if (!canvas || !barsRef.current) return
    drawBars(canvas, barsRef.current, progress, duration, null)
  }, [progress, duration, analyser, isPlaying])

  // Live rAF loop when analyser is active and playing
  useEffect(() => {
    if (liveRafRef.current) {
      cancelAnimationFrame(liveRafRef.current)
      liveRafRef.current = null
    }
    if (!analyser || !isPlaying) return
    const canvas = canvasRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(dataArray)
      drawBars(canvas, barsRef.current, progressRef.current, durationRef.current, dataArray)
      liveRafRef.current = requestAnimationFrame(tick)
    }
    liveRafRef.current = requestAnimationFrame(tick)
    return () => {
      if (liveRafRef.current) cancelAnimationFrame(liveRafRef.current)
    }
  }, [analyser, isPlaying])

  function drawBars(canvas, bars, prog, dur, liveData) {
    if (!canvas || !bars) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const pct = dur > 0 ? prog / dur : 0

    ctx.clearRect(0, 0, W, H)

    bars.forEach((h, i) => {
      const x = i * BAR_STEP
      const isPast = i / bars.length <= pct
      let barH
      if (isPast && liveData) {
        const freqIdx = Math.floor((i / bars.length) * liveData.length)
        barH = Math.max(2, (liveData[freqIdx] / 255) * MAX_HEIGHT)
      } else {
        barH = Math.max(2, h * MAX_HEIGHT)
      }
      const y = (H - barH) / 2
      ctx.fillStyle = isPast ? '#aaaaaa' : '#2e2e2e'
      ctx.fillRect(x, y, BAR_WIDTH, barH)
    })

    // Playhead
    if (dur > 0) {
      const px = pct * W
      ctx.fillStyle = '#e0e0e0'
      ctx.fillRect(Math.max(0, px - 1), 0, 2, H)
    }
  }

  const handleClick = useCallback((e) => {
    if (!duration || !onSeek) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    onSeek(pct * duration)
  }, [duration, onSeek])

  return (
    <canvas
      ref={canvasRef}
      className="waveform-canvas"
      onClick={handleClick}
      title="Click to seek"
    />
  )
}
