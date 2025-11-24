import { Locale } from './i18n';

// Import JSON translation files
import enTranslations from '../locales/en.json';
import nlTranslations from '../locales/nl.json';
import frTranslations from '../locales/fr.json';
import arTranslations from '../locales/ar.json';

// Create translations object from JSON files
export const translations = {
  en: enTranslations,
  nl: nlTranslations,
  fr: frTranslations,
  ar: arTranslations,
} as const;

// Type for translation keys based on the English translation structure
export type TranslationKey = keyof typeof enTranslations;

/**
 * Get translation for a specific key and locale
 * Supports dot notation for nested keys (e.g., "nav.dashboard")
 * Falls back to English if locale not found, then to the key itself
 * 
 * @param key - Translation key (supports dot notation)
 * @param locale - Target locale (en, nl, fr, ar)
 * @returns Translated string
 */
export function getTranslation(key: string, locale: Locale): string {
  const keys = key.split('.');
  
  // Get the translations for the specific locale
  let value: any = translations[locale];

  // Navigate through nested keys
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined || value === null) {
      // Fallback to English
      let fallbackValue: any = translations['en'];
      for (const k of keys) {
        fallbackValue = fallbackValue?.[k];
        if (fallbackValue === undefined || fallbackValue === null) {
          return key; // Return key if not found even in English
        }
      }
      return fallbackValue;
    }
  }

  return value || key;
}
