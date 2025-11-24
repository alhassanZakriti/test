'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  FiArrowLeft, 
  FiUser, 
  FiMail, 
  FiCalendar, 
  FiClock,
  FiImage,
  FiMic,
  FiFileText,
  FiEdit,
  FiSave,
  FiX
} from 'react-icons/fi';

interface Project {
  id: string;
  title: string;
  phoneNumber: string;
  description: string;
  textInput: string;
  logoUrl: string;
  photoUrls: string;
  voiceMemoUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ProjectPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isAdmin = session && (session.user as any).role === 'admin';

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Project not found');
      }
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error('Error fetching project:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, fetchProject]);

  const handleStatusUpdate = async (status: string) => {
    if (!isAdmin) return;

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchProject();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nieuw':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'In Behandeling':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Voltooid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Nieuw':
        return t('common.new');
      case 'In Behandeling':
        return t('common.inProgress');
      case 'Voltooid':
        return t('common.completed');
      default:
        return status;
    }
  };

  const photoUrls = project?.photoUrls ? JSON.parse(project.photoUrls) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">{t('projectDetail.projectNotFound')}</p>
          <Link
            href="/dashboard"
            className="text-primary-500 hover:text-primary-600 font-semibold"
          >
            {t('projectDetail.backToDashboard')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('common.back')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                {t('projectDetail.customerInfo')}
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('projectDetail.name')}</p>
                  <p className="font-medium text-gray-800 dark:text-white">{project.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('projectDetail.email')}</p>
                  <p className="font-medium text-gray-800 dark:text-white">{project.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('projectDetail.phone')}</p>
                  <p className="font-medium text-gray-800 dark:text-white">{project.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('projectDetail.created')}</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('projectDetail.lastUpdate')}</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Status Management (Admin Only) */}
              {session?.user?.role === 'ADMIN' && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('projectDetail.changeStatus')}
                  </label>
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-modual-purple dark:focus:ring-modual-pink"
                  >
                    <option value="Nieuw">{t('common.new')}</option>
                    <option value="In Behandeling">{t('common.inProgress')}</option>
                    <option value="Voltooid">{t('common.completed')}</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {project.title || t('projectDetail.untitledProject')}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
            </div>

            {/* Logo */}
            {project.logoUrl && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Logo
                </h2>
                <div className="flex justify-center">
                  <img
                    src={project.logoUrl}
                    alt="Project Logo"
                    className="h-32 w-auto object-contain rounded-lg border-2 border-gray-200 dark:border-gray-600 p-4 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {t('projectDetail.description')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {project.description || t('projectDetail.noDescription')}
              </p>
            </div>

            {/* Additional Text */}
            {project.textInput && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  {t('projectDetail.additionalText')}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {project.textInput}
                </p>
              </div>
            )}

            {/* Photos */}
            {photoUrls.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  {t('projectDetail.photos')} ({photoUrls.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photoUrls.map((url: string, index: number) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Memo */}
            {project.voiceMemoUrl && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  {t('projectDetail.voiceMemo')}
                </h2>
                <audio
                  src={project.voiceMemoUrl}
                  controls
                  className="w-full"
                >
                  {t('projectDetail.audioNotSupported')}
                </audio>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt={t('projectDetail.fullView')}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}

