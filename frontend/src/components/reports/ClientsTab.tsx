import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  FaUsers,
  FaProjectDiagram,
  FaDollarSign,
  FaChartBar
} from 'react-icons/fa';
import type { Client, Project } from '../../services/dataService';

interface ClientProjectChartPoint {
  name: string;
  value: number;
  projects: number;
}

interface ClientsTabProps {
  metrics: {
    totalClients: number;
    activeProjects: number;
    totalIncome: number;
  };
  filteredData: {
    clients: Client[];
    projects: Project[];
  };
  chartData: {
    clientProjectData: ClientProjectChartPoint[];
  };
  COLORS: string[];
}

const ClientsTab: React.FC<ClientsTabProps> = ({ metrics, filteredData, chartData, COLORS }) => {
  return (
    <div className="space-y-6">
      {/* Client Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">
                {metrics.totalClients}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Active accounts
              </p>
            </div>
            <div className="p-2 md:p-3 bg-blue-100 rounded-full">
              <FaUsers className="text-blue-600 text-lg md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                {metrics.activeProjects}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                In progress
              </p>
            </div>
            <div className="p-2 md:p-3 bg-green-100 rounded-full">
              <FaProjectDiagram className="text-green-600 text-lg md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-purple-600">
                ${metrics.totalIncome.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                From all clients
              </p>
            </div>
            <div className="p-2 md:p-3 bg-purple-100 rounded-full">
              <FaDollarSign className="text-purple-600 text-lg md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Projects</p>
              <p className="text-xl md:text-2xl font-bold text-orange-600">
                {metrics.totalClients > 0 ? (filteredData.projects.length / metrics.totalClients).toFixed(1) : '0'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Per client
              </p>
            </div>
            <div className="p-2 md:p-3 bg-orange-100 rounded-full">
              <FaChartBar className="text-orange-600 text-lg md:text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Client Projects Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients by Projects</h3>
          <div className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.clientProjectData} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip 
                  contentStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [value, 'Projects']}
                />
                <Bar dataKey="value" fill="#8884d8" name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Distribution</h3>
          <div className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.clientProjectData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.clientProjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, 'Projects']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.company_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {client.contact_person || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {client.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {(client.projects || []).length} projects
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientsTab; 