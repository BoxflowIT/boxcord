/**
 * i18n Configuration
 * Internationalization setup for multi-language support
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import sv from './locales/sv.json';

// Get saved language from localStorage or default to English
const savedLanguage = localStorage.getItem('language');
const defaultLanguage = savedLanguage || 'en';

console.log('🌍 i18n initializing with language:', defaultLanguage);

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

// Save language to localStorage when it changes
i18n.on('languageChanged', (lng) => {
  console.log('🌍 Language changed to:', lng);
  localStorage.setItem('language', lng);
  // Dispatch event for cross-tab sync
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'language',
      newValue: lng
    })
  );
});

export default i18n;
