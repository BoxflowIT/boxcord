/**
 * Appearance Settings Tab Component
 * Controls theme, font size, message density, and accessibility options
 */
import { useTranslation } from 'react-i18next';
import SettingItem from '../ui/SettingItem';
import Toggle from '../ui/Toggle';
import ThemeSelector from '../ui/ThemeSelector';
import FontSizeSelector from '../ui/FontSizeSelector';
import MessageDensitySelector, {
  type MessageDensity
} from '../ui/MessageDensitySelector';

interface AppearanceTabProps {
  theme: 'dark' | 'medium' | 'light';
  fontSize: string;
  compactMode: boolean;
  messageDensity: MessageDensity;
  messageGrouping: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  onThemeChange: (theme: 'dark' | 'medium' | 'light') => void;
  onFontSizeChange: (size: string) => void;
  onCompactModeToggle: (enabled: boolean) => void;
  onMessageDensityChange: (density: MessageDensity) => void;
  onMessageGroupingToggle: (enabled: boolean) => void;
  onHighContrastToggle: (enabled: boolean) => void;
  onReducedMotionToggle: (enabled: boolean) => void;
}

export default function AppearanceTab({
  theme,
  fontSize,
  messageDensity,
  messageGrouping,
  highContrast,
  reducedMotion,
  onThemeChange,
  onFontSizeChange,
  onMessageDensityChange,
  onMessageGroupingToggle,
  onHighContrastToggle,
  onReducedMotionToggle
}: AppearanceTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Theme Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
          {t('settings.themeSection')}
        </h3>
        <SettingItem
          title={t('settings.theme')}
          description={t('settings.themeDescription')}
          control={
            <ThemeSelector theme={theme} onThemeChange={onThemeChange} />
          }
        />
      </div>

      {/* Message Display Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
          {t('settings.messageDisplaySection')}
        </h3>
        <div className="space-y-6">
          <SettingItem
            title={t('settings.messageDensity')}
            description={t('settings.messageDensityDescription')}
            control={
              <MessageDensitySelector
                density={messageDensity}
                onDensityChange={onMessageDensityChange}
              />
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
        </div>
      </div>

      {/* Accessibility Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
          {t('settings.accessibilitySection')}
        </h3>
        <div className="space-y-6">
          <SettingItem
            title={t('settings.highContrast')}
            description={t('settings.highContrastDescription')}
            control={
              <Toggle enabled={highContrast} onChange={onHighContrastToggle} />
            }
          />
          <SettingItem
            title={t('settings.reducedMotion')}
            description={t('settings.reducedMotionDescription')}
            control={
              <Toggle
                enabled={reducedMotion}
                onChange={onReducedMotionToggle}
              />
            }
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-boxflow-hover/30 rounded-lg border border-boxflow-hover">
        <p className="text-sm text-gray-400">
          💡 {t('settings.appearanceInfo')}
        </p>
      </div>
    </div>
  );
}
