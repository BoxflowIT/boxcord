/**
 * Global keyboard shortcuts handler
 * Implements keyboard shortcuts across the application
 */

import { useEffect } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { useDMCallStore } from '../store/dmCallStore';
import { logger } from '../utils/logger';

export function useKeyboardShortcuts(options?: {
  onToggleSettings?: () => void;
}) {
  const {
    isMuted,
    isDeafened,
    isVideoEnabled,
    isScreenSharing,
    setMuted,
    setDeafened,
    setVideoEnabled,
    setScreenSharing
  } = useVoiceStore();
  const { callState } = useDMCallStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+M - Toggle Mute (both voice and DM calls)
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setMuted(!isMuted);
        logger.info('[Shortcut] Toggled mute:', !isMuted);
        return;
      }

      // Ctrl+Shift+D - Toggle Deafen
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDeafened(!isDeafened);
        logger.info('[Shortcut] Toggled deafen:', !isDeafened);
        return;
      }

      // Ctrl+Shift+V - Toggle Video
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        setVideoEnabled(!isVideoEnabled);
        logger.info('[Shortcut] Toggled video:', !isVideoEnabled);
        return;
      }

      // Ctrl+Shift+S - Toggle Screen Share
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (isVideoEnabled) {
          setScreenSharing(!isScreenSharing);
          logger.info('[Shortcut] Toggled screen share:', !isScreenSharing);
        }
        return;
      }

      // Ctrl+, - Toggle Settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        if (options?.onToggleSettings) {
          options.onToggleSettings();
          logger.info('[Shortcut] Toggled settings');
        }
        return;
      }

      // Ctrl+F - Search (let browser handle or custom search)
      if (e.ctrlKey && e.key === 'f') {
        // Could prevent default and open custom search
        // For now, let browser handle it
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isMuted,
    isDeafened,
    isVideoEnabled,
    isScreenSharing,
    setMuted,
    setDeafened,
    setVideoEnabled,
    setScreenSharing,
    callState,
    options
  ]);
}
