'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiFolder, FiCheckCircle, FiClock, FiPhone } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

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
  user: {
    name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter);

  const stats = {
    total: projects.length,
    new: projects.filter(p => p.status === 'Nieuw').length,
    inProgress: projects.filter(p => p.status === 'In Behandeling').length,
    completed: projects.filter(p => p.status === 'Voltooid').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              <span className="gradient-text">{t('nav.admin')}</span> Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('adminProjects.viewAllProjects')}</p>
          </div>
          <a
            href="/admin/projects"
            className="px-6 py-3 bg-gradient-modual text-white rounded-lg hover:opacity-90 transition-opacity font-medium inline-flex items-center space-x-2"
          >
            <FiFolder size={20} />
            <span>{t('adminProjects.viewProject')}</span>
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
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
        {['all', 'Nieuw', 'In Behandeling', 'Voltooid'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-gradient-modual text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? t('admin.all') : status === 'Nieuw' ? t('admin.new') : status === 'In Behandeling' ? t('admin.inProgress') : t('admin.completed')}
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
                      <select
                        value={project.status}
                        onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                          project.status === 'Nieuw'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : project.status === 'In Behandeling'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        }`}
                      >
                        <option value="Nieuw">{t('admin.new')}</option>
                        <option value="In Behandeling">{t('admin.inProgress')}</option>
                        <option value="Voltooid">{t('admin.completed')}</option>
                      </select>
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
                  updateProjectStatus(selectedProject.id, e.target.value);
                  setSelectedProject({ ...selectedProject, status: e.target.value });
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-modual-purple"
              >
                <option value="Nieuw">{t('admin.new')}</option>
                <option value="In Behandeling">{t('admin.inProgress')}</option>
                <option value="Voltooid">{t('admin.completed')}</option>
              </select>
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

            <div className="flex justify-end space-x-3 mt-6">
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
    </div>
  );
}

