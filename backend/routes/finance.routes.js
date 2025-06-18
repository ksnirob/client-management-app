const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');

// Get financial summary
router.get('/summary', financeController.getSummary);

// Get transactions with filters
router.get('/transactions', financeController.getTransactions);

// Create new transaction
router.post('/transactions', financeController.createTransaction);

// Update transaction status
router.put('/transactions/:id/status', financeController.updateTransactionStatus);

// Delete transaction
router.delete('/transactions/:id', financeController.deleteTransaction);

module.exports = router; 