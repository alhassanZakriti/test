'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiUsers, FiFolder, FiCheckCircle, FiClock, FiPhone } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalizedPath } from '@/lib/useLocalizedPath';

interface Project {
  id: string;
  title: string;
  phoneNumber: string;
  websiteType: string;
  price: number;
  description: string;
  textInput: string;
  logoUrl: string;
  photoUrls: string;
  voiceMemoUrl: string;
  status: string;
  previewUrl?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { getPath } = useLocalizedPath();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchProjects();
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

  const updateProjectStatus = async (projectId: string, newStatus: string, previewUrlValue?: string) => {
    try {
      const response = await fetch('/api/admin/projects/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, 
          status: newStatus,
          previewUrl: previewUrlValue || undefined
        }),
      });
      
      if (response.ok) {
        await fetchProjects();
        setPreviewUrl('');
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const updateWebsiteType = async (projectId: string, websiteType: string) => {
    try {
      const response = await fetch('/api/admin/projects/update-website-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, 
          websiteType
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchProjects();
        // Update selectedProject to reflect the change immediately
        if (selectedProject && selectedProject.id === projectId) {
          const newPrice = websiteType === 'ecommerce' ? 200 : 150;
          setSelectedProject({ 
            ...selectedProject, 
            websiteType, 
            price: newPrice 
          });
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update website type');
      }
    } catch (error) {
      console.error('Error updating website type:', error);
      alert('Failed to update website type');
    }
  };

  const deleteProject = async (projectId: string) => {
    setDeletingProject(projectId);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchProjects();
        setSelectedProject(null);
        setShowDeleteConfirm(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    } finally {
      setDeletingProject(null);
    }
  };

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => {
        // Handle both old and new status formats
        if (filter === 'NEW') return p.status === 'NEW' || p.status === 'New';
        if (filter === 'IN_PROGRESS') return p.status === 'IN_PROGRESS' || p.status === 'In Progress';
        if (filter === 'PREVIEW') return p.status === 'PREVIEW';
        if (filter === 'COMPLETE') return p.status === 'COMPLETE' || p.status === 'Completed';
        return p.status === filter;
      });

  const stats = {
    total: projects.length,
    new: projects.filter(p => p.status === 'NEW' || p.status === 'New').length,
    inProgress: projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'In Progress').length,
    preview: projects.filter(p => p.status === 'PREVIEW').length,
    completed: projects.filter(p => p.status === 'COMPLETE' || p.status === 'Completed').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              <span className="gradient-text">{t('nav.admin')}</span> Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('adminProjects.viewAllProjects')}</p>
          </div>
          <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 lg:gap-3">
            
            <a
              href="/admin/users"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium inline-flex items-center space-x-2"
            >
              <FiUsers size={20} />
              <span>Users</span>
            </a>
            <a
              href="/admin/payments"
              className="px-3 py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium inline-flex items-center justify-center space-x-2 text-sm lg:text-base"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="hidden sm:inline">Subscriptions</span>
              <span className="sm:hidden">Subs</span>
            </a>
            <a
              href="/admin/project-payments"
              className="px-3 py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium inline-flex items-center justify-center space-x-2 text-sm lg:text-base"
            >
              <FiCheckCircle size={18} className="lg:w-5 lg:h-5" />
              <span className="hidden sm:inline">Project Payments</span>
              <span className="sm:hidden">Payments</span>
            </a>
            <a
              href="/admin/projects"
              className="px-3 py-2 lg:px-6 lg:py-3 bg-gradient-modual text-white rounded-lg hover:opacity-90 transition-opacity font-medium inline-flex items-center justify-center space-x-2 text-sm lg:text-base"
            >
              <FiFolder size={18} className="lg:w-5 lg:h-5" />
              <span className="hidden sm:inline">{t('adminProjects.viewProject')}</span>
              <span className="sm:hidden">Projects</span>
            </a>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.totalProjects')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FiFolder className="text-white" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.new')}</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.new}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
              <FiClock className="text-white" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.inProgress')}</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
              <FiUsers className="text-white" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('admin.completed')}</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="text-white" size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">{t('admin.statusOverview')}</h3>
          <div className="space-y-4">
            {/* Nieuw */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.new')}</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.new}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.new / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* In Behandeling */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.inProgress')}</span>
                <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{stats.inProgress}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.preview')}</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{stats.preview}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.preview / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Voltooid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.completed')}</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">{stats.completed}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pie Chart (Visual Representation) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">{t('admin.statusDistribution')}</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Donut Chart using CSS */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {(() => {
                  const total = stats.total || 1;
                  const newPercent = (stats.new / total) * 100;
                  const inProgressPercent = (stats.inProgress / total) * 100;
                  const completedPercent = (stats.completed / total) * 100;
                  
                  const circumference = 2 * Math.PI * 40;
                  const newDash = (newPercent / 100) * circumference;
                  const inProgressDash = (inProgressPercent / 100) * circumference;
                  const completedDash = (completedPercent / 100) * circumference;

                  let offset = 0;

                  return (
                    <>
                      {/* Nieuw - Blue */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#blueGradient)"
                        strokeWidth="12"
                        strokeDasharray={`${newDash} ${circumference - newDash}`}
                        strokeDashoffset={-offset}
                        className="transition-all duration-500"
                      />
                      {/* In Behandeling - Yellow */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#yellowGradient)"
                        strokeWidth="12"
                        strokeDasharray={`${inProgressDash} ${circumference - inProgressDash}`}
                        strokeDashoffset={-(offset + newDash)}
                        className="transition-all duration-500"
                      />
                      {/* Voltooid - Green */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#greenGradient)"
                        strokeWidth="12"
                        strokeDasharray={`${completedDash} ${circumference - completedDash}`}
                        strokeDashoffset={-(offset + newDash + inProgressDash)}
                        className="transition-all duration-500"
                      />
                      {/* Gradients */}
                      <defs>
                        <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                        <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4ade80" />
                          <stop offset="100%" stopColor="#16a34a" />
                        </linearGradient>
                      </defs>
                    </>
                  );
                })()}
              </svg>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin.total')}</span>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.new')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.total > 0 ? Math.round((stats.new / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.inProgress')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.preview')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.total > 0 ? Math.round((stats.preview / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.completed')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex space-x-2 overflow-x-auto">
        {['all', 'NEW', 'IN_PROGRESS', 'PREVIEW', 'COMPLETE'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-gradient-modual text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? t('admin.all') : 
             status === 'NEW' ? t('admin.new') : 
             status === 'IN_PROGRESS' ? t('admin.inProgress') : 
             status === 'PREVIEW' ? t('admin.preview') :
             t('admin.complete')}
          </button>
        ))}
      </div>

      {/* Projects Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-modual-purple"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">{t('admin.noProjectsFound')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.project')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('admin.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {project.title || t('admin.untitledProject')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {project.textInput || project.description || t('admin.noDescription')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {project.user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {project.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'NEW' || project.status === 'New'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : project.status === 'IN_PROGRESS' || project.status === 'In Progress'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : project.status === 'PREVIEW'
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        }`}>
                        {project.status === 'NEW' ? t('admin.new') :
                         project.status === 'IN_PROGRESS' ? t('admin.inProgress') :
                         project.status === 'PREVIEW' ? t('admin.preview') :
                         project.status === 'COMPLETE' ? t('admin.complete') :
                         project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(project.createdAt).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="text-modual-purple dark:text-modual-pink hover:text-modual-pink dark:hover:text-modual-purple text-sm font-medium"
                      >
                        {t('admin.viewDetails')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedProject.title || t('admin.untitledProject')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t('admin.by')} {selectedProject.user.name} ({selectedProject.user.email})
                </p>
                {selectedProject.phoneNumber && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center space-x-2">
                    <FiPhone className="inline" />
                    <span>{selectedProject.phoneNumber}</span>
                  </p>
                )}
                {/* Website Type Selector - Admin can change */}
                <div className="mt-3 mb-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Website Type</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateWebsiteType(selectedProject.id, 'basic')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedProject.websiteType === 'basic'
                          ? 'bg-gradient-modual text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      🌐 Basic Website
                    </button>
                    <button
                      onClick={() => updateWebsiteType(selectedProject.id, 'ecommerce')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedProject.websiteType === 'ecommerce'
                          ? 'bg-gradient-modual text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      🛒 E-commerce
                    </button>
                    <span className="text-modual-purple dark:text-modual-pink font-semibold ml-2">
                      {selectedProject.price} MAD
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(selectedProject.createdAt).toLocaleDateString('nl-NL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.status')}</label>
              <select
                value={selectedProject.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setSelectedProject({ ...selectedProject, status: newStatus });
                  // If not PREVIEW, update immediately
                  if (newStatus !== 'PREVIEW') {
                    updateProjectStatus(selectedProject.id, newStatus);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-modual-purple"
              >
                <option value="NEW">{t('common.new')}</option>
                <option value="IN_PROGRESS">{t('common.inProgress')}</option>
                <option value="PREVIEW">{t('admin.preview')}</option>
                <option value="COMPLETE">{t('admin.complete')}</option>
              </select>
              
              {/* Preview URL Input - Only show when PREVIEW is selected */}
              {selectedProject.status === 'PREVIEW' && (
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                  <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                    {t('admin.previewUrl')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={previewUrl || selectedProject.previewUrl || ''}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    placeholder="https://example.com/preview"
                    className="w-full px-4 py-2 border border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 mb-3"
                    required
                  />
                  <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                    {t('admin.previewUrlHelp')}
                  </p>
                  <button
                    onClick={() => {
                      const urlToSave = previewUrl || selectedProject.previewUrl;
                      if (urlToSave && urlToSave.trim()) {
                        updateProjectStatus(selectedProject.id, 'PREVIEW', urlToSave);
                      } else {
                        alert(t('admin.previewUrlRequired'));
                      }
                    }}
                    className="w-full px-4 py-2 bg-gradient-modual text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {t('admin.saveStatus')}
                  </button>
                </div>
              )}
            </div>

            {/* Logo */}
            {selectedProject.logoUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Logo</h3>
                <div className="flex justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <img
                    src={selectedProject.logoUrl}
                    alt="Logo"
                    className="h-24 w-auto object-contain rounded-lg border-2 border-gray-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            )}

            {/* Project Description */}
            {selectedProject.textInput && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('admin.projectDescription')}</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedProject.textInput}</p>
                </div>
              </div>
            )}

            {/* Photos */}
            {selectedProject.photoUrls && selectedProject.photoUrls !== '[]' && (() => {
              try {
                const photos = JSON.parse(selectedProject.photoUrls);
                if (Array.isArray(photos) && photos.length > 0) {
                  return (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {t('admin.images')} ({photos.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map((photo: string, index: number) => (
                          <div key={index} className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo}
                              alt={`Project foto ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('admin.voiceMemo')}</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <audio controls src={selectedProject.voiceMemoUrl} className="w-full" />
                </div>
              </div>
            )}

            <div className="flex justify-between space-x-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deletingProject === selectedProject.id}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingProject === selectedProject.id ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Project
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedProject(null)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('admin.close')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Delete Project?
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete &quot;{selectedProject.title}&quot;? This action cannot be undone and will permanently remove all project data including files and payment information.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deletingProject === selectedProject.id}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteProject(selectedProject.id)}
                  disabled={deletingProject === selectedProject.id}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingProject === selectedProject.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

