import { useMemo } from 'react'

const NOW = () => Date.now()
const DAY = 86400000
const WEEK = 7 * DAY
const MONTH = 30 * DAY

function parseDuration(str) {
  // e.g. "5m" -> 300, "90s" -> 90, "1h" -> 3600
  const m = str.match(/^(\d+(?:\.\d+)?)(h|m|s)?$/)
  if (!m) return null
  const n = parseFloat(m[1])
  const unit = m[2] || 's'
  if (unit === 'h') return n * 3600
  if (unit === 'm') return n * 60
  return n
}

export function useSearch(tracks, query) {
  return useMemo(() => {
    if (!query.trim()) return tracks

    const tokens = query.trim().split(/\s+/)
    const now = NOW()
    let result = tracks

    for (const token of tokens) {
      const lower = token.toLowerCase()

      if (lower.startsWith('added:')) {
        const period = lower.slice(6)
        const cutoff =
          period === 'today' ? now - DAY :
          period === 'week'  ? now - WEEK :
          period === 'month' ? now - MONTH : null
        if (cutoff !== null) {
          result = result.filter((t) => t.addedAt >= cutoff)
        }
        continue
      }

      if (lower.startsWith('artist:')) {
        const v = lower.slice(7)
        result = result.filter((t) => t.artist?.toLowerCase().includes(v))
        continue
      }

      if (lower.startsWith('album:')) {
        const v = lower.slice(6)
        result = result.filter((t) => t.album?.toLowerCase().includes(v))
        continue
      }

      if (lower.startsWith('tag:')) {
        const v = lower.slice(4)
        result = result.filter((t) => t.tags?.some((tag) => tag.toLowerCase().includes(v)))
        continue
      }

      if (lower.startsWith('bpm:')) {
        const expr = lower.slice(4)
        const match = expr.match(/^([<>]?=?)(\d+)$/)
        if (match) {
          const op = match[1] || '='
          const val = parseInt(match[2])
          result = result.filter((t) => {
            if (!t.bpm) return false
            if (op === '>' || op === '>=') return t.bpm >= val
            if (op === '<' || op === '<=') return t.bpm <= val
            return Math.round(t.bpm) === val
          })
        }
        continue
      }

      if (lower.startsWith('dur:')) {
        const expr = lower.slice(4)
        const match = expr.match(/^([<>]?=?)(.+)$/)
        if (match) {
          const op = match[1] || '='
          const val = parseDuration(match[2])
          if (val !== null) {
            result = result.filter((t) => {
              if (op === '>' || op === '>=') return t.duration >= val
              if (op === '<' || op === '<=') return t.duration <= val
              return Math.abs(t.duration - val) < 10
            })
          }
        }
        continue
      }

      // free text
      result = result.filter((t) =>
        t.title?.toLowerCase().includes(lower) ||
        t.artist?.toLowerCase().includes(lower) ||
        t.album?.toLowerCase().includes(lower)
      )
    }

    return result
  }, [tracks, query])
}
