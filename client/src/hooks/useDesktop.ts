import { useState, useEffect } from 'react';
import { isDesktop, getElectronAPI } from '../utils/platform';
import { socketService, getQueryClient } from '../services/socket';

/**
 * Hook for desktop app features.
 * Returns { isDesktop, canEmbed, version, platform } and
 * no-ops gracefully when running in a regular browser.
 */
export function useDesktop() {
  const [desktop, setDesktop] = useState(isDesktop());
  const [canEmbed, setCanEmbed] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [updateReady, setUpdateReady] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    const api = getElectronAPI();
    if (!api) return;

    setDesktop(true);
    api.canEmbed().then(setCanEmbed);
    api.getVersion().then(setVersion);

    const unsubAvailable = api.onUpdateAvailable((ver) => {
      setUpdateError(null);
      setUpdateAvailable(ver);
    });
    const unsubDownloaded = api.onUpdateDownloaded((ver) => {
      setUpdateError(null);
      setUpdateReady(ver);
    });
    const unsubError = api.onUpdateError?.((msg) => setUpdateError(msg));

    // Sleep/wake: refresh token, reconnect socket, invalidate stale queries
    const unsubResume = api.onSystemResume?.(() => {
      import('../services/cognito').then(({ refreshAuthToken }) => {
        refreshAuthToken().then(() => {
          socketService.reconnect();
          getQueryClient()?.invalidateQueries();
        });
      });
    });

    return () => {
      unsubAvailable();
      unsubDownloaded();
      unsubError?.();
      unsubResume?.();
    };
  }, []);

  return {
    isDesktop: desktop,
    canEmbed,
    version,
    updateReady,
    updateAvailable,
    updateError,
    checkingUpdate,
    installUpdate: () => getElectronAPI()?.installUpdate(),
    checkForUpdates: async () => {
      const api = getElectronAPI();
      if (!api?.checkForUpdates) return;
      setCheckingUpdate(true);
      setUpdateError(null);
      try {
        const result = await api.checkForUpdates();
        if (result.error) setUpdateError(result.error);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to check for updates';
        setUpdateError(message);
        console.error('checkForUpdates failed:', err);
      } finally {
        setCheckingUpdate(false);
      }
    },
    showNotification: (payload: {
      title: string;
      body: string;
      tag?: string;
    }) => getElectronAPI()?.showNotification(payload),
    setBadgeCount: (count: number) => getElectronAPI()?.setBadgeCount(count)
  };
}
