const { contextBridge, ipcRenderer } = require('electron');

// Puente seguro entre el proceso principal y la interfaz.
// No exponemos Node ni ipcRenderer completos, solo funciones concretas.
contextBridge.exposeInMainWorld('hardware', {
  getStaticInfo: () => ipcRenderer.invoke('get-static-info'),
  getRealtimeInfo: () => ipcRenderer.invoke('get-realtime-info'),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  notifyReady: () => ipcRenderer.send('app-ready'),
  // Red
  speedTest: () => ipcRenderer.invoke('speed-test'),
  onSpeedTestProgress: (callback) => {
    const handler = (_e, data) => callback(data);
    ipcRenderer.on('speed-test-progress', handler);
    return () => ipcRenderer.removeListener('speed-test-progress', handler);
  },
  getDns: () => ipcRenderer.invoke('get-dns'),
  setDns: (opts) => ipcRenderer.invoke('set-dns', opts),
  resetDns: (opts) => ipcRenderer.invoke('reset-dns', opts)
});

// API de actualizaciones (GitHub Releases vía electron-updater)
contextBridge.exposeInMainWorld('updater', {
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  check: () => ipcRenderer.invoke('check-for-updates'),
  download: () => ipcRenderer.invoke('download-update'),
  install: () => ipcRenderer.invoke('install-update'),
  onStatus: (callback) => {
    const handler = (_e, data) => callback(data);
    ipcRenderer.on('update-status', handler);
    // Devuelve función para limpiar el listener
    return () => ipcRenderer.removeListener('update-status', handler);
  }
});
