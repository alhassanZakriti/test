export type Locale = 'en' | 'nl' | 'fr' | 'ar';

export const locales: Locale[] = ['en', 'nl', 'fr', 'ar'];

export const defaultLocale: Locale = 'ar';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands',
  fr: 'Français',
  ar: 'العربية',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  nl: '🇳🇱',
  fr: '🇫🇷',
  ar: '🇲🇦',
};

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}
