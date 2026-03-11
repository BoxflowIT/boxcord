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

export type MessageDensity = 'compact' | 'cozy' | 'spacious';

export interface Settings {
  theme: 'dark' | 'medium' | 'light';
  fontSize: string;
  compactMode: boolean;
  messageDensity: MessageDensity;
  messageGrouping: boolean;
  soundEnabled: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  notificationSoundType: NotificationSoundType;
}

export function useSettings() {
  const [soundEnabled, setSoundEnabled] = useState(
    isNotificationSoundEnabled()
  );
  const [notificationSoundType, setNotificationSoundTypeState] =
    useLocalStorage<NotificationSoundType>('notificationSoundType', 'default');
  const [theme, setTheme] = useLocalStorage<'dark' | 'medium' | 'light'>(
    'theme',
    'medium'
  );
  const [compactMode, setCompactMode] = useLocalStorage('compactMode', false);
  const [messageDensity, setMessageDensity] = useLocalStorage<MessageDensity>(
    'messageDensity',
    'cozy'
  );
  const [messageGrouping, setMessageGrouping] = useLocalStorage(
    'messageGrouping',
    true
  );
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 'medium');
  const [highContrast, setHighContrast] = useLocalStorage(
    'highContrast',
    false
  );
  const [reducedMotion, setReducedMotion] = useLocalStorage(
    'reducedMotion',
    false
  );

  // Apply theme on mount and when changed
  useEffect(() => {
    document.documentElement.classList.remove('light-theme', 'medium-theme');
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else if (theme === 'medium') {
      document.documentElement.classList.add('medium-theme');
    }
  }, [theme]);

  // Apply high contrast mode
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  // Apply reduced motion
  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
  }, [reducedMotion]);

  // Apply font size on mount and when changed
  useEffect(() => {
    const root = document.documentElement;
    const size =
      fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
    root.style.setProperty('--base-font-size', size);
  }, [fontSize]);

  // Apply message density
  useEffect(() => {
    const root = document.documentElement;
    // Define spacing values for each density
    const spacing = {
      compact: { messageGap: '4px', padding: '8px' },
      cozy: { messageGap: '8px', padding: '12px' },
      spacious: { messageGap: '16px', padding: '16px' }
    };
    const current = spacing[messageDensity];
    root.style.setProperty('--message-gap', current.messageGap);
    root.style.setProperty('--message-padding', current.padding);
  }, [messageDensity]);

  // Apply notification sound type
  useEffect(() => {
    setNotificationSoundType(notificationSoundType);
  }, [notificationSoundType]);

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    toggleNotificationSound(enabled);
  };

  const handleThemeChange = (newTheme: 'dark' | 'medium' | 'light') => {
    setTheme(newTheme);
  };

  const handleCompactModeToggle = (enabled: boolean) => {
    setCompactMode(enabled);
  };

  const handleMessageDensityChange = (density: MessageDensity) => {
    setMessageDensity(density);
  };

  const handleMessageGroupingToggle = (enabled: boolean) => {
    setMessageGrouping(enabled);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
  };

  const handleHighContrastToggle = (enabled: boolean) => {
    setHighContrast(enabled);
  };

  const handleReducedMotionToggle = (enabled: boolean) => {
    setReducedMotion(enabled);
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
      messageDensity,
      messageGrouping,
      soundEnabled,
      highContrast,
      reducedMotion,
      notificationSoundType
    },
    // Handlers
    handlers: {
      onSoundToggle: handleSoundToggle,
      onThemeChange: handleThemeChange,
      onCompactModeToggle: handleCompactModeToggle,
      onMessageDensityChange: handleMessageDensityChange,
      onMessageGroupingToggle: handleMessageGroupingToggle,
      onFontSizeChange: handleFontSizeChange,
      onHighContrastToggle: handleHighContrastToggle,
      onReducedMotionToggle: handleReducedMotionToggle,
      onNotificationSoundTypeChange: handleNotificationSoundTypeChange,
      onPreviewNotificationSound: handlePreviewNotificationSound
    }
  };
}
