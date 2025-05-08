import React, { useState } from 'react';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { Project, Task, transformedData } from '../services/dataService';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';

const Tasks = () => {
  const [clients, setClients] = useState(transformedData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Get all tasks from all projects
  const allTasks = clients.flatMap(client =>
    client.projects.flatMap(project =>
      (project.tasks || []).map(task => ({
        ...task,
        projectId: project.id,
        projectName: project.name,
        clientId: client.id,
        clientName: client.name
      }))
    )
  );

  const handleAddTask = () => {
    setSelectedTask(null);
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task, project: Project) => {
    setSelectedTask(task);
    setSelectedProject(project);
    setIsModalOpen(true);
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
        if (client.id === selectedProject.clientId) {
          return {
            ...client,
            projects: client.projects.map(project => {
              if (project.id === selectedProject.id) {
                return {
                  ...project,
                  tasks: project.tasks.map(task =>
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
    } else {
      // Add new task
      const newTask = {
        id: Date.now().toString(),
        ...formData
      };
      setClients(prev => prev.map(client => {
        if (client.id === formData.clientId) {
          return {
            ...client,
            projects: client.projects.map(project => {
              if (project.id === formData.projectId) {
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
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Tasks</h1>
        <button
          onClick={handleAddTask}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Add New Task
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.projectName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.clientName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.type.startsWith('round') ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                    task.type === 'development' ? 'bg-blue-100 text-blue-800' :
                    task.type === 'design' ? 'bg-purple-100 text-purple-800' :
                    task.type === 'fixing' ? 'bg-red-100 text-red-800' :
                    task.type === 'feedback' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.type.startsWith('round') ? task.type.replace('round-', 'Round ').toUpperCase() : task.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${task.budget.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(task.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => handleEditTask(task, {
                      id: task.projectId,
                      clientId: task.clientId,
                      name: task.projectName,
                      status: 'in-progress',
                      startDate: '',
                      endDate: '',
                      budget: 0,
                      description: '',
                      url: '',
                      username: '',
                      password: '',
                      clientName: task.clientName,
                      tasks: []
                    })}
                    className="text-primary-600 hover:text-primary-900 mr-3"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.projectId, task.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash />
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
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Tasks; 