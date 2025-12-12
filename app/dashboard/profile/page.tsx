'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiGlobe, FiCopy, FiCheck, FiSave } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  paymentAlias?: string;
  preferredLanguage: string;
  role?: string;
}

interface SubscriptionStatus {
  needsPayment: boolean;
  status: string;
  daysRemaining: number;
  expirationDate: string | null;
  plan?: string;
  price?: number;
  lastPayment?: {
    amount: number;
    date: string;
    verified: boolean;
  };
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { t, locale, setLocale } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    preferredLanguage: 'en',
  });

  useEffect(() => {
    fetchProfile();
    fetchSubscriptionStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (data.user) {
        setProfile(data.user);
        setFormData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          phoneNumber: data.user.phoneNumber || '',
          preferredLanguage: data.user.preferredLanguage || 'en',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      // Don't fetch subscription status for admins
      if (profile?.role === 'admin') {
        return;
      }
      
      const response = await fetch('/api/user/subscription-status');
      const data = await response.json();
      
      if (response.ok) {
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Update language context if language changed
        if (formData.preferredLanguage !== locale) {
          setLocale(formData.preferredLanguage as 'en' | 'nl' | 'fr' | 'ar');
        }

        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setIsSaving(false);
    }
  };

  const copyPaymentAlias = () => {
    if (profile?.paymentAlias) {
      navigator.clipboard.writeText(profile.paymentAlias);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-modual-purple"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('common.profile') || 'Profile'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </motion.div>

      {/* Payment Alias Card - Only show for regular users, not admins */}
      {profile?.paymentAlias && profile?.role !== 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-gradient-to-r from-modual-pink via-modual-purple to-modual-blue p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-1">💳 Your Payment ID</h3>
              <p className="text-white/80 text-sm mb-3">
                Use this ID when making payments. This ID is read-only and cannot be changed.
              </p>
              <div className="flex items-center space-x-3">
                <code className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-mono text-lg font-bold">
                  {profile.paymentAlias}
                </code>
                <button
                  onClick={copyPaymentAlias}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-lg transition-all"
                  title="Copy to clipboard"
                >
                  {copied ? <FiCheck size={20} /> : <FiCopy size={20} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subscription Status Card */}
      {subscriptionStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`mb-8 p-6 rounded-lg shadow-lg ${
            subscriptionStatus.status === 'Paid'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : subscriptionStatus.status === 'Pending Verification'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600'
              : 'bg-gradient-to-r from-red-500 to-rose-600'
          }`}
        >
          <div className="text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-xl">📅 Subscription Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                subscriptionStatus.status === 'Paid'
                  ? 'bg-white/30'
                  : 'bg-white/40'
              }`}>
                {subscriptionStatus.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white/70 text-sm">Plan</p>
                <p className="text-white font-semibold text-lg">
                  {subscriptionStatus.plan || 'Basic'}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white/70 text-sm">Days Remaining</p>
                <p className="text-white font-semibold text-lg">
                  {subscriptionStatus.daysRemaining > 0 
                    ? `${subscriptionStatus.daysRemaining} days`
                    : 'Expired'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white/70 text-sm">Next Payment</p>
                <p className="text-white font-semibold text-lg">
                  {subscriptionStatus.price || 150} MAD
                </p>
              </div>
            </div>

            {subscriptionStatus.expirationDate && (
              <p className="text-white/80 text-sm">
                Expires on: {new Date(subscriptionStatus.expirationDate).toLocaleDateString()}
              </p>
            )}

            {subscriptionStatus.lastPayment && (
              <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white/70 text-sm mb-2">Last Payment</p>
                <div className="flex items-center justify-between text-sm">
                  <span>{subscriptionStatus.lastPayment.amount} MAD</span>
                  <span>{new Date(subscriptionStatus.lastPayment.date).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded ${
                    subscriptionStatus.lastPayment.verified 
                      ? 'bg-green-500/50' 
                      : 'bg-yellow-500/50'
                  }`}>
                    {subscriptionStatus.lastPayment.verified ? '✓ Verified' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiUser className="inline mr-2" />
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-modual-purple dark:bg-gray-700 dark:text-white"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiUser className="inline mr-2" />
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-modual-purple dark:bg-gray-700 dark:text-white"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiMail className="inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-modual-purple dark:bg-gray-700 dark:text-white"
              placeholder="your.email@example.com"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiPhone className="inline mr-2" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-modual-purple dark:bg-gray-700 dark:text-white"
              placeholder="+212 6XX XXX XXX"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Used for WhatsApp notifications about your projects
            </p>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiGlobe className="inline mr-2" />
              Preferred Language
            </label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-modual-purple dark:bg-gray-700 dark:text-white"
            >
              <option value="en">🇬🇧 English</option>
              <option value="nl">🇳🇱 Nederlands</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="ar">🇲🇦 العربية</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Language used for notifications and interface
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center space-x-2 bg-gradient-modual text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
