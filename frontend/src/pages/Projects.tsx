import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import ProjectForm from '../components/ProjectForm';
import TaskForm from '../components/TaskForm';
import { Menu, Transition } from '@headlessui/react';
import { FaEye, FaEdit, FaTrash, FaTasks, FaPlus, FaProjectDiagram, FaUsers, FaDollarSign, FaCalendarAlt, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaClock, FaArrowUp } from 'react-icons/fa';
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

      // Only send the status field to avoid overwriting other data
      const updateData = {
        status: newStatus
      };

      console.log('Sending status update only:', updateData);

      // Optimistically update UI
      setProjects(prev => prev.map(project =>
        project.id === projectId ? { ...project, status: newStatus } : project
      ));

      try {
        const updatedProject = await apiService.updateProject(projectId, updateData);
        console.log('Project updated successfully:', updatedProject);
        
        // Instead of relying on the single response, refetch all projects to ensure data integrity
        const allProjects = await apiService.getProjects();
        console.log('Refetched projects after status update:', allProjects);
        setProjects(allProjects);
        
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

  // Calculate stats
  const completedProjects = projects.filter(p => p.status === 'completed');
  const inProgressProjects = projects.filter(p => p.status === 'in_progress');
  const totalBudget = projects.reduce((sum, project) => {
    const budget = Number(project.static_budget) || 0;
    return sum + budget;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-600 mx-auto mb-6"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-emerald-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading Projects</div>
          <div className="text-sm text-gray-500">Fetching your project data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-6" />
            <div className="text-xl font-semibold text-gray-800 mb-4">Unable to load projects</div>
            <div className="text-gray-600 mb-6">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-green-800 bg-clip-text text-transparent">
                Projects
              </h1>
              <p className="text-lg text-gray-600">Manage your project portfolio and track progress</p>
            </div>
            <div className="flex items-center gap-4">
              <StatusFilter
                selectedStatus={selectedStatus}
                onStatusChange={handleStatusChange}
              />
              <button
                onClick={handleAddProject}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <FaPlus className="w-4 h-4" />
                Add New Project
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                    <FaProjectDiagram className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">{projects.length}</p>
                    <p className="text-sm text-gray-500">Total Projects</p>
                  </div>
                </div>
                <p className="text-gray-600">All project initiatives</p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <FaUsers className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{inProgressProjects.length}</p>
                    <p className="text-sm text-gray-500">In Progress</p>
                  </div>
                </div>
                <p className="text-gray-600">Active development</p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                    <FaCheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">{completedProjects.length}</p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
                <p className="text-gray-600">Successfully delivered</p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <FaDollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-purple-600">
                      ${totalBudget.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Total Budget</p>
                  </div>
                </div>
                <p className="text-gray-600">Combined project value</p>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                  <FaProjectDiagram className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Project Portfolio</h2>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <FaProjectDiagram className="w-12 h-12 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {selectedStatus === 'all' ? 'No projects yet' : `No ${selectedStatus.replace('_', ' ')} projects`}
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedStatus === 'all' 
                    ? 'Start your journey by creating your first project' 
                    : `No projects match the ${selectedStatus.replace('_', ' ')} filter`
                  }
                </p>
                {selectedStatus === 'all' && (
                  <button
                    onClick={handleAddProject}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Create Your First Project
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaProjectDiagram className="w-4 h-4" />
                          Project Details
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaUsers className="w-4 h-4" />
                          Client
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaDollarSign className="w-4 h-4" />
                          Budget
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-4 h-4" />
                          Timeline
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaTasks className="w-4 h-4" />
                          Tasks
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200">
                        <td className="px-6 py-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12 mr-4">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                                <span className="text-white font-semibold text-lg">
                                  {project.title.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{project.title}</div>
                              <div className="text-sm text-gray-500">ID: {project.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-medium text-gray-900">
                            {clients.find(c => c.id === project.client_id)?.company_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <StatusMenu
                            currentStatus={project.status}
                            onStatusChange={(newStatus) => handleStatusUpdate(project.id, newStatus)}
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-5">
                          <div className="group relative">
                            <span className="cursor-help font-semibold text-gray-900">
                              ${project.static_budget ? Number(project.static_budget).toLocaleString() : '0'}
                            </span>
                            {(project.static_budget || project.total_payments || project.total_expenses) && (
                              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-0 mb-2 bg-gray-800 text-white text-xs rounded-lg p-3 whitespace-nowrap z-10 transition-opacity shadow-xl">
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
                        <td className="px-6 py-5">
                          <div className="text-sm text-gray-900">
                            {project.end_date ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <FaClock className="w-3 h-3 mr-1" />
                                {new Date(project.end_date).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">Not set</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <button
                            onClick={() => handleAddTask(project)}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition-all duration-200 transform hover:-translate-y-0.5"
                            title="Manage Tasks"
                          >
                            <FaTasks className="w-3 h-3 mr-1" />
                            {typeof project.task_count === 'number' ? project.task_count : 0}
                          </button>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewProject(project)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                              title="View project"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditProject(project)}
                              className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                              title="Edit project"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                              title="Delete project"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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