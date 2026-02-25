/**
 * Keybinds/Keyboard Shortcuts Settings Tab
 * Configure and view keyboard shortcuts for quick actions
 */

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { cn } from '../../utils/classNames';
import {
  useKeyboardShortcutsStore,
  type ShortcutAction
} from '../../store/keyboardShortcutsStore';
import KeybindEditor from '../ui/KeybindEditor';

type Category = 'navigation' | 'messaging' | 'voice' | 'reactions' | 'general';

const defaultKeybinds: Array<{ action: ShortcutAction; implemented: boolean }> =
  [
    // Navigation
    { action: 'next-channel', implemented: true },
    { action: 'prev-channel', implemented: true },
    { action: 'search', implemented: true },

    // Messaging
    { action: 'upload-file', implemented: true },
    { action: 'emoji-picker', implemented: true },
    { action: 'mark-read', implemented: true },
    { action: 'pin-message', implemented: true },

    // Voice & Video
    { action: 'toggle-mute', implemented: true },
    { action: 'toggle-deafen', implemented: true },
    { action: 'toggle-video', implemented: true },
    { action: 'toggle-screenshare', implemented: true },
    { action: 'leave-voice', implemented: true },

    // Quick Reactions
    { action: 'emoji-react-1', implemented: true },
    { action: 'emoji-react-2', implemented: true },
    { action: 'emoji-react-3', implemented: true },
    { action: 'emoji-react-4', implemented: true },
    { action: 'emoji-react-5', implemented: true }
  ];

const categoryEmojis: Record<Category, string> = {
  navigation: '🧭',
  messaging: '💬',
  voice: '🎙️',
  reactions: '😀',
  general: '⚙️'
};

const categoryLabels: Record<Category, string> = {
  navigation: 'Navigation',
  messaging: 'Messaging',
  voice: 'Voice & Video',
  reactions: 'Quick Reactions',
  general: 'General'
};

export default function KeybindsTab() {
  const { t } = useTranslation();
  const { shortcuts, enabled, setEnabled, resetAll } =
    useKeyboardShortcutsStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>(
    'all'
  );

  // Filter shortcuts by implementation status and category
  const allShortcuts = defaultKeybinds
    .filter(({ implemented }) => implemented)
    .map(({ action }) => {
      const shortcut = shortcuts[action];
      return { ...shortcut, action };
    });

  const filteredShortcuts =
    selectedCategory === 'all'
      ? allShortcuts
      : allShortcuts.filter((s) => s.category === selectedCategory);

  const groupedShortcuts = filteredShortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<Category, typeof filteredShortcuts>
  );

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-boxflow-dark-lighter rounded-lg border border-boxflow-hover">
        <div>
          <h3 className="text-sm font-medium text-white">
            ⌨️ {t('settings.enableKeyboardShortcuts')}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {t('settings.keyboardShortcutsDescription')}
          </p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors',
            enabled ? 'bg-boxflow-accent' : 'bg-gray-600'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
              enabled && 'translate-x-6'
            )}
          />
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          📂 {t('settings.keybindCategory')}
        </label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-all',
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-boxflow-accent to-boxflow-accent-dark text-white shadow-md'
                : 'bg-boxflow-darkest text-gray-300 hover:bg-boxflow-hover'
            )}
          >
            All
          </button>
          {Object.entries(categoryLabels).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as Category)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-boxflow-accent to-boxflow-accent-dark text-white shadow-md'
                  : 'bg-boxflow-darkest text-gray-300 hover:bg-boxflow-hover'
              )}
            >
              {categoryEmojis[cat as Category]} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Shortcuts List */}
      <div className="space-y-6">
        {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3 flex items-center gap-2">
              <span>{categoryEmojis[category as Category]}</span>
              {categoryLabels[category as Category]}
            </h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut) => (
                <KeybindEditor
                  key={shortcut.action}
                  action={shortcut.action}
                  showCategory={false}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="bg-boxflow-dark-lighter p-4 rounded-lg border border-boxflow-hover-50">
        <h3 className="text-sm font-medium text-white mb-2">
          💡 {t('settings.keyboardTips')}
        </h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• {t('settings.keyboardTip1')}</li>
          <li>• {t('settings.keyboardTip2')}</li>
          <li>• {t('settings.keyboardTip3')}</li>
          <li>• {t('settings.keyboardTip4')}</li>
          <li>• {t('settings.keyboardTip5')}</li>
        </ul>
      </div>

      {/* Reset Button */}
      <div className="pt-4 border-t border-boxflow-hover flex justify-between items-center">
        <div>
          <h4 className="text-sm font-medium text-white">
            {t('settings.resetKeybinds')}
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            {t('settings.resetKeybindsDescription')}
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm(t('settings.confirmResetKeybinds'))) {
              resetAll();
            }
          }}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors"
        >
          🔄 {t('settings.resetToDefaults')}
        </button>
      </div>
    </div>
  );
}
