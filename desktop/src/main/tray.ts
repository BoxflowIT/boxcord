import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAssetPath(...segments: string[]): string {
  const asarPath = path.join(__dirname, '..', '..', ...segments);
  return app.isPackaged
    ? asarPath.replace('app.asar', 'app.asar.unpacked')
    : asarPath;
}

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow): void {
  const iconPath = getAssetPath('build', 'icon-256.png');

  // Fallback: create a simple 16x16 icon if file doesn't exist
  let trayIcon: Electron.NativeImage;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) throw new Error('Empty icon');
  } catch {
    // Create a minimal tray icon programmatically
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Boxcord');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Boxcord',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Click tray icon to show/hide window
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

export function updateTrayBadge(count: number): void {
  if (!tray) return;
  tray.setToolTip(count > 0 ? `Boxcord (${count} unread)` : 'Boxcord');
}
