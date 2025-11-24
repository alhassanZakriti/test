# 🌍 Internationalization (i18n) Guide

## Overview

This application now supports **4 languages**:
- 🇬🇧 **English** (Primary/Default)
- 🇳🇱 **Dutch** (Nederlands)
- 🇫🇷 **French** (Français)
- 🇸🇦 **Arabic** (العربية) - with RTL support

## Implementation

### Architecture

The i18n system is built using React Context and doesn't require any additional dependencies. It's lightweight and fully type-safe.

**Key Files:**
- `lib/i18n.ts` - Language configuration and utilities
- `lib/translations.ts` - All translation strings
- `contexts/LanguageContext.tsx` - React Context for language state
- `components/LanguageSwitcher.tsx` - UI component for switching languages

### How It Works

1. **Language Detection**: On first load, the app uses English as default. The selected language is persisted in localStorage.

2. **Context Provider**: `LanguageProvider` wraps the entire app in `app/providers.tsx` and provides:
   - Current locale
   - Translation function `t(key)`
   - `setLocale()` function
   - RTL support for Arabic

3. **RTL Support**: When Arabic is selected, the document automatically switches to RTL layout with `dir="rtl"` attribute.

## Usage

### In Components

```tsx
'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function MyComponent() {
  const { t, locale, isRTL } = useLanguage();
  
  return (
    <div>
      <h1>{t('home.heroTitle')}</h1>
      <p>{t('home.heroSubtitle')}</p>
      {isRTL && <span>RTL layout active</span>}
    </div>
  );
}
```

### Translation Keys

Translations are organized hierarchically:

```typescript
t('nav.dashboard')          // Navigation items
t('home.heroTitle')         // Homepage content
t('auth.email')             // Auth pages
t('dashboard.myProjects')   // Dashboard
t('common.loading')         // Common UI elements
```

### Language Switcher

The `<LanguageSwitcher />` component can be placed anywhere:

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

<LanguageSwitcher />
```

It shows:
- Current language with flag
- Dropdown with all available languages
- Checkmark next to active language

## Adding New Translations

### 1. Add to translations.ts

```typescript
// lib/translations.ts
export const translations = {
  mySection: {
    myKey: {
      en: 'Hello World',
      nl: 'Hallo Wereld',
      fr: 'Bonjour le monde',
      ar: 'مرحبا بالعالم',
    },
  },
}
```

### 2. Use in Component

```tsx
const { t } = useLanguage();
<h1>{t('mySection.myKey')}</h1>
```

## Adding a New Language

### 1. Update lib/i18n.ts

```typescript
export type Locale = 'en' | 'nl' | 'fr' | 'ar' | 'de'; // Add 'de'

export const locales: Locale[] = ['en', 'nl', 'fr', 'ar', 'de'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands',
  fr: 'Français',
  ar: 'العربية',
  de: 'Deutsch', // Add German
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  nl: '🇳🇱',
  fr: '🇫🇷',
  ar: '🇸🇦',
  de: '🇩🇪', // Add German flag
};
```

### 2. Add translations to lib/translations.ts

Add the new language key to every translation object:

```typescript
nav: {
  dashboard: {
    en: 'Dashboard',
    nl: 'Dashboard',
    fr: 'Tableau de bord',
    ar: 'لوحة التحكم',
    de: 'Instrumententafel', // Add German
  },
  // ... repeat for all keys
}
```

## RTL Languages

Arabic is configured as RTL. To add more RTL languages:

```typescript
// lib/i18n.ts
export function isRTL(locale: Locale): boolean {
  return locale === 'ar' || locale === 'he'; // Add Hebrew
}
```

### RTL-Specific Styling

When RTL is active, you may need custom styles:

```tsx
const { isRTL } = useLanguage();

<div className={isRTL ? 'pr-4' : 'pl-4'}>
  Content
</div>
```

## Translation Coverage

### ✅ Fully Translated Pages

- Homepage (`app/page.tsx`)
- Login Page (`app/auth/inloggen/page.tsx`)
- Navbar (`components/Navbar.tsx`)
- Footer (`components/Footer.tsx`)

### 🔄 Partially Translated

- Register Page
- Dashboard
- Project Pages
- Admin Dashboard

### 📝 To Be Translated

- Project Form
- Voice Recorder
- Admin pages
- Error messages

## Best Practices

### 1. Always Use Translation Keys

❌ **Don't:**
```tsx
<button>Submit</button>
```

✅ **Do:**
```tsx
<button>{t('common.submit')}</button>
```

### 2. Organize by Section

Group related translations together:
```typescript
auth: {
  login: { ... },
  register: { ... },
  logout: { ... },
}
```

### 3. Use Descriptive Keys

❌ **Don't:**
```typescript
text1: { en: 'Hello' }
```

✅ **Do:**
```typescript
welcomeMessage: { en: 'Hello' }
```

### 4. Provide Fallbacks

The translation function automatically falls back to English if a translation is missing:

```typescript
// If French is missing
t('some.key') // Returns English version
```

## Testing

### Test Different Languages

1. Open the app
2. Click the language switcher (globe icon)
3. Select each language
4. Verify:
   - Text changes correctly
   - Arabic enables RTL layout
   - Layout doesn't break
   - Language persists on reload

### Test RTL Layout

1. Switch to Arabic
2. Check:
   - Text aligns right
   - Icons flip correctly
   - Navigation flows right-to-left
   - Forms look correct

## Performance

The i18n system is optimized:

- ✅ No external dependencies
- ✅ Translations loaded once at build time
- ✅ Language preference cached in localStorage
- ✅ Minimal re-renders (only when language changes)
- ✅ Type-safe translation keys

## Troubleshooting

### Language doesn't persist

Check localStorage:
```javascript
localStorage.getItem('locale') // Should return 'en', 'nl', 'fr', or 'ar'
```

### Missing translation

The key will be returned as-is:
```typescript
t('nonexistent.key') // Returns 'nonexistent.key'
```

Add the missing translation to `lib/translations.ts`.

### RTL not working

Verify:
1. Arabic is selected
2. `document.documentElement.dir` is 'rtl'
3. Component is wrapped in `LanguageProvider`

## Future Enhancements

- [ ] Dynamic locale loading (reduce bundle size)
- [ ] Pluralization support
- [ ] Date/time localization
- [ ] Number formatting per locale
- [ ] Translation management UI
- [ ] Automatic translation generation
- [ ] More languages (German, Spanish, Italian, etc.)

## Resources

- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [RTL Styling Guide](https://rtlstyling.com/)
- [Unicode CLDR](http://cldr.unicode.org/)

---

**Note:** When adding new features or pages, remember to add translations for all supported languages!
