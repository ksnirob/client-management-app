import React, { useState } from 'react';
import data from '../data/db.json';

const Dashboard = () => {
  const [timeFilter, setTimeFilter] = useState('monthly'); // 'weekly', 'monthly', 'yearly'

  const totalClients = data.clients.length;
  const totalProjects = data.clients.reduce((acc, client) => acc + client.projects.length, 0);
  
  // Get current date and calculate date ranges
  const now = new Date();
  const getDateRange = (filter: string) => {
    const start = new Date(now);
    switch (filter) {
      case 'weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }
    return { start, end: now };
  };

  const { start, end } = getDateRange(timeFilter);
  
  // Filter transactions based on time range
  const filteredTransactions = data.transactions.filter(t => {
    const transDate = new Date(t.date);
    return transDate >= start && transDate <= end;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'payment')
    .reduce((acc, t) => acc + t.amount, 0);

  // Get pending tasks (projects that are in-progress)
  const pendingTasks = data.clients.flatMap(client =>
    client.projects
      .filter(project => project.status === 'in-progress')
      .map(project => ({
        ...project,
        clientName: client.name
      }))
  );

  // Responsive table style
  const tableContainerClass = "overflow-x-auto md:overflow-x-visible";

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
          <p className="text-3xl font-bold text-primary-600">{totalClients}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-600 mb-2">Active Projects</h2>
          <p className="text-3xl font-bold text-green-600">{totalProjects}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingTasks.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-400">No pending tasks</td></tr>
                ) : pendingTasks.map(task => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.clientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(task.endDate).toLocaleDateString()}
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
                {data.clients.flatMap(client => 
                  client.projects.map(project => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 