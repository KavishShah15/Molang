import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import hi from './hi.json'; 

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { // English
        translation: en,
      },
      hi: { // Simplified Chinese
        translation: hi,
      },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, 
    },
  });

export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
};

export const getCurrentLanguage = () => i18n.language;

export default i18n;
