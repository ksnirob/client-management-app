import { apiService } from './apiService';
import { TaskStatus } from './dataService';

export interface Project {
  id: number;
  title: string;
  description?: string;
  client_id: number;
  status: TaskStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  created_at?: string;
  updated_at?: string;
  client_name?: string;
  tasks?: any[];
  task_count?: number;
  project_live_url?: string;
  project_files?: string;
  admin_login_url?: string;
  username_email?: string;
  password?: string;
}

class ProjectService {
  async getProjects(): Promise<Project[]> {
    const response = await apiService.get<Project[]>('/projects');
    return response.data;
  }

  async getProject(id: number): Promise<Project> {
    const response = await apiService.get<Project>(`/projects/${id}`);
    return response.data;
  }

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    const response = await apiService.post<Project>('/projects', project);
    return response.data;
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project> {
    const response = await apiService.put<Project>(`/projects/${id}`, project);
    return response.data;
  }

  async deleteProject(id: number): Promise<void> {
    await apiService.delete(`/projects/${id}`);
  }
}

export const projectService = new ProjectService(); 