const db = require('../config/db.config');

class Project {
  static async findAll() {
    try {
      console.log('Fetching all projects with task counts');
      
      // First get basic project data
      const [projects] = await db.execute(`
        SELECT 
          p.*,
          c.company_name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        ORDER BY p.created_at DESC
      `);
      console.log('Basic project data:', projects);

      // Then get task counts separately
      const taskCountPromises = projects.map(async (project) => {
        const [taskCount] = await db.execute(
          'SELECT COUNT(*) as count FROM tasks WHERE project_id = ?',
          [project.id]
        );
        console.log(`Task count for project ${project.id}:`, taskCount[0].count);
        return {
          ...project,
          task_count: Number(taskCount[0].count)
        };
      });

      const projectsWithCounts = await Promise.all(taskCountPromises);
      console.log('Final projects with counts:', projectsWithCounts);
      
      return projectsWithCounts;
    } catch (error) {
      console.error('Error in Project.findAll:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState,
        stack: error.stack
      });
      throw error;
    }
  }

  static async findById(id) {
    try {
      // Get project with task count in a single query
      const [rows] = await db.execute(`
        SELECT 
          p.*,
          c.company_name as client_name,
          COALESCE((
            SELECT COUNT(*) 
            FROM tasks t 
            WHERE t.project_id = p.id
          ), 0) as task_count
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id = ?
      `, [id]);
      
      if (!rows[0]) {
        throw new Error(`Project with id ${id} not found`);
      }
      
      // Convert task_count to number
      const project = {
        ...rows[0],
        task_count: Number(rows[0].task_count)
      };
      
      console.log(`Project ${project.id} (${project.title}) has ${project.task_count} tasks`);
      return project;
    } catch (error) {
      console.error('Error in Project.findById:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      throw error;
    }
  }

  static async create(projectData) {
    try {
      console.log('Creating project with data:', projectData);

      // Validate required fields
      const requiredFields = ['title', 'client_id'];
      const missingFields = requiredFields.filter(field => !projectData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate client exists
      const [clientExists] = await db.execute(
        'SELECT id FROM clients WHERE id = ?',
        [projectData.client_id]
      );
      
      if (!clientExists.length) {
        throw new Error(`Client with id ${projectData.client_id} does not exist`);
      }

      // Format dates
      const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toISOString().split('T')[0];
      };

      // Create project
      const [result] = await db.execute(
        'INSERT INTO projects (title, description, client_id, status, start_date, end_date, budget) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          projectData.title,
          projectData.description || null,
          projectData.client_id,
          projectData.status || 'not_started',
          formatDate(projectData.start_date),
          formatDate(projectData.end_date),
          projectData.budget || null
        ]
      );
      
      // Fetch the created project with client name
      const [rows] = await db.execute(`
        SELECT 
          p.*,
          c.company_name as client_name,
          0 as task_count
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id = ?
      `, [result.insertId]);
      
      if (!rows[0]) {
        throw new Error('Project was created but could not be retrieved');
      }

      console.log('Created project:', rows[0]);
      return rows[0];
    } catch (error) {
      console.error('Error in Project.create:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      console.error('Project data that caused error:', projectData);
      throw error;
    }
  }

  static async update(id, projectData) {
    try {
      console.log('Updating project with data:', projectData);

      // Format dates
      const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toISOString().split('T')[0];
      };

      const [result] = await db.execute(
        'UPDATE projects SET title=?, description=?, client_id=?, status=?, start_date=?, end_date=?, budget=?, updated_at=NOW() WHERE id=?',
        [
          projectData.title,
          projectData.description || null,
          projectData.client_id,
          projectData.status || 'not_started',
          formatDate(projectData.start_date),
          formatDate(projectData.end_date),
          projectData.budget || null,
          id
        ]
      );
      
      // Fetch the updated project
      const [rows] = await db.execute(`
        SELECT 
          p.*,
          c.company_name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.id = ?
      `, [id]);
      
      return rows[0];
    } catch (error) {
      console.error('Error in Project.update:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      console.error('Project data that caused error:', projectData);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM projects WHERE id=?', [id]);
      return { id };
    } catch (error) {
      console.error('Error in Project.delete:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      throw error;
    }
  }
}

module.exports = Project; 