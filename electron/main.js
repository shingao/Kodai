const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
const coverCache = new Map()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 700,
    minHeight: 400,
    backgroundColor: '#0a0a0a',
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a0a',
      symbolColor: '#555',
      height: 28,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('localfile', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('localfile://', ''))
    callback({ path: filePath })
  })
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ── helpers ────────────────────────────────────────────────────────────────
function playlistsDir() {
  const dir = path.join(os.homedir(), 'Music', 'NEIRO_OS', 'playlists')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function dataFile() {
  const dir = path.join(os.homedir(), '.config', 'neiro-os')
  fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'data.json')
}

function loadData() {
  try {
    const raw = fs.readFileSync(dataFile(), 'utf8')
    return JSON.parse(raw)
  } catch {
    return { tags: {} }
  }
}

function saveData(data) {
  fs.writeFileSync(dataFile(), JSON.stringify(data, null, 2))
}

// ── IPC: scan directories ──────────────────────────────────────────────────
ipcMain.handle('scan-dirs', async (event, dirs) => {
  const { parseFile } = await import('music-metadata')
  const EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.ogg', '.m4a'])
  const tracks = []
  const data = loadData()

  async function walk(dir) {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') await walk(full)
      } else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        try {
          const stat = fs.statSync(full)
          const meta = await parseFile(full, { duration: true })
          const { common, format } = meta
          const id = Buffer.from(full).toString('base64')
          const pic = common.picture?.[0]
          if (pic) {
            coverCache.set(id, `data:${pic.format};base64,${Buffer.from(pic.data).toString('base64')}`)
          }
          tracks.push({
            id,
            path: full,
            title: common.title || path.basename(full, path.extname(full)),
            artist: common.artist || common.albumartist || 'Unknown Artist',
            album: common.album || 'Unknown Album',
            year: common.year || null,
            duration: format.duration || 0,
            bpm: data.bpm?.[id] || common.bpm || null,
            addedAt: stat.mtimeMs,
            playCount: 0,
            tags: data.tags?.[id] || [],
            hasCover: !!pic,
          })
        } catch { /* skip */ }
      }
    }
  }

  for (const dir of dirs) {
    if (fs.existsSync(dir)) await walk(dir)
  }
  return tracks
})

// ── IPC: default scan paths ────────────────────────────────────────────────
ipcMain.handle('get-default-dirs', () => {
  const home = os.homedir()
  return [
    path.join(home, 'Music'),
    path.join(home, 'Downloads'),
    path.join(home, 'Documents'),
    path.join(home, 'Desktop'),
  ]
})

// ── IPC: pick directory ────────────────────────────────────────────────────
ipcMain.handle('pick-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
  return result.filePaths[0] || null
})

// ── IPC: window controls ───────────────────────────────────────────────────
ipcMain.handle('window-minimize', () => mainWindow.minimize())
ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize()
  else mainWindow.maximize()
})
ipcMain.handle('window-close', () => mainWindow.close())
ipcMain.handle('window-resize', (_, { width, height }) => mainWindow.setSize(width, height, true))

// ── IPC: focus mode (Task 2) ───────────────────────────────────────────────
let preFocusSize = null
ipcMain.handle('window-focus-mode', (_, { enter }) => {
  if (enter) {
    preFocusSize = mainWindow.getSize()
    mainWindow.setAlwaysOnTop(true, 'floating')
    mainWindow.setResizable(false)
    mainWindow.setSize(preFocusSize[0], 36, true)
  } else {
    mainWindow.setAlwaysOnTop(false)
    mainWindow.setResizable(true)
    if (preFocusSize) mainWindow.setSize(preFocusSize[0], preFocusSize[1], true)
  }
})

// ── IPC: playlists ─────────────────────────────────────────────────────────
ipcMain.handle('playlist-list', () => {
  const dir = playlistsDir()
  const regular = fs.readdirSync(dir)
    .filter(f => f.endsWith('.m3u'))
    .map(f => {
      const name = f.replace(/\.m3u$/, '')
      const content = fs.readFileSync(path.join(dir, f), 'utf8')
      const paths = content.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'))
      return { name, paths, smart: false }
    })
  const smart = fs.readdirSync(dir)
    .filter(f => f.startsWith('_smart_') && f.endsWith('.json'))
    .map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
        return { ...data, smart: true, paths: [] }
      } catch { return null }
    })
    .filter(Boolean)
  return [...regular, ...smart]
})

ipcMain.handle('playlist-create', (_, name) => {
  const file = path.join(playlistsDir(), `${name}.m3u`)
  if (!fs.existsSync(file)) fs.writeFileSync(file, '#EXTM3U\n')
  return true
})

ipcMain.handle('playlist-rename', (_, { oldName, newName }) => {
  const dir = playlistsDir()
  fs.renameSync(path.join(dir, `${oldName}.m3u`), path.join(dir, `${newName}.m3u`))
  return true
})

