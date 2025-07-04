const Client = require('../models/client.model');

exports.getDashboardStats = async (req, res) => {
  try {
    console.log('Fetching dashboard stats');
    const stats = await Client.getDashboardStats();
    console.log('Dashboard stats:', stats);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      message: 'Error retrieving dashboard stats',
      error: error.message
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    console.log('Finding all clients');
    const clients = await Client.findAll();
    console.log(`Found ${clients.length} clients`);

    res.json({
      message: 'Clients retrieved successfully',
      data: clients
    });
  } catch (err) {
    console.error('Error finding clients:', err);
    res.status(500).json({
      message: 'Failed to retrieve clients',
      error: err.message
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    console.log('Finding client by id:', req.params.id);
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      console.log('Client not found:', req.params.id);
      return res.status(404).json({
        message: 'Client not found',
        error: 'NOT_FOUND'
      });
    }

    console.log('Found client:', client);
    res.json({
      message: 'Client retrieved successfully',
      data: client
    });
  } catch (err) {
    console.error('Error finding client:', err);
    res.status(500).json({
      message: 'Failed to retrieve client',
      error: err.message
    });
  }
};

exports.create = async (req, res) => {
  try {
    console.log('Creating client with data:', req.body);
    
    // Validate required fields
    const requiredFields = ['company_name', 'contact_person', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      console.error('Invalid email format:', req.body.email);
      return res.status(400).json({
        message: 'Invalid email format',
        error: 'VALIDATION_ERROR'
      });
    }

    // Create client
    const client = await Client.create(req.body);
    console.log('Created client:', client);

    res.status(201).json({
      message: 'Client created successfully',
      data: client
    });
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({
      message: 'Failed to create client',
      error: err.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    console.log('Updating client:', { id: req.params.id, data: req.body });
    
    // Validate required fields
    const requiredFields = ['company_name', 'email'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
        error: 'VALIDATION_ERROR'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      console.error('Invalid email format:', req.body.email);
      return res.status(400).json({
        message: 'Invalid email format',
        error: 'VALIDATION_ERROR'
      });
    }

    // Update client
    const client = await Client.update(req.params.id, req.body);
    
    if (!client) {
      console.log('Client not found:', req.params.id);
      return res.status(404).json({
        message: 'Client not found',
        error: 'NOT_FOUND'
      });
    }

    console.log('Updated client:', client);
    res.json({
      message: 'Client updated successfully',
      data: client
    });
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(500).json({
      message: 'Failed to update client',
      error: err.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    console.log('Deleting client:', req.params.id);
    const result = await Client.delete(req.params.id);
    
    if (!result) {
      console.log('Client not found:', req.params.id);
      return res.status(404).json({
        message: 'Client not found',
        error: 'NOT_FOUND'
      });
    }

    console.log('Deleted client:', req.params.id);
    res.json({
      message: 'Client deleted successfully',
      data: result
    });
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({
      message: 'Failed to delete client',
      error: err.message
    });
  }
}; 