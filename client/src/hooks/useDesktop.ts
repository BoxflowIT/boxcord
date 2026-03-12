import { useState, useEffect } from 'react';
import { isDesktop, getElectronAPI } from '../utils/platform';

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
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const api = getElectronAPI();
    if (!api) return;

    setDesktop(true);
    api.canEmbed().then(setCanEmbed);
    api.getVersion().then(setVersion);

    const unsubDownloaded = api.onUpdateDownloaded((ver) =>
      setUpdateReady(ver)
    );
    const unsubError = api.onUpdateError?.((msg) => setUpdateError(msg));
    return () => {
      unsubDownloaded();
      unsubError?.();
    };
  }, []);

  return {
    isDesktop: desktop,
    canEmbed,
    version,
    updateReady,
    updateError,
    installUpdate: () => getElectronAPI()?.installUpdate(),
    showNotification: (payload: {
      title: string;
      body: string;
      tag?: string;
    }) => getElectronAPI()?.showNotification(payload),
    setBadgeCount: (count: number) => getElectronAPI()?.setBadgeCount(count)
  };
}
