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
  isViewMode?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, projects, onSubmit, onCancel, isViewMode = false }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'not_started',
    type: initialData?.type || 'development',
    priority: initialData?.priority || 'medium',
    due_date: initialData?.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : '',
    project_id: initialData?.project_id?.toString() || '',
    client_id: initialData?.client_id?.toString() || '',
    assigned_to: initialData?.assigned_to || 0,
    budget: initialData?.budget?.toString() || ''
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
      type: formData.type,
      priority: formData.priority,
      due_date: formData.due_date,
      budget: formData.budget ? Number(formData.budget) : null
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

  // Helper functions for view mode
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'development': return 'Development';
      case 'design': return 'Design';
      case 'fixing': return 'Fixing';
      case 'feedback': return 'Feedback';
      case 'round-r1': return 'Round R1';
      case 'round-r2': return 'Round R2';
      case 'round-r3': return 'Round R3';
      default: return type;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
      default: return priority;
    }
  };

  if (isViewMode) {
    const selectedProject = projects.find(p => p.id === formData.project_id);
    
    return (
      <div className="space-y-8 p-1">
        {/* Header Section with Task Title */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-gray-900 truncate">{formData.title}</h2>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="font-medium">
                  {selectedProject ? `${selectedProject.name}` : 'No Project'}
                </span>
                <span className="mx-2">•</span>
                <span>{selectedProject?.clientName || 'Unknown Client'}</span>
              </div>
            </div>
          </div>
        </div>

                 {/* Status, Type, Priority Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  formData.status === 'completed' ? 'bg-green-100' :
                  formData.status === 'in_progress' ? 'bg-blue-100' :
                  formData.status === 'pending' ? 'bg-yellow-100' :
                  formData.status === 'cancelled' ? 'bg-red-100' :
                  'bg-gray-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    formData.status === 'completed' ? 'text-green-600' :
                    formData.status === 'in_progress' ? 'text-blue-600' :
                    formData.status === 'pending' ? 'text-yellow-600' :
                    formData.status === 'cancelled' ? 'text-red-600' :
                    'text-gray-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {formData.status === 'completed' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : formData.status === 'in_progress' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : formData.status === 'cancelled' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </div>
              </div>
                             <div className="ml-4 min-w-0 flex-1">
                 <p className="text-sm font-medium text-gray-500">Status</p>
                 <p className="text-base font-semibold text-gray-900 truncate">{getStatusLabel(formData.status)}</p>
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>
                             <div className="ml-4 min-w-0 flex-1">
                 <p className="text-sm font-medium text-gray-500">Type</p>
                 <p className="text-base font-semibold text-gray-900 truncate">{getTypeLabel(formData.type)}</p>
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  formData.priority === 'high' ? 'bg-red-100' :
                  formData.priority === 'medium' ? 'bg-yellow-100' :
                  'bg-green-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    formData.priority === 'high' ? 'text-red-600' :
                    formData.priority === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {formData.priority === 'high' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    ) : formData.priority === 'medium' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    )}
                  </svg>
                </div>
              </div>
                             <div className="ml-4 min-w-0 flex-1">
                 <p className="text-sm font-medium text-gray-500">Priority</p>
                 <p className="text-base font-semibold text-gray-900 truncate">{getPriorityLabel(formData.priority)}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Due Date and Budget Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Due Date</p>
                <p className="text-xl font-bold text-gray-900">
                  {formData.due_date ? new Date(formData.due_date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 'Not set'}
                </p>
                {formData.due_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    {(() => {
                      const today = new Date();
                      const dueDate = new Date(formData.due_date);
                      const diffTime = dueDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
                      if (diffDays === 0) return 'Due today';
                      if (diffDays === 1) return 'Due tomorrow';
                      return `${diffDays} days remaining`;
                    })()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Budget</p>
                <p className="text-xl font-bold text-gray-900">
                  ${formData.budget ? Number(formData.budget).toLocaleString() : '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Allocated budget</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {formData.description && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {formData.description}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
      </div>
    );
  }

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

      <div className="grid grid-cols-3 gap-4">
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
            <option value="not_started">Not Started</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="fixing">Fixing</option>
            <option value="feedback">Feedback</option>
            <option value="round-r1">Round R1</option>
            <option value="round-r2">Round R2</option>
            <option value="round-r3">Round R3</option>
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

      <div>
        <label htmlFor="budget" className="block text-sm font-medium text-gray-700">Budget ($)</label>
        <input
          type="number"
          id="budget"
          name="budget"
          value={formData.budget}
          onChange={handleChange}
          min="0"
          step="0.01"
          placeholder="0.00"
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