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
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  FaProjectDiagram,
  FaCheckCircle,
  FaClock,
  FaDollarSign
} from 'react-icons/fa';
import type { Project } from '../../services/dataService';

interface ProjectsTabProps {
  metrics: {
    completedProjects: number;
    inProgressProjects: number;
    totalProjectBudget: number;
    overdueProjects: number;
  };
  filteredData: {
    projects: Project[];
  };
  chartData: {
    projectStatusData: Array<{
      name: string;
      value: number;
    }>;
  };
  COLORS: string[];
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ metrics, filteredData, chartData, COLORS }) => {
  return (
    <div className="space-y-6">
      {/* Project Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">
                {filteredData.projects.length}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                All projects
              </p>
            </div>
            <div className="p-2 md:p-3 bg-blue-100 rounded-full">
              <FaProjectDiagram className="text-blue-600 text-lg md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                {metrics.completedProjects}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Successfully delivered
              </p>
            </div>
            <div className="p-2 md:p-3 bg-green-100 rounded-full">
              <FaCheckCircle className="text-green-600 text-lg md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-xl md:text-2xl font-bold text-orange-600">
                {metrics.inProgressProjects}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Active projects
              </p>
            </div>
            <div className="p-2 md:p-3 bg-orange-100 rounded-full">
              <FaClock className="text-orange-600 text-lg md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-xl md:text-2xl font-bold text-purple-600">
                ${metrics.totalProjectBudget.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                All projects
              </p>
            </div>
            <div className="p-2 md:p-3 bg-purple-100 rounded-full">
              <FaDollarSign className="text-purple-600 text-lg md:text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Project Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
          <div className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, 'Projects']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Budget Distribution</h3>
          <div className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData.projects.map(project => ({
                name: project.title,
                budget: project.budget || 0
              })).sort((a, b) => b.budget - a.budget).slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Budget']}
                />
                <Bar dataKey="budget" fill="#8884d8" name="Budget" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {project.title}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {project.client_name || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    ${(project.budget || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {project.start_date || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {project.end_date || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
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

export default ProjectsTab; 