const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  scanDirs: (dirs) => ipcRenderer.invoke('scan-dirs', dirs),
  getDefaultDirs: () => ipcRenderer.invoke('get-default-dirs'),
  pickDirectory: () => ipcRenderer.invoke('pick-directory'),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowResize: (size) => ipcRenderer.invoke('window-resize', size),
  windowFocusMode: (args) => ipcRenderer.invoke('window-focus-mode', args),
  // playlists
  playlistList: () => ipcRenderer.invoke('playlist-list'),
  playlistCreate: (name) => ipcRenderer.invoke('playlist-create', name),
  playlistRename: (args) => ipcRenderer.invoke('playlist-rename', args),
  playlistDelete: (name) => ipcRenderer.invoke('playlist-delete', name),
  playlistSave: (args) => ipcRenderer.invoke('playlist-save', args),
  playlistExport: (args) => ipcRenderer.invoke('playlist-export', args),
  playlistImport: () => ipcRenderer.invoke('playlist-import'),
  // smart playlists
  smartPlaylistCreate: (args) => ipcRenderer.invoke('smart-playlist-create', args),
  smartPlaylistDelete: (name) => ipcRenderer.invoke('smart-playlist-delete', name),
  smartPlaylistEval: (args) => ipcRenderer.invoke('smart-playlist-eval', args),
  // tags
  tagsSave: (args) => ipcRenderer.invoke('tags-save', args),
  tagsLoadAll: () => ipcRenderer.invoke('tags-load-all'),
  // chokidar watch
  watchStart: (dirs) => ipcRenderer.invoke('watch-start', dirs),
  onTrackAdded: (cb) => {
    const handler = (_, track) => cb(track)
    ipcRenderer.on('track-added', handler)
    return () => ipcRenderer.removeListener('track-added', handler)
  },
  onTrackRemoved: (cb) => {
    const handler = (_, filePath) => cb(filePath)
    ipcRenderer.on('track-removed', handler)
    return () => ipcRenderer.removeListener('track-removed', handler)
  },
})
