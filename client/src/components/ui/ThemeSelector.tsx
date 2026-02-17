// Theme selector component

interface ThemeSelectorProps {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

export default function ThemeSelector({
  theme,
  onThemeChange
}: ThemeSelectorProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onThemeChange('dark')}
        className={theme === 'dark' ? 'theme-btn-active' : 'theme-btn'}
      >
        Dark
      </button>
      <button
        onClick={() => onThemeChange('light')}
        className={theme === 'light' ? 'theme-btn-active' : 'theme-btn'}
      >
        Light
      </button>
    </div>
  );
}
