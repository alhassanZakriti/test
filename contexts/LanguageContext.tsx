
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, defaultLocale, locales, isRTL } from '@/lib/i18n';
import { getTranslation } from '@/lib/translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLang }: { children: React.ReactNode; initialLang?: string }) {
  const [locale, setLocaleState] = useState<Locale>(
    (initialLang && locales.includes(initialLang as Locale) ? initialLang : defaultLocale) as Locale
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // If initialLang is provided, use it
    if (initialLang && locales.includes(initialLang as Locale)) {
      setLocaleState(initialLang as Locale);
      localStorage.setItem('locale', initialLang);
    } else {
      // Load saved locale from localStorage if no initialLang
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && locales.includes(savedLocale)) {
        setLocaleState(savedLocale);
      }
    }
    setMounted(true);
  }, [initialLang]);

  useEffect(() => {
    if (mounted) {
      // Update document attributes for RTL support
      document.documentElement.lang = locale;
      document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr';
    }
  }, [locale, mounted]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string): string => {
    return getTranslation(key, locale);
  };

  const value = {
    locale,
    setLocale,
    t,
    isRTL: isRTL(locale),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
