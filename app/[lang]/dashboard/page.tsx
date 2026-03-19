'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiPlus, FiClock, FiCheckCircle, FiAlertCircle, FiX, FiUser, FiMail, FiPhone, FiCopy, FiDollarSign, FiExternalLink } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalizedPath } from '@/lib/useLocalizedPath';

interface Project {
  id: string;
  title: string;
  description?: string;
  textInput?: string;
  phoneNumber?: string;
  websiteType?: string;
  price?: number;
  logoUrl?: string;
  photoUrls?: string;
  voiceMemoUrl?: string;
  status: string;
  previewUrl?: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const { getPath } = useLocalizedPath();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
    // Poll for updates every 30 seconds to detect status changes
    const interval = setInterval(fetchProjects, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async () => {
    try {
      console.log('📡 Fetching projects from API...');
      const response = await fetch('/api/projects');
      const data = await response.json();
      const newProjects = data.projects || [];
      console.log('📦 Fetched', newProjects.length, 'projects');
      
      setProjects(newProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    console.log('🔍 Fetching project details for ID:', projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      console.log('📡 API Response status:', response.status);
      const data = await response.json();
      console.log('📦 Project data received:', data);
      const project = data.project;
      
      setSelectedProject(project);
      console.log('✅ Modal should now open');
    } catch (error) {
      console.error('❌ Error fetching project details:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'New':
        return <FiClock className="text-blue-500 dark:text-blue-400" />;
      case 'IN_PROGRESS':
      case 'In Progress':
        return <FiAlertCircle className="text-yellow-500 dark:text-yellow-400" />;
      case 'PREVIEW':
        return <FiExternalLink className="text-purple-500 dark:text-purple-400" />;
      case 'COMPLETE':
      case 'Completed':
        return <FiCheckCircle className="text-green-500 dark:text-green-400" />;
      default:
        return <FiClock className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'New':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'IN_PROGRESS':
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'PREVIEW':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'COMPLETE':
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'New':
        return t('common.new');
      case 'IN_PROGRESS':
      case 'In Progress':
        return t('common.inProgress');
      case 'PREVIEW':
        return t('common.preview');
      case 'COMPLETE':
      case 'Completed':
        return t('common.complete');
      default:
        return status;
    }
  };

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (status === 'unauthenticated' || !session) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.welcomeBack')}, <span className="gradient-text">{session?.user?.name}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('dashboard.manageProjects')}</p>
      </div>

      <div className="mb-8">
        <Link
          href={getPath("/dashboard/nieuw-project")}
          className="inline-flex items-center space-x-2 bg-gradient-modual text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          <FiPlus />
          <span>{t('nav.newProject')}</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-modual-purple"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiPlus size={32} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('dashboard.noProjects')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('dashboard.noProjectsDesc')}
          </p>
          <Link
            href={getPath("/dashboard/nieuw-project")}
            className="inline-flex items-center space-x-2 bg-gradient-modual text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            <FiPlus />
            <span>{t('nav.newProject')}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                console.log('🖱️ Card clicked! Project ID:', project.id);
                fetchProjectDetails(project.id);
              }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all p-6 cursor-pointer hover:scale-105 border border-transparent dark:border-gray-700"
            >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {project.title || t('dashboard.untitledProject')}
                    </h3>
                    {project.websiteType && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span>{project.websiteType === 'ecommerce' ? '🛒' : '🌐'}</span>
                        <span>{project.websiteType === 'ecommerce' ? 'E-commerce' : 'Basic Website'}</span>
                        <span className="text-modual-purple dark:text-modual-pink font-semibold">
                          {project.price || 150} MAD
                        </span>
                      </div>
                    )}
                  </div>
                  {getStatusIcon(project.status)}
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {project.description || t('dashboard.noDescription')}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Preview Link and Payment for PREVIEW status */}
                {project.status === 'PREVIEW' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    {/* Preview Link */}
                    {project.previewUrl && (
                      <a
                        href={project.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        <FiExternalLink size={14} />
                        <span>👀 View Preview</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Completed status display */}
                {project.status === 'COMPLETE' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <FiCheckCircle size={14} />
                      <span>✅ Project Complete!</span>
                    </div>
                  </div>
                )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedProject.title || t('dashboard.untitledProject')}
              </h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              {selectedProject.user && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {t('projectDetail.customerInfo')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedProject.user.name && (
                      <div className="flex items-center space-x-2">
                        <FiUser className="text-gray-400 dark:text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('projectDetail.name')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedProject.user.name}</p>
                        </div>
                      </div>
                    )}
                    {selectedProject.user.email && (
                      <div className="flex items-center space-x-2">
                        <FiMail className="text-gray-400 dark:text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('projectDetail.email')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedProject.user.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedProject.phoneNumber && (
                      <div className="flex items-center space-x-2">
                        <FiPhone className="text-gray-400 dark:text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('projectDetail.phone')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedProject.phoneNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Project ID and Status */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.status')}:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProject.status)}`}>
                    {getStatusText(selectedProject.status)}
                  </span>
                </div>
                
                {/* Project Payment ID */}
              </div>

              {/* Logo */}
              {selectedProject.logoUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Logo</h3>
                  <div className="flex justify-center">
                    <img
                      src={selectedProject.logoUrl}
                      alt="Logo"
                      className="h-24 w-auto object-contain rounded-lg border-2 border-gray-200 dark:border-gray-600 p-4 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}

              {/* Preview URL - Show for PREVIEW and COMPLETE status */}
              {selectedProject.previewUrl && (selectedProject.status === 'PREVIEW' || selectedProject.status === 'COMPLETE') && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                      <FiExternalLink size={20} />
                      {t('projectDetail.projectPreview')}
                    </h3>
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                      {selectedProject.status === 'COMPLETE' ? '✅ ' + t('admin.complete') : '👀 ' + t('admin.preview')}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                    {selectedProject.status === 'PREVIEW' 
                      ? t('projectDetail.previewReadyMessage')
                      : t('projectDetail.projectCompleteMessage')
                    }
                  </p>
                  <a
                    href={selectedProject.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-modual text-white font-semibold rounded-lg hover:opacity-90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    <FiExternalLink size={18} />
                    <span>{t('projectDetail.viewPreview')}</span>
                  </a>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('admin.projectDescription')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedProject.description || selectedProject.textInput || t('dashboard.noDescription')}
                </p>
              </div>

              {/* Photos */}
              {(() => {
                try {
                  const photos = JSON.parse(selectedProject.photoUrls || '[]');
                  if (photos.length > 0) {
                    return (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {t('admin.images')} ({photos.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {photos.map((photo: string, index: number) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                                onClick={() => window.open(photo, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm">
                                  {t('admin.clickToEnlarge')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (error) {
                  console.error('Error parsing photos:', error);
                }
                return null;
              })()}

              {/* Voice Memo */}
              {selectedProject.voiceMemoUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('admin.voiceMemo')}</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <audio controls src={selectedProject.voiceMemoUrl} className="w-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button
                onClick={() => setSelectedProject(null)}
                className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                {t('admin.close')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
