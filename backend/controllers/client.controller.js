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
    console.log('Fetching all clients - Request received');
    const clients = await Client.findAll();
    console.log('Found clients:', JSON.stringify(clients, null, 2));
    if (!clients || clients.length === 0) {
      console.log('No clients found in database');
      return res.status(200).json([]);
    }
    res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error retrieving clients',
      error: error.message
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    console.log('Fetching client with id:', req.params.id);
    const client = await Client.findById(req.params.id);
    console.log('Found client:', JSON.stringify(client, null, 2));
    if (!client) {
      console.log('Client not found');
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error retrieving client',
      error: error.message
    });
  }
};

exports.create = async (req, res) => {
  try {
    console.log('Creating client with data:', req.body);
    const result = await Client.create(req.body);
    console.log('Create result:', result);
    res.status(201).json({
      message: 'Client created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating client:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error creating client',
      error: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    console.log('Updating client with id:', req.params.id);
    console.log('Update data:', req.body);
    const result = await Client.update(req.params.id, req.body);
    console.log('Update result:', result);
    if (result.affectedRows === 0) {
      console.log('Client not found for update');
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json({
      message: 'Client updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating client:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error updating client',
      error: error.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    console.log('Deleting client with id:', req.params.id);
    const result = await Client.delete(req.params.id);
    console.log('Delete result:', result);
    if (result.affectedRows === 0) {
      console.log('Client not found for deletion');
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json({
      message: 'Client deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error deleting client',
      error: error.message
    });
  }
}; 