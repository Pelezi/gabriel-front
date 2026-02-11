'use client';

import { useState, useEffect } from 'react';
import { projectApi, Project, CreateProjectData, UpdateProjectData } from '@/lib/projectApi';
import { Pencil, Trash2, Plus, Key, Copy, RefreshCw, XCircle } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    apiUrl: '',
    userNumbersApiUrl: '',
    apiKey: '',
  });
  const [apiKeyModal, setApiKeyModal] = useState<{ open: boolean; apiKey: string; projectName: string }>({
    open: false,
    apiKey: '',
    projectName: '',
  });
  const [copySuccess, setCopySuccess] = useState(false);

  // Load projects
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAll();
      setProjects(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingProject) {
        await projectApi.update(editingProject.id, formData as UpdateProjectData);
      } else {
        await projectApi.create(formData);
      }
      setIsModalOpen(false);
      setEditingProject(null);
      setFormData({ name: '', apiUrl: '', userNumbersApiUrl: '', apiKey: '' });
      loadProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await projectApi.delete(id);
      loadProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
    }
  };

  // Open modal for editing
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      apiUrl: project.apiUrl || '',
      userNumbersApiUrl: project.userNumbersApiUrl,
      apiKey: project.apiKey || '',
    });
    setIsModalOpen(true);
  };


  // Generate API key
  const handleGenerateApiKey = async (project: Project) => {
    const action = project.externalApiKey ? 'regenerate' : 'generate';
    if (project.externalApiKey && !confirm('This will replace the existing API key. Continue?')) return;

    try {
      const { apiKey } = await projectApi.generateApiKey(project.id);
      setApiKeyModal({ open: true, apiKey, projectName: project.name });
      loadProjects();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} API key`);
    }
  };

  // Revoke API key
  const handleRevokeApiKey = async (projectId: number) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;

    try {
      await projectApi.revokeApiKey(projectId);
      loadProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke API key');
    }
  };

  // Copy API key to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
  // Open modal for creating
  const handleCreate = () => {
    setEditingProject(null);
    setFormData({ name: '', apiUrl: '', userNumbersApiUrl: '', apiKey: '' });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="pl-10 flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Base API URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Number Check Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                API Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                External API Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Contacts
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No projects found. Create your first project!
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {project.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {project.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {project.apiUrl || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {project.userNumbersApiUrl || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {project.apiKey ? '••••••••' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <span>{project.externalApiKey ? '••••••••' : '-'}</span>
                      {project.externalApiKey ? (
                        <>
                          <button
                            onClick={() => handleGenerateApiKey(project)}
                            className="inline-flex items-center justify-center w-6 h-6 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/30 rounded transition"
                            title="Regenerate API Key"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRevokeApiKey(project.id)}
                            className="inline-flex items-center justify-center w-6 h-6 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition"
                            title="Revoke API Key"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleGenerateApiKey(project)}
                          className="inline-flex items-center justify-center w-6 h-6 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded transition"
                          title="Generate API Key"
                        >
                          <Key className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {project._count?.contacts || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Base API URL</label>
                <input
                  type="url"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://api.example.com"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Base URL of the project API (if left empty, use full URL in route field)
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">User Numbers API Route</label>
                <input
                  type="text"
                  value={formData.userNumbersApiUrl}
                  onChange={(e) => setFormData({ ...formData, userNumbersApiUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="/check-user"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Route to check if user exists. Both API URL and Route are required for phone validation
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter API key if required by external API"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  API key that THIS project uses to authenticate with external APIs. Will be sent as X-API-KEY header when checking phone numbers.
                </p>
              </div>
              {editingProject && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    To manage API keys for external API access, use the key management buttons in the project list.
                  </p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProject(null);
                    setFormData({ name: '', apiUrl: '', userNumbersApiUrl: '', apiKey: '' });
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingProject ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingProject ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleCreate}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        title="New Project"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* API Key Modal */}
      {apiKeyModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">
              API Key Generated Successfully!
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Project: <strong>{apiKeyModal.projectName}</strong>
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  ⚠️ Important: Save this API key now!
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  You won&apos;t be able to see it again. Use this key in your API requests via the <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">X-API-Key</code> header.
                </p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={apiKeyModal.apiKey}
                  readOnly
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(apiKeyModal.apiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copySuccess && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✓ Copied to clipboard!
                </p>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-2">
                Example Usage:
              </p>
              <pre className="text-xs bg-gray-800 dark:bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto">
{`curl -H "X-API-Key: ${apiKeyModal.apiKey.substring(0, 20)}..." \\
  ${process.env.NEXT_PUBLIC_API_BASE_URL}/conversations`}
              </pre>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setApiKeyModal({ open: false, apiKey: '', projectName: '' })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