ipcMain.handle('playlist-delete', (_, name) => {
  fs.unlinkSync(path.join(playlistsDir(), `${name}.m3u`))
  return true
})

ipcMain.handle('playlist-save', (_, { name, paths }) => {
  const lines = ['#EXTM3U', ...paths]
  fs.writeFileSync(path.join(playlistsDir(), `${name}.m3u`), lines.join('\n') + '\n')
  return true
})

ipcMain.handle('playlist-export', async (_, { name, paths }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `${name}.m3u`,
    filters: [{ name: 'M3U Playlist', extensions: ['m3u'] }],
  })
  if (!result.filePath) return false
  fs.writeFileSync(result.filePath, ['#EXTM3U', ...paths].join('\n') + '\n')
  return true
})

ipcMain.handle('playlist-import', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'M3U Playlist', extensions: ['m3u', 'm3u8'] }],
    properties: ['openFile'],
  })
  if (!result.filePaths[0]) return null
  const content = fs.readFileSync(result.filePaths[0], 'utf8')
  const paths = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  const name = path.basename(result.filePaths[0], path.extname(result.filePaths[0]))
  return { name, paths }
})

// ── IPC: smart playlists (Task 3) ─────────────────────────────────────────
ipcMain.handle('smart-playlist-create', (_, { name, rules, limit, sortBy, sortDir }) => {
  const data = { name, type: 'smart', rules: rules || [], limit: limit || 50, sortBy: sortBy || 'addedAt', sortDir: sortDir || 'desc' }
  fs.writeFileSync(path.join(playlistsDir(), `_smart_${name}.json`), JSON.stringify(data, null, 2))
  return true
})

ipcMain.handle('smart-playlist-delete', (_, name) => {
  const file = path.join(playlistsDir(), `_smart_${name}.json`)
  if (fs.existsSync(file)) fs.unlinkSync(file)
  return true
})

ipcMain.handle('smart-playlist-eval', (_, { rules, limit, sortBy, sortDir, tracks }) => {
  const DAY = 86400000
  const now = Date.now()
  const cutoff = (val) => {
    if (val === 'today') return now - DAY
    if (val === 'week') return now - 7 * DAY
    if (val === 'month') return now - 30 * DAY
    return 0
  }

  let result = tracks.filter(t => {
    return (rules || []).every(rule => {
      const { field, op, value } = rule
      if (field === 'tag') {
        const has = (t.tags || []).some(tg => tg.toLowerCase().includes(String(value).toLowerCase()))
        return op === 'not' ? !has : has
      }
      if (field === 'addedAt' && op === 'within') return t.addedAt >= cutoff(value)
      const tv = t[field]
      if (tv === undefined || tv === null) return false
      const num = parseFloat(value)
      if (op === '>') return parseFloat(tv) > num
      if (op === '<') return parseFloat(tv) < num
      if (op === '=') return String(tv).toLowerCase() === String(value).toLowerCase()
      if (op === 'includes') return String(tv).toLowerCase().includes(String(value).toLowerCase())
      if (op === 'not') return String(tv).toLowerCase() !== String(value).toLowerCase()
      return true
    })
  })

  const dir = sortDir === 'asc' ? 1 : -1
  result.sort((a, b) => {
    const av = a[sortBy] ?? 0, bv = b[sortBy] ?? 0
    return av < bv ? -dir : av > bv ? dir : 0
  })

  return result.slice(0, limit || 50)
})

// ── IPC: tags ──────────────────────────────────────────────────────────────
ipcMain.handle('tags-save', (_, { trackId, tags }) => {
  const data = loadData()
  if (!data.tags) data.tags = {}
  data.tags[trackId] = tags
  saveData(data)
  return true
})

ipcMain.handle('tags-load-all', () => {
  return loadData().tags || {}
})

// ── IPC: BPM save ─────────────────────────────────────────────────────────
ipcMain.handle('bpm-save', (_, { trackId, bpm }) => {
  const data = loadData()
  if (!data.bpm) data.bpm = {}
  data.bpm[trackId] = bpm
  saveData(data)
  return true
})

// ── IPC: crates ────────────────────────────────────────────────────────────
function cratesDir() {
  const dir = path.join(os.homedir(), 'Music', 'NEIRO_OS', 'crates')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

ipcMain.handle('crate-list', () => {
  const dir = cratesDir()
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
      } catch { return null }
    })
    .filter(Boolean)
})

ipcMain.handle('crate-create', (_, { name, code }) => {
  const data = { name, code, paths: [], createdAt: Date.now() }
  fs.writeFileSync(path.join(cratesDir(), `${code}.json`), JSON.stringify(data, null, 2))
  return data
})

