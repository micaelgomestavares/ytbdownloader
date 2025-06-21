const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Download management
  startDownload: (url, options) => ipcRenderer.invoke('start-download', url, options),
  cancelDownload: (id) => ipcRenderer.invoke('cancel-download', id),
  pauseDownload: (id) => ipcRenderer.invoke('pause-download', id),
  resumeDownload: (id) => ipcRenderer.invoke('resume-download', id),

  // File system operations
  selectFolder: (title) => ipcRenderer.invoke('select-folder', title),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),

  // Video info
  getVideoInfo: (url) => ipcRenderer.invoke('get-video-info', url),
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('get-settings'),
  showFirstRunDialog: () => ipcRenderer.invoke('show-first-run-dialog'),

  // Downloads management
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  addDownload: (url, options) => ipcRenderer.invoke('start-download', url, options),
  removeDownload: (id) => ipcRenderer.invoke('cancel-download', id),

  // Folder operations
  getDownloadsPath: () => ipcRenderer.invoke('get-downloads-path'),
  showInFolder: (path) => ipcRenderer.invoke('open-folder', path),

  // Download events
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  onDownloadComplete: (callback) => {
    ipcRenderer.on('download-complete', (event, data) => callback(data));
  },
  onDownloadError: (callback) => {
    ipcRenderer.on('download-error', (event, data) => callback(data));
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Development helpers
  isDev: () => ipcRenderer.invoke('is-dev'),
  openDevTools: () => ipcRenderer.invoke('open-dev-tools')
});

// Console proxy for debugging
window.addEventListener('DOMContentLoaded', () => {
  console.log('🔌 Preload script loaded');
  console.log('📱 Electron API exposed:', Object.keys(window.electronAPI || {}));
});
