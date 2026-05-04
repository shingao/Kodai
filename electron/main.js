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
  // Register file:// protocol to serve local audio files
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

// ── IPC: scan directories ──────────────────────────────────────────────────
ipcMain.handle('scan-dirs', async (event, dirs) => {
  const { parseFile } = await import('music-metadata')
  const EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.ogg', '.m4a'])
  const tracks = []

  async function walk(dir) {
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(full)
        }
      } else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        try {
          const stat = fs.statSync(full)
          const meta = await parseFile(full, { duration: true, skipCovers: true })
          const { common, format } = meta
          tracks.push({
            id: Buffer.from(full).toString('base64'),
            path: full,
            title: common.title || path.basename(full, path.extname(full)),
            artist: common.artist || common.albumartist || 'Unknown Artist',
            album: common.album || 'Unknown Album',
            year: common.year || null,
            duration: format.duration || 0,
            bpm: common.bpm || null,
            addedAt: stat.mtimeMs,
            playCount: 0,
            tags: [],
          })
        } catch {
          // skip unreadable files
        }
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
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  return result.filePaths[0] || null
})

// ── IPC: window controls ───────────────────────────────────────────────────
ipcMain.handle('window-minimize', () => mainWindow.minimize())
ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize()
  else mainWindow.maximize()
})
ipcMain.handle('window-close', () => mainWindow.close())
ipcMain.handle('window-resize', (_, { width, height }) => {
  mainWindow.setSize(width, height, true)
})
