const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  scanDirs: (dirs) => ipcRenderer.invoke('scan-dirs', dirs),
  getDefaultDirs: () => ipcRenderer.invoke('get-default-dirs'),
  pickDirectory: () => ipcRenderer.invoke('pick-directory'),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowResize: (size) => ipcRenderer.invoke('window-resize', size),
  // playlists
  playlistList: () => ipcRenderer.invoke('playlist-list'),
  playlistCreate: (name) => ipcRenderer.invoke('playlist-create', name),
  playlistRename: (args) => ipcRenderer.invoke('playlist-rename', args),
  playlistDelete: (name) => ipcRenderer.invoke('playlist-delete', name),
  playlistSave: (args) => ipcRenderer.invoke('playlist-save', args),
  playlistExport: (args) => ipcRenderer.invoke('playlist-export', args),
  playlistImport: () => ipcRenderer.invoke('playlist-import'),
  // tags
  tagsSave: (args) => ipcRenderer.invoke('tags-save', args),
  tagsLoadAll: () => ipcRenderer.invoke('tags-load-all'),
})
