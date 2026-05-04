const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow

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
  const dir = path.join(os.homedir(), 'Music', 'SONIC_OS', 'playlists')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function dataFile() {
  const dir = path.join(os.homedir(), '.config', 'sonic-os')
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
          const meta = await parseFile(full, { duration: true, skipCovers: true })
          const { common, format } = meta
          const id = Buffer.from(full).toString('base64')
          tracks.push({
            id,
            path: full,
            title: common.title || path.basename(full, path.extname(full)),
            artist: common.artist || common.albumartist || 'Unknown Artist',
            album: common.album || 'Unknown Album',
            year: common.year || null,
            duration: format.duration || 0,
            bpm: common.bpm || null,
            addedAt: stat.mtimeMs,
            playCount: 0,
            tags: data.tags?.[id] || [],
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

// ── IPC: playlists ─────────────────────────────────────────────────────────
ipcMain.handle('playlist-list', () => {
  const dir = playlistsDir()
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.m3u'))
    .map(f => {
      const name = f.replace(/\.m3u$/, '')
      const content = fs.readFileSync(path.join(dir, f), 'utf8')
      const paths = content.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'))
      return { name, paths }
    })
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
