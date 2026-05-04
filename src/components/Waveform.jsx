import React, { useRef, useEffect, useCallback } from 'react'
import './Waveform.css'

const BAR_WIDTH = 3
const BAR_GAP = 1
const BAR_STEP = BAR_WIDTH + BAR_GAP
const MAX_HEIGHT = 28

export default function Waveform({ progress, duration, onSeek }) {
  const canvasRef = useRef(null)
  const barsRef = useRef(null)
  const animRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)

  // Generate static noise bars on mount (no audio context needed for display)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.offsetWidth || 600
    canvas.width = W
    canvas.height = MAX_HEIGHT + 4

    const count = Math.floor(W / BAR_STEP)
    // Pseudo-random waveform that looks organic
    const bars = []
    let v = 0.5
    for (let i = 0; i < count; i++) {
      v += (Math.random() - 0.5) * 0.3
      v = Math.max(0.05, Math.min(1, v))
      bars.push(v)
    }
    barsRef.current = bars
    drawBars(canvas, bars, progress, duration)
  }, []) // eslint-disable-line

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !barsRef.current) return
    drawBars(canvas, barsRef.current, progress, duration)
  }, [progress, duration])

  function drawBars(canvas, bars, prog, dur) {
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const pct = dur > 0 ? prog / dur : 0

    ctx.clearRect(0, 0, W, H)

    bars.forEach((h, i) => {
      const x = i * BAR_STEP
      const barH = Math.max(2, h * MAX_HEIGHT)
      const y = (H - barH) / 2
      const isPast = i / bars.length <= pct
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
