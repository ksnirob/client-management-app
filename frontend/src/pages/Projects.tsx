import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import ProjectForm from '../components/ProjectForm';
import TaskForm from '../components/TaskForm';
import { Menu, Transition } from '@headlessui/react';
import { FaEye, FaEdit, FaTrash, FaTasks } from 'react-icons/fa';
import { Project, Client, Task, ProjectStatus } from '../services/dataService';
import { apiService } from '../services/apiService';
import { Link } from 'react-router-dom';
import StatusFilter from '../components/projects/StatusFilter';
import StatusMenu from '../components/common/StatusMenu';

interface MenuButtonProps {
  as: React.ElementType;
  className: string;
  children: React.ReactNode;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [projectsData, clientsData] = await Promise.all([
          apiService.getProjects(),
          apiService.getClients()
        ]);
        console.log('Fetched projects:', projectsData);
        console.log('Fetched clients:', clientsData);
        setProjects(projectsData);
        setClients(clientsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddProject = () => {
    setSelectedProject(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleViewProject = async (project: Project) => {
    try {
      // Fetch project details with tasks
      const projectDetails = await apiService.getProject(project.id);
      setSelectedProject(projectDetails);
      setIsViewMode(true);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching project details:', err);
      alert('Failed to load project details. Please try again.');
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await apiService.deleteProject(projectId);
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } catch (err) {
        console.error('Error deleting project:', err);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleSubmit = async (formData: Omit<Project, 'id'>) => {
    try {
      if (selectedProject) {
        // Update existing project
        const updated = await apiService.updateProject(selectedProject.id, formData);
        setProjects(prev => prev.map(project =>
          project.id === selectedProject.id ? updated : project
        ));
      } else {
        // Add new project
        const newProject = await apiService.createProject(formData);
        setProjects(prev => [...prev, newProject]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving project:', err);
      alert('Failed to save project. Please try again.');
    }
  };

  const handleAddTask = (project: Project) => {
    setSelectedProject(project);
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (formData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'client_name' | 'assigned_to_name'>) => {
    try {
      if (selectedProject) {
        console.log('Creating task with data:', formData);
        const now = new Date().toISOString();
        
        // Ensure project_id is a number and include project_title
        const taskData = {
          ...formData,
          project_id: Number(selectedProject.id),
          project_title: selectedProject.title,
          client_id: Number(selectedProject.client_id),
          created_at: now,
          updated_at: now
        };
        
        console.log('Submitting task with data:', taskData);
        const newTask = await apiService.createTask(taskData);
        console.log('Task created successfully:', newTask);

        // Close the modal
        setIsTaskModalOpen(false);

        // Refresh projects to get updated task count
        console.log('Refreshing projects list...');
        const updatedProjects = await apiService.getProjects();
        console.log('Updated projects:', updatedProjects);
        setProjects(updatedProjects);

        // Show success message
        alert('Task created successfully');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleStatusUpdate = async (projectId: number, newStatus: ProjectStatus) => {
    try {
      const projectToUpdate = projects.find(p => p.id === projectId);
      if (!projectToUpdate) {
        console.error('Project not found:', projectId);
        return;
      }

      console.log('Current project data:', projectToUpdate);
      console.log('New status:', newStatus);

      // Only send the minimal required data for update
      const updateData = {
        title: projectToUpdate.title,
        description: projectToUpdate.description || '',
        status: newStatus,
        client_id: projectToUpdate.client_id,
        start_date: projectToUpdate.start_date,
        end_date: projectToUpdate.end_date,
        budget: projectToUpdate.budget
      };

      console.log('Sending update data:', updateData);

      // Optimistically update UI
      setProjects(prev => prev.map(project =>
        project.id === projectId ? { ...project, status: newStatus } : project
      ));

      try {
        const updatedProject = await apiService.updateProject(projectId, updateData);
        console.log('Project updated successfully:', updatedProject);
        
        // Update with server response
        setProjects(prev => prev.map(project =>
          project.id === projectId ? updatedProject : project
        ));
      } catch (error) {
        console.error('Failed to update project status:', error);
        
        // Revert optimistic update on error
        const originalProject = projects.find(p => p.id === projectId);
        if (originalProject) {
          setProjects(prev => prev.map(project =>
            project.id === projectId ? originalProject : project
          ));
        }
        
        // Show error message to user
        alert('Failed to update project status. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleStatusUpdate:', error);
    }
  };

  const filteredProjects = selectedStatus === 'all'
    ? projects
    : projects.filter(project => project.status === selectedStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
        <div className="flex items-center gap-4">
          <StatusFilter
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusChange}
          />
          <button
            onClick={handleAddProject}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Add New Project
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-visible">
        <div className="overflow-visible">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No projects found. Click "Add New Project" to create one.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {clients.find(c => c.id === project.client_id)?.company_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusMenu
                        currentStatus={project.status}
                        onStatusChange={(newStatus) => handleStatusUpdate(project.id, newStatus)}
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="group relative">
                        <span className="cursor-help">
                          ${project.budget ? Number(project.budget).toLocaleString() : '0'}
                        </span>
                        {(project.static_budget || project.total_payments || project.total_expenses) && (
                          <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-0 mb-2 bg-gray-800 text-white text-xs rounded p-2 whitespace-nowrap z-10 transition-opacity">
                            <div>Static Budget: ${Number(project.static_budget || 0).toLocaleString()}</div>
                            <div className="text-green-300">+ Payments: ${Number(project.total_payments || 0).toLocaleString()}</div>
                            <div className="text-red-300">- Expenses: ${Number(project.total_expenses || 0).toLocaleString()}</div>
                            <div className="border-t border-gray-600 pt-1 mt-1">
                              <strong>Total: ${Number(project.budget || 0).toLocaleString()}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Due: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleAddTask(project)}
                        className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                        title="Manage Tasks"
                      >
                        <FaTasks className="inline" />
                        <span>{typeof project.task_count === 'number' ? project.task_count : 0}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                      <button
                        onClick={() => handleViewProject(project)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEditProject(project)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProject ? (isViewMode ? 'View Project' : 'Edit Project') : 'Add New Project'}
        size="md"
      >
        <ProjectForm
          initialData={selectedProject}
          clients={clients.map(client => ({
            id: String(client.id),
            name: client.company_name
          }))}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isViewMode={isViewMode}
          onAddTask={(project) => {
            // Close the view modal and open the task modal
            setIsModalOpen(false);
            handleAddTask(project);
          }}
        />
      </Modal>

      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add New Task"
      >
        <TaskForm
          projects={projects.map(project => ({
            id: project.id?.toString() || '',
            name: project.title || '',
            clientId: project.client_id?.toString() || '',
            clientName: clients.find(c => c.id === project.client_id)?.company_name || 'N/A'
          }))}
          onSubmit={handleTaskSubmit}
          onCancel={() => setIsTaskModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Projects;