// Settings Modal Component
import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  toggleNotificationSound,
  isNotificationSoundEnabled
} from '../utils/notificationSound';
import SettingsTabSidebar, {
  type SettingsTab,
  tabs
} from './settings/SettingsTabSidebar';
import SettingsHeader from './settings/SettingsHeader';
import NotificationsTab from './settings/NotificationsTab';
import AppearanceTab from './settings/AppearanceTab';
import AboutTab from './settings/AboutTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const [soundEnabled, setSoundEnabled] = useState(
    isNotificationSoundEnabled()
  );
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('theme', 'dark');
  const [compactMode, setCompactMode] = useLocalStorage('compactMode', false);
  const [messageGrouping, setMessageGrouping] = useLocalStorage(
    'messageGrouping',
    true
  );
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 'medium');

  // Apply saved settings on mount
  useEffect(() => {
    // Apply theme
    document.documentElement.classList.toggle('light-theme', theme === 'light');

    // Apply font size
    const root = document.documentElement;
    root.style.setProperty(
      '--base-font-size',
      fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    toggleNotificationSound(enabled);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    document.documentElement.classList.toggle(
      'light-theme',
      newTheme === 'light'
    );
  };

  const handleCompactModeToggle = (enabled: boolean) => {
    setCompactMode(enabled);
  };

  const handleMessageGroupingToggle = (enabled: boolean) => {
    setMessageGrouping(enabled);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    const root = document.documentElement;
    root.style.setProperty(
      '--base-font-size',
      size === 'small' ? '14px' : size === 'large' ? '18px' : '16px'
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-boxflow-dark rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex overflow-hidden border border-boxflow-hover/50"
        onClick={(e) => e.stopPropagation()}
      >
        <SettingsTabSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <SettingsHeader
            title={tabs.find((t) => t.id === activeTab)?.label || ''}
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'notifications' && (
              <NotificationsTab
                soundEnabled={soundEnabled}
                onSoundToggle={handleSoundToggle}
              />
            )}

            {activeTab === 'appearance' && (
              <AppearanceTab
                theme={theme}
                fontSize={fontSize}
                compactMode={compactMode}
                messageGrouping={messageGrouping}
                onThemeChange={handleThemeChange}
                onFontSizeChange={handleFontSizeChange}
                onCompactModeToggle={handleCompactModeToggle}
                onMessageGroupingToggle={handleMessageGroupingToggle}
              />
            )}

            {activeTab === 'about' && <AboutTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
