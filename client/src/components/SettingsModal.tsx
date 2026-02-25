// Settings Modal Component
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import SettingsTabSidebar, {
  type SettingsTab,
  tabs
} from './settings/SettingsTabSidebar';
import SettingsHeader from './settings/SettingsHeader';
import NotificationsTab from './settings/NotificationsTab';
import VoiceAudioTab from './settings/VoiceAudioTab';
import VideoTab from './settings/VideoTab';
import AppearanceTab from './settings/AppearanceTab';
import PrivacyTab from './settings/PrivacyTab';
import KeybindsTab from './settings/KeybindsTab';
import { LanguageTab } from './settings/LanguageTab';
import AccountTab from './settings/AccountTab';
import AboutTab from './settings/AboutTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const { t } = useTranslation();
  const { settings, handlers } = useSettings();

  if (!isOpen) return null;

  const activeTabLabel = tabs.find((t) => t.id === activeTab)?.labelKey;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-boxflow-dark rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex overflow-hidden border border-boxflow-hover-50"
        onClick={(e) => e.stopPropagation()}
      >
        <SettingsTabSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <SettingsHeader
            title={activeTabLabel ? t(activeTabLabel) : ''}
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'notifications' && (
              <NotificationsTab
                soundEnabled={settings.soundEnabled}
                onSoundToggle={handlers.onSoundToggle}
              />
            )}

            {activeTab === 'voice' && <VoiceAudioTab />}

            {activeTab === 'video' && <VideoTab />}

            {activeTab === 'appearance' && (
              <AppearanceTab
                theme={settings.theme}
                fontSize={settings.fontSize}
                compactMode={settings.compactMode}
                messageGrouping={settings.messageGrouping}
                onThemeChange={handlers.onThemeChange}
                onFontSizeChange={handlers.onFontSizeChange}
                onCompactModeToggle={handlers.onCompactModeToggle}
                onMessageGroupingToggle={handlers.onMessageGroupingToggle}
              />
            )}

            {activeTab === 'privacy' && <PrivacyTab />}

            {activeTab === 'keybinds' && <KeybindsTab />}

            {activeTab === 'language' && <LanguageTab />}

            {activeTab === 'account' && <AccountTab />}

            {activeTab === 'about' && <AboutTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
