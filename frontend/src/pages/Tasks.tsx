import React, { useEffect, useState } from 'react';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import { Task, Project } from '../services/dataService';
import { apiService } from '../services/apiService';

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [tasksData, projectsData] = await Promise.all([
          apiService.getTasks(),
          apiService.getProjects()
        ]);
        setTasks(tasksData);
        setProjects(projectsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddTask = () => {
    setSelectedTask(null);
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    const project = projects.find(p => p.id === task.project_id);
    setSelectedProject(project || null);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await apiService.deleteTask(taskId);
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (err) {
        console.error('Error deleting task:', err);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const handleTaskSubmit = async (formData: Omit<Task, 'id' | 'client_name' | 'assigned_to_name'>) => {
    try {
      console.log('Submitting task with data:', formData);
      
      // Ensure project_id is a number if provided
      const taskData = {
        ...formData,
        project_id: formData.project_id ? Number(formData.project_id) : null,
        client_id: Number(formData.client_id),
        project_title: formData.project_title
      };
      
      if (selectedTask) {
        // Update existing task
        console.log('Updating task with data:', taskData);
        const updated = await apiService.updateTask(selectedTask.id, taskData);
        setTasks(prev => prev.map(task =>
          task.id === selectedTask.id ? updated : task
        ));
      } else {
        // Add new task
        console.log('Creating new task with data:', taskData);
        const newTask = await apiService.createTask(taskData);
        console.log('New task created:', newTask);
        
        // Refresh the task list to get updated data
        const updatedTasks = await apiService.getTasks();
        console.log('Updated tasks:', updatedTasks);
        setTasks(updatedTasks);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Failed to save task. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading tasks...</div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No tasks found. Click "Add New Task" to create one.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.project_title || 'No Project'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.client_name || 'No Client'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(task.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="text-primary-600 hover:text-primary-900"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
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
        title={selectedTask ? 'Edit Task' : 'Add New Task'}
      >
        <TaskForm
          initialData={selectedTask}
          projects={projects.map(project => ({
            id: String(project.id),
            name: project.title || `Project ${project.id}`,
            clientId: String(project.client_id),
            clientName: project.client_name || 'N/A'
          }))}
          onSubmit={handleTaskSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Tasks; 