import React, { useState } from 'react';
import { Task, TaskType } from '../services/dataService';

interface TaskFormProps {
  initialData?: Task | null;
  projects: Array<{
    id: string;
    name: string;
    clientId: string;
    clientName: string;
  }>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, projects, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'pending',
    priority: initialData?.priority || 'medium',
    due_date: initialData?.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : '',
    project_id: initialData?.project_id?.toString() || '',
    client_id: initialData?.client_id?.toString() || '',
    assigned_to: initialData?.assigned_to || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProject = projects.find(p => p.id === formData.project_id);
    
    // Validate required fields
    const requiredFields = {
      title: 'Task Title',
      project_id: 'Project',
      status: 'Status',
      priority: 'Priority',
      due_date: 'Due Date'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (!selectedProject) {
      alert('Please select a project');
      return;
    }
    
    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      project_id: Number(formData.project_id),
      project_title: selectedProject.name,
      client_id: Number(selectedProject.clientId),
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updates: any = {
        ...prev,
        [name]: value
      };

      // Update client_id when project changes
      if (name === 'project_id') {
        const selectedProject = projects.find(p => p.id === value);
        if (selectedProject) {
          updates.client_id = selectedProject.clientId;
          updates.project_title = selectedProject.name;
          console.log('Selected project:', selectedProject);
          console.log('Project title:', selectedProject.name);
          console.log('Project ID:', value);
        } else {
          console.warn('No project found for id:', value);
          updates.project_id = '';
          updates.client_id = '';
          updates.project_title = '';
        }
      }

      return updates;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Task Title</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div>
        <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">Project</label>
        <select
          id="project_id"
          name="project_id"
          value={formData.project_id}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Select a project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name} ({project.clientName})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div>
        <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Due Date</label>
        <input
          type="date"
          id="due_date"
          name="due_date"
          value={formData.due_date}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {initialData ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm; 