import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traduções
import ptCommon from './locales/pt/common.json';
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';

const resources = {
  pt: {
    common: ptCommon
  },
  en: {
    common: enCommon
  },
  es: {
    common: esCommon
  }
};

i18n
  .use(LanguageDetector) // Detecta idioma do navegador
  .use(initReactI18next) // Passa i18n para react-i18next
  .init({
    resources,
    defaultNS: 'common',
    fallbackLng: 'pt', // Fallback para PT se idioma não estiver disponível
    supportedLngs: ['pt', 'en', 'es'],
    
    detection: {
      // Ordem de detecção
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferredLanguage',
    },

    interpolation: {
      escapeValue: false // React já faz escape
    },

    react: {
      useSuspense: false // Desabilita suspense para evitar problemas
    }
  });

export default i18n;

