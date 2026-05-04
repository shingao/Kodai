import React, { useCallback, useEffect, useRef } from 'react'
import './ResizeDivider.css'

const STORAGE_PREFIX = 'sonic_os_panel_'

export function usePanelWidth(key, defaultWidth, min, max) {
  const stored = parseInt(localStorage.getItem(STORAGE_PREFIX + key)) || defaultWidth
  const [width, setWidthRaw] = React.useState(Math.max(min, Math.min(max, stored)))

  const setWidth = useCallback((w) => {
    const clamped = Math.max(min, Math.min(max, w))
    setWidthRaw(clamped)
    localStorage.setItem(STORAGE_PREFIX + key, clamped)
  }, [key, min, max])

  return [width, setWidth]
}

export default function ResizeDivider({ onDrag }) {
  const dragging = useRef(false)
  const startX = useRef(0)

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX

    const onMove = (ev) => {
      if (!dragging.current) return
      onDrag(ev.clientX - startX.current)
      startX.current = ev.clientX
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onDrag])

  return (
    <div className="resize-divider" onMouseDown={onMouseDown} />
  )
}
