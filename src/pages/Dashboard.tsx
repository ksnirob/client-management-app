import React from 'react';
import data from '../data/db.json';

const Dashboard = () => {
  const totalClients = data.clients.length;
  const totalProjects = data.clients.reduce((acc, client) => acc + client.projects.length, 0);
  const totalIncome = data.transactions
    .filter(t => t.type === 'payment')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      
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
          <h2 className="text-lg font-medium text-gray-600 mb-2">Total Income</h2>
          <p className="text-3xl font-bold text-purple-600">${totalIncome.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Projects</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
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
  );
};

export default Dashboard; 