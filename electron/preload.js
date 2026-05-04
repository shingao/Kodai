const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  scanDirs: (dirs) => ipcRenderer.invoke('scan-dirs', dirs),
  getDefaultDirs: () => ipcRenderer.invoke('get-default-dirs'),
  pickDirectory: () => ipcRenderer.invoke('pick-directory'),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowResize: (size) => ipcRenderer.invoke('window-resize', size),
})
