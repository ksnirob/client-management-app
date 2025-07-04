interface ImportMetaEnv {
  VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import { Task, Project, Client } from './dataService';
import { PROJECT_SETTINGS } from '../config/settings';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { ClientInput } from '../types/client';

const API_BASE_URL = PROJECT_SETTINGS.apiUrl;

class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;

  private constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('API Service initialized with base URL:', API_BASE_URL);
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async fetchWithErrorHandling<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      // Add default headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Make the request
      console.log(`Making ${options.method || 'GET'} request to:`, url);
      if (options.body) {
        console.log('Request body:', options.body);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Log response status
      console.log(`Response status:`, response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(url: string): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url);
  }

  async post<T>(url: string, data: any): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data);
  }

  async put<T>(url: string, data: any): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data);
  }

  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url);
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    try {
      const response = await this.api.get<Task[]>('/tasks');
      console.log('Tasks response:', response);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to fetch tasks: ${message}`);
      }
      throw error;
    }
  }

  async getTask(id: number): Promise<Task> {
    try {
      const response = await this.api.get<Task>(`/tasks/${id}`);
      if (!response.data) {
        throw new Error('Task not found');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching task:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to fetch task: ${message}`);
      }
      throw error;
    }
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    try {
      console.log('Creating task with data:', task);
      const response = await this.api.post<Task>('/tasks', task);
      if (!response.data) {
        throw new Error('Failed to create task: No response data');
      }
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to create task: ${message}`);
      }
      throw error;
    }
  }

  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    try {
      console.log('updateTask called with:', { id, task });
      
      // Only include fields that are actually being updated
      const updateData = Object.entries(task).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      console.log('Sending update data:', updateData);

      const response = await this.api.put<Task>(`/tasks/${id}`, updateData);
      
      if (!response.data) {
        throw new Error('Invalid response format');
      }

      console.log('Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to update task: ${message}`);
      }
      throw error;
    }
  }

  async deleteTask(id: number): Promise<void> {
    try {
      await this.api.delete(`/tasks/${id}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to delete task: ${message}`);
      }
      throw error;
    }
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    try {
      const response = await this.api.get<Project[]>('/projects');
      console.log('Projects response:', response);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to fetch projects: ${message}`);
      }
      throw error;
    }
  }

  async getProject(id: number): Promise<Project> {
    try {
      const response = await this.api.get<Project>(`/projects/${id}`);
      if (!response.data) {
        throw new Error('Project not found');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to fetch project: ${message}`);
      }
      throw error;
    }
  }

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    try {
      console.log('Creating project with data:', project);
      const response = await this.api.post<Project>('/projects', project);
      if (!response.data) {
        throw new Error('Failed to create project: No response data');
      }
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to create project: ${message}`);
      }
      throw error;
    }
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project> {
    try {
      console.log('Updating project with data:', { id, project });
      
      // Format the update data to include all project fields
      const updateData = {
        title: project.title,
        description: project.description !== undefined ? project.description : '',
        status: project.status,
        client_id: project.client_id ? Number(project.client_id) : null,
        start_date: project.start_date || null,
        end_date: project.end_date || null,
        budget: project.budget !== undefined ? Number(project.budget) : null,
        project_live_url: project.project_live_url || null,
        project_files: project.project_files || null,
        admin_login_url: project.admin_login_url || null,
        username_email: project.username_email || null,
        password: project.password || null,
        assigned_to: project.assigned_to || null,
        priority: project.priority || 'medium'
      };

      // Remove undefined values to avoid sending them
      const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const url = `${API_BASE_URL}/projects/${id}`;
      console.log('Sending update request:', {
        url,
        method: 'PUT',
        data: cleanedData
      });

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      // Handle both wrapped and unwrapped response formats
      const updatedProject = data.data || data;
      
      if (!updatedProject) {
        throw new Error('Invalid response format');
        }

      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteProject(id: number): Promise<void> {
    try {
      await this.api.delete(`/projects/${id}`);
    } catch (error) {
      console.error('Error deleting project:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to delete project: ${message}`);
      }
      throw error;
    }
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    try {
      console.log('Fetching clients from API');
      const response = await this.api.get<{ message: string; data: Client[] }>('/clients');
      console.log('API response:', response.data);
      
      if (!response.data || !Array.isArray(response.data.data)) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error in getClients:', error);
      throw error;
    }
  }

  async getClient(id: number): Promise<Client> {
    try {
      const response = await this.api.get<{ message: string; data: Client }>(`/clients/${id}`);
      if (!response.data || !response.data.data) {
        throw new Error('Client not found');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching client:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to fetch client: ${message}`);
      }
      throw error;
    }
  }

  async createClient(client: ClientInput): Promise<Client> {
    try {
      console.log('Creating client with data:', client);
      const response = await this.api.post<{ message: string; data: Client }>('/clients', client);
      console.log('Create client response:', response.data);
      
      if (!response.data || !response.data.data || !response.data.data.id) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error in createClient:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to create client: ${message}`);
      }
      throw error;
    }
  }

  async updateClient(id: number, client: ClientInput): Promise<Client> {
    try {
      console.log('Updating client with data:', { id, client });
      const response = await this.api.put<{ message: string; data: Client }>(`/clients/${id}`, client);
      console.log('Update client response:', response.data);
      
      if (!response.data || !response.data.data || !response.data.data.id) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error in updateClient:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to update client: ${message}`);
      }
      throw error;
    }
  }

  async deleteClient(id: number): Promise<void> {
    try {
      console.log('Deleting client:', id);
      await this.api.delete(`/clients/${id}`);
    } catch (error) {
      console.error('Error in deleteClient:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to delete client: ${message}`);
      }
      throw error;
    }
  }
}

export const apiService = ApiService.getInstance(); 