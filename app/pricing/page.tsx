'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { FiCheck } from 'react-icons/fi';

export default function PricingPage() {
  const { t } = useLanguage();

  const plans = [
    {
      name: t('pricing.basicPlan'),
      price: t('pricing.basicPrice'),
      period: t('pricing.perMonth'),
      description: t('pricing.basicDescription'),
      features: [
        t('pricing.basic1'),
        t('pricing.basic2'),
        t('pricing.basic3'),
        t('pricing.basic4'),
        t('pricing.basic5'),
      ],
      cta: t('pricing.getStarted'),
      popular: false,
    },
    {
      name: t('pricing.proPlan'),
      price: t('pricing.proPrice'),
      period: t('pricing.perMonth'),
      description: t('pricing.proDescription'),
      features: [
        t('pricing.pro1'),
        t('pricing.pro2'),
        t('pricing.pro3'),
        t('pricing.pro4'),
        t('pricing.pro5'),
        t('pricing.pro6'),
      ],
      cta: t('pricing.getStarted'),
      popular: true,
    },
    {
      name: t('pricing.enterprisePlan'),
      price: t('pricing.enterprisePrice'),
      period: '',
      description: t('pricing.enterpriseDescription'),
      features: [
        t('pricing.enterprise1'),
        t('pricing.enterprise2'),
        t('pricing.enterprise3'),
        t('pricing.enterprise4'),
        t('pricing.enterprise5'),
        t('pricing.enterprise6'),
      ],
      cta: t('pricing.contactUs'),
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="gradient-text">{t('pricing.title')}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            {t('pricing.subtitle')}
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 ${
                plan.popular
                  ? 'ring-2 ring-modual-purple dark:ring-modual-pink transform scale-105'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-modual text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {t('pricing.mostPopular')}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>
                <div className="flex items-end justify-center gap-2">
                  <span className="text-5xl font-bold gradient-text">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600 dark:text-gray-400 mb-2">
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={20} />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/registreren"
                className={`block w-full text-center py-3 rounded-lg font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-modual text-white hover:opacity-90 transform hover:scale-105'
                    : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-modual-purple dark:hover:border-modual-pink hover:text-modual-purple dark:hover:text-modual-pink'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            {t('pricing.faqTitle')}
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {t('pricing.faq1Question')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('pricing.faq1Answer')}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {t('pricing.faq2Question')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('pricing.faq2Answer')}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {t('pricing.faq3Question')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('pricing.faq3Answer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
