const db = require('../config/db.config');

exports.getSummary = async (req, res) => {
  try {
    console.log('Getting financial summary...');
    
    // Get total income from payments (completed and pending) and completed budgets
    const [incomeResult] = await db.execute(`
      SELECT (
        (SELECT COALESCE(SUM(amount), 0) FROM transactions 
         WHERE type = 'payment' AND status IN ('completed', 'pending'))
        +
        (SELECT COALESCE(SUM(budget), 0) FROM projects 
         WHERE status = 'completed')
        +
        (SELECT COALESCE(SUM(budget), 0) FROM tasks 
         WHERE status = 'completed')
      ) as total_income
    `);
    
    console.log('Income result:', incomeResult[0]);

    // Get total expenses from invoices and other expense types
    const [expenseResult] = await db.execute(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM transactions 
      WHERE (type = 'invoice' OR type = 'expense') AND status = 'completed'
    `);
    
    console.log('Expense result:', expenseResult[0]);

    // Calculate net income (income - expenses) with proper fallbacks
    const totalIncome = Number(incomeResult[0]?.total_income || 0);
    const totalExpenses = Number(expenseResult[0]?.total_expenses || 0);
    const netIncome = totalIncome - totalExpenses;
    
    console.log('Calculated values:', { totalIncome, totalExpenses, netIncome });

    // Get pending invoices (including active project and task budgets)
    const [pendingInvoices] = await db.execute(`
      SELECT 
        (
          (SELECT COUNT(*) FROM projects WHERE status != 'completed') +
          (SELECT COUNT(*) FROM tasks WHERE status != 'completed') +
          (SELECT COUNT(*) FROM transactions WHERE status = 'pending')
        ) as count,
        (
          (SELECT COALESCE(SUM(budget), 0) FROM projects WHERE status != 'completed') +
          (SELECT COALESCE(SUM(budget), 0) FROM tasks WHERE status != 'completed') +
          (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'pending')
        ) as total
    `);

    // Get total project and task budgets
    const [totalBudgets] = await db.execute(`
      SELECT (
        (SELECT COALESCE(SUM(budget), 0) FROM projects) +
        (SELECT COALESCE(SUM(budget), 0) FROM tasks)
      ) as total_budgets
    `);

    // Get monthly revenue (net income for current month)
    const [monthlyRevenue] = await db.execute(`
      SELECT (
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE type = 'payment' AND status IN ('completed', 'pending') AND MONTH(date) = MONTH(CURRENT_DATE))
        +
        (SELECT COALESCE(SUM(budget), 0) FROM projects
         WHERE status = 'completed' AND MONTH(updated_at) = MONTH(CURRENT_DATE))
        +
        (SELECT COALESCE(SUM(budget), 0) FROM tasks
         WHERE status = 'completed' AND MONTH(updated_at) = MONTH(CURRENT_DATE))
        -
        (SELECT COALESCE(SUM(amount), 0) FROM transactions
         WHERE (type = 'invoice' OR type = 'expense') AND status = 'completed' AND MONTH(date) = MONTH(CURRENT_DATE))
      ) as monthly_revenue
    `);

    // Get recent transactions - include actual transactions, projects and tasks
    const [recentTransactions] = await db.execute(`
      (SELECT 
        t.id, 
        t.type, 
        t.amount, 
        t.description,
        t.project_id, 
        t.status, 
        t.date,
        p.title as project_title
      FROM transactions t
      LEFT JOIN projects p ON t.project_id = p.id
      ORDER BY t.date DESC
      LIMIT 5)
      
      UNION ALL
      
      (SELECT 
        p.id, 
        'payment' as type, 
        p.budget as amount, 
        CONCAT('Project: ', p.title) as description,
        p.id as project_id, 
        p.status, 
        p.updated_at as date,
        p.title as project_title
      FROM projects p
      WHERE p.budget IS NOT NULL
      ORDER BY p.updated_at DESC
      LIMIT 3)
      
      UNION ALL
      
      (SELECT 
        t.id, 
        'payment' as type, 
        t.budget as amount, 
        CONCAT('Task: ', t.title) as description,
        t.project_id, 
        t.status, 
        t.updated_at as date,
        (SELECT p.title FROM projects p WHERE p.id = t.project_id) as project_title
      FROM tasks t
      WHERE t.budget IS NOT NULL
      ORDER BY t.updated_at DESC
      LIMIT 3)
      
      ORDER BY date DESC
      LIMIT 10
    `);

    const responseData = {
      totalIncome: netIncome,
      totalExpenses: totalExpenses,
      grossIncome: totalIncome,
      pendingInvoices: {
        count: Number(pendingInvoices[0]?.count || 0),
        total: Number(pendingInvoices[0]?.total || 0)
      },
      totalBudgets: Number(totalBudgets[0]?.total_budgets || 0),
      monthlyRevenue: Number(monthlyRevenue[0]?.monthly_revenue || 0),
      recentTransactions
    };
    
    console.log('Response data:', responseData);
    res.json(responseData);
  } catch (err) {
    console.error('Error getting financial summary:', err);
    res.status(500).json({ 
      message: 'Error getting financial summary',
      error: err.message 
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { type, startDate, endDate, status, project_id } = req.query;
    console.log('Query parameters:', { type, startDate, endDate, status, project_id });
    
    let query = `
      SELECT 
        t.*,
        p.title as project_title
      FROM transactions t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== 'all') {
      query += ' AND t.type = ?';
      params.push(type);
    }

    if (startDate) {
      query += ' AND t.date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND t.date <= ?';
      params.push(endDate);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (project_id) {
      query += ' AND t.project_id = ?';
      params.push(Number(project_id));
      console.log('Filtering by project_id:', Number(project_id));
    }

    query += ' ORDER BY t.date DESC';
    
    console.log('Final query:', query.replace(/\s+/g, ' '));
    console.log('Query params:', params);

    const [transactions] = await db.execute(query, params);
    console.log('Found transactions:', transactions.length);
    res.json(transactions);
  } catch (err) {
    console.error('Error getting transactions:', err);
    res.status(500).json({ 
      message: 'Error getting transactions',
      error: err.message 
    });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, description, project_id, status = 'pending', date = new Date() } = req.body;

    // Validate required fields
    if (!type || !amount || !description) {
      return res.status(400).json({
        message: 'Missing required fields: type, amount, and description are required'
      });
    }

    // Validate project_id is provided
    if (!project_id) {
      return res.status(400).json({
        message: 'Project ID is required for all transactions'
      });
    }

    // Verify project exists
    const [projectExists] = await db.execute(
      'SELECT id FROM projects WHERE id = ?',
      [project_id]
    );
    
    if (!projectExists.length) {
      return res.status(400).json({
        message: `Project with id ${project_id} does not exist`
      });
    }

    // Insert transaction
    const [result] = await db.execute(
      'INSERT INTO transactions (type, amount, description, project_id, status, date) VALUES (?, ?, ?, ?, ?, ?)',
      [type, amount, description, project_id, status, date]
    );

    // Get the created transaction
    const [transactions] = await db.execute(
      `SELECT t.*, p.title as project_title
       FROM transactions t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json(transactions[0]);
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ 
      message: 'Error creating transaction',
      error: err.message 
    });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required'
      });
    }

    await db.execute(
      'UPDATE transactions SET status = ? WHERE id = ?',
      [status, id]
    );

    // Get the updated transaction
    const [transactions] = await db.execute(
      `SELECT t.*, p.title as project_title
       FROM transactions t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [id]
    );

    if (!transactions[0]) {
      return res.status(404).json({
        message: 'Transaction not found'
      });
    }

    res.json(transactions[0]);
  } catch (err) {
    console.error('Error updating transaction status:', err);
    res.status(500).json({ 
      message: 'Error updating transaction status',
      error: err.message 
    });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM transactions WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Transaction not found'
      });
    }

    res.json({
      message: 'Transaction deleted successfully',
      id
    });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ 
      message: 'Error deleting transaction',
      error: err.message 
    });
  }
}; 