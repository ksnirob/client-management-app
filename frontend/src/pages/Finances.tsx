import React, { useState, useEffect } from 'react';
import { FaFileInvoice, FaMoneyBillWave, FaChartLine, FaFilter, FaPlus, FaDollarSign, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaCalendarAlt, FaProjectDiagram, FaCreditCard, FaReceipt, FaTrash, FaEdit, FaArrowUp, FaArrowDown, FaClock, FaEye } from 'react-icons/fa';
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
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'payment':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'expense':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FaFileInvoice className="w-3 h-3" />;
      case 'payment':
        return <FaCreditCard className="w-3 h-3" />;
      case 'expense':
        return <FaReceipt className="w-3 h-3" />;
      default:
        return <FaDollarSign className="w-3 h-3" />;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-600 mx-auto mb-6"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-emerald-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading Financial Data</div>
          <div className="text-sm text-gray-500">Calculating your finances...</div>
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
            <div className="text-xl font-semibold text-gray-800 mb-4">Financial Data Error</div>
            <div className="text-gray-600 mb-6">{error}</div>
            <button
              onClick={() => window.location.reload()}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-green-800 bg-clip-text text-transparent">
                Finances
              </h1>
              <p className="text-lg text-gray-600">Monitor your financial performance and transactions</p>
            </div>
            <div className="flex items-center gap-4">
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
                className={`flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
                  showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''
                }`}
              >
                <FaFilter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={() => setShowNewTransactionModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <FaPlus className="w-4 h-4" />
                New Transaction
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                  <FaFilter className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Filter Transactions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-all duration-200"
                  >
                    <option value="all">All Transactions</option>
                    <option value="invoice">Invoices</option>
                    <option value="payment">Payments</option>
                    <option value="expense">Expenses</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Transaction Modal */}
          {showNewTransactionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                      <FaPlus className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">New Transaction</h2>
                  </div>
                </div>
                <form onSubmit={handleCreateTransaction} className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                      <select
                        value={newTransaction.type}
                        onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-all duration-200"
                        required
                      >
                        <option value="invoice">Invoice</option>
                        <option value="payment">Payment</option>
                        <option value="expense">Expense</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Project *</label>
                      <select
                        value={newTransaction.project_id}
                        onChange={(e) => setNewTransaction({...newTransaction, project_id: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-all duration-200"
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Amount ({currentCurrency === 'USD' ? '$' : '৳'})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-all duration-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <textarea
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-all duration-200"
                        rows={3}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowNewTransactionModal(false)}
                      className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Create Transaction
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                    <FaArrowUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">{formatCurrency(summary.totalIncome)}</p>
                    <p className="text-sm text-gray-500">Net Income</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">Gross: {formatCurrency(summary.grossIncome)}</div>
                  <div className="text-xs text-gray-600">Expenses: {formatCurrency(summary.totalExpenses)}</div>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <FaArrowDown className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
                    <p className="text-sm text-gray-500">Total Expenses</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaChartLine className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600 font-medium">Monthly: {formatCurrency(summary.monthlyRevenue)}</span>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                    <FaClock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-amber-600">{summary.pendingInvoices.count}</p>
                    <p className="text-sm text-gray-500">Pending Invoices</p>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Total Value: </span>
                  <span className="text-amber-600 font-semibold">{formatCurrency(summary.pendingInvoices.total)}</span>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-10 transform translate-x-8 -translate-y-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <FaProjectDiagram className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(summary.totalBudgets)}</p>
                    <p className="text-sm text-gray-500">Project Budgets</p>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Active Projects: </span>
                  <span className="text-blue-600 font-semibold">{projects.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                    <FaChartLine className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
                </div>
                <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                  Amounts in {currentCurrency}
                </span>
              </div>
            </div>

            {summary.recentTransactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <FaChartLine className="w-12 h-12 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No transactions yet</h3>
                <p className="text-gray-500 mb-6">Start tracking your finances by creating your first transaction</p>
                <button
                  onClick={() => setShowNewTransactionModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Create First Transaction
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-4 h-4" />
                          Date
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaFileInvoice className="w-4 h-4" />
                          Description
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-end gap-2">
                          <FaDollarSign className="w-4 h-4" />
                          Amount
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {summary.recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200">
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            <FaCalendarAlt className="w-3 h-3 mr-1" />
                            {formatDate(transaction.date)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{transaction.description}</div>
                            {transaction.project_title && (
                              <div className="inline-flex items-center mt-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <FaProjectDiagram className="w-3 h-3 mr-1" />
                                {transaction.project_title}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(transaction.type)}`}>
                            {getTypeIcon(transaction.type)}
                            <span className="ml-1">{transaction.type}</span>
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <select
                            value={transaction.status}
                            onChange={(e) => handleUpdateStatus(transaction.id, e.target.value)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border cursor-pointer transition-all duration-200 ${getStatusColor(transaction.status)}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className={`font-bold text-lg ${
                            transaction.type === 'expense' ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                            title="Delete transaction"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finances; 