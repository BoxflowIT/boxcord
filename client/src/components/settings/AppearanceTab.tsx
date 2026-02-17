// Appearance Settings Tab Component
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
  return (
    <div className="space-y-6">
      <SettingItem
        title="Theme"
        description="Choose your preferred color theme"
        control={<ThemeSelector theme={theme} onThemeChange={onThemeChange} />}
      />
      <SettingItem
        title="Font Size"
        description="Adjust the size of text throughout the app"
        control={
          <FontSizeSelector
            fontSize={fontSize}
            onFontSizeChange={onFontSizeChange}
          />
        }
      />
      <SettingItem
        title="Compact Mode"
        description="Display more messages on screen by reducing spacing"
        control={
          <Toggle enabled={compactMode} onChange={onCompactModeToggle} />
        }
      />
      <SettingItem
        title="Message Grouping"
        description="Group consecutive messages from the same user (within 5 minutes)"
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
