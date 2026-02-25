/**
 * Global keyboard shortcuts handler
 * Implements customizable keyboard shortcuts across the application
 */

import { useEffect } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import {
  useKeyboardShortcutsStore,
  QUICK_REACTION_EMOJIS,
  type ShortcutAction
} from '../store/keyboardShortcutsStore';
import { voiceService } from '../services/voice';

export interface KeyboardShortcutHandlers {
  onToggleSettings?: () => void;
  onSearch?: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  onUploadFile?: () => void;
  onEmojiPicker?: () => void;
  onMarkRead?: () => void;
  onPinMessage?: () => void;
  onQuickReaction?: (emoji: string) => void;
}

// Convert key event to shortcut string
function eventToShortcut(e: KeyboardEvent): string {
  const keys: string[] = [];

  if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
  if (e.shiftKey) keys.push('Shift');
  if (e.altKey) keys.push('Alt');

  const keyMap: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    ' ': 'Space'
  };

  const mainKey = keyMap[e.key] || e.key.toUpperCase();
  keys.push(mainKey);

  return keys.join('+');
}

export function useKeyboardShortcuts(handlers?: KeyboardShortcutHandlers) {
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

  const { shortcuts, enabled } = useKeyboardShortcutsStore();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input/textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Don't trigger shortcuts while typing
      if (!isTyping) {
        const pressedKey = eventToShortcut(e);

        // Match against custom shortcuts
        for (const [action, shortcut] of Object.entries(shortcuts)) {
          if (shortcut.keys === pressedKey) {
            e.preventDefault();

            // Type assertion needed since Object.entries returns string keys
            const shortcutAction = action as ShortcutAction;

            switch (shortcutAction) {
              case 'toggle-mute':
                setMuted(!isMuted);
                break;

              case 'toggle-deafen':
                setDeafened(!isDeafened);
                break;

              case 'toggle-video':
                setVideoEnabled(!isVideoEnabled);
                break;

              case 'toggle-screenshare':
                if (isVideoEnabled) {
                  setScreenSharing(!isScreenSharing);
                }
                break;

              case 'leave-voice':
                voiceService.leaveChannel();
                break;

              case 'search':
                handlers?.onSearch?.();
                break;

              case 'next-channel':
                handlers?.onNextChannel?.();
                break;

              case 'prev-channel':
                handlers?.onPrevChannel?.();
                break;

              case 'upload-file':
                handlers?.onUploadFile?.();
                break;

              case 'emoji-picker':
                handlers?.onEmojiPicker?.();
                break;

              case 'mark-read':
                handlers?.onMarkRead?.();
                break;

              case 'pin-message':
                handlers?.onPinMessage?.();
                break;

              case 'emoji-react-1':
              case 'emoji-react-2':
              case 'emoji-react-3':
              case 'emoji-react-4':
              case 'emoji-react-5': {
                // Use action as key to get emoji from mapping
                const emoji = QUICK_REACTION_EMOJIS[shortcutAction];
                if (emoji) {
                  handlers?.onQuickReaction?.(emoji);
                }
                break;
              }

              default:
                // Silently ignore unhandled actions
                break;
            }

            return; // Shortcut handled
          }
        }

        // Ctrl+, - Toggle Settings (hardcoded)
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
          e.preventDefault();
          handlers?.onToggleSettings?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // NOTE: handlers object may change on each render causing re-registration.
    // Consider wrapping handlers in useCallback if performance issues arise.
  }, [
    enabled,
    shortcuts,
    isMuted,
    isDeafened,
    isVideoEnabled,
    isScreenSharing,
    setMuted,
    setDeafened,
    setVideoEnabled,
    setScreenSharing,
    handlers
  ]);
}
