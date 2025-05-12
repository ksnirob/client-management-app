import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import ProjectForm from '../components/ProjectForm';
import TaskForm from '../components/TaskForm';
import { FaEye, FaEdit, FaTrash, FaTasks } from 'react-icons/fa';
import { Project, Client, Task } from '../services/dataService';
import { apiService } from '../services/apiService';

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

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setIsViewMode(true);
    setIsModalOpen(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
        <button
          onClick={handleAddProject}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Add New Project
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full">
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
            {projects.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No projects found. Click "Add New Project" to create one.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {clients.find(c => c.id === project.client_id)?.company_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${project.budget?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleAddTask(project)}
                      className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                      title="Manage Tasks"
                    >
                      <FaTasks className="inline" />
                      <span>{project.task_count || 0}</span>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProject ? (isViewMode ? 'View Project' : 'Edit Project') : 'Add New Project'}
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
        />
      </Modal>

      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add New Task"
      >
        <TaskForm
          projects={projects.map(project => ({
            id: project.id.toString(),
            name: project.title,
            clientId: project.client_id.toString(),
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