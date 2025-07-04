import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaCopy } from 'react-icons/fa';
import { Project } from '../services/dataService';
import { financeService, Transaction } from '../services/financeService';

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
    project_live_url: initialData?.project_live_url || '',
    project_files: initialData?.project_files || '',
    admin_login_url: initialData?.admin_login_url || '',
    username_email: initialData?.username_email || '',
    password: initialData?.password || '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [projectExpenses, setProjectExpenses] = useState<Transaction[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);

  useEffect(() => {
    if (isViewMode && initialData?.id) {
      loadProjectExpenses();
    }
  }, [isViewMode, initialData?.id]);

  useEffect(() => {
    if (initialData?.project_files) {
      // Parse existing files if they're stored as JSON string or comma-separated
      try {
        const files = JSON.parse(initialData.project_files);
        setExistingFiles(Array.isArray(files) ? files : []);
      } catch {
        // If not JSON, treat as comma-separated list
        const files = initialData.project_files.split(',').map(f => f.trim()).filter(f => f);
        setExistingFiles(files);
      }
    }
  }, [initialData?.project_files]);

  const loadProjectExpenses = async () => {
    if (!initialData?.id) return;
    
    try {
      setLoadingExpenses(true);
      const expenses = await financeService.getProjectExpenses(initialData.id);
      setProjectExpenses(expenses);
    } catch (error) {
      console.error('Error loading project expenses:', error);
    } finally {
      setLoadingExpenses(false);
    }
  };

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

  const handleProjectFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setProjectFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeProjectFile = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setProjectFiles(prev => prev.filter((_, i) => i !== index));
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
      end_date: formatDate(formData.end_date),
      project_live_url: formData.project_live_url.trim() || null,
      project_files: (existingFiles.length > 0 || projectFiles.length > 0) 
        ? JSON.stringify([...existingFiles, ...projectFiles.map(file => file.name)])
        : null,
      admin_login_url: formData.admin_login_url.trim() || null,
      username_email: formData.username_email.trim() || null,
      password: formData.password.trim() || null,
    };

    console.log('Submitting project data:', submissionData);
    onSubmit(submissionData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const calculateProjectDuration = () => {
    if (!formData.start_date || !formData.end_date) {
      return 'Not available';
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid dates';
    }

    const timeDiff = endDate.getTime() - startDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (dayDiff < 0) {
      return 'End date before start date';
    } else if (dayDiff === 0) {
      return 'Same day';
    } else if (dayDiff === 1) {
      return '1 day';
    } else if (dayDiff < 7) {
      return `${dayDiff} days`;
    } else if (dayDiff < 30) {
      const weeks = Math.floor(dayDiff / 7);
      const remainingDays = dayDiff % 7;
      if (remainingDays === 0) {
        return weeks === 1 ? '1 week' : `${weeks} weeks`;
      } else {
        return `${weeks} week${weeks > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
      }
    } else if (dayDiff < 365) {
      const months = Math.floor(dayDiff / 30);
      const remainingDays = dayDiff % 30;
      if (remainingDays === 0) {
        return months === 1 ? '1 month' : `${months} months`;
      } else {
        return `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
      }
    } else {
      const years = Math.floor(dayDiff / 365);
      const remainingDays = dayDiff % 365;
      const months = Math.floor(remainingDays / 30);
      const days = remainingDays % 30;
      
      let result = years === 1 ? '1 year' : `${years} years`;
      if (months > 0) {
        result += ` ${months} month${months > 1 ? 's' : ''}`;
      }
      if (days > 0) {
        result += ` ${days} day${days > 1 ? 's' : ''}`;
      }
      return result;
    }
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
    const selectedClient = clients.find(c => String(c.id) === String(initialData?.client_id));
    const totalExpenses = projectExpenses.reduce((total, expense) => total + Number(expense.amount), 0);
    
    // Helper functions for project view
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
    
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-600' };
        case 'in_progress': return { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-600' };
        case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: 'text-yellow-600' };
        case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-600' };
        default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-600' };
      }
    };

    const statusColors = getStatusColor(formData.status);

    return (
      <div className="space-y-8 p-1">
        {/* Header Section with Project Title */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-gray-900 truncate">{formData.title}</h2>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">
                  {selectedClient ? selectedClient.name : 'No Client'}
                </span>
                <span className="mx-2">•</span>
                <span>{calculateProjectDuration()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status, Budget, Timeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 ${statusColors.bg} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${statusColors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Budget</p>
                <p className="text-base font-semibold text-gray-900 truncate">${formData.budget.toLocaleString()}</p>
                {totalExpenses > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ${totalExpenses.toLocaleString()} spent
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Timeline</p>
                <p className="text-base font-semibold text-gray-900 truncate">{calculateProjectDuration()}</p>
                {formData.start_date && formData.end_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(formData.start_date).toLocaleDateString()} - {new Date(formData.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Project URLs and Access Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Project URLs</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Live URL</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {formData.project_live_url || 'Not set'}
                  </div>
                  {formData.project_live_url && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.project_live_url)}
                      className="text-gray-500 hover:text-gray-700 p-2"
                      title="Copy URL"
                    >
                      <FaCopy />
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Admin URL</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {formData.admin_login_url || 'Not set'}
                  </div>
                  {formData.admin_login_url && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.admin_login_url)}
                      className="text-gray-500 hover:text-gray-700 p-2"
                      title="Copy URL"
                    >
                      <FaCopy />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Access Credentials</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Username/Email</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {formData.username_email || 'Not set'}
                  </div>
                  {formData.username_email && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.username_email)}
                      className="text-gray-500 hover:text-gray-700 p-2"
                      title="Copy username"
                    >
                      <FaCopy />
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Password</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {showPassword ? (formData.password || 'Not set') : '••••••••'}
                  </div>
                  {formData.password && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-500 hover:text-gray-700 p-2"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formData.password)}
                        className="text-gray-500 hover:text-gray-700 p-2"
                        title="Copy password"
                      >
                        <FaCopy />
                      </button>
                    </>
                  )}
                </div>
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

        {/* Project Files Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Project Files</h3>
            </div>
          </div>
          
          <div className="mt-4">
            {existingFiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {existingFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-900 truncate">{file}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(file)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      title="Copy filename"
                    >
                      <FaCopy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
                <p className="mt-1 text-sm text-gray-500">No files uploaded for this project</p>
              </div>
            )}
          </div>
        </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tasks</label>
            <div className="mt-1 space-y-2">
              {initialData?.tasks && initialData.tasks.length > 0 ? (
                initialData.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                        {task.assigned_to_name && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Assigned to: {task.assigned_to_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Created: {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new task</p>
                </div>
              )}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
                <p className="text-sm text-gray-500">
                  {initialData?.tasks ? `${initialData.tasks.length} task${initialData.tasks.length !== 1 ? 's' : ''}` : '0 tasks'}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              {initialData?.tasks && initialData.tasks.length > 0 ? (
                <div className="space-y-3">
                  {initialData.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                          {task.assigned_to_name && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>Assigned to: {task.assigned_to_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Created: {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new task</p>
                </div>
              )}
            </div>
          </div>

          {/* Expenses Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Expenses</h3>
                <p className="text-sm text-gray-500">
                  {projectExpenses.length > 0 ? `${projectExpenses.length} expense${projectExpenses.length !== 1 ? 's' : ''} • $${totalExpenses.toLocaleString()} total` : '0 expenses'}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              {loadingExpenses ? (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Loading expenses...</div>
                </div>
              ) : projectExpenses.length > 0 ? (
                <div className="space-y-3">
                  {projectExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{expense.description}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            expense.type === 'expense' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {expense.type}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            expense.status === 'completed' ? 'bg-green-100 text-green-800' :
                            expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {expense.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Date: {new Date(expense.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span className="font-medium text-red-600">${expense.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses</h3>
                  <p className="mt-1 text-sm text-gray-500">No expenses recorded for this project</p>
                </div>
              )}
            </div>
          </div>
        </div>

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
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
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
            className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="project_live_url" className="block text-sm font-medium text-gray-700">
          Project Live URL
        </label>
        <input
          type="url"
          id="project_live_url"
          name="project_live_url"
          value={formData.project_live_url}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label htmlFor="project_files" className="block text-sm font-medium text-gray-700">
          Project Files
        </label>
        <div className="mt-1">
          <input
            type="file"
            id="project_files"
            multiple
            onChange={handleProjectFilesChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
          />
          <p className="mt-1 text-xs text-gray-500">
            Upload project files (documents, images, archives, etc.)
          </p>
        </div>

        {/* Display existing files */}
        {existingFiles.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Existing Files:</p>
            <div className="space-y-2">
              {existingFiles.map((file, index) => (
                <div key={`existing-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-700">{file}</span>
                  <button
                    type="button"
                    onClick={() => removeProjectFile(index, true)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display newly selected files */}
        {projectFiles.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">New Files:</p>
            <div className="space-y-2">
              {projectFiles.map((file, index) => (
                <div key={`new-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                  <div className="flex-1">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProjectFile(index, false)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="admin_login_url" className="block text-sm font-medium text-gray-700">
          Admin Login URL
        </label>
        <input
          type="url"
          id="admin_login_url"
          name="admin_login_url"
          value={formData.admin_login_url}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="https://admin.example.com/login"
        />
      </div>

      <div>
        <label htmlFor="username_email" className="block text-sm font-medium text-gray-700">
          Username/Email
        </label>
        <input
          type="text"
          id="username_email"
          name="username_email"
          value={formData.username_email}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="admin@example.com or username"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1 relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pr-20"
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(formData.password)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            title="Copy to clipboard"
          >
            <FaCopy />
          </button>
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