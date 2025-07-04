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
  FaArrowDown
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
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-red-600 mx-auto mb-4" />
          <div className="text-xl text-red-600 mb-4">{error}</div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 text-sm sm:text-base"
          >
            <FaSpinner className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/projects"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-all duration-200 text-sm sm:text-base"
          >
            <FaPlus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold text-blue-600">{clients.length}</p>
              <p className="text-sm text-gray-500 mt-1">Active businesses</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <Link to="/clients" className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium block">View Clients →</Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-green-600">{pendingProjects.length}</p>
              <p className="text-sm text-gray-500 mt-1">{completedProjects.length} completed</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaProjectDiagram className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <Link to="/projects" className="mt-4 text-sm text-green-600 hover:text-green-800 font-medium block">View Projects →</Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-3xl font-bold text-orange-600">{pendingTasks.length}</p>
              <p className="text-sm text-red-500 mt-1">{overdueTasks.length} overdue</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FaTasks className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <Link to="/tasks" className="mt-4 text-sm text-orange-600 hover:text-orange-800 font-medium block">View Tasks →</Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-3xl font-bold text-purple-600">
                {financialData ? formatCurrency(financialData.monthlyRevenue) : '$0'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Net revenue this month
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FaDollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <Link to="/finances" className="mt-4 text-sm text-purple-600 hover:text-purple-800 font-medium block">View Finances →</Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pending Projects */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Pending Projects</h2>
            <span className="text-sm text-gray-500">{pendingProjects.length} total</span>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingProjects.slice(0, 5).map(project => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{project.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{project.client_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(project.budget)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {pendingProjects.length > 5 && (
            <div className="mt-4 text-center">
              <Link 
                to="/projects" 
                className="text-primary-600 hover:text-primary-800 font-medium text-sm"
              >
                View {pendingProjects.length - 5} more projects →
              </Link>
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Pending Tasks</h2>
            <span className="text-sm text-gray-500">{pendingTasks.length} total</span>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingTasks.slice(0, 5).map(task => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500">{task.client_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-sm ${
                          new Date(task.due_date) < new Date() ? 'text-red-600 font-medium' : 'text-gray-900'
                        }`}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {pendingTasks.length > 5 && (
            <div className="mt-4 text-center">
              <Link 
                to="/tasks" 
                className="text-primary-600 hover:text-primary-800 font-medium text-sm"
              >
                View {pendingTasks.length - 5} more tasks →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Upcoming Projects */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Upcoming Projects</h2>
            <Link 
              to="/projects" 
              className="text-primary-600 hover:text-primary-800 font-medium text-sm"
            >
              View All
            </Link>
          </div>
          {upcomingProjects.length === 0 ? (
            <div className="text-center py-8">
              <FaCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500">No projects to start or due soon</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingProjects.map(project => (
                <div key={project.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  project.status === 'not_started' 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{project.title}</h3>
                    <p className="text-sm text-gray-600">{project.client_name}</p>
                    <p className={`text-sm ${
                      project.status === 'not_started' 
                        ? 'text-gray-600' 
                        : 'text-blue-600'
                    }`}>
                      {project.status === 'not_started' 
                        ? 'Ready to start' 
                        : `Due: ${project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    <Link 
                      to="/projects" 
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <FaEye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Upcoming Tasks</h2>
            <Link 
              to="/tasks" 
              className="text-primary-600 hover:text-primary-800 font-medium text-sm"
            >
              View All
            </Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8">
              <FaCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500">No tasks to start or due soon</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map(task => (
                <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  task.status === 'not_started' 
                    ? 'bg-gray-50 border-gray-200'
                    : task.status === 'pending' 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600">{task.client_name}</p>
                    <p className={`text-sm ${
                      task.status === 'not_started' 
                        ? 'text-gray-600'
                        : task.status === 'pending' 
                        ? 'text-orange-600' 
                        : 'text-yellow-600'
                    }`}>
                      {task.status === 'not_started' 
                        ? 'Ready to start' 
                        : task.status === 'pending'
                        ? 'Waiting to begin'
                        : `Due: ${new Date(task.due_date).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <Link 
                      to="/tasks" 
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <FaEye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Financial Overview */}
      {financialData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Financial Overview</h2>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <Link 
                to="/finances" 
                className="text-primary-600 hover:text-primary-800 font-medium flex items-center gap-2 text-sm"
              >
                View Details
                <FaEye className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors duration-200">
              <div className="flex items-center justify-center mb-2">
                <FaArrowUp className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">Total Income</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600 text-center">
                {formatCurrency(financialData.grossIncome)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 hover:bg-red-100 transition-colors duration-200">
              <div className="flex items-center justify-center mb-2">
                <FaArrowDown className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">Total Expenses</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-600 text-center">
                {formatCurrency(financialData.totalExpenses)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors duration-200">
              <div className="flex items-center justify-center mb-2">
                <FaChartLine className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">Net Profit</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 text-center">
                {formatCurrency(financialData.totalIncome)}
              </p>
            </div>
          </div>
          {financialData.pendingInvoices.count > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center">
                  <FaClock className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium text-yellow-800">
                    {financialData.pendingInvoices.count} pending invoice(s) worth {formatCurrency(financialData.pendingInvoices.total)}
                  </span>
                </div>
                <Link 
                  to="/finances?filter=pending" 
                  className="text-yellow-600 hover:text-yellow-800 font-medium text-sm whitespace-nowrap"
                >
                  View Invoices →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 