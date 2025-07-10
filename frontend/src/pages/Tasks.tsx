import React, { useEffect, useState } from 'react';
import { FaEye, FaEdit, FaTrash, FaPlus, FaTasks, FaProjectDiagram, FaClock, FaDollarSign, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaCalendarAlt, FaFlag, FaUser, FaChartBar } from 'react-icons/fa';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import { Task, Project, TaskStatus } from '../services/dataService';
import { apiService } from '../services/apiService';
import StatusMenu from '../components/common/StatusMenu';
import StatusFilter from '../components/projects/StatusFilter';
import { Menu } from '@headlessui/react';

interface MenuButtonProps {
  as: React.ElementType;
  className: string;
  children: React.ReactNode;
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [tasksResponse, projectsResponse] = await Promise.all([
          apiService.getTasks(),
          apiService.getProjects()
        ]);
        console.log('Fetched tasks:', tasksResponse);
        console.log('Fetched projects:', projectsResponse);
        
        // Handle the response format correctly
        setTasks(Array.isArray(tasksResponse) ? tasksResponse : []);
        setProjects(Array.isArray(projectsResponse) ? projectsResponse : []);
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
    setViewingTask(null);
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    console.log('Editing task:', task);
    setSelectedTask(task);
    setViewingTask(null);
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
      console.log('Task submission started');
      console.log('Form data received:', formData);
      console.log('Selected task for update:', selectedTask);
      
      // Ensure type field is present and valid
      const validTypes = ['development', 'design', 'fixing', 'feedback', 'round-r1', 'round-r2', 'round-r3'] as const;
      if (!formData.type || !validTypes.includes(formData.type as any)) {
        throw new Error(`Invalid type: ${formData.type}`);
      }

      const taskData = {
        ...formData,
        project_id: Number(formData.project_id),
        client_id: Number(formData.client_id),
        project_title: formData.project_title,
        type: formData.type // Ensure type is included
      };
      
      console.log('Processed task data:', taskData);
      
