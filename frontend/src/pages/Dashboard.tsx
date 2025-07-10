import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUsers, 
  FaProjectDiagram, 
  FaTasks, 
  FaDollarSign, 
  FaChartLine, 
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaEye,
  FaPlus,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaFireAlt
} from 'react-icons/fa';
import { apiService } from '../services/apiService';
import { financeService, FinancialSummary } from '../services/financeService';
import type { Task, Project, Client } from '../services/dataService';

const Dashboard = () => {
  const [timeFilter, setTimeFilter] = useState('monthly');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate stats from current data
  const allProjects = clients.flatMap(client => 
    (client.projects || []).map(p => ({
      ...p,
      client_name: client.company_name,
      client_id: client.id
    }))
  );

  const pendingProjects = allProjects.filter(p => 
    p.status === 'not_started' || p.status === 'in_progress'
  );

  const completedProjects = allProjects.filter(p => p.status === 'completed');

  const pendingTasks = tasks
    .filter(task => task.status === 'not_started' || task.status === 'pending' || task.status === 'in_progress')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const overdueTasks = pendingTasks.filter(task => 
    new Date(task.due_date) < new Date()
  );

  const upcomingTasks = pendingTasks
    .filter(task => {
      // Prioritize not_started tasks first, then pending tasks
      if (task.status === 'not_started' || task.status === 'pending') return true;
      
      // Then show in_progress tasks due within a week
      if (task.status === 'in_progress') {
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(today.getDate() + 7);
        return dueDate >= today && dueDate <= weekFromNow;
      }
      
      return false;
    })
    .sort((a, b) => {
      // Sort by status first (not_started first, then pending, then in_progress), then by due date
      const statusOrder = { 'not_started': 0, 'pending': 1, 'in_progress': 2, 'completed': 3, 'cancelled': 4 };
      if (a.status !== b.status) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 5);

  const upcomingProjects = pendingProjects
    .filter(project => {
      // Show all not_started projects first
      if (project.status === 'not_started') return true;
      
      // Then show in_progress projects due within a week
      if (project.status === 'in_progress' && project.end_date) {
        const endDate = new Date(project.end_date);
        const today = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(today.getDate() + 7);
        return endDate >= today && endDate <= weekFromNow;
      }
      
      return false;
    })
    .sort((a, b) => {
      // Sort by status first (not_started first), then by end date
      if (a.status !== b.status) {
        if (a.status === 'not_started') return -1;
        if (b.status === 'not_started') return 1;
      }
      if (a.end_date && b.end_date) {
        return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
      }
      return 0;
    })
    .slice(0, 5);

  const fetchData = async () => {
    try {
      setError(null);
      const [tasksData, clientsData, financeData] = await Promise.all([
        apiService.getTasks(),
        apiService.getClients(),
        financeService.getFinancialSummary()
      ]);
      
      if (!Array.isArray(tasksData)) {
        throw new Error('Tasks data is not an array');
      }
      
      if (!Array.isArray(clientsData)) {
        throw new Error('Clients data is not an array');
      }
      
      const clientsWithProjects = clientsData.map(client => ({
        ...client,
        projects: client.projects || []
      }));
      
      setTasks(tasksData);
      setClients(clientsWithProjects);
      setFinancialData(financeData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err instanceof Error) {
        setError(`Failed to load dashboard data: ${err.message}`);
      } else {
        setError('Failed to load dashboard data. Please try again later.');
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };

    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    const validAmount = isNaN(amount) || amount == null ? 0 : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(validAmount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'not_started':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading Dashboard</div>
          <div className="text-sm text-gray-500">Getting your latest data...</div>
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
            <div className="text-xl font-semibold text-gray-800 mb-4">Oops! Something went wrong</div>
            <div className="text-gray-600 mb-6">{error}</div>
            <button
              onClick={handleRefresh}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-lg text-gray-600">Welcome back! Here's what's happening with your business.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                <FaSpinner className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                to="/projects"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <FaPlus className="w-4 h-4" />
                New Project
              </Link>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <FaUsers className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{clients.length}</p>
                    <p className="text-sm text-gray-500">Total Clients</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">Active businesses</p>
                <Link to="/clients" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm group-hover:underline">
                  View Clients
                  <FaArrowUp className="w-3 h-3 ml-1 transform rotate-45 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                    <FaProjectDiagram className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">{pendingProjects.length}</p>
                    <p className="text-sm text-gray-500">Active Projects</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">{completedProjects.length} completed</p>
                <Link to="/projects" className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-medium text-sm group-hover:underline">
                  View Projects
                  <FaArrowUp className="w-3 h-3 ml-1 transform rotate-45 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
                    <FaTasks className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-amber-600">{pendingTasks.length}</p>
                    <p className="text-sm text-gray-500">Pending Tasks</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">
                  {overdueTasks.length > 0 && (
                    <span className="text-red-600 font-medium">{overdueTasks.length} overdue</span>
                  )}
                  {overdueTasks.length === 0 && "All on track"}
                </p>
                <Link to="/tasks" className="inline-flex items-center text-amber-600 hover:text-amber-800 font-medium text-sm group-hover:underline">
                  View Tasks
                  <FaArrowUp className="w-3 h-3 ml-1 transform rotate-45 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <FaDollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-purple-600">
                      {financialData ? formatCurrency(financialData.monthlyRevenue) : '$0'}
                    </p>
                    <p className="text-sm text-gray-500">Monthly Income</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">Net revenue this month</p>
                <Link to="/finances" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium text-sm group-hover:underline">
                  View Finances
                  <FaArrowUp className="w-3 h-3 ml-1 transform rotate-45 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Projects */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                    <FaProjectDiagram className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Pending Projects</h2>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                  {pendingProjects.length} total
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Budget</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {pendingProjects.slice(0, 5).map((project, index) => (
                      <tr key={project.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{project.title}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{project.client_name}</td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(project.budget)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pendingProjects.length > 5 && (
                <div className="mt-4 text-center">
                  <Link 
                    to="/projects" 
                    className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-medium text-sm hover:underline"
                  >
                    View {pendingProjects.length - 5} more projects
                    <FaArrowUp className="w-3 h-3 ml-1 transform rotate-45" />
                  </Link>
                </div>
              )}
            </div>

            {/* Pending Tasks */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                    <FaTasks className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Pending Tasks</h2>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                  {pendingTasks.length} total
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {pendingTasks.slice(0, 5).map((task, index) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-500">{task.client_name}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm font-medium ${
                            new Date(task.due_date) < new Date() ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pendingTasks.length > 5 && (
                <div className="mt-4 text-center">
                  <Link 
                    to="/tasks" 
                    className="inline-flex items-center text-amber-600 hover:text-amber-800 font-medium text-sm hover:underline"
                  >
                    View {pendingTasks.length - 5} more tasks
                    <FaArrowUp className="w-3 h-3 ml-1 transform rotate-45" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Projects */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <FaCalendarAlt className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Projects</h2>
                </div>
                <Link 
                  to="/projects" 
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                >
                  View All
                </Link>
              </div>
              {upcomingProjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FaCheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <p className="text-gray-600 font-medium">All caught up!</p>
                  <p className="text-gray-500 text-sm mt-1">No projects to start or due soon</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingProjects.map((project, index) => (
                    <div key={project.id} className={`group p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                      project.status === 'not_started' 
                        ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300' 
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">{project.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{project.client_name}</p>
                          <p className={`text-sm mt-2 font-medium ${
                            project.status === 'not_started' 
                              ? 'text-gray-600' 
                              : 'text-blue-600'
                          }`}>
                            {project.status === 'not_started' 
                              ? '🚀 Ready to start' 
                              : `📅 Due: ${project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}`
                            }
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                          <Link 
                            to="/projects" 
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200 hover:bg-blue-50 rounded-lg"
                          >
                            <FaEye className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                    <FaFireAlt className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Tasks</h2>
                </div>
                <Link 
                  to="/tasks" 
                  className="text-orange-600 hover:text-orange-800 font-medium text-sm hover:underline"
                >
                  View All
                </Link>
              </div>
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FaCheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <p className="text-gray-600 font-medium">All tasks handled!</p>
                  <p className="text-gray-500 text-sm mt-1">No tasks to start or due soon</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingTasks.map((task, index) => (
                    <div key={task.id} className={`group p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                      task.status === 'not_started' 
                        ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300'
                        : task.status === 'pending' 
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 hover:border-orange-300' 
                        : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 hover:border-yellow-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">{task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{task.client_name}</p>
                          <p className={`text-sm mt-2 font-medium ${
                            task.status === 'not_started' 
                              ? 'text-gray-600'
                              : task.status === 'pending' 
                              ? 'text-orange-600' 
                              : 'text-amber-600'
                          }`}>
                            {task.status === 'not_started' 
                              ? '🚀 Ready to start' 
                              : task.status === 'pending'
                              ? '⏳ Waiting to begin'
                              : `📅 Due: ${new Date(task.due_date).toLocaleDateString()}`
                            }
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <Link 
                            to="/tasks" 
                            className="p-2 text-gray-400 hover:text-orange-600 transition-colors duration-200 hover:bg-orange-50 rounded-lg"
                          >
                            <FaEye className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Financial Overview */}
          {financialData && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <FaChartLine className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Financial Overview</h2>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <Link 
                    to="/finances" 
                    className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium text-sm hover:underline"
                  >
                    View Details
                    <FaEye className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-6 border border-emerald-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                      <FaArrowUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-emerald-700 mb-2">Total Income</p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {formatCurrency(financialData.grossIncome)}
                    </p>
                  </div>
                </div>
                <div className="group bg-gradient-to-br from-red-50 to-pink-100 rounded-2xl p-6 border border-red-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                      <FaArrowDown className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-red-700 mb-2">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-800">
                      {formatCurrency(financialData.totalExpenses)}
                    </p>
                  </div>
                </div>
                <div className="group bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-center mb-4">
                                         <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                       <FaChartLine className="w-6 h-6 text-white" />
                     </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-blue-700 mb-2">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {formatCurrency(financialData.totalIncome)}
                    </p>
                  </div>
                </div>
              </div>
              {financialData.pendingInvoices.count > 0 && (
                <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-100 rounded-2xl border border-amber-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg">
                        <FaClock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-800">Pending Invoices</p>
                        <p className="text-sm text-amber-700">
                          {financialData.pendingInvoices.count} invoice(s) worth {formatCurrency(financialData.pendingInvoices.total)}
                        </p>
                      </div>
                    </div>
                    <Link 
                      to="/finances?filter=pending" 
                      className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      View Invoices
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 