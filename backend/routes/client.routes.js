const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');

// Debug middleware
router.use((req, res, next) => {
  console.log('Client Route accessed:', req.method, req.path);
  next();
});

// Get dashboard stats
router.get('/dashboard/stats', clientController.getDashboardStats);

// Get all clients
router.get('/', clientController.findAll);

// Get a single client
router.get('/:id', clientController.findOne);

// Create a new client
router.post('/', clientController.create);

// Update a client
router.put('/:id', clientController.update);

// Delete a client
router.delete('/:id', clientController.delete);

module.exports = router; 