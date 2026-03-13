import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  desktopCapturer,
  session,
  dialog
} from 'electron';
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTray, updateTrayBadge } from './tray.js';
import { registerNotificationHandlers } from './notifications.js';
import { getStore } from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App URL — dev script sets BOXCORD_URL to localhost; production always uses the real URL
const PROD_URL = 'https://boxcord.boxflow.com';
const APP_URL = process.env.BOXCORD_URL || PROD_URL;
const IS_DEV =
  process.env.NODE_ENV === 'development' || APP_URL.includes('localhost');

let mainWindow: BrowserWindow | null = null;

function getAssetPath(...segments: string[]): string {
  const asarPath = path.join(__dirname, '..', '..', ...segments);
  // In packaged builds, icons are unpacked outside the asar archive
  return app.isPackaged
    ? asarPath.replace('app.asar', 'app.asar.unpacked')
    : asarPath;
}

function createMainWindow(): BrowserWindow {
  const store = getStore();

  const windowState = store.get('windowState', {
    width: 1280,
    height: 800,
    x: undefined as number | undefined,
    y: undefined as number | undefined,
    isMaximized: false
  });

  const win = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 940,
    minHeight: 600,
    title: 'Boxcord',
    icon: getAssetPath('build', 'icon-1024.png'),
    backgroundColor: '#1a1a2e',
    show: false, // Show after ready-to-show for smooth startup
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true, // Enable <webview> for SharePoint embedding
      spellcheck: true
    }
  });

  if (windowState.isMaximized) {
    win.maximize();
  }

  // Persist window state on changes
  const saveWindowState = () => {
    if (win.isDestroyed()) return;
    const bounds = win.getBounds();
    store.set('windowState', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: win.isMaximized()
    });
  };

  win.on('resize', saveWindowState);
  win.on('move', saveWindowState);
  win.on('maximize', saveWindowState);
  win.on('unmaximize', saveWindowState);

  // Smooth startup — show window once content is ready
  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    try {
      const parsed = new URL(url);
      // Allow SharePoint/Office navigations within the app (hostname check, not substring)
      if (
        parsed.hostname.endsWith('.sharepoint.com') ||
        parsed.hostname.endsWith('.office.com')
      ) {
        return { action: 'deny' }; // Handled by webview
      }
    } catch {
      // Invalid URL — deny and don't open externally
      return { action: 'deny' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Navigate external links clicked in-page to default browser
  // @ts-expect-error Electron types for will-navigate don't match actual event signature
  win.webContents.on('will-navigate', (event: Event, url: string) => {
    const appOrigin = new URL(APP_URL).origin;
    if (!url.startsWith(appOrigin)) {
      event.preventDefault();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url);
      }
    }
  });

  // Load the app
  win.loadURL(APP_URL);

  // Open DevTools in dev mode
  if (IS_DEV) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  return win;
}

// ─── IPC Handlers ────────────────────────────────────────

function registerIpcHandlers() {
  // Window controls
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());

  // SharePoint webview — open URL in webview (renderer handles the actual tag)
  ipcMain.handle('webview:can-embed', () => true);

  // App info
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:platform', () => process.platform);
  ipcMain.handle('app:is-desktop', () => true);

  // Clear cached data (called on logout)
  ipcMain.handle('app:clear-cache', async () => {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData({
      storages: ['cachestorage', 'serviceworkers']
    });
  });

  // Badge count (unread messages)
  ipcMain.on('app:set-badge', (_event: IpcMainEvent, count: number) => {
    if (process.platform === 'darwin' && app.dock) {
      app.dock.setBadge(count > 0 ? String(count) : '');
    } else if (process.platform === 'linux') {
      app.setBadgeCount(count);
    }
    // Windows: update tray tooltip with unread count
    updateTrayBadge(count);
  });

  // Store (persistent settings)
  const store = getStore();
  ipcMain.handle('store:get', (_event: IpcMainInvokeEvent, key: string) =>
    store.get(key)
  );
  ipcMain.on('store:set', (_event: IpcMainEvent, key: string, value: unknown) =>
    store.set(key, value)
  );

  // ─── Media permissions (WebRTC: microphone, camera) ──────────────
  // Electron denies media permissions by default — grant them for WebRTC voice/video
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      const allowedPermissions = [
        'media',
        'mediaKeySystem',
        'display-capture',
        'notifications'
      ];
      callback(allowedPermissions.includes(permission));
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission) => {
      const allowedPermissions = [
        'media',
        'mediaKeySystem',
        'display-capture',
        'notifications'
      ];
      return allowedPermissions.includes(permission);
    }
  );

  // ─── Screen sharing (setDisplayMediaRequestHandler) ──────────────
  // Modern Electron approach: renderer calls standard getDisplayMedia(),
  // main process handles source selection via desktopCapturer
  session.defaultSession.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen', 'window'],
          thumbnailSize: { width: 320, height: 180 }
        });
        // Use first screen source (primary monitor)
        if (sources.length > 0) {
          callback({ video: sources[0] });
        } else {
          callback({});
        }
      } catch {
        callback({});
      }
    }
  );

  // ─── Open URL in system browser ────────────────────
  ipcMain.handle(
    'shell:open-external',
    (_event: IpcMainInvokeEvent, url: string) => {
      // Only allow http/https URLs for security
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return shell.openExternal(url);
      }
      return Promise.resolve();
    }
  );

  // ─── File download with save dialog ────────────────
  session.defaultSession.on('will-download', (_event, item) => {
    const fileName = item.getFilename();
    const opts: Electron.SaveDialogOptions = {
      defaultPath: fileName
    };
    dialog.showSaveDialog(mainWindow!, opts).then(({ filePath, canceled }) => {
      if (canceled || !filePath) {
        item.cancel();
      } else {
        item.setSavePath(filePath);
      }
    });
  });
}

// ─── Auto-Update ─────────────────────────────────────────

function setupAutoUpdater() {
  if (IS_DEV) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info: { version: string }) => {
    mainWindow?.webContents.send('update:available', info.version);
  });

  autoUpdater.on('update-downloaded', (info: { version: string }) => {
    mainWindow?.webContents.send('update:downloaded', info.version);
  });

  autoUpdater.on('error', (err: Error) => {
    console.error('Auto-update error:', err.message);
    mainWindow?.webContents.send('update:error', err.message);
  });

  // Check for updates every 4 hours
  autoUpdater.checkForUpdates();
  setInterval(() => autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000);

  // Allow renderer to trigger install
  ipcMain.on('update:install', () => {
    autoUpdater.quitAndInstall(false, true);
  });
}

// ─── App Lifecycle ───────────────────────────────────────

// Single instance lock — only one Boxcord window allowed
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(async () => {
  mainWindow = createMainWindow();

  registerIpcHandlers();
  registerNotificationHandlers(mainWindow);
  createTray(mainWindow);
  setupAutoUpdater();

  app.on('activate', () => {
    // macOS: re-create window when dock icon clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: prevent new window creation from renderer
(app as Electron.App).on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(({ url }: { url: string }) => {
    // Only allow http/https URLs for security
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});
