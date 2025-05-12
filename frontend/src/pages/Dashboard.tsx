import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import type { Task, Project, Client } from '../services/dataService';

const Dashboard = () => {
  const [timeFilter, setTimeFilter] = useState('monthly'); // 'weekly', 'monthly', 'yearly'
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current date and calculate date ranges
  const now = new Date();
  const getDateRange = (filter: string) => {
    // Always work with UTC dates for consistency
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ));

    let start = new Date(nowUTC);
    let end = new Date(nowUTC);
    end.setUTCHours(23, 59, 59, 999);

    switch (filter) {
      case 'weekly':
        start.setUTCDate(start.getUTCDate() - 7);
        break;
      case 'monthly':
        // Set to first day of current month
        start.setUTCDate(1);
        // Set to last day of current month
        end = new Date(Date.UTC(
          nowUTC.getUTCFullYear(),
          nowUTC.getUTCMonth() + 1,
          0,
          23, 59, 59, 999
        ));
        break;
      case 'yearly':
        // Set to first day of current year
        start = new Date(Date.UTC(nowUTC.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
        // Set to last day of current year
        end = new Date(Date.UTC(nowUTC.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
        break;
      default:
        // Default to last 30 days
        start.setUTCDate(start.getUTCDate() - 30);
    }

    return { start, end };
  };

  const { start, end } = getDateRange(timeFilter);
  
  // Calculate total income from completed projects in the selected time period
  console.log('\nDate range for income calculation:');
  console.log('Start:', start.toISOString());
  console.log('End:', end.toISOString());

  // Get all completed projects with their client names
  const completedProjects = clients.flatMap(client => 
    (client.projects || [])
      .filter(p => p.status === 'completed')
      .map(p => ({
        ...p,
        client_name: client.company_name
      }))
  );

  console.log('\nCompleted projects:', completedProjects.map(p => ({
    title: p.title,
    client: p.client_name,
    end_date: p.end_date,
    budget: p.budget
  })));

  // Calculate income from projects completed in the date range
  const totalIncome = completedProjects.reduce((sum, project) => {
    try {
      // Parse the ISO date string and convert to UTC
      const completionDate = new Date(project.end_date);
      completionDate.setUTCHours(12, 0, 0, 0);

      // Convert range dates to UTC for comparison
      const startUTC = new Date(start);
      startUTC.setUTCHours(0, 0, 0, 0);
      const endUTC = new Date(end);
      endUTC.setUTCHours(23, 59, 59, 999);

      const isInRange = completionDate >= startUTC && completionDate <= endUTC;

      console.log(`\nProject: ${project.title}`);
      console.log(`End date (raw): ${project.end_date}`);
      console.log(`End date (UTC): ${completionDate.toISOString()}`);
      console.log(`Range (UTC): ${startUTC.toISOString()} to ${endUTC.toISOString()}`);
      console.log(`In range: ${isInRange}`);

      if (isInRange) {
        const budget = Number(project.budget) || 0;
        console.log(`Adding to income: $${budget}`);
        return sum + budget;
      }
    } catch (err) {
      console.error(`Error processing project ${project.title}:`, err);
    }
    return sum;
  }, 0);

  console.log(`\nFinal total income: $${totalIncome}`);
  
  // Get pending tasks (tasks from in-progress projects)
  const pendingTasks = clients.flatMap(client =>
    (client.projects || [])
      .filter(project => project.status === 'in_progress')
      .map(project => ({
        id: project.id,
        title: project.title,
        client_name: client.company_name,
        end_date: project.end_date
      }))
  ).sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());

  // Responsive table style
  const tableContainerClass = "overflow-x-auto md:overflow-x-visible";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching tasks and clients...');
        const [tasksData, clientsData] = await Promise.all([
          apiService.getTasks(),
          apiService.getClients()
        ]);
        
        console.log('Tasks data:', tasksData);
        console.log('Clients data:', clientsData);
        
        if (!Array.isArray(tasksData)) {
          throw new Error('Tasks data is not an array');
        }
        
        if (!Array.isArray(clientsData)) {
          throw new Error('Clients data is not an array');
        }
        
        // Ensure each client has a projects array and log project data
        const clientsWithProjects = clientsData.map(client => {
          console.log(`Client ${client.company_name} projects:`, client.projects);
          return {
            ...client,
            projects: client.projects || []
          };
        });
        
        setTasks(tasksData);
        setClients(clientsWithProjects);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (err instanceof Error) {
          setError(`Failed to load dashboard data: ${err.message}`);
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading dashboard data...</div>
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

  // Log the current state for debugging
  console.log('Current clients:', clients);
  console.log('Total projects:', completedProjects.length);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFilter('weekly')}
            className={`px-4 py-2 rounded-md ${
              timeFilter === 'weekly' ? 'bg-primary-600 text-white' : 'bg-gray-100'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeFilter('monthly')}
            className={`px-4 py-2 rounded-md ${
              timeFilter === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-100'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeFilter('yearly')}
            className={`px-4 py-2 rounded-md ${
              timeFilter === 'yearly' ? 'bg-primary-600 text-white' : 'bg-gray-100'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-600 mb-2">Total Clients</h2>
          <p className="text-3xl font-bold text-primary-600">{clients.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-600 mb-2">Active Projects</h2>
          <p className="text-3xl font-bold text-green-600">{completedProjects.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-600 mb-2">{`${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Income`}</h2>
          <p className="text-3xl font-bold text-purple-600">
            {totalIncome > 0 ? `$${totalIncome.toLocaleString()}` : <span>$0 <span className="text-xs text-gray-400">(No payments in this period)</span></span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Tasks</h2>
          <div className={tableContainerClass}>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingTasks.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-400">No pending tasks</td></tr>
                ) : pendingTasks.map(task => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.client_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(task.end_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Projects</h2>
          <div className={tableContainerClass}>
            <table className="min-w-full md:table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {completedProjects.map(project => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.client_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${project.budget.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 