# KODAI 古代 — Visual Flash

This update applies a graphical refresh to the Kodai (NEIRO_OS) music manager
while preserving its dark, monospace, ASCII-driven character.

## What changed

The app now has **a single signal color** — Hinageshi 緋 red `#D9382A` — used
sparingly for now-playing rows, the play head, the play button while playing,
the live indicator, search-input caret, and the active sidebar / queue / row
markers. Everything else stays in the original grayscale.

### New visual moves

- **Kanji 古代 in the logo** ("KODAI" means "ancient" in Japanese)
- **Kanji watermark** 古代 ghosting at 3.5% opacity behind the content
- **Registration ticks** at the corners of the header & player chrome
- **Vertical edge label** (`SECTOR · NAV-01`) running down the sidebar
- **Em-dash section rules** (`—— QUEUE`, `—— LOG`) on every panel header
- **Codestrip** under the now-playing track (BPM · format · year)
- **Footer micro-strip** with live indicator, track count, queue count, system signature
- **Tag pills** on tracks (`[FLAC]` / `[MP3]`) — bordered uppercase chips
- **Tabular numerics** for time displays
- **Stats** — bars in red, sparkline in red, label markers

### Theming

Four signal-color presets ship in `src/styles/theme.css`:

```html
<!-- index.html -->
<html data-theme="red">    <!-- default · 緋 hinageshi red -->
<html data-theme="cyan">   <!-- 翠 cyan -->
<html data-theme="amber">  <!-- 琥 amber -->
<html data-theme="lime">   <!-- 萌 lime -->
```

Switch at runtime with `document.documentElement.dataset.theme = 'cyan'`.

## File-level changes

| File | Change |
|---|---|
| `src/styles/global.css` | New `--hi-500/--hi-700/--hi-glow` signal tokens, JP font, paper/tick tokens. Legacy `--accent` aliased to `--hi-500`. |
| `src/styles/theme.css` *(new)* | 4 signal-color presets via `[data-theme]`. |
| `src/styles/layout.css` | `.watermark`, `.foot-strip`, `.reg-tick` utilities. |
| `src/main.jsx` | Imports new stylesheets. |
| `index.html` | Loads M PLUS 1 Code (kanji-capable). Sets `data-theme="red"`. |
| `src/components/Header.{jsx,css}` | Kanji logo, registration tick, blinking red live dot, red close hover, em-dash version label. |
| `src/components/Sidebar.{jsx,css}` | Vertical edge label, em-dash section rules, red active-marker bar. |
| `src/components/PlaylistPanel.{jsx,css}` | Header drop (sidebar provides), red active marker. |
| `src/components/CratePanel.{jsx,css}` | Header drop (sidebar provides), red active marker, red active code. |
| `src/components/Player.{jsx,css}` | Two registration ticks, "—— NOW PLAYING · CH-01" label, codestrip, red playing-state, red album accent. |
| `src/components/TrackList.css` | Red active row marker, red playing icon, bordered tag pills, em-dash strip. |
| `src/components/QueuePanel.{jsx,css}` | "—— QUEUE" header, red now-playing marker. |
| `src/components/SearchBar.css` | Red caret, red `▸` prompt arrow, em-dash hint. |
| `src/components/StatsView.css` | Red bars, red sparkline, marker tab on each section label. |
| `src/components/FocusMode.css` | Red play hover. |
| `src/components/EmptyState.css` | Red `▸` prefix on hover, red border. |
| `src/components/KeymapView.css` | Em-dash title, red capturing-row marker. |
| `src/components/ChangelogView.css` | Em-dash title, red `+` prefix on added lines. |
| `src/components/SessionLog.css` | Em-dash title. |
| `src/App.jsx` | Watermark div, foot-strip with live indicator. |
| `package.json` | Renamed `neiro-os` → `kodai`, version 1.1.0, productName "Kodai". |

## Diff summary

- **20 files modified**
- **2 files created** (`src/styles/theme.css`, this README)
- **0 files deleted**
- All existing functionality preserved
