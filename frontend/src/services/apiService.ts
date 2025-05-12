interface ImportMetaEnv {
  VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import { Task, Project, Client } from './dataService';
import { PROJECT_SETTINGS } from '../config/settings';

const API_BASE_URL = PROJECT_SETTINGS.apiUrl;

class ApiService {
  private static instance: ApiService;

  private constructor() {
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

  // Task operations
  async getTasks(): Promise<Task[]> {
    return this.fetchWithErrorHandling<Task[]>(`${API_BASE_URL}/tasks`);
  }

  async getTask(id: number): Promise<Task> {
    return this.fetchWithErrorHandling<Task>(`${API_BASE_URL}/tasks/${id}`);
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    return this.fetchWithErrorHandling<Task>(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    return this.fetchWithErrorHandling<Task>(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: number): Promise<void> {
    return this.fetchWithErrorHandling<void>(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return this.fetchWithErrorHandling<Project[]>(`${API_BASE_URL}/projects`);
  }

  async getProject(id: number): Promise<Project> {
    return this.fetchWithErrorHandling<Project>(`${API_BASE_URL}/projects/${id}`);
  }

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    return this.fetchWithErrorHandling<Project>(`${API_BASE_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project> {
    return this.fetchWithErrorHandling<Project>(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: number): Promise<void> {
    return this.fetchWithErrorHandling<void>(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    return this.fetchWithErrorHandling<Client[]>(`${API_BASE_URL}/clients`);
  }

  async getClient(id: number): Promise<Client> {
    return this.fetchWithErrorHandling<Client>(`${API_BASE_URL}/clients/${id}`);
  }

  async createClient(client: Omit<Client, 'id' | 'projects'>): Promise<Client> {
    return this.fetchWithErrorHandling<Client>(`${API_BASE_URL}/clients`, {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  async updateClient(id: number, client: Partial<Client>): Promise<Client> {
    return this.fetchWithErrorHandling<Client>(`${API_BASE_URL}/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
  }

  async deleteClient(id: number): Promise<void> {
    return this.fetchWithErrorHandling<void>(`${API_BASE_URL}/clients/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = ApiService.getInstance(); 