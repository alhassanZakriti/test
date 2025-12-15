'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiPlus, FiClock, FiCheckCircle, FiAlertCircle, FiX, FiUser, FiMail, FiPhone, FiCopy, FiDollarSign, FiExternalLink } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';
import ProjectPaymentModal from '@/components/ProjectPaymentModal';
import toast from 'react-hot-toast';

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
  previewUrl?: string;
  paymentStatus?: string;
  paymentRequired?: boolean;
  paymentDeadline?: string;
  price?: number;
  paymentAlias?: string;
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
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentProject, setPaymentProject] = useState<Project | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [shownToasts, setShownToasts] = useState<Set<string>>(new Set());
  const [previousProjects, setPreviousProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchProjects();
    // Poll for updates every 30 seconds to detect status changes
    const interval = setInterval(fetchProjects, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-show payment modal for overdue projects
  useEffect(() => {
    if (projects.length > 0 && !showPaymentModal) {
      const overdueProject = projects.find(project => isPaymentOverdue(project));
      if (overdueProject) {
        setPaymentProject(overdueProject);
        setShowPaymentModal(true);
      }
    }
  }, [projects]);

  // Toast notifications for payment reminders
  useEffect(() => {
    if (projects.length > 0) {
      projects.forEach(project => {
        // Only show toast if not already shown in this session
        if (project.paymentRequired && project.paymentStatus !== 'Paid' && !shownToasts.has(project.id)) {
          const daysRemaining = getDaysRemaining(project.paymentDeadline);
          
          // Show toast for projects with payment due in 3 days or less
          if (daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0) {
            toast((t) => (
              <div 
                onClick={() => {
                  setPaymentProject(project);
                  setShowPaymentModal(true);
                  toast.dismiss(t.id);
                }}
                className="cursor-pointer"
              >
                <div className="font-semibold">💳 {project.title}</div>
                <div className="text-sm mt-1">Payment due in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</div>
                <div className="text-xs mt-1 opacity-90">Click to pay {project.price || 150} MAD</div>
              </div>
            ), {
              duration: 10000,
              icon: '⏰',
              style: {
                background: '#F59E0B',
                color: '#fff',
              },
            });
            
            // Mark this project's toast as shown
            setShownToasts(prev => new Set(prev).add(project.id));
          } 
          // Show urgent toast for overdue payments
          else if (daysRemaining !== null && daysRemaining < 0) {
            toast((t) => (
              <div 
                onClick={() => {
                  setPaymentProject(project);
                  setShowPaymentModal(true);
                  toast.dismiss(t.id);
                }}
                className="cursor-pointer"
              >
                <div className="font-semibold">🚨 {project.title}</div>
                <div className="text-sm mt-1">Payment overdue by {Math.abs(daysRemaining)} {Math.abs(daysRemaining) === 1 ? 'day' : 'days'}!</div>
                <div className="text-xs mt-1 opacity-90">Click to pay now - {project.price || 150} MAD</div>
              </div>
            ), {
              duration: Infinity, // Don't auto-dismiss overdue payments
              icon: '⚠️',
              style: {
                background: '#EF4444',
                color: '#fff',
              },
            });
            
            // Mark this project's toast as shown
            setShownToasts(prev => new Set(prev).add(project.id));
          }
        }
      });
    }
  }, [projects, shownToasts]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      const newProjects = data.projects || [];
      
      // Detect newly completed projects that require payment
      if (previousProjects.length > 0) {
        newProjects.forEach((newProject: Project) => {
          const oldProject = previousProjects.find(p => p.id === newProject.id);
          
          // Check if project just became completed and requires payment
          if (
            newProject.status === 'Completed' &&
            newProject.paymentRequired &&
            newProject.paymentStatus !== 'Paid' &&
            (!oldProject || oldProject.status !== 'Completed' || !oldProject.paymentRequired)
          ) {
            // Show immediate toast for newly completed project
            toast((t) => (
              <div 
                onClick={() => {
                  setPaymentProject(newProject);
                  setShowPaymentModal(true);
                  toast.dismiss(t.id);
                }}
                className="cursor-pointer"
              >
                <div className="font-semibold">🎉 {newProject.title} is Complete!</div>
                <div className="text-sm mt-1">Your project is ready! Payment is now required.</div>
                <div className="text-xs mt-1 opacity-90">Click to pay {newProject.price || 150} MAD now</div>
              </div>
            ), {
              duration: 15000,
              icon: '✅',
              style: {
                background: '#7C3AED',
                color: '#fff',
              },
            });
            
            // Also open the modal automatically
            setPaymentProject(newProject);
            setShowPaymentModal(true);
          }
        });
      }
      
      setPreviousProjects(newProjects);
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

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isPaymentOverdue = (project: Project) => {
    if (!project.paymentRequired || project.paymentStatus === 'Paid') return false;
    if (!project.paymentDeadline) return false;
    const daysRemaining = getDaysRemaining(project.paymentDeadline);
    return daysRemaining !== null && daysRemaining < 0;
  };

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

                {/* Payment Status & Actions */}
                {project.paymentRequired && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    {/* Payment Deadline Display */}
                    {project.paymentDeadline && project.paymentStatus !== 'Paid' && (
                      <div className={`text-xs font-medium px-2 py-1 rounded ${
                        getDaysRemaining(project.paymentDeadline)! < 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : getDaysRemaining(project.paymentDeadline)! <= 7
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {getDaysRemaining(project.paymentDeadline)! < 0
                          ? `⚠️ Overdue by ${Math.abs(getDaysRemaining(project.paymentDeadline)!)} days`
                          : `📅 ${getDaysRemaining(project.paymentDeadline)} days left`}
                      </div>
                    )}
                    
                    {project.previewUrl && (
                      <a
                        href={project.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        <FiExternalLink size={14} />
                        <span>View Preview</span>
                      </a>
                    )}
                    {project.paymentStatus === 'Pending' ? (
                      <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                        <FiClock size={14} />
                        <span>Payment Pending Verification</span>
                      </div>
                    ) : project.paymentStatus === 'Paid' ? (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <FiCheckCircle size={14} />
                        <span>Payment Verified</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentProject(project);
                          setShowPaymentModal(true);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 text-white text-sm font-medium rounded-md transition-colors w-full justify-center ${
                          isPaymentOverdue(project)
                            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        <FiDollarSign size={14} />
                        <span>{isPaymentOverdue(project) ? '⚠️ Pay Now ' : 'Pay '}{project.price || 150} MAD</span>
                      </button>
                    )}
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
                {selectedProject.paymentAlias && (
                  <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-800">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Project ID:</span>
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                      {selectedProject.paymentAlias}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedProject.paymentAlias || '');
                        alert('Project ID copied to clipboard!');
                      }}
                      className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                      title="Copy Project ID"
                    >
                      <FiCopy size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Deadline Info */}
              {selectedProject.paymentRequired && selectedProject.paymentDeadline && (
                <div className={`p-4 rounded-lg border-2 ${
                  getDaysRemaining(selectedProject.paymentDeadline)! < 0 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
                    : getDaysRemaining(selectedProject.paymentDeadline)! <= 7
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-semibold ${
                        getDaysRemaining(selectedProject.paymentDeadline)! < 0
                          ? 'text-red-800 dark:text-red-200'
                          : getDaysRemaining(selectedProject.paymentDeadline)! <= 7
                          ? 'text-orange-800 dark:text-orange-200'
                          : 'text-blue-800 dark:text-blue-200'
                      }`}>
                        {getDaysRemaining(selectedProject.paymentDeadline)! < 0
                          ? '⚠️ Payment Overdue'
                          : getDaysRemaining(selectedProject.paymentDeadline)! <= 7
                          ? '⏰ Payment Due Soon'
                          : '📅 Payment Deadline'}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        getDaysRemaining(selectedProject.paymentDeadline)! < 0
                          ? 'text-red-700 dark:text-red-300'
                          : getDaysRemaining(selectedProject.paymentDeadline)! <= 7
                          ? 'text-orange-700 dark:text-orange-300'
                          : 'text-blue-700 dark:text-blue-300'
                      }`}>
                        {getDaysRemaining(selectedProject.paymentDeadline)! < 0
                          ? `Overdue by ${Math.abs(getDaysRemaining(selectedProject.paymentDeadline)!)} days`
                          : `${getDaysRemaining(selectedProject.paymentDeadline)} days remaining`}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Deadline: {new Date(selectedProject.paymentDeadline).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedProject.paymentStatus !== 'Paid' && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {selectedProject.price || 150} MAD
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Monthly Payment</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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

      {/* Project Payment Modal */}
      {paymentProject && paymentProject.paymentAlias && (
        <ProjectPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentProject(null);
          }}
          project={{
            id: paymentProject.id,
            title: paymentProject.title || 'Untitled Project',
            price: paymentProject.price || 150,
            previewUrl: paymentProject.previewUrl,
            paymentStatus: paymentProject.paymentStatus || 'Not Required'
          }}
          paymentAlias={paymentProject.paymentAlias}
          onPaymentSubmitted={() => {
            fetchProjects();
            setShowPaymentModal(false);
            setPaymentProject(null);
          }}
        />
      )}
    </div>
  );
}
