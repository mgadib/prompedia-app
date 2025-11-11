import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { STORAGE_KEYS } from './constants';

// Namespaces yang digunakan
const NAMESPACES = ['common', 'errors', 'success', 'auth', 'prompt', 'library', 'modes', 'actions', 'validation'] as const;
const LANGUAGES = ['en', 'id'] as const;

/**
 * Load semua translation files menggunakan import.meta.glob
 * Ini menghindari masalah build dengan static import JSON
 * Menggunakan eager: true untuk load semua files sekaligus (normal untuk i18n)
 */
const translationModules = import.meta.glob<{ default: Record<string, unknown> }>('@/locales/**/*.json', {
  eager: true,
  import: 'default',
});

/**
 * Load translation file untuk bahasa dan namespace tertentu
 */
function loadTranslation(language: string, namespace: string): Record<string, unknown> {
  try {
    // Cari module yang cocok dengan path
    // import.meta.glob akan menghasilkan path seperti '@/locales/en/common.json'
    const moduleEntry = Object.entries(translationModules).find(([path]) => 
      path.endsWith(`/${language}/${namespace}.json`) || path.includes(`/locales/${language}/${namespace}.json`)
    );
    
    if (!moduleEntry) {
      if (import.meta.env.DEV) {
        console.warn(`Translation module not found: ${language}/${namespace}`);
      }
      return {};
    }
    
    const module = moduleEntry[1];
    
    // Module sudah loaded (eager), langsung return
    // Dengan import: 'default', module langsung berisi default export (object JSON)
    return (module as Record<string, unknown>) || {};
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error loading translation ${language}/${namespace}:`, error);
    }
    return {};
  }
}

/**
 * Load semua translation files untuk bahasa tertentu
 */
function loadLanguageResources(language: string): Record<string, Record<string, unknown>> {
  const resources: Record<string, Record<string, unknown>> = {};
  
  // Load semua namespaces untuk bahasa ini
  NAMESPACES.forEach((namespace) => {
    const translation = loadTranslation(language, namespace);
    resources[namespace] = translation;
  });
  
  return resources;
}

/**
 * Initialize i18n dengan dynamic loading
 */
function initializeI18n(): void {
  // Load resources untuk semua bahasa
  const resources: Record<string, Record<string, Record<string, unknown>>> = {};
  
  LANGUAGES.forEach((language) => {
    resources[language] = loadLanguageResources(language);
  });

  // Configure number formatting
  i18n.services.formatter?.add('number', (value, lng, options) => {
    const locale = lng?.split('-')[0] || 'en';
    return new Intl.NumberFormat(locale, options as Intl.NumberFormatOptions).format(value);
  });

  // Initialize i18n
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: NAMESPACES,
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
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng;
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lng);
    }
  });

  // Set initial HTML lang attribute
  if (typeof document !== 'undefined') {
    document.documentElement.lang = i18n.language;
  }
}

// Initialize i18n immediately
try {
  initializeI18n();
} catch (error) {
  if (import.meta.env.DEV) {
    console.error('Failed to initialize i18n:', error);
  }
  // Fallback: initialize with empty resources
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: NAMESPACES,
      resources: {},
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        lookupLocalStorage: STORAGE_KEYS.LANGUAGE,
        caches: ['localStorage'],
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;

