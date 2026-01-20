'use client';

import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function Providers({ children, lang }: { children: React.ReactNode; lang?: string }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

