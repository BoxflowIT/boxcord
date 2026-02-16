// Settings Modal Component
import { useState, useEffect } from 'react';
import { CloseIcon } from './ui/Icons';
import {
  toggleNotificationSound,
  isNotificationSoundEnabled
} from '../utils/notificationSound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'notifications' | 'appearance' | 'about';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const [soundEnabled, setSoundEnabled] = useState(
    isNotificationSoundEnabled()
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );
  const [compactMode, setCompactMode] = useState(
    localStorage.getItem('compactMode') === 'true'
  );
  const [messageGrouping, setMessageGrouping] = useState(
    localStorage.getItem('messageGrouping') !== 'false'
  );
  const [fontSize, setFontSize] = useState(
    localStorage.getItem('fontSize') || 'medium'
  );

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
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle(
      'light-theme',
      newTheme === 'light'
    );
  };

  const handleCompactModeToggle = (enabled: boolean) => {
    setCompactMode(enabled);
    localStorage.setItem('compactMode', enabled.toString());
    // Notify other components
    window.dispatchEvent(new Event('settingsChanged'));
  };

  const handleMessageGroupingToggle = (enabled: boolean) => {
    setMessageGrouping(enabled);
    localStorage.setItem('messageGrouping', enabled.toString());
    // Notify other components
    window.dispatchEvent(new Event('settingsChanged'));
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    const root = document.documentElement;
    root.style.setProperty(
      '--base-font-size',
      size === 'small' ? '14px' : size === 'large' ? '18px' : '16px'
    );
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'notifications', label: 'Notifications' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'about', label: 'About' }
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-discord-dark rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-64 bg-discord-darker flex-shrink-0 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Settings
            </h2>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded mb-1 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-discord-dark text-white'
                    : 'text-gray-300 hover:bg-discord-dark/50 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-discord-darkest">
            <h2 className="text-2xl font-bold text-white">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-discord-darker rounded transition-colors"
            >
              <CloseIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <SettingItem
                  title="Notification Sound"
                  description="Play a sound when you receive a new message"
                  control={
                    <Toggle
                      enabled={soundEnabled}
                      onChange={handleSoundToggle}
                    />
                  }
                />
                <div className="border-t border-discord-darkest pt-6">
                  <p className="text-sm text-gray-400">
                    💡 <strong>How it works:</strong> Notification sounds only
                    play for messages in channels or DMs you're not currently
                    viewing, and never for your own messages.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <SettingItem
                  title="Theme"
                  description="Choose your preferred color theme"
                  control={
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleThemeChange('dark')}
                        className={`px-4 py-2 rounded transition-colors ${
                          theme === 'dark'
                            ? 'bg-blue-500 text-white'
                            : 'bg-discord-darker text-gray-300 hover:bg-discord-darkest'
                        }`}
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => handleThemeChange('light')}
                        className={`px-4 py-2 rounded transition-colors ${
                          theme === 'light'
                            ? 'bg-blue-500 text-white'
                            : 'bg-discord-darker text-gray-300 hover:bg-discord-darkest'
                        }`}
                      >
                        Light
                      </button>
                    </div>
                  }
                />
                <SettingItem
                  title="Font Size"
                  description="Adjust the size of text throughout the app"
                  control={
                    <div className="flex gap-2">
                      {['small', 'medium', 'large'].map((size) => (
                        <button
                          key={size}
                          onClick={() => handleFontSizeChange(size)}
                          className={`px-4 py-2 rounded capitalize transition-colors ${
                            fontSize === size
                              ? 'bg-blue-500 text-white'
                              : 'bg-discord-darker text-gray-300 hover:bg-discord-darkest'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  }
                />
                <SettingItem
                  title="Compact Mode"
                  description="Display more messages on screen by reducing spacing"
                  control={
                    <Toggle
                      enabled={compactMode}
                      onChange={handleCompactModeToggle}
                    />
                  }
                />
                <SettingItem
                  title="Message Grouping"
                  description="Group consecutive messages from the same user (within 5 minutes)"
                  control={
                    <Toggle
                      enabled={messageGrouping}
                      onChange={handleMessageGroupingToggle}
                    />
                  }
                />
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="text-gray-400">
                  <h3 className="text-white font-semibold mb-4 text-xl">
                    Boxcord
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-300">
                        Version
                      </p>
                      <p className="text-sm">1.0.0</p>
                    </div>
                    <div className="border-t border-discord-darkest pt-4">
                      <p className="text-sm font-semibold text-gray-300 mb-2">
                        Privacy & Security
                      </p>
                      <ul className="text-sm space-y-2 list-disc list-inside">
                        <li>Messages are encrypted in transit (TLS)</li>
                        <li>
                          Your online status is visible to workspace members
                        </li>
                        <li>Message history is stored securely</li>
                        <li>Authentication via AWS Cognito</li>
                      </ul>
                    </div>
                    <div className="border-t border-discord-darkest pt-4">
                      <p className="text-sm font-semibold text-gray-300 mb-2">
                        Technology Stack
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• React + TypeScript</li>
                        <li>• Socket.IO for real-time messaging</li>
                        <li>• TanStack Query for data management</li>
                        <li>• Tailwind CSS for styling</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingItemProps {
  title: string;
  description: string;
  control: React.ReactNode;
}

function SettingItem({ title, description, control }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div className="ml-4">{control}</div>
    </div>
  );
}

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-6' : ''
        }`}
      />
    </button>
  );
}
