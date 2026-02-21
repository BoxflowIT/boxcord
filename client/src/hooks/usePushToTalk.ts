// Push-to-Talk Hook - Keyboard control for voice
import { useEffect, useCallback } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { voiceService } from '../services/voice.service';
import { logger } from '../utils/logger';

interface UsePushToTalkOptions {
  enabled: boolean;
  key?: string; // Default: 'v' (like Discord)
}

export function usePushToTalk({ enabled, key = 'v' }: UsePushToTalkOptions) {
  const { isPushToTalk, isMuted, isConnected } = useVoiceStore((s) => ({
    isPushToTalk: s.isPushToTalk,
    isMuted: s.isMuted,
    isConnected: s.isConnected
  }));

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only work when PTT is enabled and connected to voice
      if (!enabled || !isPushToTalk || !isConnected) return;

      // Ignore key repeat events (holding down the key)
      if (e.repeat) return;

      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check if the PTT key is pressed
      if (e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();

        // Only unmute if currently muted
        if (isMuted) {
          voiceService.toggleMute();
          logger.debug('🎤 PTT: Unmuted (key pressed)');
        }
      }
    },
    [enabled, isPushToTalk, isConnected, isMuted, key]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      // Only work when PTT is enabled and connected to voice
      if (!enabled || !isPushToTalk || !isConnected) return;

      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check if the PTT key is released
      if (e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();

        // Mute again when key is released
        if (!isMuted) {
          voiceService.toggleMute();
          logger.debug('🎤 PTT: Muted (key released)');
        }
      }
    },
    [enabled, isPushToTalk, isConnected, isMuted, key]
  );

  useEffect(() => {
    if (!enabled || !isPushToTalk || !isConnected) return;

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Auto-mute when PTT is enabled
    if (!isMuted) {
      voiceService.toggleMute();
      logger.debug('🎤 PTT mode enabled - auto-muted');
    }

    return () => {
      // Cleanup event listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, isPushToTalk, isConnected, handleKeyDown, handleKeyUp, isMuted]);

  return {
    isPushToTalkActive: enabled && isPushToTalk && isConnected
  };
}
