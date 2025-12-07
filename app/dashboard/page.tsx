'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiPlus, FiClock, FiCheckCircle, FiAlertCircle, FiX, FiUser, FiMail, FiPhone, FiCopy } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

interface Project {
  id: string;
  title: string;
  description?: string;
  textInput?: string;
  phoneNumber?: string;
  logoUrl?: string;
  photoUrls?: string;
  voiceMemoUrl?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
}

interface UserData {
  id: string;
  name: string;
  email: string;
  paymentAlias?: string;
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchUserData();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/me');
      const data = await response.json();
      setUserData(data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const copyPaymentAlias = () => {
    if (userData?.paymentAlias) {
      navigator.clipboard.writeText(userData.paymentAlias);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    console.log('🔍 Fetching project details for ID:', projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      console.log('📡 API Response status:', response.status);
      const data = await response.json();
      console.log('📦 Project data received:', data);
      setSelectedProject(data.project);
      console.log('✅ Modal should now open');
    } catch (error) {
      console.error('❌ Error fetching project details:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New':
        return <FiClock className="text-blue-500 dark:text-blue-400" />;
      case 'In Progress':
        return <FiAlertCircle className="text-yellow-500 dark:text-yellow-400" />;
      case 'Completed':
        return <FiCheckCircle className="text-green-500 dark:text-green-400" />;
      default:
        return <FiClock className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'New':
        return t('common.new');
      case 'In Progress':
        return t('common.inProgress');
      case 'Completed':
        return t('common.completed');
      default:
        return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.welcomeBack')}, <span className="gradient-text">{session?.user?.name}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('dashboard.manageProjects')}</p>
      </div>

      {/* Payment Alias Card */}
      {userData?.paymentAlias && (
        <div className="mb-8 bg-gradient-to-r from-modual-pink via-modual-purple to-modual-blue p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">💳 Your Payment ID</h3>
              <p className="text-white/80 text-sm mb-3">Use this ID when making payments to track your transactions</p>
              <div className="flex items-center space-x-3">
                <code className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-mono text-lg font-bold">
                  {userData.paymentAlias}
                </code>
                <button
                  onClick={copyPaymentAlias}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-lg transition-all"
                  title="Copy to clipboard"
                >
                  {copied ? '✓' : <FiCopy size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <Link
          href="/dashboard/nieuw-project"
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
            href="/dashboard/nieuw-project"
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                    {project.title || t('dashboard.untitledProject')}
                  </h3>
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

              {/* Status Badge */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.status')}:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProject.status)}`}>
                  {getStatusText(selectedProject.status)}
                </span>
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
