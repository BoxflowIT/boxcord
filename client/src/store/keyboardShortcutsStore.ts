/**
 * Keyboard Shortcuts Store - Custom keybinds and shortcuts management
 * Allows users to customize keyboard shortcuts
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShortcutAction =
  | 'next-channel'
  | 'prev-channel'
  | 'search'
  | 'upload-file'
  | 'emoji-picker'
  | 'toggle-mute'
  | 'toggle-deafen'
  | 'toggle-video'
  | 'toggle-screenshare'
  | 'leave-voice'
  | 'mark-read'
  | 'pin-message'
  | 'emoji-react-1'
  | 'emoji-react-2'
  | 'emoji-react-3'
  | 'emoji-react-4'
  | 'emoji-react-5';

export interface KeyboardShortcut {
  action: ShortcutAction;
  keys: string; // e.g., "Ctrl+Shift+M" or "Alt+1"
  description: string;
  category: 'navigation' | 'messaging' | 'voice' | 'reactions' | 'general';
  customizable: boolean;
}

// Default shortcuts
const DEFAULT_SHORTCUTS: Record<ShortcutAction, KeyboardShortcut> = {
  'next-channel': {
    action: 'next-channel',
    keys: 'Alt+↓',
    description: 'Navigate to next channel',
    category: 'navigation',
    customizable: true
  },
  'prev-channel': {
    action: 'prev-channel',
    keys: 'Alt+↑',
    description: 'Navigate to previous channel',
    category: 'navigation',
    customizable: true
  },
  search: {
    action: 'search',
    keys: 'Ctrl+K',
    description: 'Open search',
    category: 'navigation',
    customizable: true
  },
  'upload-file': {
    action: 'upload-file',
    keys: 'Ctrl+U',
    description: 'Upload file',
    category: 'messaging',
    customizable: true
  },
  'emoji-picker': {
    action: 'emoji-picker',
    keys: 'Ctrl+E',
    description: 'Open emoji picker',
    category: 'messaging',
    customizable: true
  },
  'toggle-mute': {
    action: 'toggle-mute',
    keys: 'Ctrl+Shift+M',
    description: 'Toggle microphone',
    category: 'voice',
    customizable: true
  },
  'toggle-deafen': {
    action: 'toggle-deafen',
    keys: 'Ctrl+Shift+D',
    description: 'Toggle deafen',
    category: 'voice',
    customizable: true
  },
  'toggle-video': {
    action: 'toggle-video',
    keys: 'Ctrl+Shift+V',
    description: 'Toggle video',
    category: 'voice',
    customizable: true
  },
  'toggle-screenshare': {
    action: 'toggle-screenshare',
    keys: 'Ctrl+Shift+S',
    description: 'Toggle screen share',
    category: 'voice',
    customizable: true
  },
  'leave-voice': {
    action: 'leave-voice',
    keys: 'Ctrl+Shift+L',
    description: 'Leave voice channel',
    category: 'voice',
    customizable: true
  },
  'mark-read': {
    action: 'mark-read',
    keys: 'Ctrl+Shift+A',
    description: 'Mark all as read',
    category: 'general',
    customizable: true
  },
  'pin-message': {
    action: 'pin-message',
    keys: 'Ctrl+P',
    description: 'Pin/unpin message',
    category: 'messaging',
    customizable: true
  },
  'emoji-react-1': {
    action: 'emoji-react-1',
    keys: '1',
    description: 'Quick reaction 1 (👍)',
    category: 'reactions',
    customizable: true
  },
  'emoji-react-2': {
    action: 'emoji-react-2',
    keys: '2',
    description: 'Quick reaction 2 (❤️)',
    category: 'reactions',
    customizable: true
  },
  'emoji-react-3': {
    action: 'emoji-react-3',
    keys: '3',
    description: 'Quick reaction 3 (😂)',
    category: 'reactions',
    customizable: true
  },
  'emoji-react-4': {
    action: 'emoji-react-4',
    keys: '4',
    description: 'Quick reaction 4 (🎉)',
    category: 'reactions',
    customizable: true
  },
  'emoji-react-5': {
    action: 'emoji-react-5',
    keys: '5',
    description: 'Quick reaction 5 (🔥)',
    category: 'reactions',
    customizable: true
  }
};

// Quick reaction emoji mapping
export const QUICK_REACTION_EMOJIS: Record<string, string> = {
  'emoji-react-1': '👍',
  'emoji-react-2': '❤️',
  'emoji-react-3': '😂',
  'emoji-react-4': '🎉',
  'emoji-react-5': '🔥'
};

interface KeyboardShortcutsState {
  shortcuts: Record<ShortcutAction, KeyboardShortcut>;
  enabled: boolean;
  getShortcut: (action: ShortcutAction) => KeyboardShortcut;
  setShortcut: (action: ShortcutAction, keys: string) => void;
  resetShortcut: (action: ShortcutAction) => void;
  resetAll: () => void;
  setEnabled: (enabled: boolean) => void;
  hasConflict: (keys: string, excludeAction?: ShortcutAction) => boolean;
}

export const useKeyboardShortcutsStore = create<KeyboardShortcutsState>()(
  persist(
    (set, get) => ({
      shortcuts: { ...DEFAULT_SHORTCUTS },
      enabled: true,

      getShortcut: (action) => {
        return get().shortcuts[action];
      },

      setShortcut: (action, keys) => {
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            [action]: {
              ...state.shortcuts[action],
              keys
            }
          }
        }));
      },

      resetShortcut: (action) => {
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            [action]: { ...DEFAULT_SHORTCUTS[action] }
          }
        }));
      },

      resetAll: () => {
        set({ shortcuts: { ...DEFAULT_SHORTCUTS } });
      },

      setEnabled: (enabled) => {
        set({ enabled });
      },

      hasConflict: (keys, excludeAction) => {
        const shortcuts = get().shortcuts;
        return Object.entries(shortcuts).some(
          ([action, shortcut]) =>
            action !== excludeAction && shortcut.keys === keys
        );
      }
    }),
    {
      name: 'keyboard-shortcuts'
    }
  )
);