ipcMain.handle('crate-rename', (_, { code, newName }) => {
  const file = path.join(cratesDir(), `${code}.json`)
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  data.name = newName
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
  return true
})

ipcMain.handle('crate-delete', (_, code) => {
  const file = path.join(cratesDir(), `${code}.json`)
  if (fs.existsSync(file)) fs.unlinkSync(file)
  return true
})

ipcMain.handle('crate-save', (_, { name, code, paths }) => {
  const file = path.join(cratesDir(), `${code}.json`)
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { name, code, createdAt: Date.now() }
  data.paths = paths
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
  return true
})

ipcMain.handle('crate-export', async (_, { name, paths }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `${name}.m3u`,
    filters: [{ name: 'M3U Playlist', extensions: ['m3u'] }],
  })
  if (!result.filePath) return false
  fs.writeFileSync(result.filePath, ['#EXTM3U', ...paths].join('\n') + '\n')
  return true
})

// ── IPC: session log ───────────────────────────────────────────────────────
function sessionLogFile() {
  const dir = path.join(os.homedir(), '.config', 'neiro-os')
  fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'sessions.log')
}

let lastLogTime = 0
ipcMain.handle('log-append', (_, { artist, title }) => {
  const now = Date.now()
  const file = sessionLogFile()
  const ts = new Date(now).toISOString().replace('T', ' ').slice(0, 19)
  let line = `[${ts}] ${artist} — ${title}\n`
  if (now - lastLogTime > 30 * 60 * 1000 && lastLogTime > 0) {
    line = `\n--- session break ---\n\n` + line
  }
  lastLogTime = now
  fs.appendFileSync(file, line)
  return true
})

ipcMain.handle('log-read', () => {
  try { return fs.readFileSync(sessionLogFile(), 'utf8') } catch { return '' }
})

ipcMain.handle('log-export', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'sessions.log',
    filters: [{ name: 'Log File', extensions: ['log', 'txt'] }],
  })
  if (!result.filePath) return false
  fs.copyFileSync(sessionLogFile(), result.filePath)
  return true
})

ipcMain.handle('log-clear', () => {
  fs.writeFileSync(sessionLogFile(), '')
  return true
})

// ── IPC: changelog ─────────────────────────────────────────────────────────
function changelogFile() {
  const dir = path.join(os.homedir(), '.config', 'neiro-os')
  fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'changelog.log')
}

function appendChangelog(prefix, filePath) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19)
  fs.appendFileSync(changelogFile(), `${prefix} [${ts}] ${filePath}\n`)
}

ipcMain.handle('changelog-read', () => {
  try { return fs.readFileSync(changelogFile(), 'utf8') } catch { return '' }
})

ipcMain.handle('changelog-clear', () => {
  fs.writeFileSync(changelogFile(), '')
  return true
})

// ── IPC: chokidar watch ────────────────────────────────────────────────────
let watcher = null

ipcMain.handle('watch-start', async (_, dirs) => {
  const { parseFile } = await import('music-metadata')
  const chokidar = require('chokidar')
  const EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.ogg', '.m4a'])

  if (watcher) { await watcher.close(); watcher = null }

  watcher = chokidar.watch(dirs.filter(d => fs.existsSync(d)), {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 1500, pollInterval: 200 },
  })

  watcher.on('add', async (filePath) => {
    if (!EXTENSIONS.has(path.extname(filePath).toLowerCase())) return
    try {
      const stat = fs.statSync(filePath)
      const meta = await parseFile(filePath, { duration: true })
      const { common, format } = meta
      const data = loadData()
      const id = Buffer.from(filePath).toString('base64')
      const pic = common.picture?.[0]
      if (pic) {
        coverCache.set(id, `data:${pic.format};base64,${Buffer.from(pic.data).toString('base64')}`)
      }
      const track = {
        id,
        path: filePath,
        title: common.title || path.basename(filePath, path.extname(filePath)),
        artist: common.artist || common.albumartist || 'Unknown Artist',
        album: common.album || 'Unknown Album',
        year: common.year || null,
        duration: format.duration || 0,
        bpm: data.bpm?.[id] || common.bpm || null,
        addedAt: stat.mtimeMs,
        playCount: 0,
        tags: data.tags?.[id] || [],
        hasCover: !!pic,
      }
      appendChangelog('+', filePath)
      mainWindow?.webContents.send('track-added', track)
    } catch { /* skip */ }
  })

  watcher.on('unlink', (filePath) => {
    if (!EXTENSIONS.has(path.extname(filePath).toLowerCase())) return
    appendChangelog('-', filePath)
    mainWindow?.webContents.send('track-removed', filePath)
  })
})

// ── IPC: cover art ─────────────────────────────────────────────────────────
ipcMain.handle('get-cover', (_, trackId) => coverCache.get(trackId) || null)
