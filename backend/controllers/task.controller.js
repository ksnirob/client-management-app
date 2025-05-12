const Task = require('../models/task.model');

exports.findAll = async (req, res) => {
  try {
    console.log('Task controller: Fetching all tasks');
    const tasks = await Task.findAll();
    console.log('Task controller: Found tasks:', JSON.stringify(tasks, null, 2));
    res.json(tasks);
  } catch (err) {
    console.error('Task controller: Error fetching tasks:', err);
    console.error('Task controller: Error stack:', err.stack);
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
};

exports.findById = async (req, res) => {
  try {
    console.log('Task controller: Fetching task with id:', req.params.id);
    const task = await Task.findById(req.params.id);
    console.log('Task controller: Found task:', JSON.stringify(task, null, 2));
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    console.error('Task controller: Error fetching task:', err);
    console.error('Task controller: Error stack:', err.stack);
    res.status(500).json({ message: 'Error fetching task', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    console.log('Task controller: Creating task with data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const requiredFields = ['title', 'project_id', 'client_id', 'status', 'priority', 'due_date'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Task controller: Missing required fields:', missingFields);
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields 
      });
    }

    const task = await Task.create(req.body);
    console.log('Task controller: Created task:', JSON.stringify(task, null, 2));
    res.status(201).json(task);
  } catch (err) {
    console.error('Task controller: Error creating task:', err);
    console.error('Task controller: Error stack:', err.stack);
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    console.log('Task controller: Updating task with id:', req.params.id);
    console.log('Task controller: Update data:', JSON.stringify(req.body, null, 2));
    const task = await Task.update(req.params.id, req.body);
    console.log('Task controller: Updated task:', JSON.stringify(task, null, 2));
    res.json(task);
  } catch (err) {
    console.error('Task controller: Error updating task:', err);
    console.error('Task controller: Error stack:', err.stack);
    res.status(500).json({ message: 'Error updating task', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    console.log('Task controller: Deleting task with id:', req.params.id);
    await Task.delete(req.params.id);
    console.log('Task controller: Task deleted successfully');
    res.json({ message: 'Task deleted', id: req.params.id });
  } catch (err) {
    console.error('Task controller: Error deleting task:', err);
    console.error('Task controller: Error stack:', err.stack);
    res.status(500).json({ message: 'Error deleting task', error: err.message });
  }
}; 