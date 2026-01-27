

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalizedPath } from '@/lib/useLocalizedPath';
import { FiMenu, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { getPath } = useLocalizedPath();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo width={150} height={45} />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href={getPath("/pricing")}
              className="text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
            >
              {t('nav.pricing')}
            </Link>
            <ThemeSwitcher />
            <LanguageSwitcher />
            {session ? (
              <>
                <Link
                  href={getPath("/dashboard")}
                  className="text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
                >
                  {t('nav.dashboard')}
                </Link>
                <Link
                  href={getPath("/dashboard/nieuw-project")}
                  className="text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
                >
                  {t('nav.newProject')}
                </Link>
                <Link
                  href={getPath("/dashboard/profile")}
                  className="text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
                >
                  {t('nav.profile') || 'Profile'}
                </Link>
                {(session.user as any)?.role === 'admin' && (
                  <Link
                    href={getPath("/admin")}
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
                  href={getPath("/auth/inloggen")}
                  className="md:flex hidden text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href={getPath("/auth/registreren")}
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

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Settings Section */}
              <div className="flex items-center space-x-3 pb-3 border-b dark:border-gray-700">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>

              {/* Pricing Link */}
              <Link
                href={getPath("/pricing")}
                className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.pricing')}
              </Link>

              {session ? (
                <>
                  {/* User Info */}
                  <div className="pb-3 border-b dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('nav.signedInAs') || 'Signed in as'}</p>
                    <p className="font-medium text-gray-900 dark:text-white truncate">{session.user?.email}</p>
                  </div>

                  {/* Navigation Links */}
                  <Link
                    href={getPath("/dashboard")}
                    className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    href={getPath("/dashboard/nieuw-project")}
                    className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.newProject')}
                  </Link>
                  <Link
                    href={getPath("/dashboard/profile")}
                    className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.profile') || 'Profile'}
                  </Link>
                  {(session.user as any)?.role === 'admin' && (
                    <Link
                      href={getPath("/admin")}
                      className="block text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('nav.admin')}
                    </Link>
                  )}

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-modual text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity mt-2"
                  >
                    <FiLogOut />
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Guest Navigation */}
                  <Link
                    href={getPath("/auth/inloggen")}
                    className="md:block hidden text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    href={getPath("/auth/registreren")}
                    className=" block w-full text-center bg-gradient-modual text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity"
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

