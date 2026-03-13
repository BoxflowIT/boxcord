import { BrowserWindow, ipcMain, Notification, app } from 'electron';
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

export function registerNotificationHandlers(mainWindow: BrowserWindow): void {
  // Desktop notification from renderer
  ipcMain.on(
    'notification:show',
    (
      _event,
      payload: {
        title: string;
        body: string;
        tag?: string;
      }
    ) => {
      // Only show native notification if window is not focused
      if (mainWindow.isFocused()) return;

      const notification = new Notification({
        title: payload.title,
        body: payload.body,
        icon: getAssetPath('build', 'icon-256.png'),
        silent: false
      });

      notification.on('click', () => {
        mainWindow.show();
        mainWindow.focus();
        // Tell renderer which notification was clicked
        if (payload.tag) {
          mainWindow.webContents.send('notification:clicked', payload.tag);
        }
      });

      notification.show();
    }
  );

  // Flash taskbar on new message when window is not focused
  ipcMain.on('notification:flash', () => {
    if (!mainWindow.isFocused()) {
      mainWindow.flashFrame(true);
    }
  });

  // Stop flashing when focused
  mainWindow.on('focus', () => {
    mainWindow.flashFrame(false);
  });
}
