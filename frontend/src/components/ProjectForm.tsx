import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaCopy } from 'react-icons/fa';
import { Project } from '../services/dataService';

interface ProjectFormProps {
  initialData?: Project | null;
  clients: Array<{
    id: string;
    name: string;
  }>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isViewMode?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialData, clients, onSubmit, onCancel, isViewMode = false }) => {
  // Add formatDateForInput function at the start
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Convert to YYYY-MM-DD
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return ''; // Return empty string if invalid date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    status: initialData?.status || 'not_started',
    start_date: initialData?.start_date ? formatDateForInput(initialData.start_date) : '',
    end_date: initialData?.end_date ? formatDateForInput(initialData.end_date) : '',
    budget: initialData?.budget || 0,
    description: initialData?.description || '',
    client_id: initialData?.client_id || clients[0]?.id || '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // For date inputs, ensure the value is in YYYY-MM-DD format
    if (name === 'start_date' || name === 'end_date') {
      setFormData(prev => ({ ...prev, [name]: formatDateForInput(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Project title is required');
      return;
    }
    
    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }

    // Format dates to YYYY-MM-DD
    const formatDate = (dateStr: string) => {
      if (!dateStr) return null;
      // Already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // Convert to YYYY-MM-DD
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Format dates and budget
    const submissionData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      client_id: Number(formData.client_id),
      budget: Number(formData.budget),
      start_date: formatDate(formData.start_date),
      end_date: formatDate(formData.end_date)
    };

    console.log('Submitting project data:', submissionData);
    onSubmit(submissionData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderCopyableField = (label: string, name: string, value: string, type: string = 'text') => {
    return (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="mt-1 relative">
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pr-20"
            required
          />
          <button
            type="button"
            onClick={() => copyToClipboard(value)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            title="Copy to clipboard"
          >
            <FaCopy />
          </button>
        </div>
      </div>
    );
  };

  if (isViewMode) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Client</label>
          <div className="mt-1 text-sm text-gray-900">
            {clients.find(c => String(c.id) === String(initialData?.client_id))?.name || 'N/A'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Project Title</label>
          <div className="mt-1 text-sm text-gray-900">{formData.title}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <div className="mt-1 text-sm text-gray-900">{formData.status}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <div className="mt-1 text-sm text-gray-900">{formData.description}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <div className="mt-1 text-sm text-gray-900">
              {formData.start_date ? new Date(formData.start_date).toLocaleDateString() : 'Not set'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <div className="mt-1 text-sm text-gray-900">
              {formData.end_date ? new Date(formData.end_date).toLocaleDateString() : 'Not set'}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Budget</label>
          <div className="mt-1 text-sm text-gray-900">
            ${formData.budget.toLocaleString()}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tasks</label>
          <div className="mt-1 space-y-2">
            {initialData?.tasks && initialData.tasks.length > 0 ? (
              initialData.tasks.map((task) => (
                <div key={task.id} className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-gray-600">{task.description}</div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Status: {task.status}</span>
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No tasks added yet</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
          Client
        </label>
        <select
          id="client_id"
          name="client_id"
          value={formData.client_id}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          required
        >
          <option value="">Select a client</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Project Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          required
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          required
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
          Budget
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
        >
          {initialData ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm; 