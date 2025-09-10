const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Speech provider API
  speech: {
    getConfig: () => ipcRenderer.invoke('speech:getConfig'),
    updateConfig: (config) => ipcRenderer.invoke('speech:updateConfig', config),
    recognize: (audioBuffer) => ipcRenderer.invoke('speech:recognize', audioBuffer),
    synthesize: (text) => ipcRenderer.invoke('speech:synthesize', text),
    getStatus: () => ipcRenderer.invoke('speech:getStatus')
  },

  // Interview session API (to be implemented)
  interview: {
    start: (config) => ipcRenderer.invoke('interview:start', config),
    stop: () => ipcRenderer.invoke('interview:stop'),
    getStatus: () => ipcRenderer.invoke('interview:getStatus')
  },

  // System API
  system: {
    getVersion: () => ipcRenderer.invoke('system:getVersion'),
    quit: () => ipcRenderer.invoke('system:quit')
  }
});