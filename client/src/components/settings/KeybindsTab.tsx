/**
 * Keybinds/Keyboard Shortcuts Settings Tab
 * Configure and view keyboard shortcuts for quick actions
 */

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { cn } from '../../utils/classNames';

interface Keybind {
  id: string;
  action: string;
  keys: string;
  category: 'navigation' | 'messaging' | 'voice' | 'general';
  customizable: boolean;
  implemented: boolean; // Whether the shortcut is currently implemented
}

const defaultKeybinds: Keybind[] = [
  // Navigation
  {
    id: 'next-channel',
    action: 'Next Channel',
    keys: 'Alt+↓',
    category: 'navigation',
    customizable: true,
    implemented: false
  },
  {
    id: 'prev-channel',
    action: 'Previous Channel',
    keys: 'Alt+↑',
    category: 'navigation',
    customizable: true,
    implemented: false
  },
  {
    id: 'search',
    action: 'Search Messages',
    keys: 'Ctrl+K',
    category: 'navigation',
    customizable: true,
    implemented: true
  },
  {
    id: 'settings',
    action: 'Open Settings',
    keys: 'Ctrl+,',
    category: 'navigation',
    customizable: false,
    implemented: true
  },

  // Messaging
  {
    id: 'send-message',
    action: 'Send Message',
    keys: 'Enter',
    category: 'messaging',
    customizable: false,
    implemented: true
  },
  {
    id: 'new-line',
    action: 'New Line',
    keys: 'Shift+Enter',
    category: 'messaging',
    customizable: false,
    implemented: true
  },
  {
    id: 'upload-file',
    action: 'Upload File',
    keys: 'Ctrl+U',
    category: 'messaging',
    customizable: true,
    implemented: false
  },
  {
    id: 'emoji-picker',
    action: 'Open Emoji Picker',
    keys: 'Ctrl+E',
    category: 'messaging',
    customizable: true,
    implemented: false
  },
  {
    id: 'edit-last',
    action: 'Edit Last Message',
    keys: '↑',
    category: 'messaging',
    customizable: false,
    implemented: false
  },

  // Voice & Video
  {
    id: 'toggle-mute',
    action: 'Toggle Mute',
    keys: 'Ctrl+Shift+M',
    category: 'voice',
    customizable: true,
    implemented: true
  },
  {
    id: 'toggle-deafen',
    action: 'Toggle Deafen',
    keys: 'Ctrl+Shift+D',
    category: 'voice',
    customizable: true,
    implemented: true
  },
  {
    id: 'toggle-video',
    action: 'Toggle Video',
    keys: 'Ctrl+Shift+V',
    category: 'voice',
    customizable: true,
    implemented: true
  },
  {
    id: 'toggle-screenshare',
    action: 'Toggle Screen Share',
    keys: 'Ctrl+Shift+S',
    category: 'voice',
    customizable: true,
    implemented: true
  },
  {
    id: 'leave-voice',
    action: 'Leave Voice Channel',
    keys: 'Ctrl+Shift+L',
    category: 'voice',
    customizable: true,
    implemented: true
  },

  // General
  {
    id: 'close-modal',
    action: 'Close Modal/Dialog',
    keys: 'Esc',
    category: 'general',
    customizable: false,
    implemented: true
  },
  {
    id: 'scroll-top',
    action: 'Scroll to Top',
    keys: 'Home',
    category: 'general',
    customizable: false,
    implemented: false
  },
  {
    id: 'scroll-bottom',
    action: 'Scroll to Bottom',
    keys: 'End',
    category: 'general',
    customizable: false,
    implemented: false
  }
];

const categoryEmojis = {
  navigation: '🧭',
  messaging: '💬',
  voice: '🎙️',
  general: '⚙️'
};

const categoryLabels = {
  navigation: 'Navigation',
  messaging: 'Messaging',
  voice: 'Voice & Video',
  general: 'General'
};

export default function KeybindsTab() {
  const { t } = useTranslation();
  const [keybinds] = useState<Keybind[]>(defaultKeybinds);
  const [selectedCategory, setSelectedCategory] = useState<
    Keybind['category'] | 'all'
  >('all');

  const filteredKeybinds =
    selectedCategory === 'all'
      ? keybinds
      : keybinds.filter((kb) => kb.category === selectedCategory);

  const groupedKeybinds = filteredKeybinds.reduce(
    (acc, kb) => {
      if (!acc[kb.category]) {
        acc[kb.category] = [];
      }
      acc[kb.category].push(kb);
      return acc;
    },
    {} as Record<Keybind['category'], Keybind[]>
  );

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          ⌨️ {t('settings.keybindCategory')}
        </label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedCategory === 'all'
                ? 'bg-boxflow-accent text-white'
                : 'bg-boxflow-darkest text-gray-300 hover:bg-boxflow-hover'
            )}
          >
            All
          </button>
          {Object.entries(categoryLabels).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as Keybind['category'])}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedCategory === cat
                  ? 'bg-boxflow-accent text-white'
                  : 'bg-boxflow-darkest text-gray-300 hover:bg-boxflow-hover'
              )}
            >
              {categoryEmojis[cat as Keybind['category']]} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Keybinds List */}
      <div className="space-y-6">
        {Object.entries(groupedKeybinds).map(([category, binds]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3 flex items-center gap-2">
              <span>{categoryEmojis[category as Keybind['category']]}</span>
              {categoryLabels[category as Keybind['category']]}
            </h3>
            <div className="space-y-2">
              {binds.map((keybind) => (
                <div
                  key={keybind.id}
                  className="flex items-center justify-between p-3 bg-boxflow-darkest rounded-lg border border-boxflow-hover"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white">{keybind.action}</span>
                    {keybind.implemented ? (
                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded border border-green-500/30">
                        ✓ Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded border border-gray-500/30">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-3 py-1 bg-boxflow-dark border border-boxflow-hover rounded text-sm font-mono text-gray-300">
                      {keybind.keys}
                    </kbd>
                    {keybind.customizable && keybind.implemented && (
                      <button
                        className="px-2 py-1 text-xs text-boxflow-accent hover:bg-boxflow-hover rounded transition-colors"
                        title="Customize (Coming Soon)"
                        disabled
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="bg-boxflow-dark-lighter p-4 rounded-lg border border-boxflow-hover-50">
        <h3 className="text-sm font-medium text-white mb-2">
          💡 Keyboard Shortcut Tips
        </h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>
            • <span className="text-green-400">✓ Active</span> shortcuts are
            currently working
          </li>
          <li>
            • <span className="text-gray-400">Coming Soon</span> shortcuts will
            be added in future updates
          </li>
          <li>
            • <kbd className="text-white">Ctrl</kbd> = Control key (⌘ on Mac)
          </li>
          <li>
            • <kbd className="text-white">Alt</kbd> = Alt key (Option on Mac)
          </li>
          <li>• Press keys simultaneously for combined shortcuts</li>
        </ul>
      </div>

      {/* Reset Button (Future Feature) */}
      <div className="pt-4 border-t border-boxflow-hover">
        <button
          className="px-4 py-2 bg-boxflow-darkest text-white rounded-lg border border-boxflow-hover hover:bg-boxflow-hover transition-colors"
          disabled
          title="Coming Soon"
        >
          🔄 Reset to Defaults
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Custom keybinds coming in a future update
        </p>
      </div>
    </div>
  );
}
