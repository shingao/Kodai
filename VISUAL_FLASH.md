# VISUAL FLASH — Hinageshi Design System
## KODAI 古代 · v1.1.0

---

### Overview

Applied the Hinageshi visual flash to KODAI. This design pass introduces a single
signal color (`--hi-500`) that cuts through the monochrome terminal aesthetic as an
accent, active state, and live indicator.

---

### Changes

**Token layer**
- Added `--hi-500`, `--hi-700`, `--hi-glow` signal-color variables
- Added `--font-jp` for M PLUS 1 Code kanji rendering
- Added `--paper`, `--tick`, `--rule-hi` surface tokens
- `--accent` aliased to `--hi-500` for backward compatibility
- `src/styles/theme.css` — 4 signal-color presets: red / cyan / amber / lime

**Layout layer**
- `.watermark.jp` — 古代 watermark at 3.5% opacity, bottom-right
- `.foot-strip` — status bar: FIG label, LIVE indicator, TRK / QUEUED counts
- `.reg-tick.tl/tr/bl/br` — corner registration tick marks

**Header**
- Kanji logo `古代` + `KODAI` mark
- Blinking `.dot.live` in signal red during scan
- `[S] RESCAN` / `[F] FOCUS` button labels
- `close-btn:hover` → signal red

**Sidebar**
- `.sidebar-vlabel` — vertical `SECTOR · NAV-01` label
- `VIEWS / PLAYLISTS / CRATES` section rules with em-dash prefix
- `.sidebar-item.active::before` — 2px signal-red left bar
- `.sb-arr` arrow indicator in signal red when active

**Player**
- Registration ticks (tl + br)
- `— NOW PLAYING · CH-01` label
- `.now-playing-codestrip` — BPM / format / year metadata strip
- `.np-album` in signal red
- `.play-btn.is-playing` — signal red border + text

**Track list**
- `.track-row.active::before` — 2px signal-red left bar
- `.playing-icon` — signal red
- `.tags` — bordered pill style

**Queue**
- `.queue-title::before { content: "—— QUEUE" }` via CSS
- `.queue-item.now::before` — 2px signal-red left bar

**All panel titles** (log, changelog, keymap)
- `::before { content: "—— " }` prefix pattern

**Stats**
- `.stats-label::before` — 2px signal-red inline tab
- `.stats-bar-fill` — signal red
- `.sparkline` — signal red

**Search**
- `caret-color: var(--hi-500)`
- `.prompt::after { content: " ▸"; color: var(--hi-500) }`

**Focus mode**
- `.focus-play.is-playing` / `:hover` — signal red

**Empty state**
- `.empty-btn:hover::before { content: "▸ " }` — signal red
- `.empty-btn:hover` — signal red border

---

### Theme switching

Set `data-theme` attribute on `<html>` to switch signal color:

```html
<html data-theme="red">   <!-- default -->
<html data-theme="cyan">
<html data-theme="amber">
<html data-theme="lime">
```

---

_Hinageshi Design System · applied 2026-05-05_
