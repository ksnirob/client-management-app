import React, { useState } from 'react';
import Modal from '../components/Modal';
import ProjectForm from '../components/ProjectForm';
import TaskForm from '../components/TaskForm';
import { FaEye, FaCopy, FaTasks } from 'react-icons/fa';
import { Project, Task, Client, transformedData } from '../services/dataService';

const Projects = () => {
  const [clients, setClients] = useState<Client[]>(transformedData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [fileInputs, setFileInputs] = useState<{ [projectId: string]: File | null }>({});

  const allProjects = clients.flatMap(client => 
    client.projects.map(project => ({
      ...project,
      clientId: client.id,
      clientName: client.name,
      tasks: project.tasks || []
    }))
  );

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

  const handleDeleteProject = (projectId: string, clientId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setClients(prev => prev.map(client => {
        if (client.id === clientId) {
          return {
            ...client,
            projects: client.projects.filter(p => p.id !== projectId)
          };
        }
        return client;
      }));
    }
  };

  const handleSubmit = (formData: any) => {
    if (selectedProject) {
      // Update existing project
      setClients(prev => prev.map(client => {
        if (client.id === formData.clientId) {
          return {
            ...client,
            projects: client.projects.map(project => 
              project.id === selectedProject.id ? { ...project, ...formData } : project
            )
          };
        }
        return client;
      }));
    } else {
      // Add new project
      const newProject = {
        id: Date.now().toString(),
        ...formData,
        tasks: []
      };
      setClients(prev => prev.map(client => {
        if (client.id === formData.clientId) {
          return {
            ...client,
            projects: [...client.projects, newProject]
          };
        }
        return client;
      }));
    }
    setIsModalOpen(false);
  };

  const handleAddTask = (project: Project) => {
    setSelectedProject(project);
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (project: Project, task: Task) => {
    setSelectedProject(project);
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setClients(prev => prev.map(client => {
        if (client.projects.some(p => p.id === projectId)) {
          return {
            ...client,
            projects: client.projects.map(project => {
              if (project.id === projectId) {
                return {
                  ...project,
                  tasks: (project.tasks || []).filter(t => t.id !== taskId)
                };
              }
              return project;
            })
          };
        }
        return client;
      }));
    }
  };

  const handleTaskSubmit = (formData: any) => {
    if (selectedTask && selectedProject) {
      // Update existing task
      setClients(prev => prev.map(client => {
        if (client.projects.some(p => p.id === selectedProject.id)) {
          return {
            ...client,
            projects: client.projects.map(project => {
              if (project.id === selectedProject.id) {
                return {
                  ...project,
                  tasks: (project.tasks || []).map(task =>
                    task.id === selectedTask.id ? { ...task, ...formData } : task
                  )
                };
              }
              return project;
            })
          };
        }
        return client;
      }));
    } else if (selectedProject) {
      // Add new task
      const newTask = {
        id: `t${Date.now()}`,
        ...formData
      };
      setClients(prev => prev.map(client => {
        if (client.projects.some(p => p.id === selectedProject.id)) {
          return {
            ...client,
            projects: client.projects.map(project => {
              if (project.id === selectedProject.id) {
                return {
                  ...project,
                  tasks: [...(project.tasks || []), newTask]
                };
              }
              return project;
            })
          };
        }
        return client;
      }));
    }
    setIsTaskModalOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFileChange = (projectId: string, file: File | null) => {
    setFileInputs(prev => ({ ...prev, [projectId]: file }));
  };

  const handleFileUpload = (projectId: string) => {
    const file = fileInputs[projectId];
    if (!file) return;
    setClients(prev => prev.map(client => {
      return {
        ...client,
        projects: client.projects.map(project => {
          if (project.id === projectId) {
            const newFile = {
              name: file.name,
              url: URL.createObjectURL(file)
            };
            return {
              ...project,
              files: [...(project.files || []), newFile]
            };
          }
          return project;
        })
      };
    }));
    setFileInputs(prev => ({ ...prev, [projectId]: null }));
  };

  const renderProjectDetails = () => {
    if (!selectedProject) return null;

    const renderDetailRow = (label: string, value: string | number, isCopyable: boolean = false) => (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
        <div className="flex items-center">
          <div className="text-sm text-gray-900">{value}</div>
          {isCopyable && (
            <button
              onClick={() => copyToClipboard(value.toString())}
              className="ml-2 text-gray-500 hover:text-gray-700"
              title="Copy to clipboard"
            >
              <FaCopy />
            </button>
          )}
        </div>
      </div>
    );

    const renderTasks = () => {
      const tasks = selectedProject.tasks || [];
      if (tasks.length === 0) {
        return (
          <div className="text-center py-4 text-gray-500">
            No tasks available
          </div>
        );
      }

      return (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
            <button
              onClick={() => handleAddTask(selectedProject)}
              className="px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Add Task
            </button>
          </div>
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{task.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.type.startsWith('round') ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {task.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                      {task.assignedTo && ` • Assigned to: ${task.assignedTo}`}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTask(selectedProject, task)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(selectedProject.id, task.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div>
        <div className="grid grid-cols-2 gap-4">
          {renderDetailRow('Project ID', selectedProject.id)}
          {renderDetailRow('Project Name', selectedProject.name)}
          {renderDetailRow('Client', selectedProject.clientName)}
          {renderDetailRow('Status', selectedProject.status)}
          {renderDetailRow('URL', selectedProject.url, true)}
          {renderDetailRow('Username', selectedProject.username, true)}
          {renderDetailRow('Password', selectedProject.password, true)}
          {renderDetailRow('Start Date', new Date(selectedProject.startDate).toLocaleDateString())}
          {renderDetailRow('End Date', new Date(selectedProject.endDate).toLocaleDateString())}
          {renderDetailRow('Budget', (() => {
            const taskBudget = (selectedProject.tasks || []).reduce((sum, t) => sum + (t.budget || 0), 0);
            const totalBudget = selectedProject.budget + taskBudget;
            return `Total: $${totalBudget.toLocaleString()} (Project: $${selectedProject.budget.toLocaleString()}, Tasks: $${taskBudget.toLocaleString()})`;
          })())}
          <div className="col-span-2">
            {renderDetailRow('Description', selectedProject.description)}
          </div>
        </div>
        {/* File upload and list */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Files</h3>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="file"
              onChange={e => handleFileChange(selectedProject.id, e.target.files ? e.target.files[0] : null)}
            />
            <button
              className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
              onClick={() => handleFileUpload(selectedProject.id)}
              disabled={!fileInputs[selectedProject.id]}
            >
              Upload
            </button>
          </div>
          <ul className="list-disc pl-6">
            {(selectedProject.files || []).length === 0 && <li className="text-gray-500">No files uploaded</li>}
            {(selectedProject.files || []).map((file: any, idx: number) => (
              <li key={idx}>
                <a href={file.url} download={file.name} className="text-blue-600 hover:underline">{file.name}</a>
              </li>
            ))}
          </ul>
        </div>
        {renderTasks()}
      </div>
    );
  };

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
          <tbody>
            {allProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.clientName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(() => {
                    const taskBudget = (project.tasks || []).reduce((sum, t) => sum + (t.budget || 0), 0);
                    const totalBudget = project.budget + taskBudget;
                    return `$${totalBudget.toLocaleString()}`;
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => handleAddTask(project)}
                    className="text-primary-600 hover:text-primary-900"
                    title="Manage Tasks"
                  >
                    <FaTasks />
                    <span className="ml-1">{(project.tasks || []).length}</span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => handleViewProject(project)}
                    className="text-gray-600 hover:text-gray-900 mr-3"
                    title="View Project"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleEditProject(project)}
                    className="text-primary-600 hover:text-primary-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id, project.clientId)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'Project Details' : (selectedProject ? 'Edit Project' : 'Add New Project')}
      >
        {isViewMode ? (
          renderProjectDetails()
        ) : (
          <ProjectForm
            initialData={selectedProject}
            clients={clients.map(({ id, name }) => ({ id, name }))}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>

      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={selectedTask ? 'Edit Task' : 'Add New Task'}
      >
        <TaskForm
          initialData={selectedTask}
          projects={clients.flatMap(client =>
            client.projects.map(project => ({
              id: project.id,
              name: project.name,
              clientId: client.id,
              clientName: client.name
            }))
          )}
          onSubmit={handleTaskSubmit}
          onCancel={() => setIsTaskModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Projects;