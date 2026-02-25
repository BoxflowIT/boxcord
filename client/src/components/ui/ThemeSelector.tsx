// Theme selector component

interface ThemeSelectorProps {
  theme: 'dark' | 'medium' | 'light';
  onThemeChange: (theme: 'dark' | 'medium' | 'light') => void;
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
        onClick={() => onThemeChange('medium')}
        className={theme === 'medium' ? 'theme-btn-active' : 'theme-btn'}
      >
        Medium
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
