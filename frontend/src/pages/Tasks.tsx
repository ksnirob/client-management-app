import React, { useEffect, useState } from 'react';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Tasks</h1>
        <div className="flex items-center gap-4">
          <StatusFilter
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusChange}
          />
          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Add New Task
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-visible">
        <div className="overflow-visible">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 text-sm">
                    No tasks found. Click "Add New Task" to create one.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.project_title || 'No Project'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {task.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusMenu
                        currentStatus={task.status as TaskStatus}
                        onStatusChange={(newStatus) => handleStatusUpdate(task.id, newStatus)}
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(task.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${task.budget ? Number(task.budget).toLocaleString() : '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                      <button
                        onClick={() => handleViewTask(task)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <FaEye />
                      </button>
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
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTask ? (selectedTask === viewingTask ? 'View Task' : 'Edit Task') : 'Add New Task'}
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