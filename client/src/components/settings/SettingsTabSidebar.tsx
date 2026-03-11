// Reusable Settings Tab Sidebar Component
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/classNames';

type SettingsTab =
  | 'notifications'
  | 'voice'
  | 'video'
  | 'appearance'
  | 'privacy'
  | 'keybinds'
  | 'language'
  | 'integrations'
  | 'account'
  | 'about';

interface SettingsTabSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const tabs: { id: SettingsTab; labelKey: string }[] = [
  { id: 'notifications', labelKey: 'settings.notifications' },
  { id: 'voice', labelKey: 'settings.voice' },
  { id: 'video', labelKey: 'settings.video' },
  { id: 'appearance', labelKey: 'settings.appearance' },
  { id: 'privacy', labelKey: 'settings.privacy' },
  { id: 'keybinds', labelKey: 'settings.keybinds' },
  { id: 'language', labelKey: 'settings.language' },
  { id: 'integrations', labelKey: 'settings.integrations' },
  { id: 'account', labelKey: 'settings.account' },
  { id: 'about', labelKey: 'settings.about' }
];

export default function SettingsTabSidebar({
  activeTab,
  onTabChange
}: SettingsTabSidebarProps) {
  const { t } = useTranslation();

  return (
    <div className="w-64 bg-boxflow-darker flex-shrink-0 overflow-y-auto border-r border-boxflow-darkest">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">
          {t('common.settings')}
        </h2>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'w-full text-left px-3 py-2 rounded mb-1 transition-colors',
              activeTab === tab.id
                ? 'bg-boxflow-hover text-white font-medium rounded-lg'
                : 'text-boxflow-muted hover:bg-boxflow-hover/50 hover:text-white rounded-lg'
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { SettingsTab };
export { tabs };
