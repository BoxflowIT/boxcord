// Hook for video window mode management
// Centralizes all mode-related logic and prevents click race conditions

import { useCallback } from 'react';
import { useVoiceStore, VideoWindowMode } from '../store/voiceStore';
import { useShallow } from 'zustand/react/shallow';

const CLICK_DEBOUNCE_MS = 200;

export function useVideoWindowMode() {
  const {
    mode,
    previousMode,
    modeChangedAt,
    setVideoWindowMode: setMode
  } = useVoiceStore(
    useShallow((s) => ({
      mode: s.videoWindow.mode,
      previousMode: s.videoWindow.previousMode,
      modeChangedAt: s.videoWindow.modeChangedAt,
      setVideoWindowMode: s.setVideoWindowMode
    }))
  );

  // Safe mode setter that prevents rapid clicks
  const setVideoWindowMode = useCallback(
    (newMode: VideoWindowMode) => {
      const timeSince = Date.now() - modeChangedAt;
      if (timeSince < CLICK_DEBOUNCE_MS) {
        return false;
      }
      setMode(newMode);
      return true;
    },
    [modeChangedAt, setMode]
  );

  // Force set mode (no debounce - for programmatic changes)
  const forceSetMode = useCallback(
    (newMode: VideoWindowMode) => {
      setMode(newMode);
    },
    [setMode]
  );

  return {
    mode,
    previousMode,
    modeChangedAt,
    setVideoWindowMode,
    forceSetMode,
    isFullscreen: mode === 'fullscreen',
    isMinimized: mode === 'minimized',
    isFloating: mode === 'floating',
    isPip: mode === 'pip'
  };
}
