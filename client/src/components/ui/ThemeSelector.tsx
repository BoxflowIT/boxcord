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
  );
}
