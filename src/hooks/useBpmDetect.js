import { useState, useCallback } from 'react'

export function useBpmDetect() {
  const [detecting, setDetecting] = useState({})

  const detect = useCallback(async (track, onResult) => {
    setDetecting(prev => ({ ...prev, [track.id]: true }))
    try {
      const url = track.path.startsWith('/') ? `localfile://${track.path}` : track.path
      const res = await fetch(url)
      const buffer = await res.arrayBuffer()
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const audio = await ctx.decodeAudioData(buffer)
      ctx.close()

      const sampleRate = audio.sampleRate
      const maxSamples = Math.min(audio.length, 30 * sampleRate)
      const data = audio.getChannelData(0).slice(0, maxSamples)

      // Energy per window
      const windowSize = 512
      const energies = []
      for (let i = 0; i < data.length; i += windowSize) {
        let sum = 0
        const end = Math.min(i + windowSize, data.length)
        for (let j = i; j < end; j++) sum += data[j] * data[j]
        energies.push(sum / windowSize)
      }

      // Local maxima above threshold
      const mean = energies.reduce((s, v) => s + v, 0) / energies.length
      const threshold = mean * 1.3
      const minDist = Math.floor((sampleRate / windowSize) * 0.25)

      const peaks = []
      for (let i = 1; i < energies.length - 1; i++) {
        if (
          energies[i] > threshold &&
          energies[i] >= energies[i - 1] &&
          energies[i] >= energies[i + 1] &&
          (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDist)
        ) {
          peaks.push(i)
        }
      }

      if (peaks.length < 4) {
        onResult(null)
        return
      }

      const intervals = []
      for (let i = 1; i < peaks.length; i++) intervals.push(peaks[i] - peaks[i - 1])
      const median = [...intervals].sort((a, b) => a - b)[Math.floor(intervals.length / 2)]
      const secondsPerBeat = (median * windowSize) / sampleRate
      let bpm = Math.round(60 / secondsPerBeat)

      // Clamp to 60–200
      while (bpm > 200) bpm = Math.round(bpm / 2)
      while (bpm < 60) bpm = Math.round(bpm * 2)

      onResult(bpm)
    } catch (e) {
      console.warn('BPM detect:', e)
      onResult(null)
    } finally {
      setDetecting(prev => ({ ...prev, [track.id]: false }))
    }
  }, [])

  return { detecting, detect }
}
