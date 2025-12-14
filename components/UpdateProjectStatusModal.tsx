'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface UpdateProjectStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    status: string;
    previewUrl?: string;
  };
  onUpdate: () => void;
}

export default function UpdateProjectStatusModal({
  isOpen,
  onClose,
  project,
  onUpdate
}: UpdateProjectStatusModalProps) {
  const [status, setStatus] = useState(project.status);
  const [previewUrl, setPreviewUrl] = useState(project.previewUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus(project.status);
      setPreviewUrl(project.previewUrl || '');
      setError(null);
    }
  }, [isOpen, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/projects/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          status,
          previewUrl: previewUrl.trim() || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        setError(data.error || 'Failed to update project status');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const statusOptions = [
    { value: 'New', label: 'New', color: 'bg-blue-100 text-blue-800' },
    { value: 'In Progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Completed', label: 'Completed (Requires Preview URL)', color: 'bg-green-100 text-green-800' },
    { value: 'Awaiting Payment', label: 'Awaiting Payment', color: 'bg-orange-100 text-orange-800' },
    { value: 'Paid', label: 'Paid', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'Rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
  ];

  const requiresPreviewUrl = status === 'Completed';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Update Project Status
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Project</p>
            <p className="font-medium text-gray-900 dark:text-white">{project.title || 'Untitled'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {project.id.slice(0, 8)}</p>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Current: <span className="font-medium">{project.status}</span>
            </p>
          </div>

          {/* Preview URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview URL {requiresPreviewUrl && <span className="text-red-500">*</span>}
            </label>
            <input
              type="url"
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              placeholder="https://example.com/preview"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
              required={requiresPreviewUrl}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {requiresPreviewUrl 
                ? '⚠️ Required when marking as "Completed" - User will receive email with this link'
                : 'Optional: Add a preview URL for the user to view the project'
              }
            </p>
          </div>

          {/* Important Note for Completed Status */}
          {requiresPreviewUrl && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Important:</strong> When you mark this project as &quot;Completed&quot; with a preview URL:
              </p>
              <ul className="list-disc list-inside text-xs text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                <li>Payment will be automatically required for this project</li>
                <li>User will receive an email notification with the preview link</li>
                <li>User must review and make payment to receive the final project</li>
              </ul>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (requiresPreviewUrl && !previewUrl.trim())}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
