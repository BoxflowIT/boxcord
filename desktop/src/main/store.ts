import ElectronStore from 'electron-store';
const Store =
  (ElectronStore as unknown as { default: typeof ElectronStore }).default ||
  ElectronStore;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getStore(): any {
  if (!store) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store = new (Store as any)({
      name: 'boxcord-settings',
      defaults: {
        windowState: {
          width: 1280,
          height: 800,
          x: undefined,
          y: undefined,
          isMaximized: false
        }
      }
    });
  }
  return store;
}
