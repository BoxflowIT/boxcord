import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

/**
 * Exposed to the renderer process via window.electronAPI
 * All IPC communication goes through this typed bridge
 */
const electronAPI = {
  // ─── Platform info ───────────────────────────
  isDesktop: () => ipcRenderer.invoke('app:is-desktop') as Promise<boolean>,
  getVersion: () => ipcRenderer.invoke('app:version') as Promise<string>,
  getPlatform: () => ipcRenderer.invoke('app:platform') as Promise<string>,

  // ─── Window controls ────────────────────────
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // ─── Notifications ──────────────────────────
  showNotification: (payload: { title: string; body: string; tag?: string }) =>
    ipcRenderer.send('notification:show', payload),
  flashFrame: () => ipcRenderer.send('notification:flash'),
  onNotificationClicked: (callback: (tag: string) => void) => {
    const handler = (_event: IpcRendererEvent, tag: string) => callback(tag);
    ipcRenderer.on('notification:clicked', handler);
    return () => ipcRenderer.removeListener('notification:clicked', handler);
  },

  // ─── Badge count ────────────────────────────
  setBadgeCount: (count: number) => ipcRenderer.send('app:set-badge', count),

  // ─── SharePoint webview ─────────────────────
  canEmbed: () => ipcRenderer.invoke('webview:can-embed') as Promise<boolean>,

  // ─── Auto-update ────────────────────────────
  onUpdateAvailable: (callback: (version: string) => void) => {
    const handler = (_event: IpcRendererEvent, version: string) =>
      callback(version);
    ipcRenderer.on('update:available', handler);
    return () => ipcRenderer.removeListener('update:available', handler);
  },
  onUpdateDownloaded: (callback: (version: string) => void) => {
    const handler = (_event: IpcRendererEvent, version: string) =>
      callback(version);
    ipcRenderer.on('update:downloaded', handler);
    return () => ipcRenderer.removeListener('update:downloaded', handler);
  },
  installUpdate: () => ipcRenderer.send('update:install'),

  // ─── Persistent store ───────────────────────
  storeGet: (key: string) =>
    ipcRenderer.invoke('store:get', key) as Promise<unknown>,
  storeSet: (key: string, value: unknown) =>
    ipcRenderer.send('store:set', key, value)
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the renderer
export type ElectronAPI = typeof electronAPI;
