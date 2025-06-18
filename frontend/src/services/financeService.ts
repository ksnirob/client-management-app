import { apiService } from './apiService';

export interface Transaction {
  id: number;
  date: string;
  description: string;
  type: 'invoice' | 'payment' | 'expense';
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  project_id?: number;
  project_title?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  grossIncome: number;
  pendingInvoices: {
    count: number;
    total: number;
  };
  totalBudgets: number;
  monthlyRevenue: number;
  recentTransactions: Transaction[];
}

export interface TransactionFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

class FinanceService {
  async getFinancialSummary(): Promise<FinancialSummary> {
    const response = await apiService.get('/finance/summary');
    return response.data as FinancialSummary;
  }

  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
    }
    const response = await apiService.get(`/finance/transactions?${queryParams}`);
    return response.data as Transaction[];
  }

  async getProjectExpenses(projectId: number): Promise<Transaction[]> {
    const response = await apiService.get(`/finance/transactions?project_id=${projectId}`);
    // Filter to only show expenses and invoices
    const transactions = response.data as Transaction[];
    return transactions.filter(t => t.type === 'expense' || t.type === 'invoice');
  }

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const response = await apiService.post('/finance/transactions', transaction);
    return response.data as Transaction;
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const response = await apiService.put(`/finance/transactions/${id}/status`, { status });
    return response.data as Transaction;
  }

  async deleteTransaction(id: number): Promise<void> {
    await apiService.delete(`/finance/transactions/${id}`);
  }
}

export const financeService = new FinanceService(); 