/**
 * i18n Configuration
 * Internationalization setup for multi-language support
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import sv from './locales/sv.json';

// Supported language codes — used to validate user-supplied values
const SUPPORTED_LANGUAGES = ['en', 'sv'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function isSupported(lang: string | null): lang is SupportedLanguage {
  return (
    typeof lang === 'string' &&
    SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
  );
}

// Get saved language from localStorage, validated against allowed list
const savedLanguage = localStorage.getItem('language');
const defaultLanguage: SupportedLanguage = isSupported(savedLanguage)
  ? savedLanguage
  : 'en';

i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: { translation: en },
      sv: { translation: sv }
    },
    lng: defaultLanguage, // Default language
    fallbackLng: 'en', // Fallback language if translation is missing
    interpolation: {
      escapeValue: false // React already escapes values
    },
    debug: false // Set to true for debugging
  });

// Save language to localStorage when it changes (validated on read)
i18n.on('languageChanged', (lng) => {
  if (isSupported(lng)) {
    localStorage.setItem('language', lng);
  }
  // Notify same-tab listeners (cross-tab sync happens via native storage events)
  window.dispatchEvent(new Event('settingsChanged'));
});

export default i18n;
