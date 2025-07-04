import React, { useState, useEffect } from 'react';
import { FaFileInvoice, FaMoneyBillWave, FaChartLine, FaFilter, FaPlus } from 'react-icons/fa';
import { financeService, Transaction, FinancialSummary, TransactionFilters } from '../services/financeService';
// @ts-ignore
import { projectService } from '../services/projectService';
import CurrencySwitcher, { Currency } from '../components/common/CurrencySwitcher';
import { convertAndFormatCurrency, convertCurrency } from '../utils/currency';

const Finances: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    grossIncome: 0,
    pendingInvoices: { count: 0, total: 0 },
    totalBudgets: 0,
    monthlyRevenue: 0,
    recentTransactions: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'invoice' | 'payment' | 'expense'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [projects, setProjects] = useState<Array<{id: number, title: string}>>([]);
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('USD');
  const [newTransaction, setNewTransaction] = useState({
    type: 'invoice',
    amount: '',
    description: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadFinancialData();
    loadProjects();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filterType, dateRange.start, dateRange.end]);

  const loadFinancialData = async () => {
    try {
      setIsLoading(true);
      const data = await financeService.getFinancialSummary();
      console.log('Received financial data:', data);
      setSummary(data);
      setError(null);
    } catch (err) {
      console.error('Error loading financial data:', err);
      setError('Failed to load financial data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const projectsData = await projectService.getProjects();
      setProjects(projectsData.map(p => ({ id: p.id, title: p.title })));
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const filters: TransactionFilters = {};
      
      // Only add type filter if not 'all'
      if (filterType !== 'all') {
        filters.type = filterType;
      }
      
      // Add date filters if set
      if (dateRange.start) filters.startDate = dateRange.start;
      if (dateRange.end) filters.endDate = dateRange.end;

      console.log('Applying filters:', filters);
      const transactions = await financeService.getTransactions(filters);
      setSummary(prev => ({ ...prev, recentTransactions: transactions }));
      setError(null);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await financeService.updateTransactionStatus(id, newStatus);
      await loadFinancialData(); // Reload all data to get updated summary
    } catch (err) {
      console.error('Error updating transaction status:', err);
      setError('Failed to update transaction status. Please try again.');
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await financeService.deleteTransaction(id);
      await loadFinancialData(); // Reload all data to get updated summary
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError('Failed to delete transaction. Please try again.');
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!newTransaction.project_id) {
        alert('Please select a project');
        return;
      }
      
      // Convert amount to USD (backend expects USD)
      const amountInUSD = convertCurrency(
        parseFloat(newTransaction.amount),
        currentCurrency,
        'USD'
      );
      
      await financeService.createTransaction({
        type: newTransaction.type as any,
        amount: amountInUSD,
        description: newTransaction.description,
        project_id: parseInt(newTransaction.project_id),
        date: newTransaction.date,
        status: 'pending'
      });
      
      // Reset form and close modal
      setNewTransaction({
        type: 'invoice',
        amount: '',
        description: '',
        project_id: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowNewTransactionModal(false);
      
      // Reload data
      await loadFinancialData();
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError('Failed to create transaction. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-100 text-blue-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    // Convert from USD (base currency) to selected currency and format
    return convertAndFormatCurrency(amount, 'USD', currentCurrency);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <CurrencySwitcher 
              currentCurrency={currentCurrency}
              onCurrencyChange={setCurrentCurrency}
            />
            {currentCurrency === 'BDT' && (
              <span className="text-xs text-gray-500 mt-1">
                Rate: 1 USD = 120 BDT
              </span>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md hover:bg-gray-50"
          >
            <FaFilter />
            <span>Filters</span>
          </button>
          <button
            onClick={() => setShowNewTransactionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <FaPlus />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All Transactions</option>
                <option value="invoice">Invoices</option>
                <option value="payment">Payments</option>
                <option value="expense">Expenses</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      )}

      {showNewTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">New Transaction</h2>
            <form onSubmit={handleCreateTransaction}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  >
                    <option value="invoice">Invoice</option>
                    <option value="payment">Payment</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project *</label>
                  <select
                    value={newTransaction.project_id}
                    onChange={(e) => setNewTransaction({...newTransaction, project_id: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount ({currentCurrency === 'USD' ? '$' : '৳'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewTransactionModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaMoneyBillWave className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">Gross Income: {formatCurrency(summary.grossIncome)}</div>
            <div className="text-sm text-gray-600">Total Expenses: {formatCurrency(summary.totalExpenses)}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FaFileInvoice className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">Monthly Revenue</div>
            <div className="flex items-center">
              <FaChartLine className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">{formatCurrency(summary.monthlyRevenue)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.pendingInvoices.count}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FaFileInvoice className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-yellow-600 font-medium">{formatCurrency(summary.pendingInvoices.total)}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Project Budgets</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalBudgets)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaChartLine className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">Active Projects</div>
            <div className="text-blue-600 font-medium">{projects.length} Projects</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
          <span className="text-sm text-gray-500">
            Amounts shown in {currentCurrency}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary.recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{transaction.description}</div>
                    {transaction.project_title && (
                      <div className="text-sm font-medium text-blue-600 mt-1">
                        Project: {transaction.project_title}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(transaction.type)}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={transaction.status}
                      onChange={(e) => handleUpdateStatus(transaction.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)} border-0 cursor-pointer`}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={transaction.type === 'expense' || transaction.type === 'invoice' ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
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

export default Finances; 