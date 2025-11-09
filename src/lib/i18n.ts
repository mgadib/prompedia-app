import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { STORAGE_KEYS } from './constants';

// Namespaces yang digunakan
const NAMESPACES = ['common', 'errors', 'success', 'auth', 'prompt', 'library', 'modes', 'actions', 'validation'] as const;
const LANGUAGES = ['en', 'id'] as const;

// Critical namespace yang harus di-load eagerly (digunakan di semua halaman)
const CRITICAL_NAMESPACES = ['common', 'errors'] as const;

// Lazy load translation modules (non-eager untuk on-demand loading)
const lazyTranslationModules = import.meta.glob<{ default: Record<string, unknown> }>('@/locales/**/*.json', {
  eager: false,
  import: 'default',
});

// Eager load critical namespaces only
const criticalTranslationModules = import.meta.glob<{ default: Record<string, unknown> }>('@/locales/**/{common,errors}.json', {
  eager: true,
  import: 'default',
});

/**
 * Load translation file untuk bahasa dan namespace tertentu (lazy)
 */
async function loadTranslation(language: string, namespace: string): Promise<Record<string, unknown>> {
  try {
    // Cari module yang cocok dengan path
    const modulePath = Object.keys(lazyTranslationModules).find((path) => 
      path.endsWith(`/${language}/${namespace}.json`) || path.includes(`/locales/${language}/${namespace}.json`)
    );
    
    if (!modulePath) {
      console.warn(`Translation module not found: ${language}/${namespace}`);
      return {};
    }
    
    // Load module dynamically
    const moduleLoader = lazyTranslationModules[modulePath];
    if (!moduleLoader) {
      console.warn(`Translation loader not found: ${language}/${namespace}`);
      return {};
    }
    
    const module = await moduleLoader();
    return (module as Record<string, unknown>) || {};
  } catch (error) {
    console.error(`Error loading translation ${language}/${namespace}:`, error);
    return {};
  }
}

/**
 * Load critical translation file (already loaded eagerly
 */
function loadCriticalTranslation(language: string, namespace: string): Record<string, unknown> {
  try {
    const moduleEntry = Object.entries(criticalTranslationModules).find(([path]) => 
      path.endsWith(`/${language}/${namespace}.json`) || path.includes(`/locales/${language}/${namespace}.json`)
    );
    
    if (!moduleEntry) {
      console.warn(`Critical translation module not found: ${language}/${namespace}`);
      return {};
    }
    
    const module = moduleEntry[1];
    return (module as Record<string, unknown>) || {};
  } catch (error) {
    console.error(`Error loading critical translation ${language}/${namespace}:`, error);
    return {};
  }
}

/**
 * Load critical translation files untuk bahasa tertentu (eager)
 */
function loadCriticalLanguageResources(language: string): Record<string, Record<string, unknown>> {
  const resources: Record<string, Record<string, unknown>> = {};
  
  // Load hanya critical namespaces untuk bahasa ini
  CRITICAL_NAMESPACES.forEach((namespace) => {
    const translation = loadCriticalTranslation(language, namespace);
    resources[namespace] = translation;
  });
  
  return resources;
}

/**
 * Initialize i18n dengan lazy loading
 * Critical namespaces (common, errors) loaded eagerly
 * Other namespaces loaded on-demand
 */
function initializeI18n(): void {
  // Load hanya critical resources untuk semua bahasa (eager)
  const resources: Record<string, Record<string, Record<string, unknown>>> = {};
  
  LANGUAGES.forEach((language) => {
    resources[language] = loadCriticalLanguageResources(language);
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
        bindI18n: 'languageChanged loaded', // Bind to languageChanged and loaded events for reactivity
        bindI18nStore: 'added removed', // Bind to store events for reactivity
      },
    });

  // Track loaded namespaces across all languages
  const loadedNamespaces = new Set<string>();

  // Preload namespaces when they're first requested
  const originalLoadNamespaces = i18n.loadNamespaces.bind(i18n);
  i18n.loadNamespaces = async (namespaces: string | string[]) => {
    const nsArray = typeof namespaces === 'string' ? [namespaces] : namespaces;
    const language = i18n.language || 'en';
    
    // Load each namespace if not already loaded
    for (const namespace of nsArray) {
      if (!CRITICAL_NAMESPACES.includes(namespace as typeof CRITICAL_NAMESPACES[number])) {
        if (!i18n.hasResourceBundle(language, namespace)) {
          const translation = await loadTranslation(language, namespace);
          i18n.addResourceBundle(language, namespace, translation, true, true);
          loadedNamespaces.add(namespace);
        }
      } else {
        // Track critical namespaces too
        loadedNamespaces.add(namespace);
      }
    }
    
    return originalLoadNamespaces(namespaces);
  };

  // Update HTML lang attribute when language changes
  i18n.on('languageChanged', async (lng) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng;
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lng);
      
      // Reload all previously loaded namespaces for the new language
      for (const namespace of loadedNamespaces) {
        if (!i18n.hasResourceBundle(lng, namespace)) {
          if (CRITICAL_NAMESPACES.includes(namespace as typeof CRITICAL_NAMESPACES[number])) {
            // Load critical namespace
            const translation = loadCriticalTranslation(lng, namespace);
            i18n.addResourceBundle(lng, namespace, translation, true, true);
          } else {
            // Load lazy namespace
            const translation = await loadTranslation(lng, namespace);
            i18n.addResourceBundle(lng, namespace, translation, true, true);
          }
        }
      }
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
  console.error('Failed to initialize i18n:', error);
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

