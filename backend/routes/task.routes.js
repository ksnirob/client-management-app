const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');

// Debug middleware
router.use((req, res, next) => {
  console.log('Task Route accessed:', req.method, req.path);
  next();
});

// Get all tasks
router.get('/', taskController.findAll);

// Get a single task
router.get('/:id', taskController.findById);

// Create a new task
router.post('/', taskController.create);

// Update a task
router.put('/:id', taskController.update);

// Delete a task
router.delete('/:id', taskController.delete);

module.exports = router; 