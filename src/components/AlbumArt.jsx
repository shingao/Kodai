import React, { useEffect, useState } from 'react'
import './AlbumArt.css'

export default function AlbumArt({ trackId, hasCover, size = 32 }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    setSrc(null)
    if (!trackId || !hasCover) return
    const api = window.electronAPI
    if (!api?.getCover) return
    api.getCover(trackId).then(data => setSrc(data || null))
  }, [trackId, hasCover])

  if (src) {
    return (
      <img
        className="album-art"
        src={src}
        alt=""
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div className="album-art album-art-placeholder" style={{ width: size, height: size }}>
      <span>♪</span>
    </div>
  )
}
