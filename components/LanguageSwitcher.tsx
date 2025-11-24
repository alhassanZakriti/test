'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n';
import { FiGlobe, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Change language"
      >
        <FiGlobe className="text-gray-700 dark:text-gray-300" size={20} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {localeFlags[locale]} {localeNames[locale]}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10 text-gray-900 dark:text-gray-100"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 dark:bg-gray-900"
            >
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    setLocale(loc);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    locale === loc ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>{localeFlags[loc]}</span>
                    <span className={locale === loc ? 'font-semibold' : ''}>
                      {localeNames[loc]}
                    </span>
                  </span>
                  {locale === loc && (
                    <FiCheck className="text-modual-purple" size={16} />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
