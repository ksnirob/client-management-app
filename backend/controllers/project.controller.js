const Project = require('../models/project.model');

exports.findAll = async (req, res) => {
  try {
    console.log('Project controller: Fetching all projects');
    const projects = await Project.findAll();
    console.log('Project controller: Found projects:', projects.length);
    res.json(projects);
  } catch (err) {
    console.error('Project controller: Error fetching projects:', err);
    res.status(500).json({ 
      message: 'Error fetching projects', 
      error: err.message 
    });
  }
};

exports.findById = async (req, res) => {
  try {
    console.log('Project controller: Fetching project with id:', req.params.id);
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    console.log('Project controller: Found project:', project);
    res.json(project);
  } catch (err) {
    console.error('Project controller: Error fetching project:', err);
    res.status(500).json({ 
      message: 'Error fetching project', 
      error: err.message 
    });
  }
};

exports.create = async (req, res) => {
  try {
    console.log('Project controller: Creating project with data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const requiredFields = ['title', 'client_id'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Project controller: Missing required fields:', missingFields);
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields 
      });
    }

    const project = await Project.create(req.body);
    console.log('Project controller: Created project:', JSON.stringify(project, null, 2));
    res.status(201).json(project);
  } catch (err) {
    console.error('Project controller: Error creating project:', err);
    console.error('Project controller: Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Error creating project', 
      error: err.message 
    });
  }
};

exports.update = async (req, res) => {
  try {
    console.log('Project controller: Updating project with id:', req.params.id);
    console.log('Project controller: Update data:', JSON.stringify(req.body, null, 2));
    const project = await Project.update(req.params.id, req.body);
    console.log('Project controller: Updated project:', JSON.stringify(project, null, 2));
    res.json(project);
  } catch (err) {
    console.error('Project controller: Error updating project:', err);
    console.error('Project controller: Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Error updating project', 
      error: err.message 
    });
  }
};

exports.delete = async (req, res) => {
  try {
    console.log('Project controller: Deleting project with id:', req.params.id);
    await Project.delete(req.params.id);
    console.log('Project controller: Project deleted successfully');
    res.json({ 
      message: 'Project deleted', 
      id: req.params.id 
    });
  } catch (err) {
    console.error('Project controller: Error deleting project:', err);
    console.error('Project controller: Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Error deleting project', 
      error: err.message 
    });
  }
}; 