import { BrowserWindow, ipcMain, Notification } from 'electron';

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
        icon: undefined, // Uses app icon by default
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
