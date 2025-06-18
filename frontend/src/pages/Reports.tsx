// To use export features, install:
// npm install html2canvas jspdf xlsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, parseISO } from 'date-fns';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { 
  FaCalendar, 
  FaDownload, 
  FaFilter, 
  FaChartLine, 
  FaChartBar, 
  FaUsers, 
  FaProjectDiagram,
  FaDollarSign,
  FaSpinner,
  FaSyncAlt as FaRefresh,
  FaArrowUp as FaTrendUp,
  FaArrowDown as FaTrendDown,
  FaEye,
  FaExclamationTriangle,
  FaChevronDown,
  FaFileImage,
  FaFilePdf,
  FaFileExcel,
  FaFileCsv
} from 'react-icons/fa';
import { apiService } from '../services/apiService';
import { financeService, Transaction, FinancialSummary } from '../services/financeService';
import type { Client, Project, Task } from '../services/dataService';
import ClientsTab from '../components/reports/ClientsTab';
import PerformanceTab from '../components/reports/PerformanceTab';
import ProjectsTab from '../components/reports/ProjectsTab';

// Color scheme for charts
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

// Helper function to safely convert values to numbers
const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

interface ReportData {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  transactions: Transaction[];
  financialSummary: FinancialSummary;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  income: number;
  expenses: number;
  projects: number;
}

type TimeFilter = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
type ReportTab = 'overview' | 'revenue' | 'projects' | 'clients' | 'performance';

interface RevenueChartPoint {
  name: string;
  value: number;
  date: string;
  income: number;
  expenses: number;
}

interface ProjectStatusChartPoint {
  name: string;
  value: number;
}

interface ClientProjectChartPoint {
  name: string;
  value: number;
  projects: number;
}

interface MonthlyPerformanceChartPoint {
  name: string;
  income: number;
  expenses: number;
  projects: number;
  value: number;
}

interface ChartData {
  revenueData: RevenueChartPoint[];
  projectStatusData: ProjectStatusChartPoint[];
  clientProjectData: ClientProjectChartPoint[];
  monthlyData: MonthlyPerformanceChartPoint[];
}

