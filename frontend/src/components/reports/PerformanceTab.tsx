import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import type { Project, Task } from '../../services/dataService';
import type { Transaction } from '../../services/financeService';

interface PerformanceTabProps {
  projects: Project[];
  tasks: Task[];
  transactions: Transaction[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface PerformanceData {
  date: string;
  completedTasks: number;
  activeProjects: number;
  revenue: number;
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({
  projects = [],
  tasks = [],
  transactions = [],
  dateRange = {
    start: new Date(),
    end: new Date()
  }
}) => {
  // Calculate performance metrics
  const calculatePerformanceData = () => {
    if (!dateRange?.start || !dateRange?.end) {
      return [];
    }
    
    const performanceData: PerformanceData[] = [];
    let currentDate = new Date(dateRange.start);
    
    while (currentDate <= dateRange.end) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      // Calculate metrics for this date
      const dayTasks = tasks.filter(task => 
        task.created_at?.startsWith(dateStr)
      );
      
      const completedTasks = dayTasks.filter(task => 
        task.status === 'completed'
      ).length;
      
      const dayProjects = projects.filter(project => 
        project.created_at.startsWith(dateStr)
      ).length;
      
      const dayTransactions = transactions.filter(transaction => 
        transaction.date.startsWith(dateStr)
      );
      
      const revenue = dayTransactions
        .filter(t => t.type === 'invoice')
        .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : (t.amount || 0)), 0);
      
      performanceData.push({
        date: dateStr,
        completedTasks,
        activeProjects: dayProjects,
        revenue: Math.round(revenue * 100) / 100
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return performanceData;
  };

  const performanceData = calculatePerformanceData();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="completedTasks"
                name="Completed Tasks"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="activeProjects"
                name="Active Projects"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Revenue Performance</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                name="Daily Revenue"
                fill="#ffc658"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Completed Tasks</h3>
          <p className="text-3xl font-bold text-blue-600">
            {performanceData.reduce((sum, day) => sum + day.completedTasks, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
          <p className="text-3xl font-bold text-green-600">
            {projects.filter(p => p.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-yellow-600">
            ${performanceData.reduce((sum, day) => sum + day.revenue, 0).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTab; 