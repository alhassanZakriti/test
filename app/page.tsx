'use client';

import Link from 'next/link'
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import Footer from '@/components/Footer';
import { FiDatabase, FiUser } from 'react-icons/fi';
import { FcBarChart } from 'react-icons/fc';

export default function Home() {
  const { data: session } = useSession();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Logo width={150} height={45} />
          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
            <LanguageSwitcher />
            {session ? (
              <Link 
                href="/dashboard" 
                className="bg-gradient-modual text-white sm:px-6 px-3 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <span className='hidden sm:block'>{t('nav.dashboard')}</span>
                <FcBarChart className='sm:hidden block'/>
              </Link>
            ) : (
              <>
                <Link 
                  href="/auth/inloggen" 
                  className="md:block hidden text-gray-700 dark:text-gray-300 hover:text-modual-purple dark:hover:text-modual-pink font-medium transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link 
                  href="/auth/registreren" 
                  className="hidden md:block bg-gradient-modual text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-all transform hover:scale-105"
                >
                  {t('nav.getStarted')}
                </Link>
                <Link 
                  href="/auth/registreren" 
                  className=" bg-gradient-modual text-white px-3 py-3 rounded-[100%] font-medium hover:opacity-90 transition-all transform hover:scale-105 md:hidden block"
                >
                  <FiUser />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 flex-1 pt-24">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="gradient-text">{t('home.heroTitle')}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            {t('home.heroSubtitle')}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link 
              href={session ? "/dashboard" : "/auth/registreren"} 
              className="bg-gradient-modual text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {t('home.startNow')}
            </Link>
            <Link 
              href="https://wa.me/212637655794" 
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 sm:px-8 px-4 sm:py-4 py-3 rounded-xl font-semibold sm:text-lg text-sm hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-600 dark:hover:border-green-300 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-6 sm:h-6">
              <path d="M12.001 2C17.524 2 22.001 6.477 22.001 12C22.001 17.523 17.524 22 12.001 22C10.2337 22.003 8.49757 21.5353 6.97099 20.645L2.00499 22L3.35699 17.032C2.46595 15.5049 1.99789 13.768 2.00099 12C2.00099 6.477 6.47799 2 12.001 2ZM8.59299 7.3L8.39299 7.308C8.26368 7.31691 8.13734 7.35087 8.02099 7.408C7.91257 7.46951 7.81355 7.5463 7.72699 7.636C7.60699 7.749 7.53899 7.847 7.46599 7.942C7.09611 8.4229 6.89696 9.01331 6.89999 9.62C6.90199 10.11 7.02999 10.587 7.22999 11.033C7.63899 11.935 8.31199 12.89 9.19999 13.775C9.41399 13.988 9.62399 14.202 9.84999 14.401C10.9534 15.3724 12.2683 16.073 13.69 16.447L14.258 16.534C14.443 16.544 14.628 16.53 14.814 16.521C15.1052 16.5056 15.3895 16.4268 15.647 16.29C15.7778 16.2223 15.9056 16.1489 16.03 16.07C16.03 16.07 16.0723 16.0413 16.155 15.98C16.29 15.88 16.373 15.809 16.485 15.692C16.569 15.6053 16.639 15.5047 16.695 15.39C16.773 15.227 16.851 14.916 16.883 14.657C16.907 14.459 16.9 14.351 16.897 14.284C16.893 14.177 16.804 14.066 16.707 14.019L16.125 13.758C16.125 13.758 15.255 13.379 14.723 13.137C14.6673 13.1128 14.6077 13.0989 14.547 13.096C14.4786 13.0888 14.4094 13.0965 14.3442 13.1184C14.279 13.1403 14.2192 13.176 14.169 13.223C14.164 13.221 14.097 13.278 13.374 14.154C13.3325 14.2098 13.2753 14.2519 13.2098 14.2751C13.1443 14.2982 13.0733 14.3013 13.006 14.284C12.9408 14.2666 12.877 14.2446 12.815 14.218C12.691 14.166 12.648 14.146 12.563 14.11C11.9889 13.8599 11.4574 13.5215 10.988 13.107C10.862 12.997 10.745 12.877 10.625 12.761C10.2316 12.3842 9.88874 11.958 9.60499 11.493L9.54599 11.398C9.50425 11.3338 9.47003 11.265 9.44399 11.193C9.40599 11.046 9.50499 10.928 9.50499 10.928C9.50499 10.928 9.74799 10.662 9.86099 10.518C9.97099 10.378 10.064 10.242 10.124 10.145C10.242 9.955 10.279 9.76 10.217 9.609C9.93699 8.925 9.64766 8.24467 9.34899 7.568C9.28999 7.434 9.11499 7.338 8.95599 7.319C8.90199 7.31233 8.84799 7.307 8.79399 7.303C8.65972 7.2953 8.52508 7.29663 8.39099 7.307L8.59299 7.3Z" fill="#22c55e"/>
              </svg>

              <span className="sm:inline hidden">{t('home.contactWhatsApp') || 'WhatsApp'}</span>
              <span className="sm:hidden inline ">WhatsApp</span>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <div id="features" className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-gray-900 transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">{t('home.feature1Title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.feature1Desc')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-gray-900 transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">{t('home.feature2Title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.feature2Desc')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-gray-900 transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">{t('home.feature3Title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.feature3Desc')}
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-32">
            <h2 className="text-4xl font-bold mb-12 text-gray-800 dark:text-gray-100">{t('home.howItWorks')}</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="relative">
                <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400 mx-auto mb-4">
                  1
                </div>
                <h4 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">{t('home.step1Title')}</h4>
                <p className="text-gray-600 dark:text-gray-400">{t('home.step1Desc')}</p>
              </div>
              <div className="relative">
                <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400 mx-auto mb-4">
                  2
                </div>
                <h4 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">{t('home.step2Title')}</h4>
                <p className="text-gray-600 dark:text-gray-400">{t('home.step2Desc')}</p>
              </div>
              <div className="relative">
                <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400 mx-auto mb-4">
                  3
                </div>
                <h4 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">{t('home.step3Title')}</h4>
                <p className="text-gray-600 dark:text-gray-400">{t('home.step3Desc')}</p>
              </div>
              <div className="relative">
                <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400 mx-auto mb-4">
                  4
                </div>
                <h4 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">{t('home.step4Title')}</h4>
                <p className="text-gray-600 dark:text-gray-400">{t('home.step4Desc')}</p>
              </div>
            </div>
          </div>

          {/* Pricing Preview Section */}
          <div className="mt-32">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                {t('pricing.sectionTitle')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t('pricing.sectionSubtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Basic Plan */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{t('pricing.basicPlan')}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-4xl font-bold gradient-text mx-auto">{t('pricing.basicPrice')}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{t('pricing.basicDescription')}</p>
                <Link
                  href="/pricing"
                  className="block w-full text-center border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold hover:border-modual-purple dark:hover:border-modual-pink hover:text-modual-purple dark:hover:text-modual-pink transition-all"
                >
                  {t('pricing.learnMore')}
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl ring-2 ring-modual-purple dark:ring-modual-pink transform scale-105">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-modual text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {t('pricing.mostPopular')}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{t('pricing.proPlan')}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-4xl font-bold gradient-text mx-auto">{t('pricing.proPrice')}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{t('pricing.proDescription')}</p>
                <Link
                  href="/pricing"
                  className="block w-full text-center bg-gradient-modual text-white py-3 rounded-lg font-semibold hover:opacity-90 transform hover:scale-105 transition-all"
                >
                  {t('pricing.learnMore')}
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{t('pricing.enterprisePlan')}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-4xl font-bold gradient-text mx-auto">{t('pricing.enterprisePrice')}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{t('pricing.enterpriseDescription')}</p>
                <Link
                  href="/pricing"
                  className="block w-full text-center border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold hover:border-modual-purple dark:hover:border-modual-pink hover:text-modual-purple dark:hover:text-modual-pink transition-all"
                >
                  {t('pricing.contactUs')}
                </Link>
              </div>
            </div>
            <div className="text-center mt-8">
              <Link
                href="/pricing"
                className="inline-block text-modual-purple dark:text-modual-pink font-semibold hover:underline"
              >
                {t('pricing.title')} →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