const Reports: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Calculate date range based on filter
  const dateRange = useMemo((): DateRange => {
  const now = new Date();
    if (timeFilter === 'custom' && customDateRange.start && customDateRange.end) {
      return {
        start: startOfDay(parseISO(customDateRange.start)),
        end: endOfDay(parseISO(customDateRange.end))
      };
    }

    switch (timeFilter) {
    case 'weekly':
        return { start: subDays(now, 7), end: now };
      case 'quarterly':
        return { start: subMonths(now, 3), end: now };
    case 'yearly':
        return { start: subYears(now, 1), end: now };
      default: // monthly
        return { start: subMonths(now, 1), end: now };
    }
  }, [timeFilter, customDateRange]);

  // Fetch all report data
  const fetchReportData = async () => {
    try {
      setError(null);
      const [clients, projects, tasks, transactions, financialSummary] = await Promise.all([
        apiService.getClients(),
        apiService.getProjects(),
        apiService.getTasks(),
        financeService.getTransactions(),
        financeService.getFinancialSummary()
      ]);

      setReportData({
        clients: clients || [],
        projects: projects || [],
        tasks: tasks || [],
        transactions: transactions || [],
        financialSummary: financialSummary || {
          totalIncome: 0,
          totalExpenses: 0,
          grossIncome: 0,
          pendingInvoices: { count: 0, total: 0 },
          totalBudgets: 0,
          monthlyRevenue: 0,
          recentTransactions: []
        }
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report data');
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchReportData();
      setLoading(false);
    };
    loadData();
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReportData();
    setRefreshing(false);
  };

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!reportData) return null;

    const isInDateRange = (dateStr: string) => {
      const date = new Date(dateStr);
      return date >= dateRange.start && date <= dateRange.end;
    };

    const filteredTransactions = reportData.transactions.filter(t => isInDateRange(t.date));
    const filteredProjects = reportData.projects.filter(p => 
      (p.start_date && isInDateRange(p.start_date)) || 
      (p.end_date && isInDateRange(p.end_date))
    );

    return {
      ...reportData,
      transactions: filteredTransactions,
      projects: filteredProjects
    };
  }, [reportData, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!filteredData || !reportData) return null;

    const { transactions, projects, clients, tasks } = filteredData;

    // Financial metrics - Use ALL transactions for totals, filtered for period-specific
    const allTransactions = reportData.transactions;
    
    // Debug: Log first few transactions to see data structure
    if (allTransactions.length > 0) {
      console.log('Sample transactions:', allTransactions.slice(0, 3).map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        amountType: typeof t.amount,
        status: t.status
      })));
    }
    
    // Calculate period-specific totals from filtered transactions (for time period filtering)
    const transactionIncome = transactions
      .filter(t => t.type === 'payment' && (t.status === 'completed' || t.status === 'pending'))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Add income from completed project budgets (like the backend does)
    const projectIncome = projects
      .filter(p => p.status === 'completed' && p.budget)
      .reduce((sum, p) => sum + Number(p.budget || 0), 0);

    // Add income from completed task budgets (like the backend does)  
    const taskIncome = tasks
      .filter(t => t.status === 'completed' && t.budget)
      .reduce((sum, t) => sum + Number(t.budget || 0), 0);

    const periodIncome = transactionIncome + projectIncome + taskIncome;

    const periodTotalExpenses = transactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
    // Use period-specific data for the main display (respects time filter)
    const totalIncome = periodIncome;
    const totalExpenses = periodTotalExpenses;
    

    
    // All-time data from backend API (for comparison/reference)
    const allTimeIncome = reportData.financialSummary?.totalIncome || 0;
    const allTimeExpenses = reportData.financialSummary?.totalExpenses || 0;
    const grossIncome = reportData.financialSummary?.grossIncome || 0;

    // Pending invoices from ALL pending invoices (not filtered by date) - includes pending projects like backend
    const pendingTransactionInvoices = allTransactions
      .filter(t => t.type === 'invoice' && t.status === 'pending')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    // Add pending project budgets (in_progress projects) like the backend does
    const pendingProjectBudgets = reportData.projects
      .filter(p => p.status !== 'completed' && p.budget)
      .reduce((sum, p) => sum + Number(p.budget || 0), 0);
    
    // Total pending invoices = pending transaction invoices + pending project budgets
    const pendingInvoices = pendingTransactionInvoices + pendingProjectBudgets;

    // Period-specific revenue (filtered by date range)
    const periodRevenue = transactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Period-specific expenses (filtered by date range)
    const periodExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalInvoices = allTransactions
      .filter(t => t.type === 'invoice')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Project metrics
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
    const totalProjectBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    
    // Calculate net profit using backend data
    const netProfit = totalIncome - totalExpenses;

    // Task metrics
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status !== 'completed').length;

    // Trends (comparing with previous period)
    const previousPeriodStart = new Date(dateRange.start);
    const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);

    const previousTransactions = reportData?.transactions.filter(t => {
      const date = new Date(t.date);
      return date >= previousPeriodStart && date < dateRange.start;
    }) || [];

    const previousRevenue = previousTransactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const revenueGrowth = previousRevenue > 0 ? 
      ((periodRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      // Total metrics (all time)
      totalIncome,
      totalExpenses,
      totalInvoices,
      pendingInvoices,
      netProfit,
      
      // Period-specific metrics (filtered by date range)
      totalRevenue: periodRevenue, // Keep this for period-specific revenue
      periodExpenses,
      periodNetProfit: periodRevenue - periodExpenses,
      
      // Project metrics
      completedProjects,
      inProgressProjects,
      totalProjectBudget,
      
      // Task metrics
      completedTasks,
      pendingTasks,
      
      // Client metrics
      totalClients: clients.length,
      
      // Growth metrics
      revenueGrowth,
      
      // Status metrics
      activeProjects: projects.filter(p => p.status !== 'completed').length,
      overdueProjects: projects.filter(p => {
        return p.end_date && new Date(p.end_date) < new Date() && p.status !== 'completed';
      }).length
    };
  }, [filteredData, dateRange, reportData]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!filteredData || !metrics) return null;

    // Revenue trend data (daily/weekly/monthly based on time filter)
    const revenueData: RevenueChartPoint[] = [];
    const groupBy = timeFilter === 'weekly' ? 'day' : timeFilter === 'yearly' ? 'month' : 'day';
    
    // Group transactions by time period
    const transactionGroups = new Map<string, { income: number; expenses: number; date: string }>();
    
    filteredData.transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key: string;
      
      if (groupBy === 'month') {
        key = format(date, 'yyyy-MM');
      } else {
        key = format(date, 'yyyy-MM-dd');
      }
      
      if (!transactionGroups.has(key)) {
        transactionGroups.set(key, { income: 0, expenses: 0, date: key });
      }
      
      const group = transactionGroups.get(key)!;
      if (transaction.type === 'payment' && transaction.status === 'completed') {
        group.income += Number(transaction.amount || 0);
      } else if (transaction.type === 'expense') {
        group.expenses += Number(transaction.amount || 0);
      }
    });

    transactionGroups.forEach(group => {
      revenueData.push({
        name: format(new Date(group.date), groupBy === 'month' ? 'MMM yyyy' : 'MMM dd'),
        date: group.date,
        income: group.income,
        expenses: group.expenses,
        value: group.income - group.expenses
      });
    });

    // Project status distribution
    const projectStatusData: ProjectStatusChartPoint[] = [
      { name: 'Completed', value: metrics.completedProjects },
      { name: 'In Progress', value: metrics.inProgressProjects },
      { name: 'Not Started', value: filteredData.projects.filter(p => p.status === 'not_started').length }
    ].filter(item => item.value > 0);

    // Client project distribution
    const clientProjectData: ClientProjectChartPoint[] = filteredData.clients
      .map(client => ({
        name: client.company_name || 'Unknown',
        value: (client.projects || []).length,
        projects: (client.projects || []).length
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 clients

    // Monthly overview for performance tab
    const monthlyData: MonthlyPerformanceChartPoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'yyyy-MM');
      const monthTransactions = reportData?.transactions.filter(t => 
        t.date.startsWith(monthKey)
      ) || [];
      
      const monthRevenue = monthTransactions
        .filter(t => t.type === 'payment' && t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const monthProjects = reportData?.projects.filter(p => 
        (p.start_date && p.start_date.startsWith(monthKey)) ||
        (p.end_date && p.end_date.startsWith(monthKey))
      ).length || 0;

      monthlyData.push({
        name: format(date, 'MMM yyyy'),
        income: monthRevenue,
        expenses: monthExpenses,
        projects: monthProjects,
        value: monthRevenue - monthExpenses
      });
    }

    return {
      revenueData: revenueData.sort((a, b) => a.date.localeCompare(b.date)),
      projectStatusData,
      clientProjectData,
      monthlyData
    } as ChartData;
  }, [filteredData, metrics, timeFilter, reportData]);

  // Export functions
  const handleExportPNG = async () => {
    if (reportRef.current) {
      try {
        // Create a temporary element with better styling for export
        const exportElement = reportRef.current.cloneNode(true) as HTMLElement;
        exportElement.style.backgroundColor = '#ffffff';
        exportElement.style.padding = '40px';
        exportElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        exportElement.style.color = '#1f2937';
        
        // Append to body temporarily
        document.body.appendChild(exportElement);
        
        const canvas = await html2canvas(exportElement, {
          backgroundColor: '#ffffff',
          scale: 2, // Higher resolution
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: exportElement.scrollWidth,
          height: exportElement.scrollHeight
        });
        
        // Remove temporary element
        document.body.removeChild(exportElement);
        
      const link = document.createElement('a');
        link.download = `${activeTab}-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      } catch (error) {
        console.error('Export PNG failed:', error);
        alert('Export failed. Please try again.');
      }
    }
  };

  const handleExportPDF = async () => {
    if (reportRef.current) {
      try {
        // Create a temporary element with better styling for export
        const exportElement = reportRef.current.cloneNode(true) as HTMLElement;
        exportElement.style.backgroundColor = '#ffffff';
        exportElement.style.padding = '30px';
        exportElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        exportElement.style.color = '#1f2937';
        
        // Append to body temporarily
        document.body.appendChild(exportElement);
        
        const canvas = await html2canvas(exportElement, {
          backgroundColor: '#ffffff',
          scale: 1.5, // Good balance between quality and file size
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: exportElement.scrollWidth,
          height: exportElement.scrollHeight
        });
        
        // Remove temporary element
        document.body.removeChild(exportElement);
        
        const imgData = canvas.toDataURL('image/png', 0.95);
        const pdf = new jsPDF({ 
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
          compress: true
        });
        
        // Add header
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`, 20, 20);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy - HH:mm')}`, 20, 30);
        pdf.text(`Period: ${format(dateRange.start, 'MMM dd, yyyy')} to ${format(dateRange.end, 'MMM dd, yyyy')}`, 20, 35);
        
        // Calculate image dimensions to fit page
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add image
        if (imgHeight > pageHeight - 60) {
          // If image is too tall, scale it down
          const scaledHeight = pageHeight - 60;
          const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
          pdf.addImage(imgData, 'PNG', 20, 45, scaledWidth, scaledHeight);
        } else {
          pdf.addImage(imgData, 'PNG', 20, 45, imgWidth, imgHeight);
        }
        
        // Add footer
        pdf.setFontSize(8);
        pdf.text('Client Management System - Business Analytics Report', 20, pageHeight - 10);
        
        pdf.save(`${activeTab}-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
      } catch (error) {
        console.error('Export PDF failed:', error);
        alert('Export failed. Please try again.');
      }
    }
  };

  const handleExportExcel = () => {
    if (!filteredData || !metrics) return;

    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet with key metrics
      const summaryData = [
        ['Client Management System - Business Report'],
        [''],
        ['Report Type:', activeTab.charAt(0).toUpperCase() + activeTab.slice(1)],
        ['Generated:', format(new Date(), 'MMMM dd, yyyy - HH:mm')],
        ['Period:', `${format(dateRange.start, 'MMM dd, yyyy')} to ${format(dateRange.end, 'MMM dd, yyyy')}`],
        [''],
        ['KEY METRICS'],
        ['Total Income', `$${metrics.totalIncome.toLocaleString()}`],
        ['Total Expenses', `$${metrics.totalExpenses.toLocaleString()}`],
        ['Net Profit', `$${metrics.netProfit.toLocaleString()}`],
        ['Pending Invoices', `$${metrics.pendingInvoices.toLocaleString()}`],
        ['Total Clients', metrics.totalClients],
        ['Active Projects', metrics.activeProjects],
        ['Completed Projects', metrics.completedProjects],
        ['Revenue Growth', `${metrics.revenueGrowth.toFixed(1)}%`],
        ['Profit Margin', `${metrics.totalIncome > 0 ? ((metrics.netProfit / metrics.totalIncome) * 100).toFixed(1) : 0}%`],
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Style the summary sheet
      summaryWs['A1'] = { t: 's', v: 'Client Management System - Business Report', s: { font: { bold: true, sz: 16 } } };
      
      XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');

      // Tab-specific detailed data
      let detailData: any[][] = [];
      let sheetName = '';

      switch (activeTab) {
        case 'revenue':
          sheetName = 'Financial Transactions';
          detailData = [
            ['Date', 'Type', 'Description', 'Amount', 'Status', 'Project'],
            ...filteredData.transactions.map(t => [
              format(new Date(t.date), 'yyyy-MM-dd'),
              t.type,
              t.description,
              Number(t.amount || 0),
              t.status,
              t.project_title || ''
            ])
          ];
          
          // Add financial summary
          const financialSummary = [
            [''],
            ['FINANCIAL SUMMARY'],
            ['Income by Project'],
            ...(() => {
              const incomeByProject = new Map();
              reportData?.transactions
                .filter(t => t.type === 'payment' && t.status === 'completed')
                .forEach(t => {
                  const key = t.project_title || 'Unknown Project';
                  incomeByProject.set(key, (incomeByProject.get(key) || 0) + Number(t.amount || 0));
                });
              
              return Array.from(incomeByProject.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([project, amount]) => [project, Number(amount)]);
            })(),
            [''],
            ['Expenses by Project'],
            ...(() => {
              const expenseByProject = new Map();
              reportData?.transactions
                .filter(t => t.type === 'expense')
                .forEach(t => {
                  const key = t.project_title || 'General Expenses';
                  expenseByProject.set(key, (expenseByProject.get(key) || 0) + Number(t.amount || 0));
                });
              
              return Array.from(expenseByProject.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([project, amount]) => [project, Number(amount)]);
            })()
          ];
          
          detailData = [...detailData, ...financialSummary];
          break;

        case 'projects':
          sheetName = 'Project Details';
          detailData = [
            ['ID', 'Title', 'Client', 'Status', 'Start Date', 'End Date', 'Budget', 'Completion %'],
            ...filteredData.projects.map(p => [
              p.id,
              p.title,
              p.client_name || p.client_id,
              p.status,
              p.start_date || '',
              p.end_date || '',
              Number(p.budget || 0),
              p.status === 'completed' ? 100 : p.status === 'in_progress' ? 50 : 0
            ])
          ];
          break;

        case 'clients':
          sheetName = 'Client Analysis';
          detailData = [
            ['ID', 'Company Name', 'Contact Person', 'Email', 'Phone', 'Status', 'Projects Count', 'Total Revenue'],
            ...filteredData.clients.map(c => [
              c.id,
              c.company_name,
              c.contact_person || '',
              c.email,
              c.phone || '',
              c.status,
              (c.projects || []).length,
              // Calculate total revenue for this client by finding projects and their payments
              (() => {
                const clientProjects = reportData?.projects.filter(p => p.client_id === c.id) || [];
                const clientProjectIds = clientProjects.map(p => p.id);
                return reportData?.transactions
                  .filter(t => t.type === 'payment' && t.status === 'completed' && t.project_id && clientProjectIds.includes(t.project_id))
                  .reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;
              })()
            ])
          ];
          break;

        case 'performance':
          sheetName = 'Performance Metrics';
          detailData = [
            ['Metric', 'Value', 'Unit'],
            ['Completion Rate', filteredData.projects.length > 0 ? ((metrics.completedProjects / filteredData.projects.length) * 100).toFixed(1) : 0, '%'],
            ['Revenue Growth', metrics.revenueGrowth.toFixed(1), '%'],
            ['Profit Margin', metrics.totalIncome > 0 ? ((metrics.netProfit / metrics.totalIncome) * 100).toFixed(1) : 0, '%'],
            ['Avg Revenue per Client', metrics.totalClients > 0 ? (metrics.totalIncome / metrics.totalClients).toFixed(2) : 0, '$'],
            ['Avg Project Value', filteredData.projects.length > 0 ? (metrics.totalProjectBudget / filteredData.projects.length).toFixed(2) : 0, '$'],
            ['Projects per Client', metrics.totalClients > 0 ? (filteredData.projects.length / metrics.totalClients).toFixed(1) : 0, 'projects'],
            [''],
            ['Monthly Performance'],
            ['Month', 'Income', 'Expenses', 'Net Profit', 'Projects'],
            ...chartData?.monthlyData.map(m => [
              m.name,
              Number(m.income || 0),
              Number(m.expenses || 0),
              Number(m.value || 0),
              Number(m.projects || 0)
            ]) || []
          ];
          break;

        default:
          sheetName = 'Overview Data';
          detailData = [
            ['Metric', 'Value'],
            ['Total Income', `$${metrics.totalIncome.toLocaleString()}`],
            ['Total Expenses', `$${metrics.totalExpenses.toLocaleString()}`],
            ['Net Profit', `$${metrics.netProfit.toLocaleString()}`],
            ['Total Clients', metrics.totalClients],
            ['Active Projects', metrics.activeProjects],
            ['Completed Projects', metrics.completedProjects],
            ['Pending Invoices', `$${metrics.pendingInvoices.toLocaleString()}`]
          ];
      }

      if (detailData.length > 0) {
        const detailWs = XLSX.utils.aoa_to_sheet(detailData);
        XLSX.utils.book_append_sheet(workbook, detailWs, sheetName);
      }

      const fileName = `${activeTab}-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Export Excel failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleExportCSV = () => {
    if (!filteredData || !metrics) return;

    try {
      let csvData: any[][] = [];
      const fileName = `${activeTab}-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;

      // Add header information
      csvData.push(['Client Management System - Business Report']);
      csvData.push([`Report Type: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`]);
      csvData.push([`Generated: ${format(new Date(), 'MMMM dd, yyyy - HH:mm')}`]);
      csvData.push([`Period: ${format(dateRange.start, 'MMM dd, yyyy')} to ${format(dateRange.end, 'MMM dd, yyyy')}`]);
      csvData.push(['']);

      // Add key metrics
      csvData.push(['KEY METRICS']);
      csvData.push(['Total Income', `$${metrics.totalIncome.toLocaleString()}`]);
      csvData.push(['Total Expenses', `$${metrics.totalExpenses.toLocaleString()}`]);
      csvData.push(['Net Profit', `$${metrics.netProfit.toLocaleString()}`]);
      csvData.push(['Pending Invoices', `$${metrics.pendingInvoices.toLocaleString()}`]);
      csvData.push(['Revenue Growth', `${metrics.revenueGrowth.toFixed(1)}%`]);
      csvData.push(['']);

      // Add tab-specific data
      switch (activeTab) {
        case 'revenue':
          csvData.push(['TRANSACTIONS']);
          csvData.push(['Date', 'Type', 'Description', 'Amount', 'Status', 'Project']);
          csvData.push(...filteredData.transactions.map(t => [
            format(new Date(t.date), 'yyyy-MM-dd'),
            t.type,
            t.description,
            `$${Number(t.amount || 0).toLocaleString()}`,
            t.status,
            t.project_title || ''
          ]));
          break;

        case 'projects':
          csvData.push(['PROJECTS']);
          csvData.push(['ID', 'Title', 'Client', 'Status', 'Start Date', 'End Date', 'Budget']);
          csvData.push(...filteredData.projects.map(p => [
            p.id,
            p.title,
            p.client_name || p.client_id,
            p.status,
            p.start_date || '',
            p.end_date || '',
            `$${Number(p.budget || 0).toLocaleString()}`
          ]));
          break;

        case 'clients':
          csvData.push(['CLIENTS']);
          csvData.push(['ID', 'Company Name', 'Contact Person', 'Email', 'Phone', 'Status', 'Projects Count']);
          csvData.push(...filteredData.clients.map(c => [
            c.id,
            c.company_name,
            c.contact_person || '',
            c.email,
            c.phone || '',
            c.status,
            (c.projects || []).length
          ]));
          break;

        case 'performance':
          csvData.push(['PERFORMANCE METRICS']);
          csvData.push(['Metric', 'Value']);
          csvData.push(['Completion Rate', `${filteredData.projects.length > 0 ? ((metrics.completedProjects / filteredData.projects.length) * 100).toFixed(1) : 0}%`]);
          csvData.push(['Revenue Growth', `${metrics.revenueGrowth.toFixed(1)}%`]);
          csvData.push(['Profit Margin', `${metrics.totalIncome > 0 ? ((metrics.netProfit / metrics.totalIncome) * 100).toFixed(1) : 0}%`]);
          break;

        default:
          csvData.push(['OVERVIEW DATA']);
          csvData.push(['Metric', 'Value']);
          csvData.push(['Total Clients', metrics.totalClients]);
          csvData.push(['Active Projects', metrics.activeProjects]);
          csvData.push(['Completed Projects', metrics.completedProjects]);
      }

      // Convert to CSV format
      const csv = csvData.map(row => 
        row.map(cell => {
          const stringCell = String(cell || '');
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
            return `"${stringCell.replace(/"/g, '""')}"`;
          }
          return stringCell;
        }).join(',')
      ).join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for proper Excel encoding
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
      link.download = fileName;
    link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Export CSV failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Add click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.export-dropdown')) {
        setIsExportOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Loading state
  if (loading) {
  return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <div className="text-xl text-gray-600">Loading reports...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-red-600 mx-auto mb-4" />
          <div className="text-xl text-red-600 mb-4">{error}</div>
        <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center gap-2 mx-auto"
        >
            <FaRefresh /> Try Again
        </button>
        </div>
      </div>
    );
  }

  if (!reportData || !filteredData || !metrics || !chartData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <div className="text-xl text-gray-600">Processing data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your business performance
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
        <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
            <FaRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
        </button>
          
          {/* Export Dropdown */}
          <div className="relative export-dropdown">
        <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
              <FaDownload className="w-4 h-4" />
              Export
              <FaChevronDown className={`w-3 h-3 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
        </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
        <button
                  onClick={() => {
                    handleExportPNG();
                    setIsExportOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
                  <FaFileImage className="w-4 h-4 text-blue-600" />
                  Export as PNG
        </button>
        <button
                  onClick={() => {
                    handleExportPDF();
                    setIsExportOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
                  <FaFilePdf className="w-4 h-4 text-red-600" />
                  Export as PDF
        </button>
        <button
                  onClick={() => {
                    handleExportExcel();
                    setIsExportOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FaFileExcel className="w-4 h-4 text-green-600" />
                  Export as Excel
                </button>
                <button
                  onClick={() => {
                    handleExportCSV();
                    setIsExportOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
                  <FaFileCsv className="w-4 h-4 text-yellow-600" />
                  Export as CSV
            </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <nav className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: FaChartLine },
            { id: 'revenue', label: 'Revenue', icon: FaDollarSign },
            { id: 'projects', label: 'Projects', icon: FaProjectDiagram },
            { id: 'clients', label: 'Clients', icon: FaUsers },
            { id: 'performance', label: 'Performance', icon: FaChartBar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
        </button>
          ))}
      </nav>
      </div>

      {/* Time Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FaCalendar className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Time Period:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'weekly', label: 'Last 7 Days' },
              { id: 'monthly', label: 'Last 30 Days' },
              { id: 'quarterly', label: 'Last 3 Months' },
              { id: 'yearly', label: 'Last Year' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => {
                  setTimeFilter(filter.id as TimeFilter);
                  setCustomDateRange({ start: '', end: '' });
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  timeFilter === filter.id 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600">Custom:</span>
          <input
            type="date"
              value={customDateRange.start}
              onChange={(e) => {
                setCustomDateRange(prev => ({ ...prev, start: e.target.value }));
                if (e.target.value && customDateRange.end) {
                  setTimeFilter('custom');
                }
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">to</span>
          <input
            type="date"
              value={customDateRange.end}
              onChange={(e) => {
                setCustomDateRange(prev => ({ ...prev, end: e.target.value }));
                if (customDateRange.start && e.target.value) {
                  setTimeFilter('custom');
                }
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          Showing data from {format(dateRange.start, 'MMM dd, yyyy')} to {format(dateRange.end, 'MMM dd, yyyy')}
      </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Gross Income</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
                      ${metrics.totalIncome.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Growth:</span>
                      <div className="flex items-center">
                        {metrics.revenueGrowth >= 0 ? (
                          <FaTrendUp className="text-green-500 mr-1 w-3 h-3" />
                        ) : (
                          <FaTrendDown className="text-red-500 mr-1 w-3 h-3" />
                        )}
                        <span className={`text-xs font-medium ${metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(metrics.revenueGrowth).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full ml-4">
                    <FaDollarSign className="text-green-600 text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex items-center justify-between">
          <div>
                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                    <p className="text-xl md:text-2xl font-bold text-red-600">
                      ${metrics.totalExpenses.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Net: ${metrics.netProfit.toLocaleString()}
                    </p>
            </div>
                  <div className="p-2 md:p-3 bg-red-100 rounded-full">
                    <FaChartLine className="text-red-600 text-lg md:text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
                    <p className="text-xl md:text-2xl font-bold text-orange-600">
                      ${metrics.pendingInvoices.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Awaiting payment
                    </p>
                  </div>
                  <div className="p-2 md:p-3 bg-orange-100 rounded-full">
                    <FaProjectDiagram className="text-orange-600 text-lg md:text-xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex items-center justify-between">
          <div>
                    <p className="text-sm font-medium text-gray-600">Active Projects</p>
                    <p className="text-xl md:text-2xl font-bold text-purple-600">
                      {metrics.activeProjects}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {metrics.overdueProjects} overdue
                    </p>
                  </div>
                  <div className="p-2 md:p-3 bg-purple-100 rounded-full">
                    <FaUsers className="text-purple-600 text-lg md:text-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                <div className="h-[300px] md:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.revenueData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ fontSize: '12px' }}
                        formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                      />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                        stroke="#82ca9d"
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
              </div>

              {/* Project Status Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h3>
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
                </div>

            {/* Client Projects Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 overflow-hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients by Projects</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {chartData.clientProjectData.map((client, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{client.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{client.projects}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-2 w-full bg-gray-200 rounded">
                              <div 
                                className="h-2 bg-primary-600 rounded" 
                                style={{ width: `${(client.projects || 0) / Math.max(...chartData.clientProjectData.map(c => c.projects || 0)) * 100}%` }}
                              />
          </div>
            </div>
                        </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </div>
          </>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {/* Revenue Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Revenue cards */}
            </div>

            {/* Revenue Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
                <div className="h-[300px] md:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ fontSize: '12px' }}
                        formatter={(value: any) => [`$${Number(value).toLocaleString()}`]}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#82ca9d" />
                      <Bar dataKey="expenses" name="Expenses" fill="#ff7782" />
                      <Line type="monotone" dataKey="value" name="Net" stroke="#8884d8" />
                    </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

              {/* Other revenue charts */}
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 overflow-hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  {/* Table content */}
            </table>
          </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <ProjectsTab 
            metrics={metrics}
            filteredData={filteredData}
            chartData={chartData}
            COLORS={COLORS}
          />
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <ClientsTab 
            metrics={metrics}
            filteredData={filteredData}
            chartData={chartData}
            COLORS={COLORS}
          />
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <PerformanceTab 
            projects={filteredData.projects}
            tasks={filteredData.tasks}
            transactions={filteredData.transactions}
            dateRange={dateRange}
          />
        )}
      </div>
    </div>
  );
};

export default Reports; 