      if (selectedTask) {
        console.log('Updating existing task:', selectedTask.id);
        console.log('Update data:', taskData);
        
        // First update only the type if it has changed
        if (taskData.type !== selectedTask.type) {
          console.log('Type has changed, updating type first:', {
            from: selectedTask.type,
            to: taskData.type
          });
          
          const typeUpdateResult = await apiService.updateTask(selectedTask.id, {
            type: taskData.type
          });
          
          console.log('Type update result:', typeUpdateResult);
          
          if (typeUpdateResult.type !== taskData.type) {
            throw new Error(`Type update failed. Expected: ${taskData.type}, Got: ${typeUpdateResult.type}`);
          }
        }
        
        // Then update other fields
        const { type, ...otherFields } = taskData;
        
        const updated = await apiService.updateTask(selectedTask.id, otherFields);
        console.log('Task update response:', updated);
        
        // Final verification
        if (updated.type !== taskData.type) {
          console.error('Type mismatch after update:', {
            expected: taskData.type,
            received: updated.type,
            fullResponse: updated
          });
          throw new Error(`Type mismatch after update. Expected: ${taskData.type}, Got: ${updated.type}`);
        }
        
        setTasks(prev => prev.map(task =>
          task.id === selectedTask.id ? updated : task
        ));
      } else {
        console.log('Creating new task');
        const newTask = await apiService.createTask(taskData);
        console.log('New task created:', newTask);
        const updatedTasks = await apiService.getTasks();
        setTasks(Array.isArray(updatedTasks) ? updatedTasks : []);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Failed to save task. Please try again.');
    }
  };

  const handleStatusUpdate = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) {
        throw new Error('Task not found');
      }

      console.log('Original task data:', taskToUpdate);

      // Optimistically update the UI
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      try {
        // Only send the status update
        const updateData = {
          status: newStatus
        };

        console.log('Sending status update:', {
          taskId,
          oldStatus: taskToUpdate.status,
          newStatus,
          updateData
        });

        // Make the API call
        const updatedTask = await apiService.updateTask(taskId, updateData);
        console.log('Task updated successfully:', updatedTask);
        
        // Update the state with the server response
        setTasks(prev => {
          const newTasks = prev.map(task =>
            task.id === taskId ? updatedTask : task
          );
          console.log('Updated tasks state:', newTasks);
          return newTasks;
        });
      } catch (error) {
        // If the API call fails, revert the optimistic update
        console.error('API call failed, reverting status:', error);
        setTasks(prev => prev.map(task =>
          task.id === taskId ? taskToUpdate : task
        ));
        throw error;
      }
    } catch (err) {
      console.error('Error in handleStatusUpdate:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task status';
      alert(errorMessage);
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setViewingTask(task);
    const project = projects.find(p => p.id === task.project_id);
    setSelectedProject(project || null);
    setIsModalOpen(true);
  };

  const filteredTasks = selectedStatus === 'all'
    ? tasks
    : tasks.filter(task => task.status === selectedStatus);

  // Calculate stats
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending');
  const overdueTasks = tasks.filter(t => {
    const dueDate = new Date(t.due_date);
    const today = new Date();
    return dueDate < today && t.status !== 'completed';
  });
  const totalBudget = tasks.reduce((sum, task) => {
    const budget = Number(task.budget) || 0;
    return sum + budget;
  }, 0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'development':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'design':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'fixing':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'feedback':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'round-r1':
      case 'round-r2':
      case 'round-r3':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-orange-200 rounded-full animate-spin border-t-orange-600 mx-auto mb-6"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-orange-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading Tasks</div>
          <div className="text-sm text-gray-500">Fetching your task data...</div>
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
            <div className="text-xl font-semibold text-gray-800 mb-4">Unable to load tasks</div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-orange-800 to-amber-800 bg-clip-text text-transparent">
                Tasks
              </h1>
              <p className="text-lg text-gray-600">Manage your tasks and track work progress</p>
            </div>
            <div className="flex items-center gap-4">
              <StatusFilter
                selectedStatus={selectedStatus}
                onStatusChange={handleStatusChange}
              />
              <button
                onClick={handleAddTask}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <FaPlus className="w-4 h-4" />
                Add New Task
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <FaTasks className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-orange-600">{tasks.length}</p>
                    <p className="text-sm text-gray-500">Total Tasks</p>
                  </div>
                </div>
                <p className="text-gray-600">All task items</p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <FaChartBar className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{inProgressTasks.length}</p>
                    <p className="text-sm text-gray-500">In Progress</p>
                  </div>
                </div>
                <p className="text-gray-600">Active work items</p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <FaClock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-red-600">{overdueTasks.length}</p>
                    <p className="text-sm text-gray-500">Overdue</p>
                  </div>
                </div>
                <p className="text-gray-600">Needs attention</p>
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
                <p className="text-gray-600">Combined task value</p>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                  <FaTasks className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Task Management</h2>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <FaTasks className="w-12 h-12 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {selectedStatus === 'all' ? 'No tasks yet' : `No ${selectedStatus.replace('_', ' ')} tasks`}
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedStatus === 'all' 
                    ? 'Start organizing your work by creating your first task' 
                    : `No tasks match the ${selectedStatus.replace('_', ' ')} filter`
                  }
                </p>
                {selectedStatus === 'all' && (
                  <button
                    onClick={handleAddTask}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Create Your First Task
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
                          <FaTasks className="w-4 h-4" />
                          Task Details
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaProjectDiagram className="w-4 h-4" />
                          Project
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaFlag className="w-4 h-4" />
                          Priority
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-4 h-4" />
                          Due Date
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaDollarSign className="w-4 h-4" />
                          Budget
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredTasks.map((task) => {
                      const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed';
                      
                      return (
                        <tr key={task.id} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all duration-200">
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 mr-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                                  <span className="text-white font-semibold text-lg">
                                    {task.title.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{task.title}</div>
                                <div className="text-sm text-gray-500">Task #{task.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-medium text-gray-900">
                              {task.project_title || 'No Project'}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(task.type)}`}>
                              {task.type}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                              <FaFlag className="w-3 h-3 mr-1" />
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <StatusMenu
                              currentStatus={task.status as TaskStatus}
                              onStatusChange={(newStatus) => handleStatusUpdate(task.id, newStatus)}
                              size="sm"
                            />
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-gray-900">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                isOverdue ? 'bg-red-100 text-red-800 border-red-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}>
                                <FaCalendarAlt className="w-3 h-3 mr-1" />
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-semibold text-gray-900">
                              ${task.budget ? Number(task.budget).toLocaleString() : '0'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewTask(task)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                                title="View task"
                              >
                                <FaEye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditTask(task)}
                                className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                                title="Edit task"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                                title="Delete task"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
        title={selectedTask ? (selectedTask === viewingTask ? 'View Task' : 'Edit Task') : 'Add New Task'}
        size="md"
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
          isViewMode={viewingTask !== null}
        />
      </Modal>
    </div>
  );
};

export default Tasks; 