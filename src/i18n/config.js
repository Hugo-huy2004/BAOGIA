import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationVI from './locales/vi/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  vi: {
    translation: translationVI
  }
};

i18n
  .use(LanguageDetector) 
  .use(initReactI18next) 
  .init({
    resources,
    fallbackLng: 'vi', 
    debug: false,
    
    interpolation: {
      escapeValue: false, 
    }
  });

const syncDocumentLanguage = (language) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = String(language || 'vi').split('-')[0];
};

syncDocumentLanguage(i18n.resolvedLanguage);
i18n.on('languageChanged', syncDocumentLanguage);

export default i18n;
