import apiClient from './apiClient';

export interface Project {
  id: number;
  name: string;
  apiUrl?: string;
  userNumbersApiUrl: string;
  apiKey?: string; // API key used BY this project to call external APIs
  externalApiKey?: string; // API key used FOR external APIs to call this API
  _count?: {
    contacts: number;
  };
}

export interface CreateProjectData {
  name: string;
  apiUrl?: string;
  userNumbersApiUrl?: string;
  apiKey?: string;
}

export interface UpdateProjectData {
  name?: string;
  apiUrl?: string;
  userNumbersApiUrl?: string;
  apiKey?: string;
}

export const projectApi = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/projects');
    return response.data;
  },

  // Get a single project
  getById: async (id: number): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  // Create a new project
  create: async (data: CreateProjectData): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', data);
    return response.data;
  },

  // Update a project
  update: async (id: number, data: UpdateProjectData): Promise<Project> => {
    const response = await apiClient.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  // Delete a project
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  // Generate API key for a project
  generateApiKey: async (id: number): Promise<{ apiKey: string }> => {
    const response = await apiClient.post<{ apiKey: string }>(`/projects/${id}/api-key/generate`);
    return response.data;
  },

  // Revoke API key for a project
  revokeApiKey: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}/api-key`);
  },
};
