

'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalizedPath } from '@/lib/useLocalizedPath';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();
  const { getPath } = useLocalizedPath();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-800 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Logo width={120} height={36} />
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('footer.links')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={getPath("/")} className="text-gray-600 dark:text-gray-400 hover:text-modual-purple dark:hover:text-modual-pink transition-colors">
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <Link href={getPath("/dashboard")} className="text-gray-600 dark:text-gray-400 hover:text-modual-purple dark:hover:text-modual-pink transition-colors">
                  {t('nav.dashboard')}
                </Link>
              </li>
              <li>
                <Link href={getPath("/auth/registreren")} className="text-gray-600 dark:text-gray-400 hover:text-modual-purple dark:hover:text-modual-pink transition-colors">
                  {t('nav.register')}
                </Link>
              </li>
            </ul>
          </div>

          <div className='flex flex-col'>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('footer.contact')}</h3>
            <a href="mailto:info@modual.ma" className="text-sm text-gray-600 dark:text-gray-400">
              Email: info@modual.ma
            </a>
            <Link 
              href="https://wa.me/212637655794" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              Phone: +212 637-655794
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {currentYear} Modual. {t('footer.allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}

