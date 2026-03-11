import ElectronStore from 'electron-store';

interface StoreSchema {
  windowState: {
    width: number;
    height: number;
    x: number | undefined;
    y: number | undefined;
    isMaximized: boolean;
  };
  [key: string]: unknown;
}

let store: ElectronStore<StoreSchema> | null = null;

export function getStore(): ElectronStore<StoreSchema> {
  if (!store) {
    store = new ElectronStore<StoreSchema>({
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
