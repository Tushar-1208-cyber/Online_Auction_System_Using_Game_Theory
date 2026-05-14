import { createContext, useContext, useState } from 'react';
import en from '../i18n/en';
import hi from '../i18n/hi';

const translations = { en, hi };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'en');

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

  const switchLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, switchLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
