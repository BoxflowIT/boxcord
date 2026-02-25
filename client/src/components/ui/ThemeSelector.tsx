// Theme selector component

interface ThemeSelectorProps {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

const THEMES = [
  { value: 'dark' as const, label: 'Dark', emoji: '🌙' },
  { value: 'light' as const, label: 'Light', emoji: '☀️' }
];

export default function ThemeSelector({
  theme,
  onThemeChange
}: ThemeSelectorProps) {
  return (
    <div className="flex gap-2">
      {THEMES.map((t) => (
        <button
          key={t.value}
          onClick={() => onThemeChange(t.value)}
          className={theme === t.value ? 'settings-btn-active' : 'settings-btn'}
        >
          <span className="mr-1.5">{t.emoji}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
