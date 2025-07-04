import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaCopy, FaExternalLinkAlt, FaCalendarAlt, FaDollarSign, FaUser, FaLink, FaEdit, FaFileAlt, FaTasks, FaChartLine, FaDownload, FaClock, FaCheckCircle, FaExclamationTriangle, FaFolder, FaUpload, FaCloudUploadAlt, FaFilePdf, FaTrash, FaFileWord, FaFileExcel } from 'react-icons/fa';
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
  onAddTask?: (project: Project) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialData, clients, onSubmit, onCancel, isViewMode = false, onAddTask }) => {
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
    const completedTasks = initialData?.tasks?.filter(task => task.status === 'completed').length || 0;
    const totalTasks = initialData?.tasks?.length || 0;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const totalExpenses = projectExpenses.reduce((total, expense) => total + Number(expense.amount), 0);
    const budgetUtilization = formData.budget > 0 ? (totalExpenses / formData.budget) * 100 : 0;
    
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-800 border-green-200';
        case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return 'bg-red-100 text-red-800 border-red-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'low': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
        {/* Clean Header Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{formData.title}</h2>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(formData.status)}`}>
                  {formData.status === 'completed' && <FaCheckCircle className="mr-1 w-3 h-3" />}
                  {formData.status === 'in_progress' && <FaClock className="mr-1 w-3 h-3" />}
                  {formData.status === 'pending' && <FaExclamationTriangle className="mr-1 w-3 h-3" />}
                  {formData.status.replace('_', ' ').toUpperCase()}
                </span>
                <div className="flex items-center text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200 text-sm">
                  <FaUser className="mr-1 w-3 h-3 text-gray-500" />
                  <span>
                    {clients.find(c => String(c.id) === String(initialData?.client_id))?.name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onAddTask && initialData) {
                    onAddTask(initialData);
                  } else {
                    alert('Unable to add task. Project data not available.');
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 border border-purple-600 rounded-lg text-xs font-medium text-white transition-all duration-200"
              >
                <FaTasks className="w-3 h-3" />
                                <span>Add Task</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-lg text-xs font-medium text-white transition-all duration-200"
              >
                <FaDownload className="w-3 h-3" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FaCalendarAlt className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-2xl font-bold text-blue-900">{calculateProjectDuration()}</p>
                </div>
              </div>
              {formData.start_date && formData.end_date && (
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 text-center">
                    {new Date(formData.start_date).toLocaleDateString()} - {new Date(formData.end_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                  <FaDollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Budget</p>
                  <p className="text-2xl font-bold text-emerald-900">${formData.budget.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-emerald-200">
                <div className="text-xs font-medium text-emerald-700 text-center">
                  ${totalExpenses.toLocaleString()} spent ({budgetUtilization.toFixed(1)}%)
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <FaTasks className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Tasks</p>
                  <p className="text-2xl font-bold text-purple-900">{completedTasks}/{totalTasks}</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-purple-200">
                <div className="text-xs font-medium text-purple-700 text-center mb-2">
                  {taskCompletionRate.toFixed(1)}% completed
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${taskCompletionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-6 border border-rose-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg">
                  <FaChartLine className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Expenses</p>
                  <p className="text-2xl font-bold text-rose-900">${totalExpenses.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-rose-200">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-xs font-medium text-rose-700">{projectExpenses.length}</div>
                    <div className="text-xs text-rose-600">Transactions</div>
                  </div>
                  <div className="h-8 w-px bg-rose-300"></div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-rose-700">
                      {projectExpenses.length > 0 ? `$${(totalExpenses / projectExpenses.length).toFixed(0)}` : '$0'}
                    </div>
                    <div className="text-xs text-rose-600">Avg/Transaction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Information - Full Width */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-1.5 bg-blue-100 rounded-md mr-3">
              <FaFileAlt className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Project Information</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Start Date</label>
                <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded">
                  {formData.start_date ? new Date(formData.start_date).toLocaleDateString() : 'Not set'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">End Date</label>
                <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded">
                  {formData.end_date ? new Date(formData.end_date).toLocaleDateString() : 'Not set'}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Description</label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200 min-h-[60px]">
                {formData.description || 'No description provided'}
              </div>
            </div>
          </div>
        </div>

        {/* Access Credentials */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="p-1.5 bg-indigo-100 rounded-md mr-3">
                <FaUser className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Access Credentials</h3>
            </div>
            <div className="space-y-4">
              {formData.project_live_url && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Live URL</label>
                  <div className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-200">
                    <div 
                      className="text-sm text-blue-700 hover:text-blue-900 cursor-pointer flex-1 truncate" 
                      onClick={() => window.open(formData.project_live_url, '_blank')}
                      title={formData.project_live_url}
                    >
                      {formData.project_live_url}
                    </div>
                    <button
                      onClick={() => window.open(formData.project_live_url, '_blank')}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded transition-colors"
                      title="Open in new tab"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(formData.project_live_url)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      <FaCopy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {formData.admin_login_url && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Admin URL</label>
                  <div className="flex items-center gap-2 bg-purple-50 p-2 rounded border border-purple-200">
                    <div 
                      className="text-sm text-purple-700 hover:text-purple-900 cursor-pointer flex-1 truncate" 
                      onClick={() => window.open(formData.admin_login_url, '_blank')}
                      title={formData.admin_login_url}
                    >
                      {formData.admin_login_url}
                    </div>
                    <button
                      onClick={() => window.open(formData.admin_login_url, '_blank')}
                      className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded transition-colors"
                      title="Open in new tab"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(formData.admin_login_url)}
                      className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      <FaCopy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {formData.username_email && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Username/Email</label>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="text-sm text-gray-900 flex-1 font-mono">
                      {formData.username_email}
                    </div>
                    <button
                      onClick={() => copyToClipboard(formData.username_email)}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      <FaCopy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {formData.password && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Password</label>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="text-sm text-gray-900 flex-1 font-mono">
                      {showPassword ? formData.password : '••••••••••••'}
                    </div>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash className="w-3 h-3" /> : <FaEye className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(formData.password)}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      <FaCopy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>



        {/* Tasks Section */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-1.5 bg-purple-100 rounded-md mr-3">
              <FaTasks className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              {totalTasks}
            </span>
          </div>
          {initialData?.tasks && initialData.tasks.length > 0 ? (
            <div className="space-y-3">
              {initialData.tasks.map((task) => (
                <div key={task.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 mb-2">{task.title}</h4>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 bg-white p-2 rounded border">{task.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt className="w-3 h-3" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                        {task.assigned_to_name && (
                          <div className="flex items-center gap-1">
                            <FaUser className="w-3 h-3" />
                            <span>{task.assigned_to_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          <span>Created: {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FaTasks className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-base font-semibold text-gray-900 mb-2">No tasks yet</h4>
              <p className="text-sm text-gray-500">Tasks will appear here once they are created for this project.</p>
            </div>
          )}
        </div>

        {/* Project Files & Documents */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-1.5 bg-blue-100 rounded-md mr-3">
                <FaFolder className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Project Files & Documents</h3>
              {existingFiles.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {existingFiles.length}
                </span>
              )}
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              onClick={() => {
                // Trigger file upload
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.multiple = true;
                fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif';
                fileInput.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) {
                    // Add files to existing files list
                    const newFileNames = Array.from(files).map(file => file.name);
                    setExistingFiles(prev => [...prev, ...newFileNames]);
                    // Here you would typically upload to a server
                    console.log('Files selected:', Array.from(files));
                  }
                };
                fileInput.click();
              }}
            >
              <FaUpload className="w-3 h-3" />
              Upload Files
            </button>
          </div>

          {existingFiles.length > 0 ? (
            <>
              {/* File Upload Area - Show when files exist */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors mb-4 cursor-pointer"
                   onClick={() => {
                     const fileInput = document.createElement('input');
                     fileInput.type = 'file';
                     fileInput.multiple = true;
                     fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif';
                     fileInput.onchange = (e) => {
                       const files = (e.target as HTMLInputElement).files;
                       if (files) {
                         const newFileNames = Array.from(files).map(file => file.name);
                         setExistingFiles(prev => [...prev, ...newFileNames]);
                       }
                     };
                     fileInput.click();
                   }}>
                <FaCloudUploadAlt className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Drop files here or click to browse</p>
                  <p className="text-xs text-gray-500">PDF, DOC, XLS, PPT, Images, Archives</p>
                </div>
              </div>

              {/* Files List */}
              <div className="space-y-3">
                {existingFiles.map((file, index) => {
                  const getFileIcon = (fileName: string) => {
                    const extension = fileName.split('.').pop()?.toLowerCase();
                    switch (extension) {
                      case 'pdf':
                        return { icon: FaFilePdf, color: 'bg-red-100 text-red-600' };
                      case 'doc':
                      case 'docx':
                        return { icon: FaFileWord, color: 'bg-blue-100 text-blue-600' };
                      case 'xls':
                      case 'xlsx':
                        return { icon: FaFileExcel, color: 'bg-green-100 text-green-600' };
                      case 'jpg':
                      case 'jpeg':
                      case 'png':
                      case 'gif':
                        return { icon: FaFileAlt, color: 'bg-purple-100 text-purple-600' };
                      default:
                        return { icon: FaFileAlt, color: 'bg-gray-100 text-gray-600' };
                    }
                  };

                  const { icon: IconComponent, color } = getFileIcon(file);

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate" title={file}>{file}</div>
                          <div className="text-xs text-gray-500">Click to download</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Download"
                          onClick={() => {
                            // Here you would implement file download
                            console.log('Download file:', file);
                          }}
                        >
                          <FaDownload className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Copy file name"
                          onClick={() => copyToClipboard(file)}
                        >
                          <FaCopy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete file"
                          onClick={() => removeProjectFile(index, true)}
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Empty state when no files */
            <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                 onClick={() => {
                   const fileInput = document.createElement('input');
                   fileInput.type = 'file';
                   fileInput.multiple = true;
                   fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif';
                   fileInput.onchange = (e) => {
                     const files = (e.target as HTMLInputElement).files;
                     if (files) {
                       const newFileNames = Array.from(files).map(file => file.name);
                       setExistingFiles(newFileNames);
                     }
                   };
                   fileInput.click();
                 }}>
              <FaCloudUploadAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-base font-semibold text-gray-900 mb-2">No project files yet</h4>
              <p className="text-sm text-gray-500 mb-3">Upload project documents, images, or files here.</p>
              <div className="text-xs text-gray-400">
                Supports: PDF, DOC, XLS, PPT, Images, Archives (Max 10MB each)
              </div>
            </div>
          )}
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