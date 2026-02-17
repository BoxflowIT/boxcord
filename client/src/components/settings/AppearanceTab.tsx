// Appearance Settings Tab Component

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
        enabled
          ? 'bg-gradient-to-r from-[#5865f2] to-[#4752c4]'
          : 'bg-[#404249]'
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
        control={
          <div className="flex gap-2">
            <button
              onClick={() => onThemeChange('dark')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-[#484644] text-white shadow-md'
                  : 'bg-[#404249] text-[#b5bac1] hover:bg-[#4e5158]'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => onThemeChange('light')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                theme === 'light'
                  ? 'bg-[#484644] text-white shadow-md'
                  : 'bg-[#404249] text-[#b5bac1] hover:bg-[#4e5158]'
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
                onClick={() => onFontSizeChange(size)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  fontSize === size
                    ? 'bg-gradient-to-r from-[#5865f2] to-[#4752c4] text-white shadow-lg shadow-[#5865f2]/25'
                    : 'bg-[#404249] text-[#b5bac1] hover:bg-[#4e5158]'
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
