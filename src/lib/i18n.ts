import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '@/locales/en/common.json';
import enErrors from '@/locales/en/errors.json';
import enSuccess from '@/locales/en/success.json';
import enAuth from '@/locales/en/auth.json';
import enPrompt from '@/locales/en/prompt.json';
import enLibrary from '@/locales/en/library.json';
import enModes from '@/locales/en/modes.json';
import enActions from '@/locales/en/actions.json';
import enValidation from '@/locales/en/validation.json';

import idCommon from '@/locales/id/common.json';
import idErrors from '@/locales/id/errors.json';
import idSuccess from '@/locales/id/success.json';
import idAuth from '@/locales/id/auth.json';
import idPrompt from '@/locales/id/prompt.json';
import idLibrary from '@/locales/id/library.json';
import idModes from '@/locales/id/modes.json';
import idActions from '@/locales/id/actions.json';
import idValidation from '@/locales/id/validation.json';

import { STORAGE_KEYS } from './constants';

// Configure number formatting
i18n.services.formatter?.add('number', (value, lng, options) => {
  const locale = lng?.split('-')[0] || 'en';
  return new Intl.NumberFormat(locale, options as Intl.NumberFormatOptions).format(value);
});

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        errors: enErrors,
        success: enSuccess,
        auth: enAuth,
        prompt: enPrompt,
        library: enLibrary,
        modes: enModes,
        actions: enActions,
        validation: enValidation,
      },
      id: {
        common: idCommon,
        errors: idErrors,
        success: idSuccess,
        auth: idAuth,
        prompt: idPrompt,
        library: idLibrary,
        modes: idModes,
        actions: idActions,
        validation: idValidation,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'errors', 'success', 'auth', 'prompt', 'library', 'modes', 'actions', 'validation'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Keys to lookup language from
      lookupLocalStorage: STORAGE_KEYS.LANGUAGE,
      // Cache user language preference
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false, // Disable suspense for better error handling
    },
  });

// Update HTML lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, lng);
});

// Set initial HTML lang attribute
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
}

export default i18n;

