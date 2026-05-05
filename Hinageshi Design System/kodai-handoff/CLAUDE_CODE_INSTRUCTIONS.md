# Kodai Visual Flash — Handoff for Claude Code

You're being handed a set of files that update the **Kodai** music manager
(formerly `neiro-os`) with a new visual language called "Hinageshi flash" —
a refreshed dark/monospace look with kanji marks, registration ticks, em-dash
section rules, and a single signal color (Hinageshi 緋 red `#D9382A`).

## Your task

Apply these files to the user's Kodai repository, commit, and push.

### 1. Identify the target repo

The user's repo is the one containing the existing `src/App.jsx`,
`src/components/Header.jsx`, etc. — i.e. the Kodai / NEIRO_OS Electron app.
If you're running inside a checkout already, you're in the right place.
If not, ask the user which clone path to use.

### 2. Copy files

Every file in this handoff is a **drop-in replacement** for the same path
in the target repo. Layout mirrors the repo:

```
package.json                          ← rename from neiro-os to kodai, v1.1.0
index.html                            ← loads M PLUS 1 Code, sets data-theme="red"
VISUAL_FLASH.md                       ← NEW — change log for this update
src/main.jsx                          ← imports new stylesheets
src/App.jsx                           ← adds watermark + foot-strip
src/styles/global.css                 ← new --hi-* tokens, JP font, paper tokens
src/styles/layout.css                 ← .watermark, .foot-strip, .reg-tick utilities
src/styles/theme.css                  ← NEW — 4 signal-color presets
src/components/Header.{jsx,css}       ← kanji logo, reg tick, live dot
src/components/Sidebar.{jsx,css}      ← vertical edge label, em-dash rules
src/components/PlaylistPanel.{jsx,css}
src/components/CratePanel.{jsx,css}
src/components/Player.{jsx,css}       ← reg ticks, codestrip, red play state
src/components/TrackList.css          ← red active marker, [FLAC]/[MP3] pills
src/components/QueuePanel.{jsx,css}
src/components/SearchBar.css
src/components/StatsView.css
src/components/FocusMode.css
src/components/EmptyState.css
src/components/KeymapView.css
src/components/ChangelogView.css
src/components/SessionLog.css
```

Two files are **new** and need to be created (not just overwritten):
- `src/styles/theme.css`
- `VISUAL_FLASH.md`

Everything else is a **modification** to an existing file.

### 3. Verify before commit

After copying, run:

```bash
npm install        # in case lockfile shifts (no new deps were added)
npm run dev:react  # Vite dev server — check the app loads at localhost:5173
```

You should see:
- "KODAI 古代" in the top-left logo
- A faint 古代 watermark behind the content
- Em-dash labels (`—— QUEUE`, `—— LOG`, etc.) on panel headers
- Red accent only on now-playing rows, play head, live dot, search caret
- Footer strip with live indicator + counts

If anything looks broken, check that `src/main.jsx` imports
`./styles/theme.css` after `./styles/global.css`.

### 4. Commit & push

Suggested commit:

```bash
git checkout -b visual-flash-hinageshi
git add -A
git commit -m "feat(ui): apply Hinageshi visual flash

- Single signal color (Hinageshi red #D9382A) for now-playing, play head,
  live dot, search caret, active markers
- Kanji 古代 in logo + watermark
- Registration ticks at chrome corners
- Em-dash section rules (—— QUEUE, —— LOG)
- Vertical edge label on sidebar
- Codestrip under now-playing track
- Foot-strip with live indicator + counts
- 4 signal-color presets via [data-theme] (red default, cyan, amber, lime)
- Renamed package neiro-os → kodai, v1.1.0

See VISUAL_FLASH.md for full file-level change list."
git push -u origin visual-flash-hinageshi
```

Then open a PR against the default branch and link it back to the user.

### 5. Notes / gotchas

- **No new npm dependencies.** Lockfile should not change.
- **Legacy `--accent` token** is aliased to `--hi-500` in `global.css` so
  any code still referencing `--accent` keeps working.
- **`productName` in `package.json`** changed from `NEIRO_OS` to `Kodai` —
  this affects the built Electron app's display name. If the user wants
  to keep the old name, revert that line.
- **Font:** `index.html` now loads "M PLUS 1 Code" from Google Fonts so
  the kanji 古代 renders correctly. Falls back to monospace if offline.
- All changes are visual / styling only — no behavioral or data-model
  changes were made. Player, library, search, hotkeys all work as before.
