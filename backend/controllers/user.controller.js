const User = require('../models/user.model');

exports.create = async (req, res) => {
  try {
    console.log('Creating user with data:', req.body);
    const result = await User.create(req.body);
    res.status(201).json({
      message: 'User created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      message: 'Error creating user',
      error: error.message
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    console.log('Fetching all users');
    const users = await User.findAll();
    console.log('Found users:', users);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      message: 'Error retrieving users',
      error: error.message
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    console.log('Fetching user with id:', req.params.id);
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Found user:', user);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      message: 'Error retrieving user',
      error: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    console.log('Updating user with id:', req.params.id);
    console.log('Update data:', req.body);
    const result = await User.update(req.params.id, req.body);
    if (result.affectedRows === 0) {
      console.log('User not found for update');
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Update result:', result);
    res.status(200).json({
      message: 'User updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      message: 'Error updating user',
      error: error.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    console.log('Deleting user with id:', req.params.id);
    const result = await User.delete(req.params.id);
    if (result.affectedRows === 0) {
      console.log('User not found for deletion');
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Delete result:', result);
    res.status(200).json({
      message: 'User deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      message: 'Error deleting user',
      error: error.message
    });
  }
}; 