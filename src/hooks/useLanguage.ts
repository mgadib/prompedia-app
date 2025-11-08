import { useTranslation } from 'react-i18next';
import { STORAGE_KEYS } from '@/lib/constants';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lng);
    document.documentElement.lang = lng;
  };

  const currentLanguage = i18n.language;
  const isEnglish = currentLanguage === 'en' || currentLanguage.startsWith('en-');
  const isIndonesian = currentLanguage === 'id' || currentLanguage.startsWith('id-');

  return {
    currentLanguage,
    changeLanguage,
    isEnglish,
    isIndonesian,
    t: i18n.t.bind(i18n),
  };
};

