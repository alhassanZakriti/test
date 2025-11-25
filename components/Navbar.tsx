

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { FiMenu, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo width={150} height={45} />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <ThemeSwitcher />
            <LanguageSwitcher />
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
                >
                  {t('nav.dashboard')}
                </Link>
                <Link
                  href="/dashboard/nieuw-project"
                  className="text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
                >
                  {t('nav.newProject')}
                </Link>
                {(session.user as any)?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
                  >
                    {t('nav.admin')}
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center space-x-2 bg-gradient-modual text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <FiLogOut />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/inloggen"
                  className="text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/auth/registreren"
                  className="bg-gradient-modual text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation - Profile Icon or Menu */}
          <div className="md:hidden flex items-center space-x-3">
            <ThemeSwitcher />
            {session ? (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full bg-gradient-modual text-white hover:opacity-90 transition-opacity"
              >
                <FiUser size={20} />
              </button>
            ) : (
              <Link
                href="/auth/inloggen"
                className="p-2 rounded-full bg-gradient-modual text-white hover:opacity-90 transition-opacity"
              >
                <FiUser size={20} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Profile Menu (Only for logged in users) */}
      <AnimatePresence>
        {isMenuOpen && session && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800"
          >
            <div className="px-4 py-4 space-y-3">
              <div className="mb-3 pb-3 border-b dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('nav.signedInAs') || 'Signed in as'}</p>
                <p className="font-medium text-gray-900 dark:text-white">{session.user?.email}</p>
              </div>
              <LanguageSwitcher />
              <Link
                href="/dashboard"
                className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                href="/dashboard/nieuw-project"
                className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.newProject')}
              </Link>
              {(session.user as any)?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('nav.admin')}
                </Link>
              )}
              <button
                onClick={() => {
                  signOut({ callbackUrl: '/' });
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-modual text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity mt-2"
              >
                <FiLogOut />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

