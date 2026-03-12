/**
 * Platform detection for Electron desktop vs web browser.
 * When running inside Electron, window.electronAPI is available
 * via the preload script's contextBridge.
 */

export interface ElectronAPI {
  isDesktop: () => Promise<boolean>;
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  showNotification: (payload: {
    title: string;
    body: string;
    tag?: string;
  }) => void;
  flashFrame: () => void;
  onNotificationClicked: (callback: (tag: string) => void) => () => void;
  setBadgeCount: (count: number) => void;
  canEmbed: () => Promise<boolean>;
  onUpdateAvailable: (callback: (version: string) => void) => () => void;
  onUpdateDownloaded: (callback: (version: string) => void) => () => void;
  onUpdateError: (callback: (message: string) => void) => () => void;
  installUpdate: () => void;
  storeGet: (key: string) => Promise<unknown>;
  storeSet: (key: string, value: unknown) => void;
  clearCache: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/** True when running inside Electron desktop app */
export const isDesktop = (): boolean => {
  return typeof window !== 'undefined' && !!window.electronAPI;
};

/** Get the Electron API (only available in desktop app) */
export const getElectronAPI = (): ElectronAPI | null => {
  return window.electronAPI ?? null;
};

/** Navigate to an external URL — uses system browser in Electron, redirect in web */
export const openExternalUrl = (url: string): void => {
  const api = getElectronAPI();
  if (api) {
    api.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
