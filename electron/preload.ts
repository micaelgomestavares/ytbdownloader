import { contextBridge, ipcRenderer } from 'electron';

interface DownloadOptions {
  title?: string;
  uploader?: string;
  duration?: string;
  outputPath?: string;
  quality?: string;
  format?: string;
}

interface Settings {
  downloadPath: string;
  quality: string;
  format: string;
  isFirstRun?: boolean;
}

interface ElectronAPI {
  // Download management
  startDownload: (url: string, options?: DownloadOptions) => Promise<string>;
  cancelDownload: (id: string) => Promise<boolean>;
  pauseDownload: (id: string) => Promise<boolean>;
  resumeDownload: (id: string) => Promise<boolean>;

  // File system operations
  selectFolder: (title: string) => Promise<string | null>;
  openFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
  // Video info
  getVideoInfo: (url: string) => Promise<any>;
  getPlaylistCount: (url: string) => Promise<number>;

  // Settings
  getSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<{ success: boolean; error?: string }>;
  loadSettings: () => Promise<Settings>;
  showFirstRunDialog: () => Promise<{
    success: boolean;
    path?: string;
    cancelled?: boolean;
    error?: string;
  }>;

  // Downloads management
  getDownloads: () => Promise<any[]>;
  addDownload: (url: string, options?: DownloadOptions) => Promise<string>;
  removeDownload: (id: string) => Promise<boolean>;

  // Folder operations
  getDownloadsPath: () => Promise<string>;
  showInFolder: (path: string) => Promise<{ success: boolean; error?: string }>;

  // Download events
  onDownloadProgress: (callback: (data: any) => void) => void;
  onDownloadComplete: (callback: (data: any) => void) => void;
  onDownloadError: (callback: (data: any) => void) => void;

  // Remove listeners
  removeAllListeners: (channel: string) => void;

  // App info
  getAppVersion: () => Promise<string>;

  // Development helpers
  isDev: () => Promise<boolean>;
  openDevTools: () => Promise<void>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
  // Download management
  startDownload: (url: string, options?: DownloadOptions) =>
    ipcRenderer.invoke('start-download', url, options),
  cancelDownload: (id: string) => ipcRenderer.invoke('cancel-download', id),
  pauseDownload: (id: string) => ipcRenderer.invoke('pause-download', id),
  resumeDownload: (id: string) => ipcRenderer.invoke('resume-download', id),

  // File system operations
  selectFolder: (title: string) => ipcRenderer.invoke('select-folder', title),
  openFolder: (path: string) => ipcRenderer.invoke('open-folder', path),
  // Video info
  getVideoInfo: (url: string) => ipcRenderer.invoke('get-video-info', url),
  getPlaylistCount: (url: string) => ipcRenderer.invoke('get-playlist-count', url),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('get-settings'),
  showFirstRunDialog: () => ipcRenderer.invoke('show-first-run-dialog'),

  // Downloads management
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  addDownload: (url: string, options?: DownloadOptions) =>
    ipcRenderer.invoke('start-download', url, options),
  removeDownload: (id: string) => ipcRenderer.invoke('cancel-download', id),

  // Folder operations
  getDownloadsPath: () => ipcRenderer.invoke('get-downloads-path'),
  showInFolder: (path: string) => ipcRenderer.invoke('open-folder', path),

  // Download events
  onDownloadProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('download-progress', (_event, data) => callback(data));
  },
  onDownloadComplete: (callback: (data: any) => void) => {
    ipcRenderer.on('download-complete', (_event, data) => callback(data));
  },
  onDownloadError: (callback: (data: any) => void) => {
    ipcRenderer.on('download-error', (_event, data) => callback(data));
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Development helpers
  isDev: () => ipcRenderer.invoke('is-dev'),
  openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Console proxy for debugging
window.addEventListener('DOMContentLoaded', () => {
  console.log('🔌 Preload script loaded');
  console.log('📱 Electron API exposed:', Object.keys((window as any).electronAPI || {}));
});

// Declare global types for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
