// Appearance Settings Tab Component
import { useTranslation } from 'react-i18next';
import SettingItem from '../ui/SettingItem';
import Toggle from '../ui/Toggle';
import ThemeSelector from '../ui/ThemeSelector';
import FontSizeSelector from '../ui/FontSizeSelector';

interface AppearanceTabProps {
  theme: 'dark' | 'light';
  fontSize: string;
  compactMode: boolean;
  messageGrouping: boolean;
  onThemeChange: (theme: 'dark' | 'light') => void;
  onFontSizeChange: (size: string) => void;
  onCompactModeToggle: (enabled: boolean) => void;
  onMessageGroupingToggle: (enabled: boolean) => void;
}

export default function AppearanceTab({
  theme,
  fontSize,
  compactMode,
  messageGrouping,
  onThemeChange,
  onFontSizeChange,
  onCompactModeToggle,
  onMessageGroupingToggle
}: AppearanceTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <SettingItem
        title={t('settings.theme')}
        description={t('settings.themeDescription')}
        control={<ThemeSelector theme={theme} onThemeChange={onThemeChange} />}
      />
      <SettingItem
        title={t('settings.fontSize')}
        description={t('settings.fontSizeDescription')}
        control={
          <FontSizeSelector
            fontSize={fontSize}
            onFontSizeChange={onFontSizeChange}
          />
        }
      />
      <SettingItem
        title={t('settings.compactMode')}
        description={t('settings.compactModeDescription')}
        control={
          <Toggle enabled={compactMode} onChange={onCompactModeToggle} />
        }
      />
      <SettingItem
        title={t('settings.messageGrouping')}
        description={t('settings.messageGroupingDescription')}
        control={
          <Toggle
            enabled={messageGrouping}
            onChange={onMessageGroupingToggle}
          />
        }
      />
    </div>
  );
}
