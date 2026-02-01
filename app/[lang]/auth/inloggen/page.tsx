'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { update } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Extract language from URL pathname
  const getLangFromPath = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const match = pathname.match(/^\/([a-z]{2})\//);
      return match ? match[1] : 'en';
    }
    return 'en';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: `/${getLangFromPath()}/dashboard`,
      });

      if (result?.error) {
        setError(t('auth.invalidCredentials'));
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Refresh the session to ensure useSession() is updated
        await update();
        const lang = getLangFromPath();
        // Use full page navigation to ensure session is properly loaded
        window.location.href = `/${lang}/dashboard`;
      }
    } catch (error) {
      setError(t('auth.somethingWrong'));
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Dynamic import to avoid SSR issues
      const { signInWithGoogle } = await import('@/lib/firebase');
      
      // Sign in with Firebase
      const firebaseUser = await signInWithGoogle();
      
      // Send Firebase user data to your backend
      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with backend');
      }

      // Sign in with NextAuth using the email
      const result = await signIn('credentials', {
        redirect: true,
        callbackUrl: `/${getLangFromPath()}/dashboard`,
        email: firebaseUser.email,
        password: firebaseUser.uid, // Use UID as password for Firebase users
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        const lang = getLangFromPath();
        router.push(`/${lang}/dashboard`);
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      if (error.message === 'Popup was blocked. Please allow popups for this site.') {
        setError(t('auth.popupBlocked') || error.message);
      } else if (error.message === 'Sign-in cancelled. Please try again.') {
        setError(t('auth.signInCancelled') || error.message);
      } else if (error.message?.includes('unauthorized-domain')) {
        setError('Domain not authorized. Please add this domain to Firebase authorized domains.');
      } else if (error.message?.includes('operation-not-allowed')) {
        setError('Google sign-in is not enabled in Firebase configuration.');
      } else {
        setError(error.message || t('auth.googleSignInError') || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    if (provider === 'google') {
      await handleGoogleSignIn();
      return;
    }
    
    try {
      const lang = getLangFromPath();
      const callbackUrl = `/${lang}/dashboard`;
      
      const result = await signIn(provider, { 
        redirect: true,
        callbackUrl: callbackUrl,
      });
      
      if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (error) {
      setError(t('auth.somethingWrong'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo width={180} height={54} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.welcomeBack')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('auth.loginToAccount')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-modual-purple focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-modual-purple focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-modual text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? t('auth.loggingIn') : t('nav.login')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t('auth.orLoginWith')}</span>
              </div>
            </div>

            <div className="mt-6 grid  gap-3">
              <button
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FcGoogle size={20} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google</span>
              </button>
              {/* <button
                onClick={() => handleSocialLogin('facebook')}
                className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</span>
              </button> */}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.noAccount')}{' '}
            <Link href={`/${getLangFromPath()}/auth/registreren`} className="text-modual-purple dark:text-modual-pink font-semibold hover:underline">
              {t('auth.registerHere')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

