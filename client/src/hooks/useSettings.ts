/**
 * useSettings - Centralized settings management hook
 * Manages all app settings: theme, font size, compact mode, message grouping, sound
 */
import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  toggleNotificationSound,
  isNotificationSoundEnabled,
  setNotificationSoundType,
  previewNotificationSound,
  type NotificationSoundType
} from '../utils/notificationSound';

export interface Settings {
  theme: 'dark' | 'light';
  fontSize: string;
  compactMode: boolean;
  messageGrouping: boolean;
  soundEnabled: boolean;
  notificationSoundType: NotificationSoundType;
}

export function useSettings() {
  const [soundEnabled, setSoundEnabled] = useState(
    isNotificationSoundEnabled()
  );
  const [notificationSoundType, setNotificationSoundTypeState] =
    useLocalStorage<NotificationSoundType>('notificationSoundType', 'default');
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('theme', 'dark');
  const [compactMode, setCompactMode] = useLocalStorage('compactMode', false);
  const [messageGrouping, setMessageGrouping] = useLocalStorage(
    'messageGrouping',
    true
  );
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 'medium');

  // Apply theme on mount and when changed
  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  // Apply font size on mount and when changed
  useEffect(() => {
    const root = document.documentElement;
    const size =
      fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
    root.style.setProperty('--base-font-size', size);
  }, [fontSize]);

  // Apply notification sound type
  useEffect(() => {
    setNotificationSoundType(notificationSoundType);
  }, [notificationSoundType]);

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    toggleNotificationSound(enabled);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
  };

  const handleCompactModeToggle = (enabled: boolean) => {
    setCompactMode(enabled);
  };

  const handleMessageGroupingToggle = (enabled: boolean) => {
    setMessageGrouping(enabled);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
  };

  const handleNotificationSoundTypeChange = (type: NotificationSoundType) => {
    setNotificationSoundTypeState(type);
  };

  const handlePreviewNotificationSound = (type: NotificationSoundType) => {
    previewNotificationSound(type);
  };

  return {
    // Current values
    settings: {
      theme,
      fontSize,
      compactMode,
      messageGrouping,
      soundEnabled,
      notificationSoundType
    },
    // Handlers
    handlers: {
      onSoundToggle: handleSoundToggle,
      onThemeChange: handleThemeChange,
      onCompactModeToggle: handleCompactModeToggle,
      onMessageGroupingToggle: handleMessageGroupingToggle,
      onFontSizeChange: handleFontSizeChange,
      onNotificationSoundTypeChange: handleNotificationSoundTypeChange,
      onPreviewNotificationSound: handlePreviewNotificationSound
    }
  };
}
