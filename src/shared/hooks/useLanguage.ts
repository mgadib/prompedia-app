import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { STORAGE_KEYS } from '@/lib/constants';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  
  // Use state to make currentLanguage reactive
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  // Subscribe to language changes to update state
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    // Cleanup subscription on unmount
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lng);
    document.documentElement.lang = lng;
  };

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

