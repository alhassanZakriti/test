'use client';

import ProjectForm from '@/components/ProjectForm';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NewProjectPage() {
  const { t } = useLanguage();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-modual-purple dark:text-modual-pink hover:text-modual-pink dark:hover:text-modual-purple transition-colors mb-4"
        >
          <FiArrowLeft className="mr-2" />
          {t('dashboard.backToDashboard')}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.startNewProject').split(' ').slice(0, -2).join(' ')} <span className="gradient-text">{t('dashboard.startNewProject').split(' ').slice(-2).join(' ')}</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('dashboard.shareIdeas')}
        </p>
      </div>

      <ProjectForm />
    </div>
  );
}

