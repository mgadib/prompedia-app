import { useTranslation } from 'react-i18next';
import { STORAGE_KEYS } from '@/lib/constants';

// RTL language codes
const RTL_LANGUAGES = ['ar', 'he', 'ur', 'fa', 'yi', 'ji', 'iw', 'ku', 'ps', 'sd'];

const isRTL = (lang: string): boolean => {
  const langCode = lang.split('-')[0].toLowerCase();
  return RTL_LANGUAGES.includes(langCode);
};

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lng);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng;
      document.documentElement.dir = isRTL(lng) ? 'rtl' : 'ltr';
    }
  };

  const currentLanguage = i18n.language;
  const isEnglish = currentLanguage === 'en' || currentLanguage.startsWith('en-');
  const isIndonesian = currentLanguage === 'id' || currentLanguage.startsWith('id-');
  const isRTLMode = isRTL(currentLanguage);

  return {
    currentLanguage,
    changeLanguage,
    isEnglish,
    isIndonesian,
    isRTL: isRTLMode,
    t: i18n.t.bind(i18n),
  };
};

