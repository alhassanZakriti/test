'use client';

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

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 dark:text-gray-300"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800"
          >
            <div className="px-4 py-4 space-y-3">
              <div className="mb-3 flex items-center space-x-3">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    href="/dashboard/nieuw-project"
                    className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.newProject')}
                  </Link>
                  {(session.user as any)?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
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
                    className="w-full text-left bg-gradient-modual text-white px-4 py-2 rounded-lg"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/inloggen"
                    className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    href="/auth/registreren"
                    className="block bg-gradient-modual text-white px-4 py-2 rounded-lg text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

