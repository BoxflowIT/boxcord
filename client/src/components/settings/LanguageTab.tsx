/**
 * Language Settings Tab
 * Allows users to select their preferred language
 */
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' }
];

export function LanguageTab() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">{t('settings.language')}</h2>
        <p className="text-sm text-gray-400">
          {t('settings.languageDescription')}
        </p>
        <p className="text-xs text-gray-500 mt-2">Current: {currentLanguage}</p>
      </div>

      <div className="space-y-3">
        {LANGUAGES.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              currentLanguage === language.code
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <span className="text-3xl">{language.flag}</span>
            <div className="flex-1 text-left">
              <div className="font-medium text-white">{language.name}</div>
              <div className="text-xs text-gray-400">
                {language.code.toUpperCase()}
              </div>
            </div>
            {currentLanguage === language.code && (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl">ℹ️</span>
          <div className="text-sm text-gray-300">
            <p className="font-medium mb-1">Language Support</p>
            <p className="text-gray-400">
              The interface will update immediately when you change the
              language. More languages will be added in future updates!
            </p>
          </div>
        </div>
      </div>

      {/* Debug: Reset Language button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={() => {
            localStorage.removeItem('language');
            window.location.reload();
          }}
          className="text-xs text-gray-500 hover:text-gray-400"
        >
          🔧 Debug: Reset to default language
        </button>
      </div>
    </div>
  );
}
