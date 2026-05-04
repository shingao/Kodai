import React, { useState, useRef, useEffect } from 'react'
import './TagEditor.css'

export default function TagEditor({ track, onSave, onClose }) {
  const [input, setInput] = useState(track.tags?.join(' ') || '')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const save = () => {
    const tags = input.split(/[\s,]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean)
    onSave(track.id, tags)
    onClose()
  }

  return (
    <div className="tag-editor" onClick={e => e.stopPropagation()}>
      <span className="tag-prompt">#</span>
      <input
        ref={inputRef}
        className="tag-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') onClose()
        }}
        onBlur={save}
        placeholder="chill workout 2am..."
        spellCheck={false}
      />
    </div>
  )
}
