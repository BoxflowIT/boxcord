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
    // Create a minimal 16x16 blue icon as fallback
    const size = 16;
    const buffer = Buffer.alloc(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      buffer[i * 4] = 88; // R
      buffer[i * 4 + 1] = 101; // G
      buffer[i * 4 + 2] = 242; // B
      buffer[i * 4 + 3] = 255; // A
    }
    trayIcon = nativeImage.createFromBuffer(buffer, {
      width: size,
      height: size
    });
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
