import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import id from './locales/id.json';
import en from './locales/en.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            id: { translation: id },
            en: { translation: en }
        },
        fallbackLng: 'en',
        debug: false,
        // Pluralization configuration
        pluralSeparator: '_',
        contextSeparator: '_',
        // Interpolation configuration
        interpolation: {
            escapeValue: false,
            formatSeparator: ',',
            format: (value, format) => {
                if (format === 'number') {
                    return new Intl.NumberFormat(i18n.language).format(value);
                }
                return value;
            }
        },
        // React-specific options
        react: {
            useSuspense: false
        }
    });

export default i18n;
