

import Logo from './Logo';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

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
                <a href="/" className="text-gray-600 dark:text-gray-400 hover:text-modual-purple dark:hover:text-modual-pink transition-colors">
                  {t('footer.home')}
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-modual-purple dark:hover:text-modual-pink transition-colors">
                  {t('nav.dashboard')}
                </a>
              </li>
              <li>
                <a href="/auth/registreren" className="text-gray-600 dark:text-gray-400 hover:text-modual-purple dark:hover:text-modual-pink transition-colors">
                  {t('nav.register')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('footer.contact')}</h3>
            <a href="mailto:info@modual.ma" className="text-sm text-gray-600 dark:text-gray-400">
              Email: info@modual.ma
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {currentYear} Modual. {t('footer.allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}

